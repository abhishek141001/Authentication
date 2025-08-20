import express from "express";
import { uploadFile, uploadZip, handleMulterError } from "../middleware/uploadMiddleware.js";
import authenticate from "../middleware/auth.js";
import { 
  defineSchemaHandler, 
  extractHandler, 
  extractTextHandler, 
  getSchemasHandler, 
  bulkExtractHandler, 
  analyzeTemplateHandler,
  getUserSchemasHandler,
  getPublicSchemasHandler,
  getSchemaByIdHandler,
  updateSchemaHandler,
  deleteSchemaHandler,
  shareSchemaHandler,
  duplicateSchemaHandler,
  getSchemaUsageHandler
} from "../controllers/schemaController.js";

const router = express.Router();

// Existing routes (no authentication required for backward compatibility)
// POST /define-schema
router.post("/define-schema", defineSchemaHandler);

// POST /extract (accepts PDF upload or schemaId)
router.post("/extract", uploadFile.single("pdf"), handleMulterError, extractHandler);

// POST /extract-text (returns all OCR text for user selection)
router.post("/extract-text", uploadFile.single("pdf"), handleMulterError, extractTextHandler);

// POST /analyze-template (analyze reference PDF for template creation)
router.post("/analyze-template", uploadFile.single("pdf"), handleMulterError, analyzeTemplateHandler);

// GET /schemas - Get all saved schemas (now requires authentication)
router.get("/schemas", authenticate, getSchemasHandler);

// POST /bulk-extract - Extract from ZIP using saved schema
router.post("/bulk-extract", uploadZip.single("zip"), handleMulterError, bulkExtractHandler);

// Test route
router.get("/test", (req, res) => {
    res.json({ message: "Upload route is working!" });
});

// Static routes (must come before parameterized routes)
// GET /schema/user - Get user's schemas
router.get("/user", authenticate, getUserSchemasHandler);

// GET /schema/public - Get public schemas
router.get("/public", authenticate, getPublicSchemasHandler);

// Parameterized routes (must come after static routes)
// GET /schema/:id - Get specific schema
router.get("/:id", authenticate, getSchemaByIdHandler);

// PUT /schema/:id - Update schema
router.put("/:id", authenticate, updateSchemaHandler);

// DELETE /schema/:id - Delete schema
router.delete("/:id", authenticate, deleteSchemaHandler);

// POST /schema/:id/share - Share schema
router.post("/:id/share", authenticate, shareSchemaHandler);

// POST /schema/:id/duplicate - Duplicate schema
router.post("/:id/duplicate", authenticate, duplicateSchemaHandler);

// GET /schema/:id/usage - Get schema usage stats
router.get("/:id/usage", authenticate, getSchemaUsageHandler);

export default router; 