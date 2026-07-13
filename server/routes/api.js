import express from 'express';
import { getStatus } from '../controllers/apiController.js';
import { analyzeFeedback } from '../controllers/analyzeController.js';
import voiceRoutes from './voiceRoutes.js';

const router = express.Router();

router.get('/status', getStatus);
router.post('/analyze', analyzeFeedback);
router.use('/voice', voiceRoutes);

export default router;
