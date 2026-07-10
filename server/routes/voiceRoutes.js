import express from 'express';
import multer from 'multer';
import os from 'os';
import { analyzeVoiceFeedback } from '../controllers/voiceController.js';

// Setup multer to store uploaded files in the operating system's temp folder
const upload = multer({ 
  dest: os.tmpdir(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const router = express.Router();

// POST /api/voice/analyze
// Accepts multipart/form-data with 'audio' field
router.post('/analyze', upload.single('audio'), analyzeVoiceFeedback);

export default router;
