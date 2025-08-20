import Folder from '../models/Folder.js';
import Document from '../models/Document.js';
import logger from '../utils/logger.js';
import fs from 'fs';

// Helper functions
const validateObjectId = (id) => {
  return id && typeof id === 'string' && id.length === 24;
};

const handleError = (res, error, operation) => {
  logger.error(`${operation} error: ${error.message}`);
  res.status(500).json({
    success: false,
    error: `Failed to ${operation}`
  });
};

// Create folder
export const createFolder = async (req, res) => {
  try {
    const { name, parentFolderId, description } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Folder name is required'
      });
    }

    // Validate parent folder if provided
    let parentPath = '';
    if (parentFolderId) {
      if (!validateObjectId(parentFolderId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parent folder ID format'
        });
      }

      const parentFolder = await Folder.findOne({ _id: parentFolderId, userId });
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          error: 'Parent folder not found'
        });
      }
      parentPath = parentFolder.path;
    }

    // Generate folder path
    const folderPath = parentPath ? `${parentPath}/${name}` : `/${name}`;

    // Check if folder already exists at this path
    const existingFolder = await Folder.findOne({ userId, path: folderPath });
    if (existingFolder) {
      return res.status(400).json({
        success: false,
        error: 'Folder already exists at this location'
      });
    }

    // Create folder
    const folder = new Folder({
      userId,
      name: name.trim(),
      parentFolderId: parentFolderId || null,
      path: folderPath,
      description: description || ''
    });

    await folder.save();

    logger.info(`Folder created: ${folder._id} by user: ${userId}`);

    res.status(201).json({
      success: true,
      data: folder,
      message: 'Folder created successfully'
    });

  } catch (error) {
    handleError(res, error, 'create folder');
  }
};

// Get user folders (tree structure)
export const getUserFolders = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get folders for the authenticated user
    const folders = await Folder.find({ userId })
      .sort({ path: 1 });

    // Build tree structure
    const folderTree = buildFolderTree(folders);

    res.json({
      success: true,
      data: folderTree
    });

  } catch (error) {
    handleError(res, error, 'get folders');
  }
};

// Get single folder
export const getFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid folder ID format'
      });
    }

    const folder = await Folder.findOne({ _id: id, userId });

    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    res.json({
      success: true,
      data: folder
    });

  } catch (error) {
    handleError(res, error, 'get folder');
  }
};

// Update folder
export const updateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid folder ID format'
      });
    }

    // Check if folder exists and belongs to user
    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Folder name cannot be empty'
        });
      }

      // Check if new name would conflict with existing folder
      const parentPath = folder.path.substring(0, folder.path.lastIndexOf('/'));
      const newPath = parentPath ? `${parentPath}/${name.trim()}` : `/${name.trim()}`;
      
      const existingFolder = await Folder.findOne({ 
        userId, 
        path: newPath,
        _id: { $ne: id }
      });
      
      if (existingFolder) {
        return res.status(400).json({
          success: false,
          error: 'Folder with this name already exists at this location'
        });
      }
    }

    // Update folder
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;

    const updatedFolder = await Folder.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    logger.info(`Folder updated: ${id} by user: ${userId}`);

    res.json({
      success: true,
      data: updatedFolder,
      message: 'Folder updated successfully'
    });

  } catch (error) {
    handleError(res, error, 'update folder');
  }
};

// Delete folder
export const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid folder ID format'
      });
    }

    // Check if folder exists and belongs to user
    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    // Get all subfolders
    const subfolders = await Folder.find({ 
      userId, 
      path: { $regex: `^${folder.path}/` }
    });

    // Get all documents in this folder and subfolders
    const folderIds = [folder._id, ...subfolders.map(f => f._id)];
    const documents = await Document.find({ 
      userId, 
      folderId: { $in: folderIds } 
    });

    // Delete all documents in this folder and subfolders
    for (const document of documents) {
      try {
        if (fs.existsSync(document.filePath)) {
          fs.unlinkSync(document.filePath);
        }
        if (document.thumbnailPath && fs.existsSync(document.thumbnailPath)) {
          fs.unlinkSync(document.thumbnailPath);
        }
      } catch (fileError) {
        logger.warn(`Failed to delete file: ${fileError.message}`);
      }
    }

    // Delete documents from database
    await Document.deleteMany({ userId, folderId: { $in: folderIds } });

    // Delete all subfolders
    await Folder.deleteMany({ userId, path: { $regex: `^${folder.path}` } });

    logger.info(`Folder deleted: ${id} with ${documents.length} documents by user: ${userId}`);

    res.json({
      success: true,
      message: 'Folder and all contents deleted successfully'
    });

  } catch (error) {
    handleError(res, error, 'delete folder');
  }
};

// Get folder documents
export const getFolderDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeSubfolders = 'false'
    } = req.query;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid folder ID format'
      });
    }

    // Check if folder exists and belongs to user
    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    // Build query
    let query = { userId };
    
    if (includeSubfolders === 'true') {
      // Include documents from subfolders
      const subfolders = await Folder.find({ 
        userId, 
        path: { $regex: `^${folder.path}/` }
      });
      const folderIds = [folder._id, ...subfolders.map(f => f._id)];
      query.folderId = { $in: folderIds };
    } else {
      // Only documents in this folder
      query.folderId = id;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Document.countDocuments(query);

    // Get documents
    const documents = await Document.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('name originalName fileSize mimeType tags metadata createdAt')
      .populate('schemaId', 'name');

    res.json({
      success: true,
      data: {
        folder: {
          _id: folder._id,
          name: folder.name,
          path: folder.path
        },
        documents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    handleError(res, error, 'get folder documents');
  }
};

// Move folder
export const moveFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { newParentFolderId } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid folder ID format'
      });
    }

    // Check if folder exists and belongs to user
    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    // Validate new parent folder if provided
    let newParentPath = '';
    if (newParentFolderId) {
      if (!validateObjectId(newParentFolderId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parent folder ID format'
        });
      }

      const newParentFolder = await Folder.findOne({ _id: newParentFolderId, userId });
      if (!newParentFolder) {
        return res.status(404).json({
          success: false,
          error: 'New parent folder not found'
        });
      }

      // Prevent moving folder into itself or its subfolder
      if (newParentFolder.path.startsWith(folder.path)) {
        return res.status(400).json({
          success: false,
          error: 'Cannot move folder into itself or its subfolder'
        });
      }

      newParentPath = newParentFolder.path;
    }

    // Calculate new path
    const newPath = newParentPath ? `${newParentPath}/${folder.name}` : `/${folder.name}`;

    // Check if destination already exists
    const existingFolder = await Folder.findOne({ 
      userId, 
      path: newPath,
      _id: { $ne: id }
    });
    
    if (existingFolder) {
      return res.status(400).json({
        success: false,
        error: 'Folder already exists at destination'
      });
    }

    // Update folder and all subfolders
    const oldPath = folder.path;
    const subfolders = await Folder.find({ 
      userId, 
      path: { $regex: `^${oldPath}/` }
    });

    // Update subfolders first (bottom-up)
    for (const subfolder of subfolders.reverse()) {
      const newSubfolderPath = subfolder.path.replace(oldPath, newPath);
      await Folder.findByIdAndUpdate(subfolder._id, {
        path: newSubfolderPath,
        updatedAt: new Date()
      });
    }

    // Update main folder
    await Folder.findByIdAndUpdate(id, {
      parentFolderId: newParentFolderId || null,
      path: newPath,
      updatedAt: new Date()
    });

    logger.info(`Folder moved: ${id} by user: ${userId}`);

    res.json({
      success: true,
      message: 'Folder moved successfully'
    });

  } catch (error) {
    handleError(res, error, 'move folder');
  }
};

// Get folder statistics
export const getFolderStats = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid folder ID format'
      });
    }

    // Check if folder exists and belongs to user
    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    // Get subfolders
    const subfolders = await Folder.find({ 
      userId, 
      path: { $regex: `^${folder.path}/` }
    });

    // Get documents in this folder and subfolders
    const folderIds = [folder._id, ...subfolders.map(f => f._id)];
    const documents = await Document.find({ 
      userId, 
      folderId: { $in: folderIds } 
    });

    // Calculate statistics
    const stats = {
      folder: {
        _id: folder._id,
        name: folder.name,
        path: folder.path
      },
      subfolders: subfolders.length,
      documents: documents.length,
      totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
      byStatus: {
        pending: documents.filter(doc => doc.metadata?.processingStatus === 'pending').length,
        processing: documents.filter(doc => doc.metadata?.processingStatus === 'processing').length,
        completed: documents.filter(doc => doc.metadata?.processingStatus === 'completed').length,
        failed: documents.filter(doc => doc.metadata?.processingStatus === 'failed').length
      },
      byType: documents.reduce((acc, doc) => {
        const type = doc.mimeType || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    handleError(res, error, 'get folder statistics');
  }
};

// Helper function to build folder tree
const buildFolderTree = (folders) => {
  const folderMap = new Map();
  const rootFolders = [];

  // Create a map of all folders
  folders.forEach(folder => {
    folderMap.set(folder._id.toString(), {
      ...folder.toObject(),
      children: []
    });
  });

  // Build the tree structure
  folders.forEach(folder => {
    const folderNode = folderMap.get(folder._id.toString());
    
    if (folder.parentFolderId) {
      const parent = folderMap.get(folder.parentFolderId.toString());
      if (parent) {
        parent.children.push(folderNode);
      }
    } else {
      rootFolders.push(folderNode);
    }
  });

  return rootFolders;
}; 