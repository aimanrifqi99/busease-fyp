import mongoose from 'mongoose';
import BookingModel from '../models/BookingModel.js';

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
    const updatedBooking = await BookingModel.findByIdAndUpdate(bookingId, updateData, { new: true }).populate('schedule');
    if (!updatedBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
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