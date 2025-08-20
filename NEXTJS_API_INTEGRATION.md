# Next.js API Integration Guide - Document Management System

## Base Configuration

### Base URL
```
http://localhost:5000/api
```

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

### Standard Response Format
```json
{
  "success": true,
  "data": {...},
  "message": "Success message",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

---

## 1. Authentication APIs

### POST `/api/auth/register`
**Purpose**: Register new user

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "jwt_token_here"
  }
}
```

### POST `/api/auth/login`
**Purpose**: Authenticate user

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "jwt_token_here"
  }
}
```

---

## 2. Document Management APIs

### POST `/api/documents/upload`
**Purpose**: Upload document with schema

**Request**: Multipart form data
```
file: PDF file (required)
schemaId: string (required)
folderId: string (optional)
tags: string (comma-separated, optional)
description: string (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "document_id",
    "name": "invoice.pdf",
    "originalName": "invoice.pdf",
    "fileSize": 1024000,
    "schemaId": "schema_id",
    "folderId": "folder_id",
    "tags": ["invoice", "work"],
    "metadata": {
      "description": "Monthly invoice",
      "processingStatus": "pending"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### GET `/api/documents`
**Purpose**: Get user documents with filtering

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 10)
- `folderId`: string (filter by folder)
- `schemaId`: string (filter by schema)
- `search`: string (search in name/tags)
- `status`: string (pending/processing/completed/failed)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "document_id",
      "name": "invoice.pdf",
      "fileSize": 1024000,
      "schemaId": "schema_id",
      "folderId": "folder_id",
      "metadata": {
        "processingStatus": "completed",
        "extractedFields": {
          "invoiceNumber": "INV-001",
          "totalAmount": "$1,234.56"
        }
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### GET `/api/documents/:id`
**Purpose**: Get specific document details

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "document_id",
    "name": "invoice.pdf",
    "originalName": "invoice.pdf",
    "fileSize": 1024000,
    "schemaId": "schema_id",
    "folderId": "folder_id",
    "tags": ["invoice", "work"],
    "metadata": {
      "description": "Monthly invoice",
      "processingStatus": "completed",
      "extractedFields": {
        "invoiceNumber": "INV-001",
        "totalAmount": "$1,234.56"
      },
      "pageCount": 2
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT `/api/documents/:id`
**Purpose**: Update document metadata

**Request Body:**
```json
{
  "tags": ["invoice", "work", "important"],
  "description": "Updated description",
  "folderId": "new_folder_id"
}
```

### DELETE `/api/documents/:id`
**Purpose**: Delete document

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### POST `/api/documents/:id/extract`
**Purpose**: Re-extract data from document

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedFields": {
      "invoiceNumber": "INV-001",
      "totalAmount": "$1,234.56"
    },
    "processingStatus": "completed"
  }
}
```

---

## 3. Folder Management APIs

### POST `/api/folders`
**Purpose**: Create new folder

**Request Body:**
```json
{
  "name": "Work Documents",
  "parentFolderId": "parent_folder_id",
  "description": "Important work documents"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "folder_id",
    "name": "Work Documents",
    "path": "/Work Documents",
    "parentFolderId": "parent_folder_id",
    "description": "Important work documents",
    "documentCount": 0,
    "totalSize": 0,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### GET `/api/folders`
**Purpose**: Get folder tree structure

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "folder_id",
      "name": "Work Documents",
      "path": "/Work Documents",
      "description": "Important work documents",
      "documentCount": 5,
      "totalSize": 5120000,
      "children": [
        {
          "_id": "subfolder_id",
          "name": "Invoices",
          "path": "/Work Documents/Invoices",
          "description": "Invoice documents",
          "documentCount": 3,
          "totalSize": 3072000
        }
      ]
    }
  ]
}
```

### GET `/api/folders/:id`
**Purpose**: Get specific folder details

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "folder_id",
    "name": "Work Documents",
    "path": "/Work Documents",
    "parentFolderId": "parent_folder_id",
    "description": "Important work documents",
    "documentCount": 5,
    "totalSize": 5120000,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT `/api/folders/:id`
**Purpose**: Update folder information

**Request Body:**
```json
{
  "name": "Updated Work Documents",
  "description": "Updated description"
}
```

### DELETE `/api/folders/:id`
**Purpose**: Delete folder (must be empty)

**Response:**
```json
{
  "success": true,
  "message": "Folder deleted successfully"
}
```

### GET `/api/folders/:id/documents`
**Purpose**: Get documents in specific folder

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "document_id",
      "name": "invoice.pdf",
      "fileSize": 1024000,
      "schemaId": "schema_id",
      "metadata": {
        "processingStatus": "completed"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

## 4. Schema Management APIs

### POST `/api/schema/define-schema`
**Purpose**: Define new extraction schema

**Request Body:**
```json
{
  "name": "Invoice Schema",
  "description": "Extract invoice data",
  "fields": [
    {
      "name": "invoiceNumber",
      "regex": "Invoice #: (\\w+)"
    },
    {
      "name": "totalAmount",
      "region": {
        "page": 1,
        "x": 400,
        "y": 500,
        "width": 200,
        "height": 50
      }
    },
    {
      "name": "date",
      "template": {
        "referenceText": "Date:",
        "offsetX": 50,
        "offsetY": 0,
        "width": 150,
        "height": 30
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "schema_id",
    "name": "Invoice Schema",
    "description": "Extract invoice data",
    "fields": [...],
    "version": 1,
    "isPublic": false,
    "usageCount": 0,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### GET `/api/schema/schemas`
**Purpose**: Get user's schemas and public schemas

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "schema_id",
      "name": "Invoice Schema",
      "description": "Extract invoice data",
      "fields": [...],
      "version": 1,
      "isPublic": false,
      "usageCount": 5,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET `/api/schema/user`
**Purpose**: Get user's private schemas

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "schema_id",
      "name": "Private Schema",
      "description": "Private schema",
      "fields": [...],
      "version": 1,
      "isPublic": false,
      "usageCount": 2,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET `/api/schema/public`
**Purpose**: Get public schemas

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "schema_id",
      "name": "Public Invoice Schema",
      "description": "Public invoice schema",
      "fields": [...],
      "version": 1,
      "isPublic": true,
      "usageCount": 15,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET `/api/schema/:id`
**Purpose**: Get specific schema details

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "schema_id",
    "name": "Invoice Schema",
    "description": "Extract invoice data",
    "fields": [
      {
        "name": "invoiceNumber",
        "regex": "Invoice #: (\\w+)"
      }
    ],
    "version": 1,
    "isPublic": false,
    "usageCount": 5,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT `/api/schema/:id`
**Purpose**: Update schema

**Request Body:**
```json
{
  "name": "Updated Invoice Schema",
  "description": "Updated description",
  "fields": [...]
}
```

### DELETE `/api/schema/:id`
**Purpose**: Delete schema

**Response:**
```json
{
  "success": true,
  "message": "Schema deleted successfully"
}
```

### POST `/api/schema/:id/share`
**Purpose**: Share schema with other users

**Request Body:**
```json
{
  "userIds": ["user_id_1", "user_id_2"]
}
```

### POST `/api/schema/:id/duplicate`
**Purpose**: Duplicate existing schema

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "new_schema_id",
    "name": "Invoice Schema (Copy)",
    "description": "Extract invoice data",
    "fields": [...],
    "version": 1,
    "isPublic": false,
    "usageCount": 0,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### GET `/api/schema/:id/usage`
**Purpose**: Get schema usage statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "usageCount": 15,
    "lastUsed": "2024-01-01T00:00:00Z",
    "documentsProcessed": 15,
    "successRate": 0.93
  }
}
```

---

## 5. Document Processing APIs

### POST `/api/upload/upload-pdf`
**Purpose**: Upload and OCR single PDF

**Request**: Multipart form data
```
pdf: PDF file
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pages": [
      {
        "pageNumber": 1,
        "text": "Extracted text content...",
        "confidence": 0.95
      }
    ]
  }
}
```

### POST `/api/upload/upload-zip`
**Purpose**: Upload and process ZIP containing PDFs

**Request**: Multipart form data
```
zip: ZIP file containing PDFs
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processedFiles": 5,
    "results": [
      {
        "filename": "document1.pdf",
        "pages": [...],
        "status": "completed"
      }
    ]
  }
}
```

---

## 6. Data Extraction APIs

### POST `/api/schema/extract`
**Purpose**: Extract data from PDF using schema

**Request**: Multipart form data
```
pdf: PDF file
schemaId: string (optional)
schema: object (optional - inline schema)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedData": {
      "invoiceNumber": "INV-001",
      "totalAmount": "$1,234.56",
      "date": "2024-01-01"
    },
    "confidence": 0.92
  }
}
```

### POST `/api/schema/bulk-extract`
**Purpose**: Extract data from ZIP using schema

**Request**: Multipart form data
```
zip: ZIP file
schemaId: string (required)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processedFiles": 5,
    "results": [
      {
        "filename": "invoice1.pdf",
        "extractedData": {
          "invoiceNumber": "INV-001",
          "totalAmount": "$1,234.56"
        },
        "status": "completed"
      }
    ]
  }
}
```

### POST `/api/schema/analyze-template`
**Purpose**: Analyze PDF for template-based extraction

**Request**: Multipart form data
```
pdf: PDF file
```

**Response:**
```json
{
  "success": true,
  "data": {
    "words": [
      {
        "text": "Invoice",
        "x": 100,
        "y": 200,
        "width": 80,
        "height": 20
      }
    ],
    "suggestedRegions": [...]
  }
}
```

---

## 7. Analytics APIs

### GET `/api/analytics/storage`
**Purpose**: Get storage usage statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStorage": 104857600,
    "usedStorage": 52428800,
    "availableStorage": 52428800,
    "documentCount": 25,
    "averageFileSize": 2097152
  }
}
```

### GET `/api/analytics/documents`
**Purpose**: Get document processing statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDocuments": 25,
    "processedDocuments": 20,
    "pendingDocuments": 3,
    "failedDocuments": 2,
    "successRate": 0.8,
    "averageProcessingTime": 15.5
  }
}
```

### GET `/api/analytics/schemas`
**Purpose**: Get schema usage statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSchemas": 10,
    "publicSchemas": 3,
    "privateSchemas": 7,
    "mostUsedSchema": {
      "id": "schema_id",
      "name": "Invoice Schema",
      "usageCount": 15
    },
    "averageUsage": 5.2
  }
}
```

### GET `/api/analytics/activity`
**Purpose**: Get user activity timeline

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "document_upload",
      "timestamp": "2024-01-01T00:00:00Z",
      "details": {
        "documentName": "invoice.pdf",
        "fileSize": 1024000
      }
    },
    {
      "type": "schema_created",
      "timestamp": "2024-01-01T00:00:00Z",
      "details": {
        "schemaName": "Invoice Schema"
      }
    }
  ]
}
```

---

## Error Response Format

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

### Common Error Types

#### Authentication Error (401)
```json
{
  "success": false,
  "error": "Authentication required"
}
```

#### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "field": "error message"
  }
}
```

#### Not Found Error (404)
```json
{
  "success": false,
  "error": "Resource not found"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Frontend Data Storage Strategy

### User Profile Structure
```javascript
{
  // User basic info (managed by Next.js)
  id: "user_id",
  name: "John Doe",
  email: "john@example.com",
  
  // Document references (store IDs from backend)
  documentReferences: [
    {
      documentId: "backend_document_id",
      schemaId: "backend_schema_id",
      folderId: "backend_folder_id",
      name: "invoice.pdf",
      extractedData: {
        invoiceNumber: "INV-001",
        totalAmount: "$1,234.56"
      },
      processingStatus: "completed",
      lastUpdated: "2024-01-01T00:00:00Z"
    }
  ],
  
  // Schema references
  schemaReferences: [
    {
      schemaId: "backend_schema_id",
      name: "Invoice Schema",
      isPublic: false,
      usageCount: 5
    }
  ],
  
  // Folder structure (cache from backend)
  folderStructure: [
    {
      folderId: "backend_folder_id",
      name: "Work Documents",
      path: "/Work Documents",
      documentCount: 5
    }
  ],
  
  // Storage usage
  storageUsage: {
    used: 52428800,
    limit: 104857600,
    percentage: 50
  }
}
```

### Key Integration Points

1. **Document Upload**: Store backend document ID in user profile
2. **Schema Management**: Cache schema IDs and metadata
3. **Folder Organization**: Sync folder structure with backend
4. **Processing Status**: Poll backend for document processing updates
5. **Analytics**: Display backend statistics in frontend dashboard

---

## API Integration Best Practices

### 1. Error Handling
- Always check `success` field in responses
- Handle network errors gracefully
- Show user-friendly error messages

### 2. Authentication
- Store JWT token securely (httpOnly cookies)
- Refresh token before expiration
- Handle 401 errors by redirecting to login

### 3. File Upload
- Show upload progress
- Validate file types and sizes
- Handle upload failures gracefully

### 4. Real-time Updates
- Poll for document processing status
- Update UI when processing completes
- Show loading states during operations

### 5. Caching
- Cache schema and folder data
- Implement optimistic updates
- Sync with backend periodically

---

*This API documentation provides all the necessary information for integrating the document management backend with your Next.js frontend application.* 