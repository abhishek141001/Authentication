# API Documentation - Document Management System

## Overview
This API provides document management, organization, and text extraction capabilities. It integrates with a Next.js frontend application and uses JWT authentication for user management.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All API endpoints require authentication via JWT Bearer token.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### JWT Token Structure
The backend expects JWT tokens with the following payload:
```json
{
  "id": "user_mongodb_id",
  "userId": "user_mongodb_id",
  "email": "user@example.com",
  "iat": 1234567890
}
```

## API Endpoints

---

## 1. Document Management

### 1.1 Upload Document
**POST** `/documents/upload`

Upload a document with optional schema and folder assignment.

**Request:**
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```
  file: <pdf_file>
  schemaId: "64f1a2b3c4d5e6f7g8h9i0j1" (optional)
  folderId: "64f1a2b3c4d5e6f7g8h9i0j2" (optional)
  tags: "invoice,business,2024" (optional, comma-separated)
  description: "Monthly invoice for January" (optional)
  ```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "invoice_january.pdf",
    "originalName": "invoice_january.pdf",
    "filePath": "uploads/documents/uuid-filename.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "folderId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "tags": ["invoice", "business", "2024"],
    "metadata": {
      "description": "Monthly invoice for January",
      "processingStatus": "pending",
      "extractedFields": {},
      "customFields": {}
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Document uploaded successfully"
}
```

### 1.2 Get User Documents
**GET** `/documents`

Get all documents for the authenticated user with optional filtering.

**Query Parameters:**
- `folderId`: Filter by folder ID
- `schemaId`: Filter by schema ID
- `status`: Filter by processing status (`pending`, `processing`, `completed`, `failed`)
- `tags`: Filter by tags (comma-separated)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
        "name": "invoice_january.pdf",
        "fileSize": 1024000,
        "mimeType": "application/pdf",
        "folderId": "64f1a2b3c4d5e6f7g8h9i0j2",
        "tags": ["invoice", "business"],
        "metadata": {
          "description": "Monthly invoice for January",
          "processingStatus": "completed",
          "extractedFields": {
            "invoiceNumber": "INV-001",
            "totalAmount": "$1,234.56"
          }
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

### 1.3 Get Single Document
**GET** `/documents/:id`

Get detailed information about a specific document.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "schemaId": "64f1a2b3c4d5e6f7g8h9i0j4",
    "name": "invoice_january.pdf",
    "originalName": "invoice_january.pdf",
    "filePath": "uploads/documents/uuid-filename.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "thumbnailPath": "uploads/thumbnails/uuid-thumbnail.png",
    "folderId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "tags": ["invoice", "business", "2024"],
    "metadata": {
      "description": "Monthly invoice for January",
      "processingStatus": "completed",
      "extractedFields": {
        "invoiceNumber": "INV-001",
        "totalAmount": "$1,234.56",
        "date": "2024-01-15"
      },
      "customFields": {
        "priority": "high",
        "department": "finance"
      },
      "pageCount": 2
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 1.4 Update Document
**PUT** `/documents/:id`

Update document metadata (name, description, tags, folder).

**Request:**
```json
{
  "name": "Updated Invoice Name",
  "description": "Updated description",
  "tags": ["invoice", "updated", "2024"],
  "folderId": "64f1a2b3c4d5e6f7g8h9i0j5"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
    "name": "Updated Invoice Name",
    "description": "Updated description",
    "tags": ["invoice", "updated", "2024"],
    "folderId": "64f1a2b3c4d5e6f7g8h9i0j5",
    "updatedAt": "2024-01-15T11:30:00.000Z"
  },
  "message": "Document updated successfully"
}
```

### 1.5 Delete Document
**DELETE** `/documents/:id`

Delete a document and its associated files.

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### 1.6 Re-extract Document
**POST** `/documents/:id/re-extract`

Re-process document with current or new schema.

**Request:**
```json
{
  "schemaId": "64f1a2b3c4d5e6f7g8h9i0j4" (optional)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document re-extraction started",
  "data": {
    "processingStatus": "processing",
    "estimatedTime": "30 seconds"
  }
}
```

### 1.7 Get Document Metadata
**GET** `/documents/:id/metadata`

Get detailed metadata and extracted fields.

**Response:**
```json
{
  "success": true,
  "data": {
    "metadata": {
      "description": "Monthly invoice for January",
      "processingStatus": "completed",
      "pageCount": 2,
      "extractedFields": {
        "invoiceNumber": "INV-001",
        "totalAmount": "$1,234.56",
        "date": "2024-01-15",
        "vendor": "ABC Company"
      },
      "customFields": {
        "priority": "high",
        "department": "finance"
      }
    },
    "schema": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
      "name": "Invoice Schema",
      "fields": [
        {
          "name": "invoiceNumber",
          "regex": "Invoice #: (\\w+)"
        }
      ]
    }
  }
}
```

---

## 2. Folder Management

### 2.1 Create Folder
**POST** `/folders`

Create a new folder.

**Request:**
```json
{
  "name": "Invoices",
  "parentFolderId": "64f1a2b3c4d5e6f7g8h9i0j2" (optional),
  "description": "Folder for all invoice documents"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j6",
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "Invoices",
    "parentFolderId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "path": "/Work/Invoices",
    "description": "Folder for all invoice documents",
    "documentCount": 0,
    "totalSize": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Folder created successfully"
}
```

### 2.2 Get User Folders (Tree Structure)
**GET** `/folders`

Get all folders for the user in a hierarchical tree structure.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "name": "Work",
      "path": "/Work",
      "description": "Work documents",
      "documentCount": 15,
      "totalSize": 52428800,
      "children": [
        {
          "_id": "64f1a2b3c4d5e6f7g8h9i0j6",
          "name": "Invoices",
          "path": "/Work/Invoices",
          "description": "Invoice documents",
          "documentCount": 8,
          "totalSize": 20971520,
          "children": []
        }
      ]
    }
  ]
}
```

### 2.3 Get Single Folder
**GET** `/folders/:id`

Get detailed information about a specific folder.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j6",
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "Invoices",
    "parentFolderId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "path": "/Work/Invoices",
    "description": "Folder for all invoice documents",
    "documentCount": 8,
    "totalSize": 20971520,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2.4 Update Folder
**PUT** `/folders/:id`

Update folder information.

**Request:**
```json
{
  "name": "Updated Invoices",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j6",
    "name": "Updated Invoices",
    "description": "Updated description",
    "updatedAt": "2024-01-15T11:30:00.000Z"
  },
  "message": "Folder updated successfully"
}
```

### 2.5 Delete Folder
**DELETE** `/folders/:id`

Delete folder and all its contents (documents and subfolders).

**Response:**
```json
{
  "success": true,
  "message": "Folder and all contents deleted successfully"
}
```

### 2.6 Get Folder Documents
**GET** `/folders/:id/documents`

Get all documents in a specific folder.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `sortBy`: Sort field (`name`, `createdAt`, `updatedAt`)
- `sortOrder`: Sort order (`asc`, `desc`)

**Response:**
```json
{
  "success": true,
  "data": {
    "folder": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j6",
      "name": "Invoices",
      "path": "/Work/Invoices"
    },
    "documents": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
        "name": "invoice_january.pdf",
        "fileSize": 1024000,
        "mimeType": "application/pdf",
        "tags": ["invoice", "business"],
        "metadata": {
          "processingStatus": "completed",
          "extractedFields": {
            "invoiceNumber": "INV-001",
            "totalAmount": "$1,234.56"
          }
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "pages": 1
    }
  }
}
```

---

## 3. Schema Management

### 3.1 Create Schema
**POST** `/schema/define-schema`

Create a new extraction schema.

**Request:**
```json
{
  "name": "Invoice Schema",
  "description": "Extract invoice data from PDFs",
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
  ],
  "isPublic": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "Invoice Schema",
    "description": "Extract invoice data from PDFs",
    "fields": [...],
    "version": 1,
    "isPublic": false,
    "usageCount": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Schema saved"
}
```

### 3.2 Get User Schemas
**GET** `/schema/user`

Get all private schemas for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
      "name": "Invoice Schema",
      "description": "Extract invoice data from PDFs",
      "fields": [...],
      "version": 1,
      "isPublic": false,
      "usageCount": 5,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 3.3 Get Public Schemas
**GET** `/schema/public`

Get all public schemas available to all users.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j7",
      "name": "Standard Invoice Schema",
      "description": "Standard invoice extraction",
      "fields": [...],
      "version": 1,
      "isPublic": true,
      "usageCount": 25,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 3.4 Get All Schemas (User + Public)
**GET** `/schema/schemas`

Get all schemas available to the user (private + public).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
      "name": "Invoice Schema",
      "description": "Extract invoice data from PDFs",
      "fields": [...],
      "version": 1,
      "isPublic": false,
      "usageCount": 5,
      "userId": "64f1a2b3c4d5e6f7g8h9i0j1"
    },
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j7",
      "name": "Standard Invoice Schema",
      "description": "Standard invoice extraction",
      "fields": [...],
      "version": 1,
      "isPublic": true,
      "usageCount": 25
    }
  ]
}
```

### 3.5 Get Schema by ID
**GET** `/schema/:id`

Get detailed information about a specific schema.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "Invoice Schema",
    "description": "Extract invoice data from PDFs",
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
      }
    ],
    "version": 1,
    "isPublic": false,
    "usageCount": 5,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3.6 Update Schema
**PUT** `/schema/:id`

Update an existing schema.

**Request:**
```json
{
  "name": "Updated Invoice Schema",
  "description": "Updated description",
  "fields": [...],
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
    "name": "Updated Invoice Schema",
    "description": "Updated description",
    "fields": [...],
    "isPublic": true,
    "updatedAt": "2024-01-15T11:30:00.000Z"
  },
  "message": "Schema updated successfully"
}
```

### 3.7 Delete Schema
**DELETE** `/schema/:id`

Delete a schema.

**Response:**
```json
{
  "success": true,
  "message": "Schema deleted successfully"
}
```

### 3.8 Share Schema
**POST** `/schema/:id/share`

Share a schema with other users.

**Request:**
```json
{
  "userIds": ["64f1a2b3c4d5e6f7g8h9i0j8", "64f1a2b3c4d5e6f7g8h9i0j9"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
    "sharedWith": ["64f1a2b3c4d5e6f7g8h9i0j8", "64f1a2b3c4d5e6f7g8h9i0j9"],
    "updatedAt": "2024-01-15T11:30:00.000Z"
  },
  "message": "Schema shared successfully"
}
```

### 3.9 Duplicate Schema
**POST** `/schema/:id/duplicate`

Create a copy of an existing schema.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j10",
    "name": "Invoice Schema (Copy)",
    "description": "Extract invoice data from PDFs",
    "fields": [...],
    "version": 1,
    "isPublic": false,
    "usageCount": 0,
    "createdAt": "2024-01-15T11:30:00.000Z",
    "updatedAt": "2024-01-15T11:30:00.000Z"
  },
  "message": "Schema duplicated successfully"
}
```

### 3.10 Get Schema Usage Stats
**GET** `/schema/:id/usage`

Get usage statistics for a schema.

**Response:**
```json
{
  "success": true,
  "data": {
    "usageCount": 15,
    "lastUsed": "2024-01-15T10:30:00.000Z",
    "documentsProcessed": 15,
    "successRate": 0.95
  }
}
```

---

## 4. Text Extraction

### 4.1 Extract Text from PDF
**POST** `/schema/extract-text`

Extract raw text from a PDF document.

**Request:**
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```
  file: <pdf_file>
  ```

**Response:**
```json
{
  "pages": [
    {
      "page": 1,
      "text": "Invoice #: INV-001\nDate: 2024-01-15\nTotal: $1,234.56"
    }
  ],
  "fullText": "Invoice #: INV-001\nDate: 2024-01-15\nTotal: $1,234.56"
}
```

### 4.2 Extract Data with Schema
**POST** `/schema/extract`

Extract structured data from PDF using a schema.

**Request:**
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```
  file: <pdf_file>
  schemaId: "64f1a2b3c4d5e6f7g8h9i0j4" (optional)
  schema: {...} (optional, inline schema)
  ```

**Response:**
- **Content-Type**: `text/csv`
- **Content-Disposition**: `attachment; filename="extracted.csv"`

CSV content:
```csv
invoiceNumber,totalAmount,date
INV-001,$1,234.56,2024-01-15
```

### 4.3 Bulk Extract from ZIP
**POST** `/schema/bulk-extract`

Extract data from multiple PDFs in a ZIP file.

**Request:**
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```
  file: <zip_file>
  schemaId: "64f1a2b3c4d5e6f7g8h9i0j4"
  ```

**Response:**
- **Content-Type**: `text/csv`
- **Content-Disposition**: `attachment; filename="bulk_extract_schema_name.csv"`

### 4.4 Analyze Template
**POST** `/schema/analyze-template`

Analyze a PDF to help create template-based extraction schemas.

**Request:**
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```
  file: <pdf_file>
  ```

**Response:**
```json
{
  "message": "Template analysis complete",
  "analysis": [
    {
      "page": 1,
      "words": [
        {
          "text": "Invoice",
          "confidence": 95.5,
          "bbox": {
            "x": 100,
            "y": 200,
            "width": 80,
            "height": 20
          }
        }
      ],
      "fullText": "Invoice #: INV-001\nDate: 2024-01-15"
    }
  ],
  "suggestions": [
    "Use the word positions to create template fields with referenceText and offsetX/offsetY",
    "Example: { name: 'invoice_number', template: { referenceText: 'Invoice:', offsetX: 100, offsetY: 0, width: 200, height: 30 } }"
  ]
}
```

---

## 5. Analytics

### 5.1 Get Storage Statistics
**GET** `/analytics/storage`

Get storage usage statistics for the user.

**Response:**
```json
{
  "success": true,
  "data": {
    "used": 52428800,
    "limit": 1073741824,
    "percentage": 4.88,
    "documentCount": 25
  }
}
```

### 5.2 Get Document Statistics
**GET** `/analytics/documents`

Get document processing statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "byStatus": {
      "pending": 2,
      "processing": 1,
      "completed": 20,
      "failed": 2
    },
    "byType": {
      "application/pdf": 25
    },
    "recent": 8
  }
}
```

### 5.3 Get Schema Statistics
**GET** `/analytics/schemas`

Get schema usage statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSchemas": 10,
    "schemas": [...],
    "mostUsed": [
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j4",
        "name": "Invoice Schema",
        "usageCount": 15
      }
    ],
    "publicSchemasUsed": [...]
  }
}
```

### 5.4 Get User Activity
**GET** `/analytics/activity`

Get user activity timeline.

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "type": "document_upload",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "details": {
          "documentName": "invoice_january.pdf",
          "fileSize": 1024000
        }
      },
      {
        "type": "folder_created",
        "timestamp": "2024-01-15T09:15:00.000Z",
        "details": {
          "folderName": "Invoices"
        }
      }
    ],
    "totalUploads": 25,
    "totalFolders": 8,
    "totalSchemas": 10
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required field: name"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Access denied: No authorization header"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Document not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to process request"
}
```

---

## Usage Examples

### Frontend Integration Example

```javascript
// Authentication
const token = 'your_jwt_token';
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

// Upload document with schema
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('schemaId', '64f1a2b3c4d5e6f7g8h9i0j4');
formData.append('folderId', '64f1a2b3c4d5e6f7g8h9i0j6');
formData.append('tags', 'invoice,business,2024');

const response = await fetch('/api/documents/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('Upload result:', result);

// Get user documents
const documentsResponse = await fetch('/api/documents?page=1&limit=20', {
  headers
});

const documents = await documentsResponse.json();
console.log('Documents:', documents);

// Create folder
const folderResponse = await fetch('/api/folders', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    name: 'Invoices',
    description: 'Invoice documents'
  })
});

const folder = await folderResponse.json();
console.log('Created folder:', folder);
```

---

## Rate Limiting

- **Upload endpoints**: 10 requests per minute
- **Extraction endpoints**: 20 requests per minute
- **Other endpoints**: 100 requests per minute

---

## File Size Limits

- **Single PDF**: 50MB
- **ZIP files**: 100MB
- **Total storage per user**: 1GB (configurable)

---

## Supported File Types

- **PDF**: Primary document format
- **ZIP**: For bulk processing (containing PDFs)

---

## Processing Status

Documents go through these processing states:

1. **pending**: Document uploaded, waiting for processing
2. **processing**: OCR and extraction in progress
3. **completed**: Processing finished successfully
4. **failed**: Processing failed, check logs

---

## Schema Field Types

### 1. Regex-based Extraction
```json
{
  "name": "invoiceNumber",
  "regex": "Invoice #: (\\w+)"
}
```

### 2. Region-based Extraction
```json
{
  "name": "totalAmount",
  "region": {
    "page": 1,
    "x": 400,
    "y": 500,
    "width": 200,
    "height": 50
  }
}
```

### 3. Template-based Extraction
```json
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
```

This API provides a complete document management system with authentication, organization, and text extraction capabilities for your Next.js frontend application. 