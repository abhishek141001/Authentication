# API Documentation - Updated

## Authentication
All API endpoints require a valid JWT access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

The system extracts `userId` from the JWT token for all operations.

## Base URL
```
https://api.yourdomain.com/v1
```

## Document Management

### Upload Document
**POST** `/documents/upload`

Upload a new document with optional schema for field extraction.

**Request:**
```javascript
// Multipart form data
{
  file: File,                    // Document file
  schemaId: ObjectId,           // Optional: Schema for extraction
  folderId: ObjectId,           // Optional: Target folder
  tags: [String],               // Optional: Document tags
  description: String           // Optional: Document description
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    documentId: ObjectId,
    processingStatus: 'pending',
    message: 'Document uploaded successfully. Processing started.'
  }
}
```

### Get Document
**GET** `/documents/:documentId`

Retrieve document details including extracted text and embeddings.

**Response:**
```javascript
{
  success: true,
  data: {
    _id: ObjectId,
    userId: String,
    schemaId: ObjectId,
    name: String,
    originalName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,
    thumbnailPath: String,
    folderId: ObjectId,
    tags: [String],
    
    // Extracted Content
    extractedText: {
      fullText: String,
      pageTexts: [{
        pageNumber: Number,
        text: String
      }],
      extractedAt: Date,
      extractionMethod: String
    },
    
    // Vector Embeddings
    embeddings: {
      fullTextVector: [Number],
      pageVectors: [{
        pageNumber: Number,
        vector: [Number]
      }],
      lastUpdated: Date,
      modelVersion: String
    },
    
    metadata: {
      extractedFields: Map,
      customFields: Map,
      description: String,
      pageCount: Number,
      processingStatus: String
    },
    
    createdAt: Date,
    updatedAt: Date
  }
}
```

### List Documents
**GET** `/documents`

List documents with filtering and pagination.

**Query Parameters:**
- `page`: Number (default: 1)
- `limit`: Number (default: 20)
- `folderId`: ObjectId
- `schemaId`: ObjectId
- `tags`: String (comma-separated)
- `status`: String (pending, processing, completed, failed)
- `search`: String (search in filename and extracted text)

**Response:**
```javascript
{
  success: true,
  data: {
    documents: [Document],
    pagination: {
      page: Number,
      limit: Number,
      total: Number,
      pages: Number
    }
  }
}
```

### Update Document
**PUT** `/documents/:documentId`

Update document metadata.

**Request:**
```javascript
{
  name: String,
  tags: [String],
  description: String,
  customFields: Map
}
```

### Delete Document
**DELETE** `/documents/:documentId`

Delete document and all associated data.

## Text Extraction

### Get Extracted Text
**GET** `/documents/:documentId/text`

Get the extracted text content of a document.

**Response:**
```javascript
{
  success: true,
  data: {
    fullText: String,
    pageTexts: [{
      pageNumber: Number,
      text: String
    }],
    extractedAt: Date,
    extractionMethod: String
  }
}
```

### Re-extract Text
**POST** `/documents/:documentId/extract-text`

Re-extract text from document using specified method.

**Request:**
```javascript
{
  method: String,  // 'ocr', 'pdf', 'manual'
  force: Boolean   // Force re-extraction even if already extracted
}
```

## Field Extraction

### Get Extracted Fields
**GET** `/documents/:documentId/fields`

Get all extracted fields for a document.

**Response:**
```javascript
{
  success: true,
  data: {
    extractedFields: [{
      fieldName: String,
      fieldValue: String,
      confidence: Number,
      extractionMethod: String,
      pageNumber: Number,
      region: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      },
      processedAt: Date
    }],
    schemaFields: [{
      name: String,
      value: String,
      confidence: Number
    }]
  }
}
```

### Extract Fields
**POST** `/documents/:documentId/extract-fields`

Extract fields using a specific schema.

**Request:**
```javascript
{
  schemaId: ObjectId,
  force: Boolean  // Force re-extraction
}
```

### Update Field Value
**PUT** `/documents/:documentId/fields/:fieldName`

Manually update a field value.

**Request:**
```javascript
{
  value: String,
  confidence: Number  // Optional: 0-1
}
```

## Vector Search

### Semantic Search
**POST** `/search/semantic`

Search documents using semantic similarity.

**Request:**
```javascript
{
  query: String,
  userId: String,  // From JWT token
  filters: {
    folderId: ObjectId,
    schemaId: ObjectId,
    tags: [String],
    dateRange: {
      start: Date,
      end: Date
    }
  },
  options: {
    limit: Number,        // Default: 10
    threshold: Number,    // Similarity threshold (0-1)
    includeVectors: Boolean  // Include vector data in response
  }
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    results: [{
      documentId: ObjectId,
      documentName: String,
      similarity: Number,
      matchedPage: Number,
      snippet: String,
      extractedFields: Map
    }],
    totalResults: Number,
    searchTime: Number  // milliseconds
  }
}
```

### Generate Embeddings
**POST** `/documents/:documentId/embeddings`

Generate or update vector embeddings for a document.

**Request:**
```javascript
{
  modelVersion: String,  // e.g., 'text-embedding-ada-002'
  method: String,        // 'openai', 'cohere', 'huggingface', 'custom'
  force: Boolean         // Force regeneration
}
```

### Get Embeddings
**GET** `/documents/:documentId/embeddings`

Get vector embeddings for a document.

**Response:**
```javascript
{
  success: true,
  data: {
    fullTextVector: [Number],
    pageVectors: [{
      pageNumber: Number,
      vector: [Number]
    }],
    modelVersion: String,
    vectorDimension: Number,
    lastUpdated: Date,
    isIndexed: Boolean
  }
}
```

## Schema Management

### Create Schema
**POST** `/schemas`

Create a new extraction schema.

**Request:**
```javascript
{
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
  isPublic: Boolean,
  sharedWith: [String]
}
```

### Get Schema
**GET** `/schemas/:schemaId`

Get schema details.

### List Schemas
**GET** `/schemas`

List user's schemas and public schemas.

### Update Schema
**PUT** `/schemas/:schemaId`

Update schema (creates new version).

### Delete Schema
**DELETE** `/schemas/:schemaId`

Delete schema (if not in use).

## Folder Management

### Create Folder
**POST** `/folders`

Create a new folder.

**Request:**
```javascript
{
  name: String,
  parentFolderId: ObjectId,
  description: String,
  schemaId: ObjectId  // Optional: Default schema for documents
}
```

### Get Folder
**GET** `/folders/:folderId`

Get folder details with document count.

### List Folders
**GET** `/folders`

List user's folders with optional parent filter.

### Update Folder
**PUT** `/folders/:folderId`

Update folder details.

### Delete Folder
**DELETE** `/folders/:folderId`

Delete folder (must be empty).

## Analytics

### Get Processing Statistics
**GET** `/analytics/processing`

Get document processing statistics.

**Response:**
```javascript
{
  success: true,
  data: {
    totalDocuments: Number,
    processingStatus: {
      pending: Number,
      processing: Number,
      completed: Number,
      failed: Number
    },
    averageProcessingTime: Number,
    extractionAccuracy: Number
  }
}
```

### Get Search Analytics
**GET** `/analytics/search`

Get search usage statistics.

**Response:**
```javascript
{
  success: true,
  data: {
    totalSearches: Number,
    averageSearchTime: Number,
    popularQueries: [String],
    searchMethods: {
      semantic: Number,
      keyword: Number,
      field: Number
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```javascript
{
  success: false,
  error: {
    code: String,
    message: String,
    details: Object  // Optional additional error details
  }
}
```

### Common Error Codes
- `AUTH_REQUIRED`: Authentication required
- `INVALID_TOKEN`: Invalid or expired token
- `PERMISSION_DENIED`: User doesn't have permission
- `RESOURCE_NOT_FOUND`: Document/folder/schema not found
- `VALIDATION_ERROR`: Invalid request data
- `PROCESSING_ERROR`: Document processing failed
- `STORAGE_LIMIT_EXCEEDED`: User storage limit exceeded
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Rate Limits

- **Standard Users**: 100 requests/minute
- **Premium Users**: 1000 requests/minute
- **File Uploads**: 10 files/minute
- **Search Queries**: 50 queries/minute

## Webhooks

### Document Processing Events
The system can send webhooks for document processing events:

```javascript
{
  event: String,  // 'processing_started', 'processing_completed', 'processing_failed'
  documentId: ObjectId,
  userId: String,
  timestamp: Date,
  data: Object  // Event-specific data
}
```

### Supported Events
- `document.uploaded`
- `document.processing_started`
- `document.text_extracted`
- `document.fields_extracted`
- `document.embeddings_generated`
- `document.processing_completed`
- `document.processing_failed` 