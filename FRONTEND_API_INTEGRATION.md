# Document Store and Management API Documentation

## Overview

This document provides comprehensive information about the Document Store and Management APIs for frontend integration. The backend provides RESTful APIs for uploading, managing, and extracting data from documents.

## Base URL

```
http://localhost:5000
```

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Document Upload

#### Upload Document (with Schema)
**Endpoint:** `POST /api/documents/upload`  
**Alternative:** `POST /upload` (for backward compatibility)

**Description:** Upload a document with optional schema for data extraction.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `file` (required): PDF file to upload
  - `schemaId` (optional): ID of the schema to use for extraction
  - `folderId` (optional): ID of the folder to store the document in
  - `tags` (optional): Comma-separated list of tags
  - `description` (optional): Document description

**Example Request:**
```javascript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('schemaId', '507f1f77bcf86cd799439011');
formData.append('folderId', '507f1f77bcf86cd799439012');
formData.append('tags', 'invoice,2024,urgent');
formData.append('description', 'Q4 Invoice for Client ABC');

const response = await fetch('http://localhost:5000/api/documents/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "07a04db0-af08-45d3-acf6-cecb8db72a4c",
    "schemaId": "507f1f77bcf86cd799439011",
    "name": "invoice.pdf",
    "originalName": "invoice.pdf",
    "filePath": "uploads/documents/uuid-filename.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "folderId": "507f1f77bcf86cd799439012",
    "tags": ["invoice", "2024", "urgent"],
    "metadata": {
      "description": "Q4 Invoice for Client ABC",
      "processingStatus": "pending"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Document uploaded successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing file or invalid data
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Schema not found (if schemaId provided)
- `413 Payload Too Large`: File too large
- `500 Internal Server Error`: Server error

### 2. Document Management

#### Get User Documents
**Endpoint:** `GET /api/documents`

**Description:** Retrieve all documents for the authenticated user with optional filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sortBy` (optional): Sort field (createdAt, name, fileSize)
- `sortOrder` (optional): Sort order (asc, desc)
- `folderId` (optional): Filter by folder
- `tags` (optional): Filter by tags (comma-separated)
- `status` (optional): Filter by processing status

**Example Request:**
```javascript
const response = await fetch('http://localhost:5000/api/documents?page=1&limit=10&sortBy=createdAt&sortOrder=desc', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "userId": "07a04db0-af08-45d3-acf6-cecb8db72a4c",
        "schemaId": "507f1f77bcf86cd799439011",
        "name": "invoice.pdf",
        "originalName": "invoice.pdf",
        "filePath": "uploads/documents/uuid-filename.pdf",
        "fileSize": 1024000,
        "mimeType": "application/pdf",
        "folderId": "507f1f77bcf86cd799439012",
        "tags": ["invoice", "2024"],
        "metadata": {
          "description": "Q4 Invoice",
          "processingStatus": "completed",
          "extractedFields": {
            "invoice_number": "INV-2024-001",
            "amount": "1500.00",
            "date": "2024-01-15"
          }
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### Get Single Document
**Endpoint:** `GET /api/documents/:id`

**Description:** Retrieve a specific document by ID.

**Example Request:**
```javascript
const response = await fetch('http://localhost:5000/api/documents/507f1f77bcf86cd799439013', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "07a04db0-af08-45d3-acf6-cecb8db72a4c",
    "schemaId": "507f1f77bcf86cd799439011",
    "name": "invoice.pdf",
    "originalName": "invoice.pdf",
    "filePath": "uploads/documents/uuid-filename.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "folderId": "507f1f77bcf86cd799439012",
    "tags": ["invoice", "2024"],
    "metadata": {
      "description": "Q4 Invoice",
      "processingStatus": "completed",
      "extractedFields": {
        "invoice_number": "INV-2024-001",
        "amount": "1500.00",
        "date": "2024-01-15"
      },
      "pageCount": 2
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Update Document
**Endpoint:** `PUT /api/documents/:id`

**Description:** Update document metadata (name, description, tags, folder).

**Request Body:**
```json
{
  "name": "Updated Invoice Name",
  "description": "Updated description",
  "tags": ["invoice", "updated", "2024"],
  "folderId": "507f1f77bcf86cd799439012"
}
```

**Example Request:**
```javascript
const response = await fetch('http://localhost:5000/api/documents/507f1f77bcf86cd799439013', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Updated Invoice Name',
    description: 'Updated description',
    tags: ['invoice', 'updated', '2024']
  })
});
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Updated Invoice Name",
    "description": "Updated description",
    "tags": ["invoice", "updated", "2024"],
    "updatedAt": "2024-01-15T11:30:00.000Z"
  },
  "message": "Document updated successfully"
}
```

#### Delete Document
**Endpoint:** `DELETE /api/documents/:id`

**Description:** Delete a document and its associated files.

**Example Request:**
```javascript
const response = await fetch('http://localhost:5000/api/documents/507f1f77bcf86cd799439013', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

#### Re-extract Document Data
**Endpoint:** `POST /api/documents/:id/extract`

**Description:** Re-run data extraction on a document using its associated schema.

**Example Request:**
```javascript
const response = await fetch('http://localhost:5000/api/documents/507f1f77bcf86cd799439013/extract', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Document extraction started",
  "data": {
    "processingStatus": "processing"
  }
}
```

#### Get Document Metadata
**Endpoint:** `GET /api/documents/:id/metadata`

**Description:** Get detailed metadata for a document including extraction results.

**Example Request:**
```javascript
const response = await fetch('http://localhost:5000/api/documents/507f1f77bcf86cd799439013/metadata', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "documentId": "507f1f77bcf86cd799439013",
    "extractedFields": {
      "invoice_number": "INV-2024-001",
      "amount": "1500.00",
      "date": "2024-01-15",
      "vendor": "ABC Company"
    },
    "processingStatus": "completed",
    "pageCount": 2,
    "fileSize": 1024000,
    "extractionTimestamp": "2024-01-15T10:35:00.000Z"
  }
}
```

### 3. Folder Management

#### Get User Folders
**Endpoint:** `GET /api/folders`

**Description:** Retrieve all folders for the authenticated user in a tree structure.

**Example Request:**
```javascript
const response = await fetch('http://localhost:5000/api/folders', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Invoices",
      "description": "All invoice documents",
      "parentId": null,
      "documentCount": 15,
      "totalSize": 52428800,
      "children": [
        {
          "_id": "507f1f77bcf86cd799439014",
          "name": "2024",
          "description": "2024 invoices",
          "parentId": "507f1f77bcf86cd799439012",
          "documentCount": 8,
          "totalSize": 26214400
        }
      ],
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### Create Folder
**Endpoint:** `POST /api/folders`

**Description:** Create a new folder.

**Request Body:**
```json
{
  "name": "New Folder",
  "description": "Folder description",
  "parentId": "507f1f77bcf86cd799439012"
}
```

**Example Request:**
```javascript
const response = await fetch('http://localhost:5000/api/folders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'New Folder',
    description: 'Folder description',
    parentId: '507f1f77bcf86cd799439012'
  })
});
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "name": "New Folder",
    "description": "Folder description",
    "parentId": "507f1f77bcf86cd799439012",
    "documentCount": 0,
    "totalSize": 0,
    "createdAt": "2024-01-15T12:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### Get Folder Documents
**Endpoint:** `GET /api/folders/:id/documents`

**Description:** Get all documents in a specific folder.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `sortBy` (optional): Sort field
- `sortOrder` (optional): Sort order

**Example Request:**
```javascript
const response = await fetch('http://localhost:5000/api/folders/507f1f77bcf86cd799439012/documents?page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "folder": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Invoices",
      "description": "All invoice documents"
    },
    "documents": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "invoice.pdf",
        "fileSize": 1024000,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "pages": 2
    }
  }
}
```

### 4. Schema Management

#### Get User Schemas
**Endpoint:** `GET /api/schema/user`

**Description:** Get all schemas created by the authenticated user.

**Example Request:**
```javascript
const response = await fetch('http://localhost:5000/api/schema/user', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Invoice Schema",
      "description": "Schema for extracting invoice data",
      "fields": [
        {
          "name": "invoice_number",
          "type": "text",
          "required": true,
          "regex": "INV-\\d{4}-\\d{3}"
        },
        {
          "name": "amount",
          "type": "number",
          "required": true,
          "regex": "\\$?\\d+\\.\\d{2}"
        }
      ],
      "usageCount": 25,
      "isPublic": false,
      "createdAt": "2024-01-15T09:00:00.000Z"
    }
  ]
}
```

#### Get Public Schemas
**Endpoint:** `GET /api/schema/public`

**Description:** Get all public schemas available for use.

**Example Request:**
```javascript
const response = await fetch('http://localhost:5000/api/schema/public', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 5. Analytics

#### Get Document Analytics
**Endpoint:** `GET /api/analytics/documents`

**Description:** Get analytics data for documents.

**Query Parameters:**
- `period` (optional): Time period (day, week, month, year)
- `folderId` (optional): Filter by folder

**Example Request:**
```javascript
const response = await fetch('http://localhost:5000/api/analytics/documents?period=month', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalDocuments": 150,
    "totalSize": 1073741824,
    "documentsByType": {
      "application/pdf": 120,
      "image/jpeg": 30
    },
    "documentsByStatus": {
      "completed": 100,
      "processing": 20,
      "pending": 30
    },
    "uploadTrend": [
      {
        "date": "2024-01-01",
        "count": 5,
        "size": 52428800
      }
    ]
  }
}
```

## Error Handling

All API endpoints return consistent error responses:

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

### Common HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `413 Payload Too Large`: File too large
- `500 Internal Server Error`: Server error

## File Upload Guidelines

### Supported File Types
- **PDF**: `application/pdf` (primary)
- **Images**: `image/jpeg`, `image/png`, `image/tiff` (for OCR)

### File Size Limits
- **Maximum file size**: 100MB per file
- **Maximum batch size**: 1GB total

### Upload Best Practices
1. **Compress large files** before upload
2. **Use descriptive filenames** for better organization
3. **Add relevant tags** for easier searching
4. **Include descriptions** for context
5. **Organize in folders** for better management

## Authentication Flow

### 1. Login
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});

const { token } = await response.json();
localStorage.setItem('authToken', token);
```

### 2. Token Usage
```javascript
const token = localStorage.getItem('authToken');
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### 3. Token Refresh
```javascript
// Check if token is expired
const token = localStorage.getItem('authToken');
if (isTokenExpired(token)) {
  // Redirect to login or refresh token
  window.location.href = '/login';
}
```

## Frontend Integration Examples

### React Hook for Document Upload
```javascript
import { useState } from 'react';

const useDocumentUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadDocument = async (file, options = {}) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.schemaId) formData.append('schemaId', options.schemaId);
      if (options.folderId) formData.append('folderId', options.folderId);
      if (options.tags) formData.append('tags', options.tags);
      if (options.description) formData.append('description', options.description);

      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { uploadDocument, uploading, error };
};
```

### React Hook for Document Management
```javascript
import { useState, useEffect } from 'react';

const useDocuments = (filters = {}) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  const fetchDocuments = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...filters
      });

      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/documents?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const result = await response.json();
      setDocuments(result.data.documents);
      setPagination(result.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [filters]);

  return { documents, loading, error, pagination, refetch: fetchDocuments };
};
```

## Security Considerations

1. **Token Storage**: Store JWT tokens securely (httpOnly cookies recommended)
2. **File Validation**: Always validate file types and sizes on frontend
3. **Error Handling**: Don't expose sensitive error details to users
4. **Rate Limiting**: Implement client-side rate limiting for uploads
5. **Progress Tracking**: Show upload progress for large files

## Performance Tips

1. **Lazy Loading**: Load documents in pages
2. **Caching**: Cache document metadata and thumbnails
3. **Compression**: Compress images before upload
4. **Batch Operations**: Use batch endpoints for multiple operations
5. **Debouncing**: Debounce search and filter operations

## Testing

### Test File Upload
```javascript
// Create a test PDF file
const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

// Test upload
const result = await uploadDocument(testFile, {
  schemaId: 'test-schema-id',
  tags: 'test,upload',
  description: 'Test upload'
});

console.log('Upload successful:', result);
```

### Test Error Handling
```javascript
try {
  await uploadDocument(null); // Should fail
} catch (error) {
  console.log('Error handled:', error.message);
}
```

This documentation provides a comprehensive guide for frontend developers to integrate with the Document Store and Management APIs. For additional support, refer to the backend logs and error messages for debugging. 