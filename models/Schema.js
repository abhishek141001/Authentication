import mongoose from "mongoose";

const regionSchema = new mongoose.Schema({
  page: { type: Number, required: false }, // page number (optional)
  x: Number,
  y: Number,
  width: Number,
  height: Number
}, { _id: false });

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  region: regionSchema, // optional: for region-based extraction
  regex: { type: String, required: false }, // optional: for regex-based extraction
  template: { // optional: for template-based extraction
    referenceText: { type: String, required: false }, // text to find in template PDF
    offsetX: { type: Number, required: false }, // offset from reference text position
    offsetY: { type: Number, required: false },
    width: { type: Number, required: false }, // width of extraction region
    height: { type: Number, required: false } // height of extraction region
  }
}, { _id: false });

const extractionSchema = new mongoose.Schema({
  userId: { type: String, required: false },
  name: { type: String, required: true }, // schema name
  description: { type: String },
  fields: [fieldSchema],
  version: { type: Number, default: 1 },
  
  // Sharing and visibility
  isPublic: { type: Boolean, default: false },
  sharedWith: [{ type: String }],
  
  // Usage statistics
  usageCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamps on save
extractionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for performance
extractionSchema.index({ userId: 1, createdAt: -1 });
extractionSchema.index({ isPublic: 1 });

const SchemaModel = mongoose.model('Schema', extractionSchema);
export default SchemaModel; 