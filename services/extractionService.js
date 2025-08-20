import Document from '../models/Document.js';
import Schema from '../models/Schema.js';
import { pdfToImages, ocrImage, ocrRegion, ocrImageWithFuzzy, ocrImageWithTemplate } from '../utils/pdfUtils.js';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';

class ExtractionService {
  // Extract data from document using schema
  async extractFromDocument(documentId, schemaId) {
    try {
      const document = await Document.findById(documentId);
      const schema = await Schema.findById(schemaId);

      if (!document || !schema) {
        throw new Error('Document or schema not found');
      }

      // Update document status to processing
      document.metadata.processingStatus = 'processing';
      await document.save();

      // Convert PDF to images
      const outDir = path.join(path.dirname(document.filePath), path.basename(document.filePath, path.extname(document.filePath)));
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
      
      const imagePaths = await pdfToImages(document.filePath, outDir);
      
      // Extract data using schema fields
      const extractedData = {};
      
      for (const field of schema.fields) {
        let fieldValue = null;
        
        // Try different extraction methods based on field configuration
        if (field.regex) {
          // Regex-based extraction
          fieldValue = await this.extractWithRegex(imagePaths, field.regex);
        } else if (field.region) {
          // Region-based extraction
          fieldValue = await this.extractWithRegion(imagePaths, field.region);
        } else if (field.template) {
          // Template-based extraction
          fieldValue = await this.extractWithTemplate(imagePaths, field.template);
        }
        
        if (fieldValue) {
          extractedData[field.name] = fieldValue;
        }
      }

      // Update document with extracted data
      document.metadata.extractedFields = extractedData;
      document.metadata.processingStatus = 'completed';
      document.metadata.pageCount = imagePaths.length;
      await document.save();

      return extractedData;

    } catch (error) {
      // Update document status to failed
      const document = await Document.findById(documentId);
      if (document) {
        document.metadata.processingStatus = 'failed';
        await document.save();
      }
      
      throw error;
    }
  }

  // Extract data using regex pattern
  async extractWithRegex(imagePaths, regex) {
    for (const imgPath of imagePaths) {
      const text = await ocrImage(imgPath);
      const matches = text.match(new RegExp(regex, 'i'));
      if (matches && matches.length > 0) {
        return matches[0].trim();
      }
    }
    return null;
  }

  // Extract data from specific region
  async extractWithRegion(imagePaths, region) {
    const { page = 1, x, y, width, height } = region;
    const imgPath = imagePaths[page - 1];
    
    if (!imgPath) return null;

    return await ocrRegion(imgPath, x, y, width, height);
  }

  // Extract data using template matching
  async extractWithTemplate(imagePaths, template) {
    const { referenceText, offsetX, offsetY, width, height } = template;
    
    for (const imgPath of imagePaths) {
      try {
        return await ocrImageWithTemplate(imgPath, referenceText, offsetX, offsetY, width, height);
      } catch (error) {
        console.error('Template extraction failed:', error);
        continue;
      }
    }
    return null;
  }

  // Process document and generate thumbnail
  async processDocument(documentId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Generate thumbnail
      const thumbnailPath = await this.generateThumbnail(document.filePath);
      document.thumbnailPath = thumbnailPath;
      await document.save();

      return thumbnailPath;
    } catch (error) {
      console.error('Document processing error:', error);
      throw error;
    }
  }

  // Generate thumbnail from PDF
  async generateThumbnail(pdfPath) {
    try {
      const outDir = path.join(path.dirname(pdfPath), 'thumbnails');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
      
      const thumbnailName = path.basename(pdfPath, path.extname(pdfPath)) + '_thumb.png';
      const thumbnailPath = path.join(outDir, thumbnailName);
      
      // Convert first page to image
      const imagePaths = await pdfToImages(pdfPath, outDir, 1);
      const firstPage = imagePaths[0];
      
      if (firstPage) {
        // Resize to thumbnail size
        await sharp(firstPage)
          .resize(200, 200, { fit: 'inside' })
          .png()
          .toFile(thumbnailPath);
        
        // Clean up temporary files
        fs.unlinkSync(firstPage);
        
        return thumbnailPath;
      }
      
      return null;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return null;
    }
  }

  // Extract text from file (for microservice)
  async extractTextFromFile(filePath, options = {}) {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      
      if (fileExtension === '.pdf') {
        // Convert PDF to images and extract text
        const outDir = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
        
        const imagePaths = await pdfToImages(filePath, outDir);
        let fullText = '';
        let totalConfidence = 0;
        let pageCount = 0;
        
        for (const imgPath of imagePaths) {
          try {
            const text = await ocrImage(imgPath);
            fullText += text + '\n';
            totalConfidence += 0.8; // Assume 80% confidence per page
            pageCount++;
          } catch (error) {
            console.error('OCR failed for page:', imgPath, error);
          }
        }
        
        // Clean up temporary files
        for (const imgPath of imagePaths) {
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
          }
        }
        
        return {
          text: fullText.trim(),
          confidence: pageCount > 0 ? totalConfidence / pageCount : 0,
          pageCount
        };
        
      } else if (['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'].includes(fileExtension)) {
        // Direct OCR for image files
        const text = await ocrImage(filePath);
        return {
          text: text.trim(),
          confidence: 0.8,
          pageCount: 1
        };
        
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }
      
    } catch (error) {
      console.error('Text extraction error:', error);
      throw error;
    }
  }

  // Batch process multiple documents
  async batchProcessDocuments(documentIds, schemaId) {
    const results = [];
    
    for (const documentId of documentIds) {
      try {
        const extractedData = await this.extractFromDocument(documentId, schemaId);
        results.push({
          documentId,
          success: true,
          data: extractedData
        });
      } catch (error) {
        results.push({
          documentId,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

export default new ExtractionService(); 