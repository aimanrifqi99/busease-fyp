// routes/BookingRoutes.js
import express from 'express';
import { 
    getAllBookings, 
    getUserBookings,
    getBookingById,
    updateBooking, 
    cancelBooking, 
    deleteBooking 
} from '../controllers/BookingController.js';
import { verifyAdmin, verifyUser } from '../utils/verifyToken.js';

const router = express.Router();

// Get all bookings (Admin only)
router.get('/', verifyAdmin, getAllBookings);

// Get user-specific bookings
router.get('/:userId', verifyUser, getUserBookings);

// Update booking (Admin only)
router.put('/:bookingId', verifyUser, updateBooking);

// Cancel a booking (User only)
router.post('/cancel-booking', verifyUser, cancelBooking);

// Delete a booking (Admin only)
router.delete('/:bookingId', verifyAdmin, deleteBooking);

// Get a single booking by ID
router.get('/booking/:bookingId', verifyUser, getBookingById);

export default router;
