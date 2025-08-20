import express from 'express';
import {
  uploadDocumentMicroservice,
  extractTextFromDocument,
  previewDocument,
  downloadDocument,
  getDocumentInfo
} from '../controllers/documentMicroserviceController.js';
import { uploadFile, handleMulterError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Document upload (no authentication required)
router.post('/upload', uploadFile.single('file'), handleMulterError, uploadDocumentMicroservice);

// Extract text from document
router.post('/extract/:fileName', extractTextFromDocument);

// Preview document
router.get('/preview/:fileName', previewDocument);

// Download document
router.get('/download/:fileName', downloadDocument);

// Get document info/metadata
router.get('/info/:fileName', getDocumentInfo);

export default router; 