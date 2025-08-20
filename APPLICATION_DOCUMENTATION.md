# Document Management Backend API - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Setup & Installation](#setup--installation)
5. [API Endpoints](#api-endpoints)
6. [Authentication](#authentication)
7. [Database Models](#database-models)
8. [File Structure](#file-structure)
9. [Usage Examples](#usage-examples)
10. [Error Handling](#error-handling)
11. [Configuration](#configuration)
12. [Development](#development)

---

## Overview

This is a Node.js/Express.js backend API for a comprehensive document management system. The application serves as a microservice that handles document processing, storage, organization, and data extraction while integrating with external user management systems.

### Key Capabilities
- **Document Upload & Processing**: PDF upload with OCR and data extraction
- **Folder Organization**: Hierarchical folder structure for document organization
- **Schema Management**: Custom extraction schemas with multiple extraction methods
- **Data Extraction**: OCR-based extraction using regions, regex, and templates
- **Analytics**: Storage and usage statistics
- **JWT Authentication**: Secure API access with token-based authentication

---

## Architecture

### Microservice Design
The backend operates as a microservice focused on document management:
- **No User Management**: User data is managed externally (Next.js frontend)
- **ID-Based Communication**: Frontend stores document/schema/folder IDs
- **Stateless Authentication**: JWT tokens contain user identification
- **Modular Structure**: Separate controllers for different functionalities

### Technology Stack
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Processing**: Multer, Sharp, Tesseract.js
- **Document Processing**: PDF2Pic, OCR extraction
- **Logging**: Winston

---

## Features

### 1. Document Management
- Upload PDF documents with metadata
- Organize documents in folders
- Extract data using custom schemas
- Generate thumbnails
- Track processing status

### 2. Folder Organization
- Create hierarchical folder structure
- Nested folder support
- Document count and size tracking
- Path-based organization

### 3. Schema Management
- Define custom extraction schemas
- Multiple extraction methods (regex, region, template)
- Public and private schemas
- Schema sharing and duplication
- Version control

### 4. Data Extraction
- OCR processing with Tesseract.js
- Region-based extraction
- Regex pattern matching
- Template-based extraction
- Batch processing for ZIP files

### 5. Analytics
- Storage usage statistics
- Document processing metrics
- Schema usage tracking
- User activity monitoring

---

## Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Tesseract OCR installed

### 1. Clone and Install
```bash
git clone <repository-url>
cd Backend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/document_management

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# OCR Configuration
TESSERACT_PATH=/usr/bin/tesseract
OCR_DPI=300
OCR_LANG=eng

# CORS (for development)
CORS_ORIGIN=http://localhost:3000
```

### 3. Install Tesseract OCR

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-eng
```

**macOS:**
```bash
brew install tesseract
```

**Windows:**
Download from https://github.com/UB-Mannheim/tesseract/wiki

### 4. Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

---

## API Endpoints

### Authentication
All endpoints (except `/api/auth/*`) require JWT authentication:
```
Authorization: Bearer <jwt_token>
```

### 1. Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
Register a new user.

**Request:**
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

#### POST `/api/auth/login`
Authenticate user and get JWT token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### 2. Document Management (`/api/documents`)

#### POST `/api/documents/upload`
Upload a document with schema for processing.

**Request:** Multipart form data
```
file: PDF file
schemaId: Schema ID (required)
folderId: Folder ID (optional)
tags: Comma-separated tags (optional)
description: Document description (optional)
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

#### GET `/api/documents`
Get user's documents with filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `folderId`: Filter by folder
- `schemaId`: Filter by schema
- `search`: Search in name/tags
- `status`: Filter by processing status

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

#### GET `/api/documents/:id`
Get specific document details.

#### PUT `/api/documents/:id`
Update document metadata.

#### DELETE `/api/documents/:id`
Delete document and associated files.

#### POST `/api/documents/:id/extract`
Re-extract data from document using current schema.

### 3. Folder Management (`/api/folders`)

#### POST `/api/folders`
Create a new folder.

**Request:**
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
    "documentCount": 0,
    "totalSize": 0,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET `/api/folders`
Get user's folder tree structure.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "folder_id",
      "name": "Work Documents",
      "path": "/Work Documents",
      "documentCount": 5,
      "totalSize": 5120000,
      "children": [
        {
          "_id": "subfolder_id",
          "name": "Invoices",
          "path": "/Work Documents/Invoices",
          "documentCount": 3,
          "totalSize": 3072000
        }
      ]
    }
  ]
}
```

#### GET `/api/folders/:id`
Get specific folder details.

#### PUT `/api/folders/:id`
Update folder information.

#### DELETE `/api/folders/:id`
Delete folder (must be empty).

#### GET `/api/folders/:id/documents`
Get documents in specific folder.

### 4. Schema Management (`/api/schema`)

#### POST `/api/schema/define-schema`
Define a new extraction schema.

**Request:**
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

#### GET `/api/schema/schemas`
Get user's schemas and public schemas.

#### GET `/api/schema/user`
Get user's private schemas.

#### GET `/api/schema/public`
Get public schemas.

#### GET `/api/schema/:id`
Get specific schema details.

#### PUT `/api/schema/:id`
Update schema.

#### DELETE `/api/schema/:id`
Delete schema.

#### POST `/api/schema/:id/share`
Share schema with other users.

#### POST `/api/schema/:id/duplicate`
Duplicate existing schema.

#### GET `/api/schema/:id/usage`
Get schema usage statistics.

### 5. Document Processing (`/api/upload`)

#### POST `/api/upload/upload-pdf`
Upload and OCR a single PDF.

#### POST `/api/upload/upload-zip`
Upload and process ZIP containing PDFs.

### 6. Data Extraction (`/api/schema`)

#### POST `/api/schema/extract`
Extract data from PDF using schema.

#### POST `/api/schema/bulk-extract`
Extract data from ZIP using schema.

#### POST `/api/schema/analyze-template`
Analyze PDF for template-based extraction.

### 7. Analytics (`/api/analytics`)

#### GET `/api/analytics/storage`
Get storage usage statistics.

#### GET `/api/analytics/documents`
Get document processing statistics.

#### GET `/api/analytics/schemas`
Get schema usage statistics.

#### GET `/api/analytics/activity`
Get user activity timeline.

---

## Authentication

### JWT Token Structure
The backend expects JWT tokens with the following payload:
```json
{
  "id": "user_id",
  "userId": "user_id", // Alternative field name
  "email": "user@example.com",
  "iat": 1234567890
}
```

### Token Verification
The authentication middleware:
1. Extracts the Bearer token from Authorization header
2. Verifies the JWT signature using `JWT_SECRET`
3. Extracts user ID from `userId` or `id` field
4. Attaches user info to `req.user`

### Error Responses
```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

## Database Models

### 1. User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  premium: Boolean,
  storageUsed: Number,
  storageLimit: Number,
  documentCount: Number,
  preferences: {
    defaultSchema: ObjectId,
    folderView: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Document Model
```javascript
{
  userId: ObjectId (ref: User),
  schemaId: ObjectId (ref: Schema),
  name: String,
  originalName: String,
  filePath: String,
  fileSize: Number,
  mimeType: String,
  thumbnailPath: String,
  folderId: ObjectId (ref: Folder),
  tags: [String],
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
```

### 3. Folder Model
```javascript
{
  userId: ObjectId (ref: User),
  name: String,
  parentFolderId: ObjectId (ref: Folder),
  path: String,
  description: String,
  documentCount: Number,
  totalSize: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Schema Model
```javascript
{
  userId: ObjectId (ref: User),
  name: String,
  description: String,
  fields: [{
    name: String,
    regex: String,
    region: {
      page: Number,
      x: Number,
      y: Number,
      width: Number,
      height: Number
    },
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
  sharedWith: [ObjectId],
  usageCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## File Structure

```
Backend/
├── config/
│   └── db.js                 # Database connection
├── controllers/
│   ├── analyticsController.js # Analytics endpoints
│   ├── documentController.js  # Document management
│   ├── folderController.js    # Folder management
│   ├── schemaController.js    # Schema and extraction
│   └── uploadController.js    # File upload processing
├── middleware/
│   ├── auth.js               # JWT authentication
│   └── uploadMiddleware.js    # File upload handling
├── models/
│   ├── Document.js           # Document model
│   ├── Folder.js             # Folder model
│   ├── Schema.js             # Schema model
│   └── User.js               # User model
├── routes/
│   ├── analytics.js          # Analytics routes
│   ├── authRoute.js          # Authentication routes
│   ├── documents.js          # Document routes
│   ├── folders.js            # Folder routes
│   ├── schema.js             # Schema routes
│   └── upload.js             # Upload routes
├── services/
│   └── extractionService.js  # Data extraction logic
├── utils/
│   └── ...                   # Utility functions
├── uploads/
│   ├── documents/            # Uploaded documents
│   └── thumbnails/           # Generated thumbnails
├── index.js                  # Main application file
├── package.json              # Dependencies and scripts
└── .env                      # Environment variables
```

---

## Usage Examples

### Frontend Integration

#### 1. Upload Document
```javascript
const uploadDocument = async (file, schemaId, folderId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('schemaId', schemaId);
  if (folderId) formData.append('folderId', folderId);
  
  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    },
    body: formData
  });
  
  return response.json();
};
```

#### 2. Get User Documents
```javascript
const getDocuments = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/documents?${params}`, {
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  return response.json();
};
```

#### 3. Create Folder
```javascript
const createFolder = async (name, parentFolderId) => {
  const response = await fetch('/api/folders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, parentFolderId })
  });
  
  return response.json();
};
```

#### 4. Define Schema
```javascript
const defineSchema = async (schemaData) => {
  const response = await fetch('/api/schema/define-schema', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(schemaData)
  });
  
  return response.json();
};
```

### cURL Examples

#### 1. Upload Document
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.pdf" \
  -F "schemaId=schema_id_here" \
  http://localhost:5000/api/documents/upload
```

#### 2. Get Documents
```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:5000/api/documents?page=1&limit=10"
```

#### 3. Create Folder
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Work Documents","description":"Important work files"}' \
  http://localhost:5000/api/folders
```

#### 4. Define Schema
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invoice Schema",
    "fields": [
      {
        "name": "invoiceNumber",
        "regex": "Invoice #: (\\w+)"
      }
    ]
  }' \
  http://localhost:5000/api/schema/define-schema
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

### Error Types
1. **Authentication Errors**: Missing or invalid JWT token
2. **Validation Errors**: Invalid request data
3. **File Errors**: Upload issues, unsupported formats
4. **Processing Errors**: OCR failures, extraction errors
5. **Database Errors**: Connection issues, query failures

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `UPLOAD_DIR` | File upload directory | `uploads` |
| `MAX_FILE_SIZE` | Maximum file size (bytes) | `10485760` |
| `TESSERACT_PATH` | Tesseract executable path | `/usr/bin/tesseract` |
| `OCR_DPI` | OCR resolution | `300` |
| `OCR_LANG` | OCR language | `eng` |
| `CORS_ORIGIN` | CORS allowed origins | `http://localhost:3000` |

### CORS Configuration
The application is configured to accept requests from:
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- Any IP in the `192.168.x.x:3000` range

---

## Development

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests (not implemented)
```

### Development Workflow
1. Start MongoDB service
2. Set up environment variables
3. Run `npm run dev` for development
4. Use Postman or similar for API testing
5. Check logs for debugging information

### Debugging
The application includes extensive logging:
- Authentication attempts
- File processing steps
- Database operations
- Error details

### Testing API Endpoints
Use tools like:
- Postman
- cURL
- Thunder Client (VS Code extension)
- Insomnia

### Common Issues
1. **JWT Token Issues**: Ensure token is valid and includes `userId` or `id`
2. **File Upload Errors**: Check file size and format restrictions
3. **OCR Failures**: Verify Tesseract installation and path
4. **Database Connection**: Check MongoDB connection string

---

## Security Considerations

### Authentication
- JWT tokens with expiration
- Secure token verification
- No user management in backend

### File Security
- File type validation
- Size limits
- Secure file storage
- Thumbnail generation for previews

### Data Protection
- Input validation
- SQL injection prevention (Mongoose)
- CORS configuration
- Error message sanitization

---

## Performance Optimization

### Database
- Indexed fields for faster queries
- Efficient pagination
- Optimized aggregation pipelines

### File Processing
- Asynchronous processing
- Thumbnail generation
- Batch processing for ZIP files

### Caching
- Schema caching (future enhancement)
- Document metadata caching

---

## Future Enhancements

### Planned Features
1. **Real-time Processing**: WebSocket integration for live status updates
2. **Advanced OCR**: Support for multiple languages and formats
3. **Cloud Storage**: S3 integration for scalable storage
4. **API Rate Limiting**: Prevent abuse and ensure fair usage
5. **Webhook Support**: Notify frontend of processing completion
6. **Bulk Operations**: Mass document operations
7. **Advanced Analytics**: Detailed usage and performance metrics

### Scalability
- Horizontal scaling with load balancers
- Database sharding for large datasets
- CDN integration for file delivery
- Microservice decomposition

---

## Support

### Troubleshooting
1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Confirm Tesseract OCR is properly installed
5. Validate JWT token format and content

### Getting Help
- Review this documentation
- Check server logs for error details
- Verify API endpoint responses
- Test with simple cURL commands first

---

## License
MIT License - See LICENSE file for details.

---

*This documentation covers the complete functionality of the Document Management Backend API. For specific implementation details, refer to the individual source files.* 