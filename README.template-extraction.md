# Template-Based PDF Text Extraction

## Overview
This feature allows you to extract text from PDFs based on the position of reference text. Instead of using fixed coordinates or regex patterns, you can use one PDF as a "template" and extract text from the same relative positions in other PDFs.

## How It Works

### 1. **Template Analysis**
- Upload a reference PDF to analyze text positions
- The system identifies where each word appears on the page
- You can use this information to create extraction templates

### 2. **Template-Based Extraction**
- Define fields that reference specific text (e.g., "Invoice Number:")
- Specify offsets from that reference text (e.g., 100 pixels to the right)
- The system finds the reference text in each PDF and extracts from the relative position

## API Endpoints

### **1. Analyze Template PDF**
**Endpoint:** `POST /api/schema/analyze-template`

**Request:** Upload a reference PDF file
```bash
curl -F "pdf=@reference.pdf" http://localhost:5000/api/schema/analyze-template
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
          "confidence": 95.2,
          "bbox": { "x": 100, "y": 200, "width": 60, "height": 20 }
        },
        {
          "text": "Number:",
          "confidence": 94.8,
          "bbox": { "x": 170, "y": 200, "width": 80, "height": 20 }
        }
      ],
      "fullText": "Invoice Number: INV-001..."
    }
  ],
  "suggestions": [
    "Use the word positions to create template fields with referenceText and offsetX/offsetY",
    "Example: { name: 'invoice_number', template: { referenceText: 'Invoice:', offsetX: 100, offsetY: 0, width: 200, height: 30 } }"
  ]
}
```

### **2. Create Template Schema**
**Endpoint:** `POST /api/schema/define-schema`

**Request:**
```json
{
  "name": "InvoiceTemplate",
  "fields": [
    {
      "name": "invoice_number",
      "template": {
        "referenceText": "Invoice Number:",
        "offsetX": 100,
        "offsetY": 0,
        "width": 200,
        "height": 30
      }
    },
    {
      "name": "total_amount",
      "template": {
        "referenceText": "Total:",
        "offsetX": 50,
        "offsetY": 0,
        "width": 150,
        "height": 25
      }
    }
  ]
}
```

### **3. Extract Using Template**
**Endpoint:** `POST /api/schema/extract`

**Request:** Upload PDF + schema ID
```bash
curl -F "pdf=@document.pdf" \
     -F "schemaId=64b8c1e2f1a2b3c4d5e6f7a8" \
     http://localhost:5000/api/schema/extract -o extracted.csv
```

## Template Field Configuration

### **Template Object Structure:**
```json
{
  "template": {
    "referenceText": "Text to find in the PDF",
    "offsetX": 100,        // pixels to the right of reference text
    "offsetY": 0,          // pixels below reference text (negative = above)
    "width": 200,          // width of extraction region
    "height": 30           // height of extraction region
  }
}
```

### **Parameters:**
- **referenceText**: The text to search for in the PDF (used as anchor point)
- **offsetX**: Horizontal offset from reference text position (positive = right, negative = left)
- **offsetY**: Vertical offset from reference text position (positive = down, negative = up)
- **width**: Width of the extraction region in pixels
- **height**: Height of the extraction region in pixels

## Use Cases

### **1. Invoice Processing**
```json
{
  "name": "InvoiceExtractor",
  "fields": [
    {
      "name": "invoice_number",
      "template": {
        "referenceText": "Invoice #:",
        "offsetX": 80,
        "offsetY": 0,
        "width": 150,
        "height": 25
      }
    },
    {
      "name": "customer_name",
      "template": {
        "referenceText": "Bill To:",
        "offsetX": 0,
        "offsetY": 30,
        "width": 300,
        "height": 25
      }
    }
  ]
}
```

### **2. Form Processing**
```json
{
  "name": "FormExtractor",
  "fields": [
    {
      "name": "name",
      "template": {
        "referenceText": "Name:",
        "offsetX": 60,
        "offsetY": 0,
        "width": 200,
        "height": 20
      }
    },
    {
      "name": "date",
      "template": {
        "referenceText": "Date:",
        "offsetX": 50,
        "offsetY": 0,
        "width": 100,
        "height": 20
      }
    }
  ]
}
```

## Workflow Example

### **Step 1: Analyze Reference PDF**
```bash
curl -F "pdf=@sample_invoice.pdf" http://localhost:5000/api/schema/analyze-template
```

### **Step 2: Create Template Schema**
Based on the analysis, create a schema:
```json
{
  "name": "InvoiceTemplate",
  "fields": [
    {
      "name": "invoice_number",
      "template": {
        "referenceText": "Invoice Number:",
        "offsetX": 100,
        "offsetY": 0,
        "width": 200,
        "height": 30
      }
    }
  ]
}
```

### **Step 3: Save Schema**
```bash
curl -X POST http://localhost:5000/api/schema/define-schema \
     -H "Content-Type: application/json" \
     -d '{"name":"InvoiceTemplate","fields":[...]}'
```

### **Step 4: Extract from Multiple PDFs**
```bash
curl -F "zip=@invoices.zip" \
     -F "schemaId=YOUR_SCHEMA_ID" \
     http://localhost:5000/api/schema/bulk-extract -o results.csv
```

## Advantages

1. **Position-Independent**: Works even if text moves slightly between PDFs
2. **Flexible**: Can extract text relative to any reference point
3. **Robust**: Handles OCR variations and formatting differences
4. **Scalable**: One template works for multiple similar documents

## Tips for Best Results

1. **Choose Stable Reference Text**: Use text that appears consistently across all PDFs
2. **Test Offsets**: Use the analyze endpoint to find the right offset values
3. **Adjust Region Size**: Make extraction regions large enough to capture the full text
4. **Handle Variations**: Use fuzzy matching for reference text that might vary slightly

## Error Handling

- If reference text is not found, the field will be empty
- The system logs warnings when reference text cannot be located
- Fuzzy matching is used to handle OCR variations in reference text

## Integration with Existing Features

Template-based extraction works alongside:
- **Regex extraction**: Mix template and regex fields in the same schema
- **Region extraction**: Use fixed coordinates when needed
- **Bulk processing**: Process ZIP files with template schemas
- **Schema management**: Save and reuse template schemas 