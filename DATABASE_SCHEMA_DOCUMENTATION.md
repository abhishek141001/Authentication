# Database Schema Documentation

## Overview
This document provides comprehensive documentation for the Document Management System database schema. The system uses MongoDB with Mongoose ODM and supports document storage, organization, data extraction, and user management.

## Database Connection
- **Database**: MongoDB
- **ODM**: Mongoose
- **Connection**: Configured via `config/db.js`
- **Environment Variable**: `MONGODB` (connection string)

## Schema Models

### 1. User Model (`models/User.js`)

#### Schema Definition
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  premium: { type: Boolean, default: false },
  storageUsed: { type: Number, default: 0 }, // in bytes
  storageLimit: { type: Number, default: 1073741824 }, // 1GB default
  documentCount: { type: Number, default: 0 },
  preferences: {
    defaultSchema: { type: mongoose.Schema.Types.ObjectId, ref: 'Schema' },
    folderView: { type: String, enum: ['grid', 'list'], default: 'grid' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

#### Field Descriptions
- **name**: User's full name
- **email**: Unique email address for authentication
- **password**: Hashed password for security
- **premium**: Boolean flag for premium features
- **storageUsed**: Current storage usage in bytes
- **storageLimit**: Maximum allowed storage (1GB default)
- **documentCount**: Total number of documents owned
- **preferences.defaultSchema**: Reference to user's default extraction schema
- **preferences.folderView**: UI preference for folder display

#### Indexes
- Email field is automatically indexed for uniqueness
- No additional indexes defined

#### Usage Patterns
- User authentication and profile management
- Storage quota tracking
- Document count monitoring
- User preferences storage

### 2. Document Model (`models/Document.js`)

#### Schema Definition
```javascript
{
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
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

#### Field Descriptions
- **userId**: Reference to the document owner
- **schemaId**: Optional reference to extraction schema used
- **name**: Display name for the document
- **originalName**: Original filename from upload
- **filePath**: Physical file location in storage
- **fileSize**: File size in bytes
- **mimeType**: File MIME type (e.g., 'application/pdf')
- **thumbnailPath**: Path to generated thumbnail image
- **folderId**: Reference to containing folder
- **tags**: Array of user-defined tags
- **metadata.extractedFields**: Map of extracted data from OCR
- **metadata.customFields**: Map of user-defined custom fields
- **metadata.description**: User-provided document description
- **metadata.pageCount**: Number of pages in document
- **metadata.processingStatus**: Current processing state

#### Indexes
```javascript
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ userId: 1, folderId: 1 });
documentSchema.index({ userId: 1, schemaId: 1 });
documentSchema.index({ "metadata.processingStatus": 1 });
```

#### Usage Patterns
- Document storage and retrieval
- OCR processing status tracking
- Data extraction results storage
- Folder organization
- Tag-based categorization

### 3. Folder Model (`models/Folder.js`)

#### Schema Definition
```javascript
{
  userId: { type: String, required: true },
  name: { type: String, required: true },
  parentFolderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  path: { type: String, required: true }, // Full path like "/work/invoices"
  description: { type: String },
  
  // Metadata
  documentCount: { type: Number, default: 0 },
  totalSize: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

#### Field Descriptions
- **userId**: Reference to folder owner
- **name**: Folder display name
- **parentFolderId**: Reference to parent folder (null for root)
- **path**: Full hierarchical path (e.g., "/work/invoices")
- **description**: User-provided folder description
- **documentCount**: Number of documents in folder
- **totalSize**: Total size of all documents in folder

#### Indexes
```javascript
folderSchema.index({ userId: 1, parentFolderId: 1 });
folderSchema.index({ userId: 1, path: 1 });
```

#### Usage Patterns
- Hierarchical folder organization
- Document grouping and organization
- Storage space tracking per folder
- Path-based navigation

### 4. Schema Model (`models/Schema.js`)

#### Schema Definition
```javascript
// Region Schema (sub-schema)
{
  page: { type: Number, required: false },
  x: Number,
  y: Number,
  width: Number,
  height: Number
}

// Field Schema (sub-schema)
{
  name: { type: String, required: true },
  region: regionSchema, // optional: for region-based extraction
  regex: { type: String, required: false }, // optional: for regex-based extraction
  template: { // optional: for template-based extraction
    referenceText: { type: String, required: false },
    offsetX: { type: Number, required: false },
    offsetY: { type: Number, required: false },
    width: { type: Number, required: false },
    height: { type: Number, required: false }
  }
}

// Main Schema
{
  userId: { type: String, required: false },
  name: { type: String, required: true },
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
}
```

#### Field Descriptions
- **userId**: Schema owner (null for public schemas)
- **name**: Schema display name
- **description**: Schema description
- **fields**: Array of field definitions for data extraction
- **version**: Schema version number
- **isPublic**: Whether schema is publicly available
- **sharedWith**: Array of user IDs with access
- **usageCount**: Number of times schema has been used

#### Field Types
1. **Region-based**: Extract data from specific coordinates
2. **Regex-based**: Extract data using regular expressions
3. **Template-based**: Extract data relative to reference text

#### Indexes
```javascript
extractionSchema.index({ userId: 1, createdAt: -1 });
extractionSchema.index({ isPublic: 1 });
```

#### Usage Patterns
- Data extraction configuration
- Template-based OCR processing
- Schema sharing and collaboration
- Usage analytics tracking

## Relationships

### One-to-Many Relationships
1. **User → Documents**: A user can have multiple documents
2. **User → Folders**: A user can have multiple folders
3. **User → Schemas**: A user can have multiple schemas
4. **Folder → Documents**: A folder can contain multiple documents
5. **Folder → Folders**: A folder can have multiple subfolders (self-referencing)

### Many-to-One Relationships
1. **Document → User**: Each document belongs to one user
2. **Document → Folder**: Each document can belong to one folder
3. **Document → Schema**: Each document can use one schema for extraction
4. **Folder → User**: Each folder belongs to one user
5. **Folder → Parent Folder**: Each folder can have one parent folder
6. **Schema → User**: Each schema belongs to one user

### Many-to-Many Relationships
1. **Schema ↔ Users**: Schemas can be shared with multiple users via `sharedWith` array

## Data Flow Patterns

### Document Upload Flow
1. User uploads file
2. Document record created with `processingStatus: 'pending'`
3. OCR processing begins (`processingStatus: 'processing'`)
4. Data extraction using specified schema
5. Results stored in `metadata.extractedFields`
6. Status updated to `completed` or `failed`

### Folder Organization Flow
1. User creates folder
2. Folder record created with path
3. Documents can be moved to folder
4. `documentCount` and `totalSize` updated automatically

### Schema Usage Flow
1. User selects schema for document
2. Schema's `usageCount` incremented
3. Extraction results stored in document metadata
4. Analytics updated for reporting

## Storage Considerations

### File Storage
- Physical files stored in `uploads/` directory
- Thumbnails generated and stored separately
- File paths stored in database for retrieval

### Database Storage
- Document metadata and extracted data stored in MongoDB
- Large extracted data stored in `metadata.extractedFields` Map
- Indexes optimized for common query patterns

### Storage Limits
- User storage tracked via `storageUsed` field
- Default limit: 1GB per user
- Premium users may have higher limits

## Performance Optimizations

### Indexes
- User-based queries indexed for fast retrieval
- Processing status indexed for background job queries
- Folder relationships indexed for hierarchical queries
- Schema usage indexed for analytics

### Query Patterns
- Most queries filtered by `userId` for data isolation
- Pagination implemented for large result sets
- Aggregation pipelines used for analytics

### Caching Strategy
- Document metadata cached in memory
- Thumbnail images cached on filesystem
- Schema definitions cached for repeated use

## Security Considerations

### Data Isolation
- All queries filtered by `userId` to prevent cross-user data access
- Folder hierarchies isolated per user
- Schema sharing controlled via `sharedWith` array

### Access Control
- JWT authentication required for all operations
- User ownership verified before data access
- Public schemas accessible to all authenticated users

### Data Validation
- File type validation on upload
- Schema field validation before processing
- Input sanitization for user-provided data

## Analytics and Monitoring

### Usage Metrics
- Document processing success rates
- Schema usage statistics
- Storage utilization per user
- Processing time analytics

### Performance Metrics
- Query response times
- File upload speeds
- OCR processing times
- Database connection health

## Migration and Backup

### Schema Migrations
- Version field in schemas for migration tracking
- Backward compatibility maintained
- Migration scripts for schema updates

### Backup Strategy
- Regular MongoDB backups
- File system backups for uploaded documents
- Point-in-time recovery capabilities

## API Integration

### RESTful Endpoints
- Document CRUD operations
- Folder management
- Schema definition and usage
- Analytics and reporting

### Authentication
- JWT token-based authentication
- User context attached to all requests
- Session management via tokens

### Error Handling
- Consistent error response format
- Detailed logging for debugging
- Graceful degradation for failures

## Future Enhancements

### Planned Features
- Advanced search capabilities
- Document versioning
- Collaborative editing
- Advanced analytics dashboard
- API rate limiting
- Webhook integrations

### Scalability Considerations
- Horizontal scaling with MongoDB clusters
- CDN integration for file delivery
- Microservices architecture potential
- Caching layer implementation 