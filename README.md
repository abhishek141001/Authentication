# Document Management System API

A comprehensive Node.js backend API for document management, organization, and text extraction with MongoDB and JWT authentication.

## 🚀 Features

### 📁 Document Management
- **Upload Documents**: Upload PDF files with optional schema and folder assignment
- **Document Organization**: Organize documents in hierarchical folders
- **Metadata Management**: Store and manage document metadata, tags, and descriptions
- **Bulk Operations**: Bulk delete and move documents
- **Processing Status**: Track document processing status (pending, processing, completed, failed)

### 🗂️ Folder Management
- **Hierarchical Folders**: Create nested folder structures
- **Folder Operations**: Create, update, delete, and move folders
- **Document Organization**: Assign documents to folders
- **Folder Statistics**: Get detailed statistics for folders and subfolders

### 📋 Schema Management
- **Custom Schemas**: Define extraction schemas for different document types
- **Multiple Extraction Methods**: 
  - Regex-based extraction
  - Region-based extraction (coordinates)
  - Template-based extraction (relative to reference text)
- **Schema Sharing**: Share schemas with other users
- **Public Schemas**: Make schemas available to all users
- **Schema Versioning**: Track schema versions and updates

### 🔍 Text Extraction
- **OCR Processing**: Extract text from PDF documents using Tesseract
- **Structured Data**: Extract specific fields using defined schemas
- **Bulk Processing**: Process multiple documents from ZIP files
- **Template Analysis**: Analyze PDFs to help create extraction templates
- **Fuzzy Matching**: Handle OCR errors with fuzzy text matching

### 📊 Analytics
- **Storage Analytics**: Track user storage usage and limits
- **Document Statistics**: Monitor document processing and status
- **Schema Usage**: Track schema usage and performance
- **User Activity**: Monitor user activity and document uploads

### 🔐 Authentication & Security
- **JWT Authentication**: Secure API with JWT tokens
- **User Management**: User registration, login, and profile management
- **Data Isolation**: Users can only access their own data
- **Storage Limits**: Configurable storage limits per user

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Processing**: 
  - PDF to Image: pdf2pic
  - OCR: Tesseract.js
  - Image Processing: Sharp
- **File Upload**: Multer
- **Logging**: Winston
- **Validation**: Custom validation with MongoDB ObjectId checking

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Database
   MONGODB=mongodb://localhost:27017/document-management
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # File Upload
   UPLOAD_DIR=uploads
   MAX_FILE_SIZE=52428800
   
   # OCR Configuration
   OCR_DPI=300
   OCR_LANG=eng
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## 📁 Project Structure

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
│   ├── logger.js             # Logging utility
│   └── pdfUtils.js           # PDF processing utilities
├── uploads/
│   ├── documents/            # Uploaded documents
│   └── thumbnails/           # Generated thumbnails
├── server.js                 # Main server file
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - Get user documents
- `GET /api/documents/:id` - Get single document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/re-extract` - Re-extract document
- `GET /api/documents/:id/metadata` - Get document metadata
- `POST /api/documents/bulk-delete` - Bulk delete documents
- `POST /api/documents/bulk-move` - Bulk move documents

### Folders
- `POST /api/folders` - Create folder
- `GET /api/folders` - Get user folders (tree)
- `GET /api/folders/:id` - Get single folder
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder
- `GET /api/folders/:id/documents` - Get folder documents
- `POST /api/folders/:id/move` - Move folder
- `GET /api/folders/:id/stats` - Get folder statistics

### Schemas
- `POST /api/schema/define-schema` - Create schema
- `GET /api/schema/user` - Get user schemas
- `GET /api/schema/public` - Get public schemas
- `GET /api/schema/schemas` - Get all available schemas
- `GET /api/schema/:id` - Get schema by ID
- `PUT /api/schema/:id` - Update schema
- `DELETE /api/schema/:id` - Delete schema
- `POST /api/schema/:id/share` - Share schema
- `POST /api/schema/:id/duplicate` - Duplicate schema
- `GET /api/schema/:id/usage` - Get schema usage stats

### Text Extraction
- `POST /api/schema/extract-text` - Extract raw text
- `POST /api/schema/extract` - Extract with schema
- `POST /api/schema/bulk-extract` - Bulk extract from ZIP
- `POST /api/schema/analyze-template` - Analyze PDF template

### Analytics
- `GET /api/analytics/storage` - Storage statistics
- `GET /api/analytics/documents` - Document statistics
- `GET /api/analytics/schemas` - Schema statistics
- `GET /api/analytics/activity` - User activity

## 🔐 Authentication

All API endpoints require authentication via JWT Bearer token:

```bash
Authorization: Bearer <jwt_token>
```

### JWT Token Structure
```json
{
  "id": "user_mongodb_id",
  "userId": "user_mongodb_id",
  "email": "user@example.com",
  "iat": 1234567890
}
```

## 📊 Database Models

### User Model
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

### Document Model
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

### Folder Model
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

### Schema Model
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

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `MONGODB` | MongoDB connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `UPLOAD_DIR` | File upload directory | uploads |
| `MAX_FILE_SIZE` | Maximum file size (bytes) | 52428800 |
| `OCR_DPI` | OCR resolution | 300 |
| `OCR_LANG` | OCR language | eng |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |

### File Size Limits
- **Single PDF**: 50MB
- **ZIP files**: 100MB
- **Total storage per user**: 1GB (configurable)

## 🚀 Usage Examples

### Frontend Integration

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

// Get user documents
const documentsResponse = await fetch('/api/documents?page=1&limit=20', {
  headers
});

// Create folder
const folderResponse = await fetch('/api/folders', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    name: 'Invoices',
    description: 'Invoice documents'
  })
});
```

## 🔍 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## 📈 Performance

### Optimizations
- **Database Indexes**: Optimized queries with proper indexing
- **File Processing**: Asynchronous background processing
- **Caching**: Document metadata caching
- **Pagination**: Efficient pagination for large datasets
- **Streaming**: CSV streaming for bulk operations

### Monitoring
- **Logging**: Comprehensive logging with Winston
- **Error Tracking**: Detailed error logging and handling
- **Performance Metrics**: Response time monitoring
- **Storage Tracking**: Real-time storage usage monitoring

## 🔒 Security

### Data Protection
- **JWT Authentication**: Secure token-based authentication
- **Data Isolation**: Users can only access their own data
- **Input Validation**: Comprehensive input validation
- **File Type Validation**: Secure file upload handling
- **SQL Injection Prevention**: Mongoose ODM protection

### Best Practices
- **Environment Variables**: Secure configuration management
- **Error Handling**: No sensitive data in error messages
- **Rate Limiting**: API rate limiting (configurable)
- **CORS**: Proper CORS configuration
- **File Upload Security**: Secure file handling and validation

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "document"
```

### Test Structure
```
tests/
├── unit/
│   ├── controllers/
│   ├── models/
│   └── utils/
├── integration/
│   ├── auth.test.js
│   ├── documents.test.js
│   └── folders.test.js
└── fixtures/
    └── test-data.json
```

## 🚀 Deployment

### Production Setup
1. **Environment Variables**: Set production environment variables
2. **Database**: Configure production MongoDB instance
3. **File Storage**: Configure production file storage
4. **SSL**: Enable HTTPS with SSL certificates
5. **Monitoring**: Set up application monitoring

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
MONGODB=mongodb://production-db:27017/document-management
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-frontend-domain.com
```

## 📝 API Documentation

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the error logs
- Contact the development team

## 🔄 Changelog

### v1.0.0
- Initial release
- Document management system
- Folder organization
- Schema-based extraction
- JWT authentication
- Analytics and monitoring
