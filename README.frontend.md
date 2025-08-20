# Frontend Integration Guide: PDF OCR Extraction API

## Overview
This guide explains how to integrate your frontend with the backend PDF OCR extraction API for both single and bulk PDF extraction using regex-based selection.

---

## **Complete Workflow**

### 1. **User Uploads a PDF to Get All Parsed Text**
- The frontend sends a PDF to the backend.
- The backend returns the **full OCR text** for each page.
- The frontend displays this text to the user for selection.

### 2. **User Selects Text to Extract**
- The user highlights or selects the desired text in the UI.
- The frontend generates a **regex pattern** for the selected text (can be exact or fuzzy).

### 3. **User Defines and Saves Extraction Schema**
- The frontend builds a schema with document type name and regex patterns.
- The schema is saved to the backend for future use.

### 4. **Bulk Extraction (ZIP Upload)**
- The user uploads a ZIP of PDFs.
- The frontend sends the saved schema ID and the ZIP to the backend.
- The backend extracts the desired fields from all PDFs and returns a CSV.

---

## **API Endpoints & Example Requests**

### **1. Get All Parsed Text from a PDF**
**Endpoint:**
```
POST /api/schema/extract-text
```
**Request (multipart/form-data):**
- `pdf`: (file) The PDF file to parse

**Example (curl):**
```
curl -F "pdf=@/path/to/file.pdf" http://localhost:5000/api/schema/extract-text
```

**Response:**
```json
{
  "pages": [
    { "page": 1, "text": "...full OCR text..." },
    { "page": 2, "text": "..." }
  ],
  "fullText": "...all pages concatenated..."
}
```

### **2. Save Extraction Schema**
**Endpoint:**
```
POST /api/schema/define-schema
```
**Request (JSON):**
```json
{
  "name": "incorporation",
  "fields": [
    { "name": "company name", "regex": "RAPTANI AROMAS PRIVATE LIMITED" },
    { "name": "invoice number", "regex": "INV-\\d+" }
  ]
}
```

**Example (curl):**
```
curl -X POST http://localhost:5000/api/schema/define-schema \
     -H "Content-Type: application/json" \
     -d '{"name":"incorporation","fields":[{"name":"company name","regex":"RAPTANI AROMAS PRIVATE LIMITED"}]}'
```

**Response:**
```json
{
  "message": "Schema saved",
  "schema": {
    "_id": "64b8c1e2f1a2b3c4d5e6f7a8",
    "name": "incorporation",
    "fields": [...],
    "createdAt": "2025-07-16T19:45:00.000Z"
  }
}
```

### **3. Get All Saved Schemas**
**Endpoint:**
```
GET /api/schema/schemas
```

**Response:**
```json
{
  "schemas": [
    {
      "_id": "64b8c1e2f1a2b3c4d5e6f7a8",
      "name": "incorporation",
      "fields": [...],
      "createdAt": "2025-07-16T19:45:00.000Z"
    }
  ]
}
```

### **4. Extract Data Using Saved Schema**
**Endpoint:**
```
POST /api/schema/extract
```
**Request (multipart/form-data):**
- `pdf`: (file) The PDF file to extract from
- `schemaId`: (string) ID of saved schema, OR
- `schema`: (string, JSON) Inline schema definition

**Example (curl):**
```
curl -F "pdf=@/path/to/file.pdf" \
     -F "schemaId=64b8c1e2f1a2b3c4d5e6f7a8" \
     http://localhost:5000/api/schema/extract
```

**Response:**
- Returns a CSV file with extracted fields.

### **5. Bulk Extraction (ZIP Upload)**
**Endpoint:**
```
POST /api/schema/bulk-extract
```
**Request (multipart/form-data):**
- `zip`: (file) ZIP file containing PDFs
- `schemaId`: (string) ID of saved schema to use

**Example (curl):**
```
curl -F "zip=@/path/to/pdfs.zip" \
     -F "schemaId=64b8c1e2f1a2b3c4d5e6f7a8" \
     http://localhost:5000/api/schema/bulk-extract
```

**Response:**
- Returns a CSV file with extracted fields from all PDFs in the ZIP.
- CSV includes a `filename` column to identify which PDF each row came from.

---

## **Frontend Implementation Steps**

### **Step 1: Schema Creation**
1. User uploads PDF → get all text
2. User selects text → frontend generates regex
3. User names the schema (e.g., "incorporation", "invoice")
4. Frontend saves schema to backend

### **Step 2: Schema Management**
1. Display list of saved schemas
2. Allow user to select schema for extraction
3. Show schema details (name, fields, creation date)

### **Step 3: Bulk Processing**
1. User selects saved schema
2. User uploads ZIP of PDFs
3. Frontend sends schema ID + ZIP to backend
4. Backend returns CSV with all extracted data

---

## **Frontend Responsibilities**
- Display all parsed text to the user for selection.
- Allow user to select/highlight text and generate regex patterns.
- Build and save extraction schemas with document type names.
- Display list of saved schemas for selection.
- Handle CSV download and display results.
- Provide schema management (view, delete, edit).

---

## **Tips for Regex Extraction**
- Use exact text for static fields (e.g., company name).
- Use patterns for variable fields (e.g., invoice numbers, dates).
- Test regex on sample OCR text before saving schema.
- Use descriptive schema names for easy identification.

---

## **Example Schema**
```json
{
  "name": "incorporation",
  "fields": [
    { "name": "company name", "regex": "RAPTANI AROMAS PRIVATE LIMITED" },
    { "name": "registration number", "regex": "U\\d{5}\\w{2}\\d{4}\\w{3}\\d{6}" }
  ]
}
```

---

## **Contact Backend Team**
If you need help with regex patterns or want to add new extraction features, contact the backend team. 