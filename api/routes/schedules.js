// routes/ScheduleRoutes.js
import express from 'express'; 
import { 
    bookSeats,
    createSchedule, 
    deleteSchedule, 
    getSchedule, 
    getSchedules, 
    updateSchedule, 
} from '../controllers/ScheduleController.js';
import { verifyAdmin, verifyUser } from '../utils/verifyToken.js';
import { getDistanceMatrix } from '../controllers/ScheduleController.js';

const router = express.Router();

// Create new schedule (Admin only)
router.post('/', verifyAdmin, createSchedule);

// Update schedule (Admin only)
router.put('/:id', verifyAdmin, updateSchedule);

// Delete schedule (Admin only)
router.delete('/:id', verifyAdmin, deleteSchedule);

// Get a specific schedule by ID (accessible to all users)
router.get('/:id', getSchedule);

// Get all schedules (accessible to all users)
router.get('', getSchedules);

// Book seats on a specific schedule (user must be authenticated)
router.post('/book-seats', verifyUser, bookSeats);

router.get('/distance-matrix/:id', getDistanceMatrix);


export default router;
