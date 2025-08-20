import express from 'express';
import authenticate from '../middleware/auth.js';
import {
  createFolder,
  getUserFolders,
  getFolder,
  updateFolder,
  deleteFolder,
  getFolderDocuments,
  moveFolder,
  getFolderStats
} from '../controllers/folderController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Create folder
router.post('/', createFolder);

// Get user folders (tree structure)
router.get('/', getUserFolders);

// Get single folder
router.get('/:id', getFolder);

// Update folder
router.put('/:id', updateFolder);

// Delete folder
router.delete('/:id', deleteFolder);

// Get documents in folder
router.get('/:id/documents', getFolderDocuments);

// Move folder
router.post('/:id/move', moveFolder);

// Get folder statistics
router.get('/:id/stats', getFolderStats);

export default router; 