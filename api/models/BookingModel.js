// BookingModel.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const BookingSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to the User who made the booking
    ref: 'User',
    required: true
  },
  schedule: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to the Schedule (bus trip)
    ref: 'Schedule',
    required: true
  },
  seatNumbers: {
    type: [Number],  // Array of seat numbers that were booked
    required: true
  },
  totalPrice: {
    type: Number,  // Total price for the booking
    required: true
  },
  bookingDate: {
    type: Date,  // Date when the booking was made
    default: Date.now
  },
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'cancelled'], // Possible statuses
    default: 'ongoing'
  }
});

export default mongoose.model("Booking", BookingSchema);
