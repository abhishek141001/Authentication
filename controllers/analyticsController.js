import Document from '../models/Document.js';
import Schema from '../models/Schema.js';
import Folder from '../models/Folder.js';

// Get storage usage statistics
export const getStorageStats = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📊 getStorageStats called for user:', userId);

    // Calculate storage stats from user's documents
    const documents = await Document.find({ userId });
    const storageUsed = documents.reduce((total, doc) => total + (doc.fileSize || 0), 0);
    const storageLimit = 1073741824; // 1GB default
    const documentCount = documents.length;

    const storagePercentage = (storageUsed / storageLimit) * 100;

    res.json({
      success: true,
      data: {
        used: storageUsed,
        limit: storageLimit,
        percentage: Math.round(storagePercentage * 100) / 100,
        documentCount: documentCount
      }
    });

  } catch (error) {
    console.error('Get storage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching storage statistics'
    });
  }
};

// Get document statistics
export const getDocumentStats = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📊 getDocumentStats called for user:', userId);

    // Get document stats for the user
    const documents = await Document.find({ userId });
    const total = documents.length;
    
    const byStatus = {
      pending: documents.filter(doc => doc.metadata?.processingStatus === 'pending').length,
      processing: documents.filter(doc => doc.metadata?.processingStatus === 'processing').length,
      completed: documents.filter(doc => doc.metadata?.processingStatus === 'completed').length,
      failed: documents.filter(doc => doc.metadata?.processingStatus === 'failed').length
    };

    const byType = documents.reduce((acc, doc) => {
      const type = doc.mimeType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const recent = documents.filter(doc => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return doc.createdAt > oneWeekAgo;
    }).length;

    res.json({
      success: true,
      data: {
        total,
        byStatus,
        byType,
        recent
      }
    });

  } catch (error) {
    console.error('Get document stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document statistics'
    });
  }
};

// Get schema usage statistics
export const getSchemaStats = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📊 getSchemaStats called for user:', userId);

    // Get schema stats for the user
    const userSchemas = await Schema.find({ userId });
    const publicSchemas = await Schema.find({ isPublic: true });
    
    const totalSchemas = userSchemas.length;
    const schemas = userSchemas.map(schema => ({
      id: schema._id,
      name: schema.name,
      usageCount: schema.usageCount,
      isPublic: schema.isPublic
    }));

    const mostUsed = userSchemas
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(schema => ({
        id: schema._id,
        name: schema.name,
        usageCount: schema.usageCount
      }));

    const publicSchemasUsed = publicSchemas
      .filter(schema => schema.usageCount > 0)
      .map(schema => ({
        id: schema._id,
        name: schema.name,
        usageCount: schema.usageCount
      }));

    res.json({
      success: true,
      data: {
        totalSchemas,
        schemas,
        mostUsed,
        publicSchemasUsed
      }
    });

  } catch (error) {
    console.error('Get schema stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching schema statistics'
    });
  }
};

// Get user activity timeline
export const getUserActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📊 getUserActivity called for user:', userId);

    // Get user activity data
    const documents = await Document.find({ userId }).sort({ createdAt: -1 }).limit(10);
    const folders = await Folder.find({ userId }).sort({ createdAt: -1 }).limit(5);
    const schemas = await Schema.find({ userId }).sort({ createdAt: -1 }).limit(5);

    const activities = [
      ...documents.map(doc => ({
        type: 'document_upload',
        timestamp: doc.createdAt,
        details: {
          documentName: doc.name,
          fileSize: doc.fileSize
        }
      })),
      ...folders.map(folder => ({
        type: 'folder_created',
        timestamp: folder.createdAt,
        details: {
          folderName: folder.name
        }
      })),
      ...schemas.map(schema => ({
        type: 'schema_created',
        timestamp: schema.createdAt,
        details: {
          schemaName: schema.name
        }
      }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

    res.json({
      success: true,
      data: {
        activities,
        totalUploads: documents.length,
        totalFolders: folders.length,
        totalSchemas: schemas.length
      }
    });

  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user activity'
    });
  }
}; 