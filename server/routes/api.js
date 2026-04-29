import express from 'express';
import { getStatus } from '../controllers/apiController.js';
import { analyzeFeedback } from '../controllers/analyzeController.js';

const router = express.Router();

router.get('/status', getStatus);
router.post('/analyze', analyzeFeedback);

export default router;
