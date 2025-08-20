# Backend Implementation Plan - Document Management System

## Overview
This plan outlines the implementation of a comprehensive document management system that allows users to store, organize, and extract data from documents using schemas. The system will integrate with a Next.js frontend for user management.

## Current System Analysis
- **Existing Features**: OCR extraction, schema definition, PDF/ZIP upload, authentication
- **Current Models**: User, Schema
- **Current Routes**: `/api/auth`, `/api/upload`, `/api/schema`

## Phase 1: Database Schema Design

### 1.1 Enhanced User Model
```javascript
// models/User.js - Enhanced
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  premium: { type: Boolean, default: false },
  
  // New fields for document management
  storageUsed: { type: Number, default: 0 }, // in bytes
  storageLimit: { type: Number, default: 1073741824 }, // 1GB default
  documentCount: { type: Number, default: 0 },
  preferences: {
    defaultSchema: { type: mongoose.Schema.Types.ObjectId, ref: 'Schema' },
    folderView: { type: String, enum: ['grid', 'list'], default: 'grid' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### 1.2 Document Model
```javascript
// models/Document.js - New
const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  schemaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schema', required: true },
  
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

// Indexes for performance
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ userId: 1, folderId: 1 });
documentSchema.index({ userId: 1, schemaId: 1 });
```

### 1.3 Folder Model
```javascript
// models/Folder.js - New
const folderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  parentFolderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  path: { type: String, required: true }, // Full path like "/work/invoices"
  description: { type: String },
  
  // Metadata
  documentCount: { type: Number, default: 0 },
  totalSize: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
folderSchema.index({ userId: 1, parentFolderId: 1 });
folderSchema.index({ userId: 1, path: 1 });
```

### 1.4 Enhanced Schema Model
```javascript
// models/Schema.js - Enhanced
const schemaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  
  // Schema configuration
  fields: [fieldSchema], // Existing field schema
  version: { type: Number, default: 1 },
  
  // Sharing and visibility
  isPublic: { type: Boolean, default: false },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Usage statistics
  usageCount: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
schemaSchema.index({ userId: 1, createdAt: -1 });
schemaSchema.index({ isPublic: 1 });
```

## Phase 2: API Architecture

### 2.1 Route Structure
```
/api/auth/*          # Existing authentication routes
/api/documents/*     # Document management
/api/folders/*       # Folder management  
/api/schema/*        # Enhanced schema management
/api/upload/*        # File upload endpoints
/api/extract/*       # Data extraction endpoints
/api/analytics/*     # Usage analytics
```

### 2.2 Document Management API
```javascript
// routes/documents.js
POST   /api/documents/upload          # Upload document with schema
GET    /api/documents                 # List user documents with filters
GET    /api/documents/:id             # Get specific document
PUT    /api/documents/:id             # Update document metadata
DELETE /api/documents/:id             # Delete document
POST   /api/documents/:id/extract     # Re-extract data
GET    /api/documents/:id/metadata    # Get document metadata
POST   /api/documents/bulk-delete     # Bulk delete documents
POST   /api/documents/bulk-move       # Bulk move documents
```

### 2.3 Folder Management API
```javascript
// routes/folders.js
POST   /api/folders                   # Create folder
GET    /api/folders                   # List user folders (tree structure)
GET    /api/folders/:id               # Get folder details
PUT    /api/folders/:id               # Update folder
DELETE /api/folders/:id               # Delete folder
GET    /api/folders/:id/documents     # Get documents in folder
POST   /api/folders/:id/move          # Move folder
```

### 2.4 Enhanced Schema API
```javascript
// routes/schema.js (enhanced)
POST   /api/schema/create             # Create new schema
GET    /api/schema/user               # Get user's schemas
GET    /api/schema/public             # Get public schemas
GET    /api/schema/:id                # Get specific schema
PUT    /api/schema/:id                # Update schema
DELETE /api/schema/:id                # Delete schema
POST   /api/schema/:id/share          # Share schema
POST   /api/schema/:id/duplicate      # Duplicate schema
GET    /api/schema/:id/usage          # Get schema usage stats
```

### 2.5 Analytics API
```javascript
// routes/analytics.js
GET    /api/analytics/storage         # Storage usage statistics
GET    /api/analytics/documents       # Document statistics
GET    /api/analytics/schemas         # Schema usage statistics
GET    /api/analytics/activity        # User activity timeline
```

## Phase 3: Core Features Implementation

### 3.1 Document Upload & Processing Pipeline
```javascript
// controllers/documentController.js
const uploadDocument = async (req, res) => {
  // 1. Validate file and user permissions
  // 2. Generate unique filename and save to storage
  // 3. Create document record in database
  // 4. Extract data using specified schema
  // 5. Generate thumbnail
  // 6. Update user storage usage
  // 7. Return document info with extracted data
};
```

### 3.2 Folder Management System
```javascript
// controllers/folderController.js
const createFolder = async (req, res) => {
  // 1. Validate folder name and path
  // 2. Check for conflicts
  // 3. Create folder record
  // 4. Update parent folder counts
  // 5. Return folder info
};
```

### 3.3 Enhanced Schema Management
```javascript
// controllers/schemaController.js (enhanced)
const createSchema = async (req, res) => {
  // 1. Validate schema configuration
  // 2. Create schema record
  // 3. Set user ownership
  // 4. Return schema info
};
```

### 3.4 Data Extraction Engine
```javascript
// services/extractionService.js
class ExtractionService {
  async extractFromDocument(documentId, schemaId) {
    // 1. Load document and schema
    // 2. Apply OCR if needed
    // 3. Extract data using schema fields
    // 4. Validate extracted data
    // 5. Save extracted metadata
    // 6. Update document status
  }
}
```

## Phase 4: Security & Performance

### 4.1 Security Implementation
```javascript
// middleware/auth.js (enhanced)
const authenticateUser = async (req, res, next) => {
  // JWT token validation
  // User permission checks
  // Rate limiting
};

// middleware/documentAccess.js
const checkDocumentAccess = async (req, res, next) => {
  // Verify user owns document
  // Check folder permissions
};
```

### 4.2 Performance Optimizations
```javascript
// Database indexing strategy
// File storage optimization
// Caching layer (Redis)
// Background job processing
// API response pagination
```

## Phase 5: Integration with Next.js Frontend

### 5.1 API Response Format
```javascript
// Standard API response format
{
  success: boolean,
  data: any,
  message: string,
  pagination?: {
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}
```

### 5.2 Next.js Integration Points
```javascript
// Frontend will store in user profile:
{
  documentReferences: [
    {
      documentId: "backend_document_id",
      schemaId: "backend_schema_id", 
      name: "Document Name",
      folderPath: "/work/invoices",
      extractedData: { /* key extracted fields */ },
      lastUpdated: "2024-01-01T00:00:00Z"
    }
  ],
  storageUsage: {
    used: 1073741824, // bytes
    limit: 2147483648,
    percentage: 50
  }
}
```

### 5.3 API Endpoints for Frontend
```javascript
// Essential endpoints for Next.js integration
GET    /api/user/profile              # Get user profile with storage info
GET    /api/user/documents/summary    # Get document summary for frontend
POST   /api/documents/upload          # Upload with schema selection
GET    /api/schema/user               # Get user's schemas for selection
```

## Phase 6: Implementation Priority

### High Priority (Week 1-2)
1. Enhanced database models
2. Basic document CRUD operations
3. Folder management system
4. Enhanced schema management

### Medium Priority (Week 3-4)
1. Security implementation
2. Performance optimizations
3. Analytics endpoints
4. Advanced extraction features

### Low Priority (Week 5-6)
1. Advanced sharing features
2. Bulk operations
3. Advanced analytics
4. Third-party integrations

## Technical Stack

### Backend Technologies
- **Runtime**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **File Storage**: Local filesystem (can be upgraded to S3)
- **Authentication**: JWT with bcrypt
- **File Processing**: Multer, Sharp, Tesseract.js
- **Validation**: Joi or express-validator
- **Logging**: Winston
- **Testing**: Jest

### File Structure
```
/
├── models/           # Database models
├── routes/           # API route handlers
├── controllers/      # Business logic
├── middleware/       # Authentication, validation
├── services/         # Core services (extraction, etc.)
├── utils/            # Helper functions
├── config/           # Configuration files
├── uploads/          # File storage
└── tests/            # Test files
```

## Database Indexes for Performance
```javascript
// Document indexes
db.documents.createIndex({ "userId": 1, "createdAt": -1 })
db.documents.createIndex({ "userId": 1, "folderId": 1 })
db.documents.createIndex({ "userId": 1, "schemaId": 1 })
db.documents.createIndex({ "metadata.processingStatus": 1 })

// Folder indexes  
db.folders.createIndex({ "userId": 1, "parentFolderId": 1 })
db.folders.createIndex({ "userId": 1, "path": 1 })

// Schema indexes
db.schemas.createIndex({ "userId": 1, "createdAt": -1 })
db.schemas.createIndex({ "isPublic": 1 })
```

This plan provides a solid foundation for building a comprehensive document management system while maintaining the existing functionality and ensuring scalability for future enhancements. 