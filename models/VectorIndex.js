import mongoose from "mongoose";

const vectorIndexSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  userId: { type: String, required: true },
  
  // Embedding vectors
  fullTextVector: [{ type: Number }],
  pageVectors: [{
    pageNumber: { type: Number, required: true },
    vector: [{ type: Number, required: true }]
  }],
  
  // Metadata
  modelVersion: { type: String, required: true },
  vectorDimension: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
  
  // Search optimization
  isIndexed: { type: Boolean, default: false },
  indexVersion: { type: String },
  
  // Processing metadata
  processingTime: { type: Number },       // milliseconds
  vectorGenerationMethod: { 
    type: String, 
    enum: ['openai', 'cohere', 'huggingface', 'custom'],
    required: true 
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamps on save
vectorIndexSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for performance
vectorIndexSchema.index({ documentId: 1 }, { unique: true });
vectorIndexSchema.index({ userId: 1, lastUpdated: -1 });
vectorIndexSchema.index({ modelVersion: 1 });
vectorIndexSchema.index({ isIndexed: 1 });
vectorIndexSchema.index({ vectorDimension: 1 });

const VectorIndex = mongoose.model('VectorIndex', vectorIndexSchema);
export default VectorIndex; 