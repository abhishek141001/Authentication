import extractionService from '../services/extractionService.js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import logger from '../utils/logger.js';

// Upload document (microservice - no authentication)
export const uploadDocumentMicroservice = async (req, res) => {
  const requestId = uuidv4().substring(0, 8);
  const startTime = Date.now();
  
  console.log(`[${requestId}] 📤 Document upload request started:`, req.file?.originalname, `(${req.file?.size} bytes)`);
  logger.info(`[${requestId}] 📤 Document upload request started`, {
    originalName: req.file?.originalname,
    fileSize: req.file?.size,
    mimeType: req.file?.mimetype,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  try {
    // Handle case where req.body might be undefined
    const body = req.body || {};
    const { tags, description, metadata } = body;

    // Validate required fields
    if (!req.file) {
      console.log(`[${requestId}] ❌ Upload failed: No file provided`);
      logger.warn(`[${requestId}] ❌ Upload failed: No file provided`);
      return res.status(400).json({
        success: false,
        message: 'File is required'
      });
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const uploadPath = path.join('uploads', 'documents', uniqueFilename);

    // Ensure upload directory exists
    const uploadDir = path.dirname(uploadPath);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Move file to permanent location
    fs.renameSync(req.file.path, uploadPath);

    // Parse additional metadata
    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      } catch (error) {
        console.warn('Invalid metadata format, using empty object');
      }
    }

    // Generate file info without database storage
    const fileInfo = {
      fileId: uuidv4(),
      originalName: req.file.originalname,
      fileName: uniqueFilename,
      filePath: uploadPath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      metadata: {
        description: description || '',
        processingStatus: 'pending',
        ...parsedMetadata
      },
      createdAt: new Date(),
      urls: {
        download: `/api/microservice/documents/download/${uniqueFilename}`,
        preview: `/api/microservice/documents/preview/${uniqueFilename}`,
        info: `/api/microservice/documents/info/${uniqueFilename}`,
        extract: `/api/microservice/documents/extract/${uniqueFilename}`
      }
    };

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ✅ Document upload completed successfully:`, fileInfo.fileName, `(${duration}ms)`);
    logger.info(`[${requestId}] ✅ Document upload completed successfully`, {
      fileId: fileInfo.fileId,
      fileName: fileInfo.fileName,
      originalName: fileInfo.originalName,
      fileSize: fileInfo.fileSize,
      mimeType: fileInfo.mimeType,
      tags: fileInfo.tags,
      duration: `${duration}ms`,
      uploadPath: fileInfo.filePath
    });

    res.status(201).json({
      success: true,
      data: fileInfo,
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ❌ Document upload failed:`, error.message, `(${duration}ms)`);
    logger.error(`[${requestId}] ❌ Document upload failed`, {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      originalName: req.file?.originalname
    });
    res.status(500).json({
      success: false,
      message: 'Error uploading document'
    });
  }
};

// Extract text from document
export const extractTextFromDocument = async (req, res) => {
  const requestId = uuidv4().substring(0, 8);
  const startTime = Date.now();
  
  console.log(`[${requestId}] 🔍 Text extraction request started:`, req.params.fileName);
  logger.info(`[${requestId}] 🔍 Text extraction request started`, {
    fileName: req.params.fileName,
    options: req.body.options,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  try {
    const { fileName } = req.params;
    const { options } = req.body;

    // Construct file path
    const filePath = path.join('uploads', 'documents', fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`[${requestId}] ❌ Text extraction failed: File not found:`, filePath);
      logger.warn(`[${requestId}] ❌ Text extraction failed: File not found`, {
        fileName,
        filePath,
        duration: `${Date.now() - startTime}ms`
      });
      return res.status(404).json({
        success: false,
        message: 'Document file not found'
      });
    }

    console.log(`[${requestId}] 🔄 Starting text extraction process for:`, filePath);
    logger.info(`[${requestId}] 🔄 Starting text extraction process`, {
      fileName,
      filePath,
      mimeType: mime.lookup(filePath) || 'unknown'
    });

    try {
      // Extract text using the extraction service
      const extractedData = await extractionService.extractTextFromFile(filePath, options);

      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ✅ Text extraction completed successfully:`, fileName, `(${duration}ms, ${extractedData.text?.length || 0} chars)`);
      logger.info(`[${requestId}] ✅ Text extraction completed successfully`, {
        fileName,
        textLength: extractedData.text?.length || 0,
        confidence: extractedData.confidence || 0,
        pageCount: extractedData.pageCount || 1,
        duration: `${duration}ms`
      });

      res.json({
        success: true,
        data: {
          fileId: req.body.fileId || 'unknown', // Include fileId if provided
          fileName,
          extractedText: extractedData.text,
          confidence: extractedData.confidence || 0,
          extractedAt: new Date().toISOString(),
          language: 'en', // Default to English, can be enhanced later
          pageCount: extractedData.pageCount || 1
        },
        message: 'Text extraction completed successfully'
      });

    } catch (extractionError) {
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ❌ Text extraction failed:`, extractionError.message, `(${duration}ms)`);
      logger.error(`[${requestId}] ❌ Text extraction failed`, {
        fileName,
        error: extractionError.message,
        stack: extractionError.stack,
        duration: `${duration}ms`
      });

      res.status(500).json({
        success: false,
        message: 'Text extraction failed',
        error: extractionError.message
      });
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ❌ Text extraction request failed:`, error.message, `(${duration}ms)`);
    logger.error(`[${requestId}] ❌ Text extraction request failed`, {
      fileName: req.params.fileName,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    res.status(500).json({
      success: false,
      message: 'Error extracting text from document'
    });
  }
};

// Preview document
export const previewDocument = async (req, res) => {
  const requestId = uuidv4().substring(0, 8);
  const startTime = Date.now();
  
  console.log(`[${requestId}] 👁️ Document preview request started:`, req.params.fileName);
  logger.info(`[${requestId}] 👁️ Document preview request started`, {
    fileName: req.params.fileName,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  try {
    const { fileName } = req.params;

    // Construct file path
    const filePath = path.join('uploads', 'documents', fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`[${requestId}] ❌ Document preview failed: File not found:`, filePath);
      logger.warn(`[${requestId}] ❌ Document preview failed: File not found`, {
        fileName,
        filePath,
        duration: `${Date.now() - startTime}ms`
      });
      return res.status(404).json({
        success: false,
        message: 'Document file not found'
      });
    }

    // Get file stats and mime type
    const stats = fs.statSync(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';

    // Set appropriate headers for preview
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ✅ Document preview started streaming:`, fileName, `(${duration}ms)`);
    logger.info(`[${requestId}] ✅ Document preview started streaming`, {
      fileName,
      fileSize: stats.size,
      mimeType,
      duration: `${duration}ms`
    });

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ❌ Document preview failed:`, error.message, `(${duration}ms)`);
    logger.error(`[${requestId}] ❌ Document preview failed`, {
      fileName: req.params.fileName,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    res.status(500).json({
      success: false,
      message: 'Error previewing document'
    });
  }
};

// Download document
export const downloadDocument = async (req, res) => {
  const requestId = uuidv4().substring(0, 8);
  const startTime = Date.now();
  
  console.log(`[${requestId}] 📥 Document download request started:`, req.params.fileName);
  logger.info(`[${requestId}] 📥 Document download request started`, {
    fileName: req.params.fileName,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  try {
    const { fileName } = req.params;

    // Construct file path
    const filePath = path.join('uploads', 'documents', fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`[${requestId}] ❌ Document download failed: File not found:`, filePath);
      logger.warn(`[${requestId}] ❌ Document download failed: File not found`, {
        fileName,
        filePath,
        duration: `${Date.now() - startTime}ms`
      });
      return res.status(404).json({
        success: false,
        message: 'Document file not found'
      });
    }

    // Get file stats and mime type
    const stats = fs.statSync(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';

    // Set appropriate headers for download
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', stats.size);

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ✅ Document download started streaming:`, fileName, `(${duration}ms)`);
    logger.info(`[${requestId}] ✅ Document download started streaming`, {
      fileName,
      fileSize: stats.size,
      mimeType,
      duration: `${duration}ms`
    });

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ❌ Document download failed:`, error.message, `(${duration}ms)`);
    logger.error(`[${requestId}] ❌ Document download failed`, {
      fileName: req.params.fileName,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    res.status(500).json({
      success: false,
      message: 'Error downloading document'
    });
  }
};

// Get document info/metadata
export const getDocumentInfo = async (req, res) => {
  const requestId = uuidv4().substring(0, 8);
  const startTime = Date.now();
  
  console.log(`[${requestId}] ℹ️ Document info request started:`, req.params.fileName);
  logger.info(`[${requestId}] ℹ️ Document info request started`, {
    fileName: req.params.fileName,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  try {
    const { fileName } = req.params;

    // Construct file path
    const filePath = path.join('uploads', 'documents', fileName);

    // Check if file exists
    const fileExists = fs.existsSync(filePath);

    if (!fileExists) {
      console.log(`[${requestId}] ❌ Document info failed: File not found:`, filePath);
      logger.warn(`[${requestId}] ❌ Document info failed: File not found`, {
        fileName,
        filePath,
        duration: `${Date.now() - startTime}ms`
      });
      return res.status(404).json({
        success: false,
        message: 'Document file not found'
      });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ✅ Document info retrieved successfully:`, fileName, `(${duration}ms)`);
    logger.info(`[${requestId}] ✅ Document info retrieved successfully`, {
      fileName,
      fileSize: stats.size,
      mimeType,
      fileExists,
      duration: `${duration}ms`
    });

    res.json({
      success: true,
      data: {
        fileName,
        filePath,
        fileSize: stats.size,
        mimeType,
        fileExists,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        urls: {
          download: `/api/microservice/documents/download/${fileName}`,
          preview: `/api/microservice/documents/preview/${fileName}`,
          info: `/api/microservice/documents/info/${fileName}`,
          extract: `/api/microservice/documents/extract/${fileName}`
        }
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ❌ Document info failed:`, error.message, `(${duration}ms)`);
    logger.error(`[${requestId}] ❌ Document info failed`, {
      fileName: req.params.fileName,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching document info'
    });
  }
}; 