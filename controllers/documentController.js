import Document from '../models/Document.js';
import Schema from '../models/Schema.js';
import Folder from '../models/Folder.js';
import extractionService from '../services/extractionService.js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Upload document with schema
export const uploadDocument = async (req, res) => {
  try {
    // Handle case where req.body might be undefined
    const body = req.body || {};
    const { schemaId, folderId, tags, description } = body;
    const userId = req.user.id;

    // Validate required fields
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File is required'
      });
    }

    // Make schemaId optional for now
    if (!schemaId) {
      console.log('⚠️  No schemaId provided, proceeding without schema');
    }

    // Check if schema exists (only if schemaId is provided)
    let schema = null;
    if (schemaId) {
      schema = await Schema.findById(schemaId);
      if (!schema) {
        return res.status(404).json({
          success: false,
          message: 'Schema not found'
        });
      }
    }

    // Check user storage limit (simplified for now)
    const fileSize = req.file.size;
    const storageLimit = 1073741824; // 1GB default
    const storageUsed = 0; // For now, assume no storage used
    
    if (storageUsed + fileSize > storageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Storage limit exceeded'
      });
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const uploadPath = path.join('uploads', 'documents', uniqueFilename);

    // Move file to permanent location
    fs.renameSync(req.file.path, uploadPath);

    // Create document record
    const document = new Document({
      userId,
      schemaId: schemaId || null,
      name: req.file.originalname,
      originalName: req.file.originalname,
      filePath: uploadPath,
      fileSize,
      mimeType: req.file.mimetype,
      folderId: folderId || null,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      metadata: {
        description: description || '',
        processingStatus: 'pending'
      }
    });

    await document.save();

    // Update user storage usage (simplified for now)
    console.log('  Document uploaded, file size:', fileSize);

    // Update folder document count if specified
    if (folderId) {
      await Folder.findByIdAndUpdate(folderId, {
        $inc: { documentCount: 1, totalSize: fileSize }
      });
    }

    // Update schema usage count (only if schemaId is provided)
    if (schemaId) {
      await Schema.findByIdAndUpdate(schemaId, {
        $inc: { usageCount: 1 }
      });
    }

    // Start extraction process in background (only if schemaId is provided)
    if (schemaId) {
      extractionService.extractFromDocument(document._id, schemaId)
        .then(extractedData => {
          console.log('Document extraction completed:', document._id);
        })
        .catch(error => {
          console.error('Document extraction failed:', error);
        });
    } else {
      console.log('⚠️  Skipping extraction - no schemaId provided');
    }

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document'
    });
  }
};

// Get user documents with filters
export const getUserDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📄 getUserDocuments called for user:', userId);
    
    const { 
      page = 1, 
      limit = 10, 
      folderId, 
      schemaId, 
      search,
      status 
    } = req.query;

    const query = { userId };

    // Apply filters
    if (folderId) query.folderId = folderId;
    if (schemaId) query.schemaId = schemaId;
    if (status) query['metadata.processingStatus'] = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;
    
    // Get documents for the authenticated user
    const documents = await Document.find(query)
      .populate('schemaId', 'name description')
      .populate('folderId', 'name path')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(query);

    console.log('  Found documents:', documents.length, 'out of', total);

    res.json({
      success: true,
      data: documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents'
    });
  }
};

// Get specific document
export const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await Document.findOne({ _id: id, userId })
      .populate('schemaId', 'name description fields')
      .populate('folderId', 'name path');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document'
    });
  }
};

// Update document metadata
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, tags, folderId } = req.body;

    const document = await Document.findOne({ _id: id, userId });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Update fields
    if (name) document.name = name;
    if (description !== undefined) document.metadata.description = description;
    if (tags) document.tags = tags.split(',').map(tag => tag.trim());
    if (folderId !== undefined) document.folderId = folderId;

    await document.save();

    res.json({
      success: true,
      data: document,
      message: 'Document updated successfully'
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating document'
    });
  }
};

// Delete document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await Document.findOne({ _id: id, userId });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete file from storage
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Update user storage usage (simplified for now)
    console.log('  Document deleted, file size:', document.fileSize);

    // Update folder counts if document was in a folder
    if (document.folderId) {
      await Folder.findByIdAndUpdate(document.folderId, {
        $inc: { documentCount: -1, totalSize: -document.fileSize }
      });
    }

    await Document.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document'
    });
  }
};

// Re-extract data from document
export const reExtractDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Start extraction process
    extractionService.extractFromDocument(document._id, document.schemaId)
      .then(extractedData => {
        console.log('Document re-extraction completed:', document._id);
      })
      .catch(error => {
        console.error('Document re-extraction failed:', error);
      });

    res.json({
      success: true,
      message: 'Document extraction started'
    });

  } catch (error) {
    console.error('Re-extract document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting document extraction'
    });
  }
};

// Get document metadata
export const getDocumentMetadata = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await Document.findOne({ _id: id, userId })
      .select('metadata name originalName fileSize createdAt updatedAt');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('Get document metadata error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document metadata'
    });
  }
}; 

// Bulk delete documents
export const bulkDeleteDocuments = async (req, res) => {
  try {
    const { documentIds } = req.body;
    const userId = req.user.id;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document IDs array is required'
      });
    }

    // Find all documents belonging to the user
    const documents = await Document.find({ _id: { $in: documentIds }, userId });
    
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No documents found'
      });
    }

    let totalSizeDeleted = 0;
    const folderUpdates = {};

    // Process each document
    for (const document of documents) {
      // Delete file from storage
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }

      totalSizeDeleted += document.fileSize;

      // Track folder updates
      if (document.folderId) {
        const folderId = document.folderId.toString();
        if (!folderUpdates[folderId]) {
          folderUpdates[folderId] = { documentCount: 0, totalSize: 0 };
        }
        folderUpdates[folderId].documentCount += 1;
        folderUpdates[folderId].totalSize += document.fileSize;
      }
    }

    // Delete documents from database
    await Document.deleteMany({ _id: { $in: documentIds }, userId });

    // Update folder counts
    for (const [folderId, updates] of Object.entries(folderUpdates)) {
      await Folder.findByIdAndUpdate(folderId, {
        $inc: { 
          documentCount: -updates.documentCount, 
          totalSize: -updates.totalSize 
        }
      });
    }

    console.log('  Bulk deleted documents:', documents.length, 'total size:', totalSizeDeleted);

    res.json({
      success: true,
      message: `Successfully deleted ${documents.length} documents`,
      deletedCount: documents.length,
      totalSizeDeleted
    });

  } catch (error) {
    console.error('Bulk delete documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting documents'
    });
  }
};

// Bulk move documents
export const bulkMoveDocuments = async (req, res) => {
  try {
    const { documentIds, targetFolderId } = req.body;
    const userId = req.user.id;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document IDs array is required'
      });
    }

    if (!targetFolderId) {
      return res.status(400).json({
        success: false,
        message: 'Target folder ID is required'
      });
    }

    // Verify target folder exists and belongs to user
    const targetFolder = await Folder.findOne({ _id: targetFolderId, userId });
    if (!targetFolder) {
      return res.status(404).json({
        success: false,
        message: 'Target folder not found'
      });
    }

    // Find all documents belonging to the user
    const documents = await Document.find({ _id: { $in: documentIds }, userId });
    
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No documents found'
      });
    }

    const folderUpdates = {};
    let totalSizeMoved = 0;

    // Process each document
    for (const document of documents) {
      const oldFolderId = document.folderId;
      
      // Update document folder
      document.folderId = targetFolderId;
      await document.save();

      totalSizeMoved += document.fileSize;

      // Track old folder updates (decrease counts)
      if (oldFolderId) {
        const oldFolderIdStr = oldFolderId.toString();
        if (!folderUpdates[oldFolderIdStr]) {
          folderUpdates[oldFolderIdStr] = { documentCount: 0, totalSize: 0 };
        }
        folderUpdates[oldFolderIdStr].documentCount += 1;
        folderUpdates[oldFolderIdStr].totalSize += document.fileSize;
      }
    }

    // Update old folder counts (decrease)
    for (const [folderId, updates] of Object.entries(folderUpdates)) {
      await Folder.findByIdAndUpdate(folderId, {
        $inc: { 
          documentCount: -updates.documentCount, 
          totalSize: -updates.totalSize 
        }
      });
    }

    // Update target folder counts (increase)
    await Folder.findByIdAndUpdate(targetFolderId, {
      $inc: { 
        documentCount: documents.length, 
        totalSize: totalSizeMoved 
      }
    });

    console.log('  Bulk moved documents:', documents.length, 'to folder:', targetFolderId);

    res.json({
      success: true,
      message: `Successfully moved ${documents.length} documents to folder: ${targetFolder.name}`,
      movedCount: documents.length,
      targetFolder: targetFolder.name,
      totalSizeMoved
    });

  } catch (error) {
    console.error('Bulk move documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error moving documents'
    });
  }
}; 