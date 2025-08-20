import express from "express"
import dotenv from "dotenv"
import authRoute from "./routes/authRoute.js"
import connectDb from "./config/db.js"
import uploadRoutes from "./routes/upload.js";
import schemaRoutes from "./routes/schema.js";
import documentRoutes from "./routes/documents.js";
import folderRoutes from "./routes/folders.js";
import analyticsRoutes from "./routes/analytics.js";
import documentMicroserviceRoutes from "./routes/documentMicroservice.js";
import { uploadFile, handleMulterError } from "./middleware/uploadMiddleware.js";
import authenticate from "./middleware/auth.js";
import { uploadDocument } from "./controllers/documentController.js";
import cors from "cors";
import logger from "./utils/logger.js";

const app = express()

dotenv.config()

const port = process.env.PORT || 3000

// Apply URL encoding for all routes (including file uploads)
app.use(express.urlencoded({extended:true}))

// Only apply JSON parsing to non-file upload routes
app.use((req, res, next) => {
  // Skip JSON parsing for file upload routes
  const uploadPaths = [
    '/api/upload',
    '/api/documents/upload',
    '/api/microservice/documents/upload',
    '/api/schema/extract',
    '/api/schema/extract-text',
    '/api/schema/analyze-template',
    '/api/schema/bulk-extract'
  ];
  
  if (uploadPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  express.json({
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        logger.error('Malformed JSON received:', buf.toString());
        throw new Error('Invalid JSON');
      }
    }
  })(req, res, next);
});

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    /^(http:\/\/192\.168\.[0-9]+\.[0-9]+:3000)$/
  ],
  credentials: true,
}));

connectDb()
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((error) => {
    logger.error('Database connection failed:', error);
    process.exit(1);
  });

// Health check endpoint (should be first)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/',(req,res)=>{
    res.send('Hello World')
})

// API routes (order matters - more specific routes first)
app.use('/api/auth', authRoute);
app.use('/api/upload', uploadRoutes); // PDF/ZIP upload endpoints
app.use('/api/schema', schemaRoutes); // Schema and extraction endpoints
app.use('/api/documents', documentRoutes); // Document management endpoints
app.use('/api/folders', folderRoutes); // Folder management endpoints
app.use('/api/analytics', analyticsRoutes); // Analytics endpoints

// Document microservice routes (no authentication required)
app.use('/api/microservice/documents', documentMicroserviceRoutes);

// Legacy upload route (keep for backward compatibility)
app.post('/upload', uploadFile.single("file"), handleMulterError, authenticate, uploadDocument);

// Global error handler for JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.error('JSON Parse Error:', err.message);
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON format',
      details: err.message
    });
  }
  next(err);
});

// 404 handler (should be last)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(port,()=>{
  logger.info(`Server running on port ${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
