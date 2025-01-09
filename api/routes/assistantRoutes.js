// assistantRoutes.js
import express from 'express';
import { assistantHandler } from '../controllers/assistantController.js';

const router = express.Router();

router.post('/assistant', assistantHandler);

export default router;
