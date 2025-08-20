import mongoose from "mongoose";

const extractedFieldSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  schemaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schema', required: true },
  userId: { type: String, required: true },
  
  fieldName: { type: String, required: true },
  fieldValue: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 1 },           // Extraction confidence (0-1)
  extractionMethod: { 
    type: String, 
    enum: ['regex', 'region', 'template', 'ai'],
    required: true 
  },
  
  // Location information
  pageNumber: { type: Number, required: true },
  region: {
    x: { type: Number },
    y: { type: Number },
    width: { type: Number },
    height: { type: Number }
  },
  
  // Processing metadata
  processedAt: { type: Date, default: Date.now },
  processingTime: { type: Number },       // milliseconds
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamps on save
extractedFieldSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for performance
extractedFieldSchema.index({ documentId: 1, fieldName: 1 });
extractedFieldSchema.index({ schemaId: 1, fieldName: 1 });
extractedFieldSchema.index({ userId: 1, fieldName: 1 });
extractedFieldSchema.index({ userId: 1, schemaId: 1 });
extractedFieldSchema.index({ processedAt: -1 });
extractedFieldSchema.index({ confidence: -1 });

const ExtractedField = mongoose.model('ExtractedField', extractedFieldSchema);
export default ExtractedField; 