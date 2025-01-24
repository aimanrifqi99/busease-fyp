import BookingModel from "../models/BookingModel.js";
import ScheduleModel from "../models/ScheduleModel.js";
import UserModel from "../models/UserModel.js";
import pdfkit from "pdfkit";
import nodemailer from "nodemailer";

// Get all bookings (Admin only)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await BookingModel.find()
      .populate('schedule')
      .sort({ bookingDate: -1 })
      .exec();

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Get user-specific bookings with status update logic
export const getUserBookings = async (req, res) => {
  const { userId } = req.params;

  try {
    const bookings = await BookingModel.find({ user: userId })
      .populate('schedule')
      .sort({ bookingDate: -1 })
      .exec();

    const currentDateTime = new Date();

    const updatedBookings = await Promise.all(bookings.map(async (booking) => {
      if (booking.status === 'ongoing') {
        const departureDate = new Date(booking.schedule.departureDate);
        const [time, modifier] = booking.schedule.departureTime.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        departureDate.setHours(hours, minutes, 0, 0);

        if (currentDateTime > departureDate) {
          booking.status = 'completed';
          await booking.save();
        }
      }
      return booking;
    }));

    res.status(200).json(updatedBookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Update booking details
export const updateBooking = async (req, res) => {
  const { bookingId } = req.params;
  const updateData = req.body; 
 

  try {
    const booking = await BookingModel.findById(bookingId)
      .populate("user")     
      .populate("schedule")
      .exec();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const oldSeatNumbers = booking.seatNumbers || [];
    const newSeatNumbers = updateData.seatNumbers || oldSeatNumbers; 
    const seatNumbersChanged =
      updateData.seatNumbers && // seatNumbers provided in update
      JSON.stringify(oldSeatNumbers.sort()) !== JSON.stringify(newSeatNumbers.sort());

    if (seatNumbersChanged && booking.schedule) {
      await ScheduleModel.updateOne(
        { _id: booking.schedule._id },
        {
          $set: {
            "seatNumbers.$[elem].isBooked": false,
          },
        },
        {
          arrayFilters: [{ "elem.number": { $in: oldSeatNumbers } }],
          multi: true,
        }
      );
    }

    const updatedBooking = await BookingModel.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true }
    )
      .populate("user")
      .populate("schedule");

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found after update" });
    }

    if (updatedBooking.status === "cancelled") {
      await ScheduleModel.updateOne(
        { _id: updatedBooking.schedule._id },
        {
          $set: {
            "seatNumbers.$[elem].isBooked": false,
          },
        },
        {
          arrayFilters: [{ "elem.number": { $in: updatedBooking.seatNumbers } }],
          multi: true,
        }
      );
    }
    else if (updatedBooking.status === "ongoing" && updatedBooking.seatNumbers.length) {
      await ScheduleModel.updateOne(
        { _id: updatedBooking.schedule._id },
        {
          $set: {
            "seatNumbers.$[elem].isBooked": true,
          },
        },
        {
          arrayFilters: [
            { "elem.number": { $in: updatedBooking.seatNumbers } },
          ],
          multi: true,
        }
      );
    }

    if (updatedBooking.status === "ongoing") {
      // Generate the PDF
      const doc = new pdfkit({ size: "A4", margin: 50 });
      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));

      doc.on("end", async () => {
        let pdfData = Buffer.concat(buffers);

        try {
          let transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          await transporter.sendMail({
            from: `"BusEase" <${process.env.EMAIL_USER}>`,
            to: updatedBooking.user.email, 
            subject: "Your Updated Bus Ticket - BusEase",
            html: `
              <p>Dear ${updatedBooking.user.username},</p>
              <p>Your booking has been updated. Please find your revised bus ticket attached.</p>
              <p>Have a safe journey!</p>
              <p>Best regards,<br/>BusEase Team</p>
            `,
            attachments: [
              {
                filename: "BusEase_UpdatedTicket.pdf",
                content: pdfData,
                contentType: "application/pdf",
              },
            ],
          });
        } catch (emailError) {
          console.error("Error sending updated ticket email:", emailError);
        }
      });

      // PDF content
      doc.fontSize(20).text("BusEase", { align: "center" }).moveDown();
      doc
        .fontSize(16)
        .text("Updated Bus Ticket", { align: "center", underline: true })
        .moveDown();

      doc
        .fontSize(12)
        .text(`Booking ID: ${updatedBooking._id}`)
        .text(`Booking Date: ${updatedBooking.bookingDate.toDateString()}`)
        .moveDown();

      doc
        .fontSize(14)
        .text("Passenger Information", { underline: true })
        .moveDown(0.5);
      doc
        .fontSize(12)
        .text(`Name: ${updatedBooking.user.username}`)
        .text(`Email: ${updatedBooking.user.email}`)
        .moveDown();

      doc.fontSize(14).text("Trip Details", { underline: true }).moveDown(0.5);
      doc
        .fontSize(12)
        .text(`Origin: ${updatedBooking.schedule.origin}`)
        .text(`Destination: ${updatedBooking.schedule.destination}`)
        .text(`Departure Date: ${new Date(updatedBooking.schedule.departureDate).toDateString()}`)
        .text(`Departure Time: ${updatedBooking.schedule.departureTime}`)
        .text(`Arrival Time: ${updatedBooking.schedule.arrivalTime}`)
        .text(`Duration: ${updatedBooking.schedule.duration}`)
        .moveDown();

      doc.fontSize(14).text("Seat Information", { underline: true }).moveDown(0.5);
      doc
        .fontSize(12)
        .text(`Seats Booked: ${updatedBooking.seatNumbers.join(", ")}`)
        .text(`Total Price: RM${updatedBooking.totalPrice}`)
        .moveDown();

      doc
        .fontSize(10)
        .text("You can cancel bookings up to 1 day before departure.")
        .text("Cancellation applies to the entire booking, not individual seats.")
        .moveDown();

      doc
        .fontSize(10)
        .text(
          "If you have any questions, contact support@busease.com or +60 123-456-789.",
          { align: "center" }
        )
        .moveDown(2);

      doc.end();
    }

    res.status(200).json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Cancel a booking
export const cancelBooking = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await BookingModel.findById(bookingId).populate('schedule');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking is already cancelled' });
    if (booking.status === 'completed') return res.status(400).json({ message: 'Completed bookings cannot be cancelled' });

    const departureDate = new Date(booking.schedule.departureDate);
    const currentDate = new Date();
    const [time, modifier] = booking.schedule.departureTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    departureDate.setHours(hours, minutes, 0, 0);

    const timeDiff = departureDate.getTime() - currentDate.getTime();
    const oneDayInMillis = 24 * 60 * 60 * 1000;

    if (timeDiff < oneDayInMillis) return res.status(400).json({ message: 'Booking can only be cancelled 1 day before departure' });

    booking.seatNumbers.forEach(seatNumber => {
      const seat = booking.schedule.seatNumbers.find(s => s.number === seatNumber);
      if (seat) seat.isBooked = false;
    });

    await booking.schedule.save();
    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error("Error in cancelling booking:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Delete a booking
export const deleteBooking = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await BookingModel.findById(bookingId).populate('schedule');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Set seats as available
    booking.seatNumbers.forEach(seatNumber => {
      const seat = booking.schedule.seatNumbers.find(s => s.number === seatNumber);
      if (seat) seat.isBooked = false;
    });

    // Save the updated schedule
    await booking.schedule.save();

    // Delete the booking
    await BookingModel.findByIdAndDelete(bookingId);

    res.status(200).json({ message: 'Booking deleted successfully, seats set to available' });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const getBookingById = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await BookingModel.findById(bookingId)
      .populate('user', 'username email') // Populate user with selected fields
      .populate('schedule', 'name origin destination departureDate departureTime arrivalTime') // Populate schedule with selected fields
      .exec();

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking by ID:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};