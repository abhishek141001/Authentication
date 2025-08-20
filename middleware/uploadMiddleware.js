import multer from "multer";
import path from "path";
import fs from "fs";
import logger from "../utils/logger.js";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

const fileFilter = (mimetypes) => (req, file, cb) => {
  logger.info(`File upload attempt: ${file.originalname}, mimetype: ${file.mimetype}`);
  if (mimetypes.includes(file.mimetype)) {
    logger.info(`File accepted: ${file.originalname}`);
    cb(null, true);
  } else {
    logger.warn(`File rejected: ${file.originalname}, expected: ${mimetypes.join(', ')}, got: ${file.mimetype}`);
    cb(new Error("Invalid file type"), false);
  }
};

// More flexible upload configurations
export const uploadPdf = multer({ 
  storage, 
  fileFilter: fileFilter(["application/pdf"]),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  }
});

export const uploadZip = multer({ 
  storage, 
  fileFilter: fileFilter([
    "application/zip", 
    "application/x-zip-compressed", 
    "application/octet-stream"
  ]),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 1
  }
});

// Generic file upload for any field name
export const uploadFile = multer({ 
  storage, 
  fileFilter: fileFilter([
    "application/pdf", 
    "application/zip", 
    "application/x-zip-compressed", 
    "application/octet-stream",
    "image/png",
    "image/jpeg", 
    "image/jpg",
    "image/gif",
    "image/bmp",
    "image/tiff"
  ]),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 1
  }
});

// Error handling middleware for Multer errors
export const handleMulterError = (err, req, res, next) => {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  if (err instanceof multer.MulterError) {
    logger.error(`[${requestId}] Multer error: ${err.message}`, {
      errorCode: err.code,
      field: err.field,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 100MB.'
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Only one file allowed.'
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected field. Please check the field name in your form data.'
      });
    }
    
    return res.status(400).json({
      success: false,
      error: 'File upload error',
      details: err.message
    });
  }
  
  if (err.message === 'Invalid file type') {
    logger.warn(`[${requestId}] Invalid file type rejected`, {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    return res.status(400).json({
      success: false,
      error: 'Invalid file type. Supported types: PDF, ZIP, PNG, JPEG, GIF, BMP, TIFF'
    });
  }
  
  next(err);
}; 