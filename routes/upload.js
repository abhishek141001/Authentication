import express from "express";
import { uploadPdf, uploadZip } from "../middleware/uploadMiddleware.js";
import { uploadPdfHandler, uploadZipHandler } from "../controllers/uploadController.js";

const router = express.Router();

// POST /upload-pdf
router.post("/upload-pdf", uploadPdf.single("pdf"), uploadPdfHandler);

// POST /upload-zip
router.post("/upload-zip", uploadZip.single("zip"), uploadZipHandler);

// Test GET endpoint
router.get("/test", (req, res) => {
  res.json({ message: "Upload route is working!" });
});

export default router; 


