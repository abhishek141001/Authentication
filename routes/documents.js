import express from 'express';
import authenticate from '../middleware/auth.js';
import {
  uploadDocument,
  getUserDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  reExtractDocument,
  getDocumentMetadata,
  bulkDeleteDocuments,
  bulkMoveDocuments
} from '../controllers/documentController.js';
import { uploadFile, handleMulterError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Document upload with flexible field name
router.post('/upload', uploadFile.single('file'), handleMulterError, uploadDocument);

// Get user documents with filtering and pagination
router.get('/', getUserDocuments);

// Get single document
router.get('/:id', getDocument);

// Update document
router.put('/:id', updateDocument);

// Delete document
router.delete('/:id', deleteDocument);

// Re-extract document
router.post('/:id/re-extract', reExtractDocument);

// Get document metadata
router.get('/:id/metadata', getDocumentMetadata);

// Bulk operations
router.post('/bulk-delete', bulkDeleteDocuments);
router.post('/bulk-move', bulkMoveDocuments);

export default router; 