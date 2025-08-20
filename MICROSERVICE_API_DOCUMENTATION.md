# Document Microservice API Documentation

This microservice provides document management functionality without authentication requirements, acting as both a document processing service and object storage.

## Base URL
```
http://localhost:5000/api/microservice/documents
```

## Endpoints

### 1. Upload Document
**POST** `/upload`

Upload a document to the microservice storage.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file` (required): The document file to upload
  - `tags` (optional): Comma-separated tags
  - `description` (optional): Document description
  - `metadata` (optional): JSON string of additional metadata

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/microservice/documents/upload \
  -F "file=@document.pdf" \
  -F "tags=invoice,2024,important" \
  -F "description=Monthly invoice for August 2024" \
  -F 'metadata={"category":"finance","priority":"high"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "uuid-1234-5678-90ab",
    "originalName": "document.pdf",
    "fileName": "uuid-1234-document.pdf",
    "filePath": "uploads/documents/uuid-1234-document.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "tags": ["invoice", "2024", "important"],
    "metadata": {
      "description": "Monthly invoice for August 2024",
      "processingStatus": "pending",
      "category": "finance",
      "priority": "high"
    },
    "createdAt": "2024-08-18T19:39:46.336Z",
    "urls": {
      "download": "/api/microservice/documents/download/uuid-1234-document.pdf",
      "preview": "/api/microservice/documents/preview/uuid-1234-document.pdf",
      "info": "/api/microservice/documents/info/uuid-1234-document.pdf",
      "extract": "/api/microservice/documents/extract/uuid-1234-document.pdf"
    }
  },
  "message": "Document uploaded successfully"
}
```

### 2. Extract Text from Document
**POST** `/extract/:documentId`

Extract text content from a document using OCR.

**Request:**
- Content-Type: `application/json`
- Body:
  - `options` (optional): Extraction options

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/microservice/documents/extract/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Content-Type: application/json" \
  -d '{"options": {"language": "eng"}}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "uuid-1234-5678-90ab",
    "fileName": "uuid-1234-document.pdf",
    "extractedText": "This is the extracted text from the document...",
    "confidence": 0.85,
    "extractedAt": "2024-08-18T19:40:15.123Z",
    "language": "en",
    "pageCount": 1
  },
  "message": "Text extraction completed successfully"
}
```

### 3. Preview Document
**GET** `/preview/:documentId`

Preview a document in the browser (inline display).

**Example Request:**
```bash
curl -X GET http://localhost:5000/api/microservice/documents/preview/64f8a1b2c3d4e5f6a7b8c9d0
```

**Response:**
- Content-Type: Based on document MIME type
- Content-Disposition: `inline; filename="original-filename.pdf"`
- Body: Document file stream

### 4. Download Document
**GET** `/download/:documentId`

Download a document file.

**Example Request:**
```bash
curl -X GET http://localhost:5000/api/microservice/documents/download/64f8a1b2c3d4e5f6a7b8c9d0 \
  -o downloaded-document.pdf
```

**Response:**
- Content-Type: Based on document MIME type
- Content-Disposition: `attachment; filename="original-filename.pdf"`
- Content-Length: File size
- Body: Document file stream

### 5. Get Document Info
**GET** `/info/:documentId`

Get document metadata and information.

**Example Request:**
```bash
curl -X GET http://localhost:5000/api/microservice/documents/info/64f8a1b2c3d4e5f6a7b8c9d0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileName": "uuid-1234-document.pdf",
    "filePath": "uploads/documents/uuid-1234-document.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "fileExists": true,
    "createdAt": "2024-08-18T19:39:46.336Z",
    "modifiedAt": "2024-08-18T19:40:15.123Z",
    "urls": {
      "download": "/api/microservice/documents/download/uuid-1234-document.pdf",
      "preview": "/api/microservice/documents/preview/uuid-1234-document.pdf",
      "info": "/api/microservice/documents/info/uuid-1234-document.pdf",
      "extract": "/api/microservice/documents/extract/uuid-1234-document.pdf"
    }
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "File is required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Document not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error uploading document"
}
```

## Supported File Types

### Text Extraction
- **PDF**: Full OCR text extraction with multi-page support
- **Images**: PNG, JPG, JPEG, GIF, BMP, TIFF

### Preview/Download
- All file types supported by browsers

## Processing Status Values

- `pending`: Document uploaded, not yet processed
- `processing`: Text extraction in progress
- `completed`: Text extraction completed successfully
- `failed`: Text extraction failed

## Usage Examples

### Complete Workflow Example

1. **Upload a document:**
```bash
curl -X POST http://localhost:5000/api/microservice/documents/upload \
  -F "file=@invoice.pdf" \
  -F "tags=invoice,2024" \
  -F "description=Monthly invoice"
```

2. **Extract text:**
```bash
curl -X POST http://localhost:5000/api/microservice/documents/extract/FILENAME
```

3. **Get document info:**
```bash
curl -X GET http://localhost:5000/api/microservice/documents/info/FILENAME
```

4. **Preview document:**
```bash
# Open in browser
open http://localhost:5000/api/microservice/documents/preview/FILENAME
```

5. **Download document:**
```bash
curl -X GET http://localhost:5000/api/microservice/documents/download/FILENAME \
  -o downloaded-invoice.pdf
```

## Notes

- No authentication required for any endpoints
- Documents are stored with unique filenames for security
- Text extraction supports multiple languages (default: English)
- File streaming is used for preview and download to handle large files efficiently
- All operations are logged for debugging purposes 