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
    type: [Number],
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  bookingDate: {
    type: Date, 
    default: Date.now
  },
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'cancelled'],
    default: 'ongoing'
  }
});

export default mongoose.model("Booking", BookingSchema);
