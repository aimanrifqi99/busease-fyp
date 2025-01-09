import BookingModel from "../models/BookingModel.js";
import ScheduleModel from "../models/ScheduleModel.js";
import UserModel from "../models/UserModel.js";
import pdfkit from "pdfkit";
import nodemailer from "nodemailer";
import distanceMatrix from 'google-distance-matrix';

export const createSchedule = async (req, res, next) => {
    try {
        const newSchedule = new ScheduleModel(req.body);
        const savedSchedule = await newSchedule.save();
        res.status(200).json(savedSchedule);
    } catch (err) {
        console.error("Error creating schedule:", err);  
        res.status(500).json({ message: "Error creating schedule", error: err.message });
    }
};

// Update schedule
export const updateSchedule = async (req, res, next) => {
    try {
        const updatedSchedule = await ScheduleModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.status(200).json(updatedSchedule);
    } catch (err) {
        next(err);
    }
};

// Delete schedule
export const deleteSchedule = async (req, res, next) => {
  try {
      // Find the schedule by its ID
      const schedule = await ScheduleModel.findById(req.params.id);
      if (!schedule) {
          return res.status(404).json({ message: "Schedule not found" });
      }

      // Delete associated bookings
      await BookingModel.deleteMany({ schedule: schedule._id });

      // Delete the schedule
      await ScheduleModel.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: "Schedule and associated bookings have been deleted" });
  } catch (err) {
      console.error("Error deleting schedule and associated bookings:", err);
      res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};


// Get schedule
export const getSchedule = async (req, res, next) => {
    try {
        const schedule = await ScheduleModel.findById(req.params.id);
        if (!schedule) return res.status(404).json({ message: "Schedule not found" });
        res.status(200).json(schedule);
    } catch (err) {
        next(err);
    }
};


// Get all schedules with filtering
export const getSchedules = async (req, res, next) => {
  try {
    const query = {};

    if (req.query.origin) {
      query.origin = req.query.origin;
    }

    if (req.query.destination) {
      query.destination = req.query.destination;
    }

    if (req.query.departureDate) {
      const date = new Date(req.query.departureDate);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      query.departureDate = { $gte: date, $lt: nextDate };
    }
   
    if (req.query.amenities) {
      const amenitiesArray = req.query.amenities.split(',');
      query.amenities = { $all: amenitiesArray };
    }

    const schedules = await ScheduleModel.find(query);
    res.status(200).json(schedules);
  } catch (err) {
    next(err);
  }
};

export const bookSeats = async (req, res) => {
  const { scheduleId, seatNumbers, userId } = req.body;

  try {
    // Fetch the schedule by its ID
    const schedule = await ScheduleModel.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Fetch the user by their ID
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if any of the seats are already booked
    const alreadyBooked = seatNumbers.filter(seat =>
      schedule.seatNumbers.find(s => s.number === seat && s.isBooked)
    );
    if (alreadyBooked.length > 0) {
      return res.status(400).json({ message: `Seats ${alreadyBooked.join(', ')} are already booked` });
    }

    // Mark the selected seats as booked
    schedule.seatNumbers.forEach(seat => {
      if (seatNumbers.includes(seat.number)) {
        seat.isBooked = true;
      }
    });

    // Calculate total price based on schedule price and number of seats booked
    const totalPrice = schedule.price * seatNumbers.length;

    // Save the updated schedule
    await schedule.save();

    // Create a new booking
    const newBooking = new BookingModel({
      user: userId,
      schedule: scheduleId,
      seatNumbers,
      totalPrice,
    });

    await newBooking.save();

    // Generate the PDF ticket
    const doc = new pdfkit({ size: 'A4', margin: 50 });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      let pdfData = Buffer.concat(buffers);

      try {
        // Set up nodemailer transporter
        let transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE, // e.g., 'Gmail'
          auth: {
            user: process.env.EMAIL_USER, // Your email address
            pass: process.env.EMAIL_PASS, // Your email password or app password
          },
        });

        // Send mail with defined transport object
        let info = await transporter.sendMail({
          from: `"BusEase" <${process.env.EMAIL_USER}>`, // Sender address
          to: user.email, // Recipient's email
          subject: 'Your Bus Ticket - BusEase', // Subject line
          html: `
            <p>Dear ${user.username},</p>
            <p>Thank you for booking with BusEase! Please find your bus ticket attached.</p>
            <p>We wish you a pleasant journey.</p>
            <p>Best regards,<br/>BusEase Team</p>
          `, // HTML body
          attachments: [
            {
              filename: 'BusEase_Ticket.pdf',
              content: pdfData,
              contentType: 'application/pdf',
            },
          ],
        });

        res.status(200).json({
          success: true,
          message: 'Booking successful, ticket sent to your email.',
          booking: newBooking,
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        res.status(500).json({
          message: "Booking successful but failed to send email.",
          error: emailError.message,
        });
      }
    });

    // Add content to the PDF

    doc
      .fontSize(20)
      .text('BusEase', { align: 'center' })
      .moveDown();

    doc
      .fontSize(16)
      .text('Bus Ticket', { align: 'center', underline: true })
      .moveDown();

    // Booking Details
    doc
      .fontSize(12)
      .text(`Booking ID: ${newBooking._id}`, { align: 'left' })
      .text(`Booking Date: ${newBooking.bookingDate.toDateString()}`, { align: 'left' })
      .moveDown();

    doc
      .fontSize(14)
      .text('Passenger Information', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .text(`Name: ${user.username}`)
      .text(`Email: ${user.email}`)
      .moveDown();

    doc
      .fontSize(14)
      .text('Trip Details', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .text(`Schedule ID: ${schedule._id}`)
      .text(`Origin: ${schedule.origin}`)
      .text(`Destination: ${schedule.destination}`)
      .text(`Departure Date: ${schedule.departureDate.toDateString()}`)
      .text(`Departure Time: ${schedule.departureTime}`)
      .text(`Arrival Time: ${schedule.arrivalTime}`)
      .text(`Duration: ${schedule.duration}`)
      .moveDown();

    doc
      .fontSize(14)
      .text('Seat Information', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .text(`Seats Booked: ${seatNumbers.join(', ')}`)
      .text(`Total Price: RM${totalPrice}`)
      .moveDown();

    doc
      .fontSize(10)
      .text(`Customers can cancel bookings up to 1 day before the departure date.`)
      .text(`Cancellation applies to the entire booking and cannot be done per seat.`)
      .text(`Modifications to bookings are currently not available through the self-service system.`)
      .moveDown();

    // Footer with Contact Information
    doc
      .fontSize(10)
      .text('If you have any questions or need assistance, please contact us at support@busease.com or call +60 123-456-789.', {
        align: 'center',
        lineBreak: false,
      })
      .moveDown(2);

    doc.end(); // Finalize the PDF document
  } catch (error) {
    console.error("Error in booking process:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

//function for Google Map API (Distance Matrix)
export const getDistanceMatrix = async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch schedule details
    const schedule = await ScheduleModel.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Setup origins and destinations
    const origins = [schedule.origin];
    const destinations = [schedule.destination];

    // Configure Google Distance Matrix
    distanceMatrix.key(process.env.GOOGLE_MAP);
    distanceMatrix.units('metric');

    distanceMatrix.matrix(origins, destinations, (err, distances) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!distances || distances.status !== 'OK') {
        return res.status(500).json({ error: 'Error fetching distance matrix' });
      }

      // Extract duration from the response
      const duration = distances.rows[0].elements[0].duration.text;

      // Send duration with response
      res.status(200).json({
        origin: schedule.origin,
        destination: schedule.destination,
        stops: schedule.stops,
        departureTime: schedule.departureTime,
        arrivalTime: schedule.arrivalTime,
        duration,
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
