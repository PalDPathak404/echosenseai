import express from 'express';
import { getStatus } from '../controllers/apiController.js';

const router = express.Router();

router.get('/status', getStatus);

export default router;
