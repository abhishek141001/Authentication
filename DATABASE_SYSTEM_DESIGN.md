# Database and System Design Documentation

## Overview
This document outlines the database schema and system design for a document management and extraction system. The system handles document storage, organization, field extraction, and vector embeddings for search capabilities.

## System Architecture

### User Management
- **External User Management**: User authentication and management is handled by a separate application
- **User Identification**: Users are identified via `userId` from JWT access tokens
- **No Local User Storage**: The system does not store user credentials locally

### Core Entities

## 1. User Entity
```javascript
{
  userId: String (from external system),
  name: String,
  email: String,
  premium: Boolean,
  storageUsed: Number (bytes),
  storageLimit: Number (bytes),
  documentCount: Number,
  preferences: {
    defaultSchema: ObjectId (ref: Schema),
    folderView: String (enum: ['grid', 'list'])
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 2. Schema Entity
**Purpose**: Defines extraction templates for different document types

```javascript
{
  userId: String,
  name: String,
  description: String,
  fields: [{
    name: String,
    region: {
      page: Number,
      x: Number,
      y: Number,
      width: Number,
      height: Number
    },
    regex: String,
    template: {
      referenceText: String,
      offsetX: Number,
      offsetY: Number,
      width: Number,
      height: Number
    }
  }],
  version: Number,
  isPublic: Boolean,
  sharedWith: [String],
  usageCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 3. Folder Entity
**Purpose**: Organizes documents in a hierarchical structure

```javascript
{
  userId: String,
  name: String,
  parentFolderId: ObjectId (ref: Folder),
  path: String,
  description: String,
  documentCount: Number,
  totalSize: Number,
  schemaId: ObjectId (ref: Schema), // NEW: Reference to schema
  createdAt: Date,
  updatedAt: Date
}
```

## 4. Document Entity
**Purpose**: Stores document metadata and extracted information

```javascript
{
  userId: String,
  schemaId: ObjectId (ref: Schema),
  
  // File Information
  name: String,
  originalName: String,
  filePath: String,
  fileSize: Number,
  mimeType: String,
  thumbnailPath: String,
  
  // Organization
  folderId: ObjectId (ref: Folder),
  tags: [String],
  
  // NEW: Extracted Content
  extractedText: {
    fullText: String,           // Complete extracted text
    pageTexts: [{               // Text per page
      pageNumber: Number,
      text: String
    }],
    extractedAt: Date,
    extractionMethod: String    // 'ocr', 'pdf', 'manual'
  },
  
  // NEW: Vector Embeddings
  embeddings: {
    fullTextVector: [Number],   // Vector for complete document
    pageVectors: [{             // Vectors per page
      pageNumber: Number,
      vector: [Number]
    }],
    lastUpdated: Date,
    modelVersion: String        // Embedding model version used
  },
  
  // Metadata
  metadata: {
    extractedFields: Map,       // Schema-based field extractions
    customFields: Map,          // User-defined fields
    description: String,
    pageCount: Number,
    processingStatus: String (enum: ['pending', 'processing', 'completed', 'failed'])
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

## 5. NEW: ExtractedField Entity
**Purpose**: Stores individual field extractions for better querying and analytics

```javascript
{
  documentId: ObjectId (ref: Document),
  schemaId: ObjectId (ref: Schema),
  userId: String,
  
  fieldName: String,
  fieldValue: String,
  confidence: Number,           // Extraction confidence (0-1)
  extractionMethod: String,     // 'regex', 'region', 'template', 'ai'
  
  // Location information
  pageNumber: Number,
  region: {
    x: Number,
    y: Number,
    width: Number,
    height: Number
  },
  
  // Processing metadata
  processedAt: Date,
  processingTime: Number,       // milliseconds
  
  createdAt: Date,
  updatedAt: Date
}
```

## 6. NEW: VectorIndex Entity
**Purpose**: Manages vector embeddings for semantic search

```javascript
{
  documentId: ObjectId (ref: Document),
  userId: String,
  
  // Embedding vectors
  fullTextVector: [Number],
  pageVectors: [{
    pageNumber: Number,
    vector: [Number]
  }],
  
  // Metadata
  modelVersion: String,
  vectorDimension: Number,
  lastUpdated: Date,
  
  // Search optimization
  isIndexed: Boolean,
  indexVersion: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

## Relationships and Constraints

### Primary Relationships
1. **User → Documents**: One-to-Many (via userId)
2. **User → Folders**: One-to-Many (via userId)
3. **User → Schemas**: One-to-Many (via userId)
4. **Folder → Documents**: One-to-Many (via folderId)
5. **Schema → Documents**: One-to-Many (via schemaId)
6. **Schema → Folders**: One-to-Many (via schemaId)
7. **Document → ExtractedFields**: One-to-Many
8. **Document → VectorIndex**: One-to-One

### Hierarchical Relationships
- **Folder → Folder**: Self-referencing (parentFolderId)
- **Schema Versioning**: Schemas can have multiple versions

## Database Indexes

### Performance Indexes
```javascript
// User-based queries
{ userId: 1, createdAt: -1 }
{ userId: 1, folderId: 1 }
{ userId: 1, schemaId: 1 }

// Document processing
{ "metadata.processingStatus": 1 }
{ "extractedText.extractedAt": 1 }

// Vector search
{ "embeddings.lastUpdated": 1 }
{ "embeddings.modelVersion": 1 }

// Field extraction queries
{ documentId: 1, fieldName: 1 }
{ schemaId: 1, fieldName: 1 }

// Folder hierarchy
{ userId: 1, parentFolderId: 1 }
{ userId: 1, path: 1 }
```

## Data Flow

### Document Processing Pipeline
1. **Upload**: Document uploaded with userId and optional schemaId
2. **Text Extraction**: OCR/PDF extraction to get full text
3. **Field Extraction**: Apply schema to extract specific fields
4. **Vector Generation**: Create embeddings for search
5. **Storage**: Store all extracted data and metadata
6. **Indexing**: Update search indexes

### Search Capabilities
1. **Metadata Search**: Search by filename, tags, custom fields
2. **Content Search**: Full-text search in extracted text
3. **Semantic Search**: Vector similarity search
4. **Field Search**: Search within extracted fields
5. **Combined Search**: Multi-modal search combining all methods

## Security Considerations

### Access Control
- All operations require valid userId from access token
- User can only access their own documents, folders, and schemas
- Public schemas are accessible to all users
- Shared schemas have explicit user permissions

### Data Privacy
- Extracted text and vectors are user-specific
- No cross-user data access
- Secure file storage with user isolation

## Scalability Considerations

### Storage Optimization
- Vector embeddings stored separately for efficient updates
- Page-level vectors for granular search
- Compressed storage for large text content

### Performance Optimization
- Indexed queries for common operations
- Caching for frequently accessed schemas
- Background processing for heavy operations

### Horizontal Scaling
- User-based sharding possible
- Separate collections for different data types
- Vector database integration for large-scale semantic search

## API Integration Points

### External User System
- JWT token validation
- User profile synchronization
- Storage quota management

### File Storage
- Secure file upload/download
- Thumbnail generation
- File format validation

### AI/ML Services
- OCR service integration
- Vector embedding generation
- Field extraction AI models

## Monitoring and Analytics

### System Metrics
- Document processing times
- Extraction accuracy rates
- Storage usage per user
- Search performance metrics

### User Analytics
- Schema usage patterns
- Search query patterns
- Document organization preferences
- Feature adoption rates

## Future Enhancements

### Planned Features
- Multi-language support
- Advanced AI extraction models
- Collaborative document editing
- Real-time collaboration
- Advanced search filters
- Document versioning
- Automated categorization
- Integration with external document sources 