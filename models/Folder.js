import mongoose from "mongoose";

const folderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  parentFolderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  path: { type: String, required: true }, // Full path like "/work/invoices"
  description: { type: String },
  
  // NEW: Schema reference for documents in this folder
  schemaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schema' },
  
  // Metadata
  documentCount: { type: Number, default: 0 },
  totalSize: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamps on save
folderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes
folderSchema.index({ userId: 1, parentFolderId: 1 });
folderSchema.index({ userId: 1, path: 1 });
folderSchema.index({ userId: 1, schemaId: 1 });

const Folder = mongoose.model('Folder', folderSchema);
export default Folder; 