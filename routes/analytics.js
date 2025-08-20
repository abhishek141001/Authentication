import express from "express";
import authenticate from "../middleware/auth.js";
import { 
  getStorageStats,
  getDocumentStats,
  getSchemaStats,
  getUserActivity
} from "../controllers/analyticsController.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/analytics/storage - Storage usage statistics
router.get("/storage", getStorageStats);

// GET /api/analytics/documents - Document statistics
router.get("/documents", getDocumentStats);

// GET /api/analytics/schemas - Schema usage statistics
router.get("/schemas", getSchemaStats);

// GET /api/analytics/activity - User activity timeline
router.get("/activity", getUserActivity);

export default router; 