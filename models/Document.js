import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  schemaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schema', required: false },
  
  // File information
  name: { type: String, required: true },
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  thumbnailPath: { type: String },
  
  // Organization
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  tags: [{ type: String }],
  
  // NEW: Extracted Content
  extractedText: {
    fullText: { type: String },           // Complete extracted text
    pageTexts: [{                         // Text per page
      pageNumber: { type: Number, required: true },
      text: { type: String, required: true }
    }],
    extractedAt: { type: Date },
    extractionMethod: { 
      type: String, 
      enum: ['ocr', 'pdf', 'manual'],
      default: 'pdf'
    }
  },
  
  // NEW: Vector Embeddings
  embeddings: {
    fullTextVector: [{ type: Number }],   // Vector for complete document
    pageVectors: [{                       // Vectors per page
      pageNumber: { type: Number, required: true },
      vector: [{ type: Number, required: true }]
    }],
    lastUpdated: { type: Date },
    modelVersion: { type: String }        // Embedding model version used
  },
  
  // Metadata
  metadata: {
    extractedFields: { type: Map, of: mongoose.Schema.Types.Mixed },
    customFields: { type: Map, of: mongoose.Schema.Types.Mixed },
    description: { type: String },
    pageCount: { type: Number },
    processingStatus: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed'], 
      default: 'pending' 
    }
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamps on save
documentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for performance
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ userId: 1, folderId: 1 });
documentSchema.index({ userId: 1, schemaId: 1 });
documentSchema.index({ "metadata.processingStatus": 1 });
documentSchema.index({ "extractedText.extractedAt": 1 });
documentSchema.index({ "embeddings.lastUpdated": 1 });
documentSchema.index({ "embeddings.modelVersion": 1 });

const Document = mongoose.model('Document', documentSchema);
export default Document; 