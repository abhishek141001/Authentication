# Next.js Integration Guide for Document Microservice

## Overview
This guide explains how to integrate the Next.js application with the document microservice for file storage and OCR processing.

## Microservice Architecture
- **Microservice**: Pure file storage + OCR processing (stateless, no database)
- **Next.js App**: Business logic, user management, folder organization
- **Database**: MongoDB for document metadata and user data (handled by Next.js)
- **File Storage**: Microservice filesystem

---

## Microservice API Endpoints

### Base URL
```
http://localhost:5000/api/microservice/documents
```

### 1. Upload Document
```http
POST /upload
Content-Type: multipart/form-data

Body:
- file: File (required)
- tags: string (optional, comma-separated)
- description: string (optional)
- metadata: JSON string (optional)
```

**Response:**
```typescript
interface MicroserviceUploadResponse {
  success: boolean;
  message: string;
  data: {
    fileId: string;           // Unique identifier for the file
    originalName: string;     // Original filename uploaded by user
    fileName: string;         // Unique filename on microservice filesystem
    filePath: string;         // Full path on microservice
    fileSize: number;         // File size in bytes
    mimeType: string;         // MIME type (e.g., "application/pdf")
    tags: string[];           // Array of tags
    metadata: Record<string, any>; // Additional metadata
    createdAt: string;        // ISO date string
    urls: {
      download: string;       // Direct download URL
      preview: string;        // Browser preview URL
      info: string;           // Document info URL
      extract: string;        // Text extraction URL
    };
  };
}
```

### 2. Extract Text
```http
POST /extract/{fileName}
Content-Type: application/json

Body:
{
  "fileId": "string",        // Optional: fileId for tracking
  "options": {               // Optional: extraction options
    "language": "en"
  }
}
```

**Response:**
```typescript
interface MicroserviceExtractionResponse {
  success: boolean;
  message: string;
  data: {
    fileId: string;          // Same fileId from upload (if provided)
    fileName: string;        // Same fileName from upload
    extractedText: string;   // Full extracted text
    confidence: number;      // OCR confidence (0-1)
    extractedAt: string;     // ISO date string
    language: string;        // Detected language (default: "en")
    pageCount: number;       // Number of pages
  };
}
```

### 3. Preview Document
```http
GET /preview/{fileName}
```

**Response:** File stream for browser preview

### 4. Download Document
```http
GET /download/{fileName}
```

**Response:** File stream for download

### 5. Get Document Info
```http
GET /info/{fileName}
```

**Response:**
```typescript
interface MicroserviceInfoResponse {
  success: boolean;
  data: {
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    fileExists: boolean;
    createdAt: string;
    modifiedAt: string;
    urls: {
      download: string;
      preview: string;
      info: string;
      extract: string;
    };
  };
}
```

---

## Next.js Integration Implementation

### 1. Microservice Client

```typescript
// lib/microservice-client.ts
class MicroserviceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.MICROSERVICE_URL || 'http://localhost:5000/api/microservice/documents';
  }

  // Upload document to microservice
  async uploadDocument(formData: FormData): Promise<MicroserviceUploadResponse> {
    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Extract text from document
  async extractText(fileName: string, fileId?: string, options?: { language?: string }): Promise<MicroserviceExtractionResponse> {
    const body: any = { options };
    if (fileId) body.fileId = fileId;

    const response = await fetch(`${this.baseUrl}/extract/${fileName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Extraction failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get document information
  async getDocumentInfo(fileName: string): Promise<MicroserviceInfoResponse> {
    const response = await fetch(`${this.baseUrl}/info/${fileName}`);

    if (!response.ok) {
      throw new Error(`Info fetch failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const microserviceClient = new MicroserviceClient();
```

### 2. Document Model

```typescript
// lib/models/Document.ts
import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Microservice file reference
  microserviceFileId: { type: String, required: true },
  originalName: { type: String, required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  
  // Processing status
  status: { 
    type: String, 
    enum: ['uploaded', 'processing', 'completed', 'failed'], 
    default: 'uploaded' 
  },
  
  // Extracted content
  extractedText: String,
  extractionConfidence: Number,
  extractedAt: Date,
  
  // Tags and metadata
  tags: [String],
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  
  // Microservice URLs
  urls: {
    download: String,
    preview: String,
    info: String,
    extract: String
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamps
documentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes
documentSchema.index({ userId: 1, folderId: 1 });
documentSchema.index({ microserviceFileId: 1 });
documentSchema.index({ status: 1 });

export const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
```

### 3. Folder Upload API Route

```typescript
// app/api/folders/[id]/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { microserviceClient } from '@/lib/microservice-client';
import { Document } from '@/lib/models/Document';
import { Folder } from '@/lib/models/Folder';
import { getAuthenticatedUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id: folderId } = await params;
    
    await dbConnect();
    
    // Verify folder exists and user has access
    const folder = await Folder.findOne({ _id: folderId, userId: user.id }).lean();
    if (!folder) {
      return NextResponse.json(
        { success: false, message: 'Folder not found' },
        { status: 404 }
      );
    }
    
    // Get form data and upload to microservice
    const formData = await request.formData();
    const uploadResponse = await microserviceClient.uploadDocument(formData);
    
    if (!uploadResponse.success) {
      throw new Error(uploadResponse.message);
    }
    
    // Store document metadata in our database
    const documentData = {
      folderId,
      userId: user.id,
      microserviceFileId: uploadResponse.data.fileId,
      originalName: uploadResponse.data.originalName,
      fileName: uploadResponse.data.fileName,
      filePath: uploadResponse.data.filePath,
      fileSize: uploadResponse.data.fileSize,
      mimeType: uploadResponse.data.mimeType,
      tags: uploadResponse.data.tags || [],
      metadata: uploadResponse.data.metadata || {},
      urls: uploadResponse.data.urls,
      status: 'uploaded'
    };
    
    const document = await Document.create(documentData);
    
    return NextResponse.json({
      success: true,
      data: {
        documentId: document._id,
        microserviceFileId: uploadResponse.data.fileId,
        originalName: uploadResponse.data.originalName,
        fileName: uploadResponse.data.fileName,
        fileSize: uploadResponse.data.fileSize,
        mimeType: uploadResponse.data.mimeType,
        folderId,
        folderName: folder.name,
        urls: uploadResponse.data.urls
      },
      message: `Document uploaded successfully to folder "${folder.name}"`
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
```

### 4. Text Extraction API Route

```typescript
// app/api/documents/[id]/extract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { microserviceClient } from '@/lib/microservice-client';
import { Document } from '@/lib/models/Document';
import { getAuthenticatedUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id: documentId } = await params;
    
    await dbConnect();
    
    // Get document and verify access
    const document = await Document.findOne({ _id: documentId, userId: user.id });
    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Update status to processing
    document.status = 'processing';
    await document.save();
    
    try {
      // Extract text from microservice
      const extractionResponse = await microserviceClient.extractText(
        document.fileName, 
        document.microserviceFileId
      );
      
      if (!extractionResponse.success) {
        throw new Error(extractionResponse.message);
      }
      
      // Update document with extracted data
      document.extractedText = extractionResponse.data.extractedText;
      document.extractionConfidence = extractionResponse.data.confidence;
      document.extractedAt = new Date(extractionResponse.data.extractedAt);
      document.status = 'completed';
      await document.save();
      
      return NextResponse.json({
        success: true,
        data: {
          documentId: document._id,
          extractedText: extractionResponse.data.extractedText,
          confidence: extractionResponse.data.confidence,
          pageCount: extractionResponse.data.pageCount,
          language: extractionResponse.data.language,
          extractedAt: extractionResponse.data.extractedAt
        },
        message: 'Text extraction completed successfully'
      });
      
    } catch (extractionError) {
      // Update status to failed
      document.status = 'failed';
      await document.save();
      
      throw extractionError;
    }
    
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Extraction failed' },
      { status: 500 }
    );
  }
}
```

### 5. API Client Integration

```typescript
// lib/api-client.ts
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  async uploadDocumentToFolder(folderId: string, formData: FormData): Promise<ApiResponse> {
    return this.request(`/api/folders/${folderId}/upload`, {
      method: 'POST',
      body: formData,
    });
  }
  
  async extractTextFromDocument(documentId: string): Promise<ApiResponse> {
    return this.request(`/api/documents/${documentId}/extract`, {
      method: 'POST',
    });
  }
  
  async getDocumentInfo(fileName: string): Promise<ApiResponse> {
    return this.request(`/api/microservice/documents/info/${fileName}`);
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<ApiResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
```

---

## Implementation Flow

### 1. Document Upload Process
```
User Uploads File → Next.js API Route → Microservice → Store File → Return File Info → Save Metadata to DB → Return Success Response
```

### 2. Text Extraction Process
```
User Requests Extraction → Next.js API Route → Update DB Status → Microservice → Process OCR → Return Extracted Text → Update DB → Return Results
```

### 3. Document Display Process
```
User Views Folder → Next.js API Route → Query DB for Documents → Return Document List with Microservice URLs → Frontend Displays Documents
```

---

## Environment Variables

```env
# .env.local
MICROSERVICE_URL=http://localhost:5000/api/microservice/documents
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Error Handling

### Microservice Errors
- File not found (404)
- Invalid file types (400)
- Upload errors (500)
- Extraction failures (500)

### Next.js App Errors
- Authentication failures (401)
- Permission denied (403)
- Document not found (404)
- Database errors (500)

---

## Testing the Integration

### 1. Test Upload
```bash
curl -X POST http://localhost:3000/api/folders/{folderId}/upload \
  -F "file=@test.pdf" \
  -F "tags=test,document" \
  -H "Authorization: Bearer {token}"
```

### 2. Test Extraction
```bash
curl -X POST http://localhost:3000/api/documents/{documentId}/extract \
  -H "Authorization: Bearer {token}"
```

### 3. Test Microservice Directly
```bash
curl -X POST http://localhost:5000/api/microservice/documents/upload \
  -F "file=@test.pdf"
```

---

## Key Benefits

1. **Separation of Concerns**: Microservice handles files, Next.js handles business logic
2. **Scalability**: Microservice can be replicated independently
3. **Performance**: Fast file operations without database overhead
4. **Flexibility**: Easy to switch file storage providers
5. **User Experience**: Immediate upload feedback with async processing
6. **Stateless**: Microservice has no persistent state, easy to deploy 