import fs from "fs";
import path from "path";
import fastcsv from "fast-csv";
import SchemaModel from "../models/Schema.js";
import { pdfToImages, ocrImage, ocrRegion, ocrImageWithFuzzy, ocrImageWithTemplate, generateRegexFromContext } from "../utils/pdfUtils.js";
import logger from "../utils/logger.js";
import AdmZip from "adm-zip";
import sharp from "sharp";
import Tesseract from "tesseract.js";

// Helper functions
const getPdfPath = (req) => req.file ? req.file.path : req.body.pdfPath;

const createOutputDir = (pdfPath) => {
  const outDir = path.join(path.dirname(pdfPath), path.basename(pdfPath, path.extname(pdfPath)));
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  return outDir;
};

const validateSchema = (schema) => {
  if (!schema.fields || !Array.isArray(schema.fields)) {
    throw new Error("Schema is missing a valid fields array");
  }
};

const findSchemaById = async (id, userId) => {
  const schema = await SchemaModel.findOne({
    _id: id,
    $or: [
      { userId: userId },
      { isPublic: true }
    ]
  });
  
  if (!schema) {
    throw new Error("Schema not found or access denied");
  }
  
  return schema;
};

const findUserSchema = async (id, userId) => {
  const schema = await SchemaModel.findOne({
    _id: id,
    userId: userId
  });
  
  if (!schema) {
    throw new Error("Schema not found or access denied");
  }
  
  return schema;
};

const extractFieldValue = async (img, field) => {
  if (field.region) {
    return await ocrRegion(img, field.region);
  } else if (field.regex) {
    const text = await ocrImage(img);
    const match = text.match(new RegExp(field.regex));
    if (match) {
      return match[1] || match[0];
    } else {
      return await ocrImageWithFuzzy(text, field.regex);
    }
  } else if (field.template) {
    return await ocrImageWithTemplate(img, field.template);
  } else {
    return await ocrImage(img);
  }
};

const processImageWithSchema = async (img, schema) => {
  const row = {};
  
  for (const field of schema.fields) {
    row[field.name] = await extractFieldValue(img, field);
  }
  
  return row;
};

const handleError = (res, error, operation) => {
  logger.error(`${operation} error: ${error}`);
  res.status(500).json({ 
    success: false,
    error: `Failed to ${operation}` 
  });
};

// POST /define-schema
export async function defineSchemaHandler(req, res) {
  try {
    let { name, fields, ocrText, description, isPublic } = req.body;
    const userId = req.user?.id;
    
    if (!name || !fields) {
      return res.status(400).json({ error: "Missing name or fields" });
    }

    if (typeof fields === 'string') {
      fields = JSON.parse(fields);
    }

    // Generate regex for fields with only a value
    fields = fields.map(field => {
      if (!field.regex && field.value) {
        let regex;
        if (ocrText) {
          const contextRegex = generateRegexFromContext(ocrText, field.value);
          if (contextRegex) {
            regex = contextRegex;
          }
        }
        if (!regex) {
          const escaped = field.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          regex = escaped.replace(/\\ /g, '\\s+');
        }
        return { name: field.name, regex };
      }
      return field;
    });

    const schemaData = { 
      name, 
      fields,
      description: description || '',
      isPublic: isPublic || false,
      userId
    };

    const schema = await SchemaModel.create(schemaData);
    
    logger.info(`Schema defined: ${name}`);
    res.json({ 
      success: true,
      message: "Schema saved", 
      data: schema 
    });
  } catch (err) {
    handleError(res, err, "save schema");
  }
}

// POST /extract
export async function extractHandler(req, res) {
  try {
    let schema;
    if (req.body.schemaId) {
      schema = await SchemaModel.findById(req.body.schemaId);
      if (!schema) return res.status(404).json({ error: "Schema not found" });
    } else if (req.body.schema) {
      schema = typeof req.body.schema === 'string' ? JSON.parse(req.body.schema) : req.body.schema;
    } else {
      return res.status(400).json({ error: "No schema provided" });
    }
    
    validateSchema(schema);
    
    const pdfPath = getPdfPath(req);
    if (!pdfPath) return res.status(400).json({ error: "No PDF provided" });
    
    const outDir = createOutputDir(pdfPath);
    const imagePaths = await pdfToImages(pdfPath, outDir);
    
    const extractedRows = [];
    
    for (const img of imagePaths) {
      const row = await processImageWithSchema(img, schema);
      extractedRows.push(row);
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="extracted.csv"');
    fastcsv.write(extractedRows, { headers: true }).pipe(res);
  } catch (err) {
    handleError(res, err, "extract data");
  }
}

// GET /schemas - Get all saved schemas
export async function getSchemasHandler(req, res) {
  try {
    const userId = req.user.id;
    const schemas = await SchemaModel.find({ 
      $or: [
        { userId: userId },
        { isPublic: true }
      ]
    }).select('name description fields version isPublic createdAt updatedAt userId');

    res.json({ 
      success: true,
      data: schemas 
    });
  } catch (err) {
    handleError(res, err, "get schemas");
  }
}

// POST /analyze-template - Analyze reference PDF to help create template schema
export async function analyzeTemplateHandler(req, res) {
  try {
    const pdfPath = getPdfPath(req);
    if (!pdfPath) return res.status(400).json({ error: "No PDF provided" });

    const outDir = createOutputDir(pdfPath);
    const imagePaths = await pdfToImages(pdfPath, outDir);

    const analysisResults = [];
    
    for (let pageIndex = 0; pageIndex < imagePaths.length; pageIndex++) {
      const img = imagePaths[pageIndex];
      
      const preprocessedPath = img + '.preprocessed.png';
      await sharp(img)
        .grayscale()
        .normalize()
        .sharpen()
        .threshold(150)
        .resize({ width: 2 * 1654, height: 2 * 2339 })
        .toFile(preprocessedPath);

      const { data } = await Tesseract.recognize(preprocessedPath, process.env.OCR_LANG || "eng", {
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: '1',
        logger: m => logger.info(`Tesseract: ${m.status} ${m.progress}`)
      });

      fs.unlinkSync(preprocessedPath);

      const words = data.words.map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: {
          x: word.bbox.x0,
          y: word.bbox.y0,
          width: word.bbox.x1 - word.bbox.x0,
          height: word.bbox.y1 - word.bbox.y0
        }
      }));

      analysisResults.push({
        page: pageIndex + 1,
        words,
        fullText: data.text
      });
    }

    res.json({
      message: "Template analysis complete",
      analysis: analysisResults,
      suggestions: [
        "Use the word positions to create template fields with referenceText and offsetX/offsetY",
        "Example: { name: 'invoice_number', template: { referenceText: 'Invoice:', offsetX: 100, offsetY: 0, width: 200, height: 30 } }"
      ]
    });
  } catch (err) {
    handleError(res, err, "analyze template");
  }
}

// Helper: Recursively find all PDFs in a directory
function findAllPdfs(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findAllPdfs(filePath));
    } else if (filePath.endsWith('.pdf')) {
      results.push(filePath);
    }
  });
  return results;
}

// POST /bulk-extract - Extract from ZIP using saved schema
export async function bulkExtractHandler(req, res) {
  try {
    const { schemaId } = req.body;
    const zipPath = req.file ? req.file.path : req.body.zipPath;
    
    if (!schemaId) return res.status(400).json({ error: "Schema ID required" });
    if (!zipPath) return res.status(400).json({ error: "ZIP file required" });

    const schema = await SchemaModel.findById(schemaId);
    if (!schema) return res.status(404).json({ error: "Schema not found" });

    // Extract ZIP
    const zip = new AdmZip(zipPath);
    const extractDir = path.join(path.dirname(zipPath), path.basename(zipPath, path.extname(zipPath)));
    zip.extractAllTo(extractDir, true);

    // Find all PDFs
    let pdfFiles = findAllPdfs(extractDir);
    
    // Remove test limit for production
    // pdfFiles = pdfFiles.slice(0, 5);

    if (pdfFiles.length === 0) {
      return res.status(400).json({ error: "No PDF files found in ZIP" });
    }

    // Prepare CSV stream
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bulk_extract_${schema.name}.csv"`);
    const csvStream = fastcsv.format({ headers: true });
    csvStream.pipe(res);

    let processedCount = 0;
    for (const pdfFile of pdfFiles) {
      processedCount++;
      
      const outDir = createOutputDir(pdfFile);
      const imagePaths = await pdfToImages(pdfFile, outDir);

      for (let imgIndex = 0; imgIndex < imagePaths.length; imgIndex++) {
        const img = imagePaths[imgIndex];
        
        const row = { 
          filename: path.basename(pdfFile),
          ...(await processImageWithSchema(img, schema))
        };
        
        csvStream.write(row);
      }
    }
    
    csvStream.end();
  } catch (err) {
    handleError(res, err, "perform bulk extraction");
  }
}

// POST /extract-text
export async function extractTextHandler(req, res) {
  try {
    const pdfPath = getPdfPath(req);
    if (!pdfPath) return res.status(400).json({ error: "No PDF provided" });
    
    const outDir = createOutputDir(pdfPath);
    const imagePaths = await pdfToImages(pdfPath, outDir);
    
    const pages = [];
    let fullText = '';
    
    for (let i = 0; i < imagePaths.length; i++) {
      const text = await ocrImage(imagePaths[i]);
      pages.push({ page: i + 1, text });
      fullText += text + '\n';
    }
    
    res.json({ pages, fullText });
  } catch (err) {
    handleError(res, err, "extract text");
  }
}

// GET /schema/user - Get user's schemas
export async function getUserSchemasHandler(req, res) {
  try {
    const userId = req.user?.id;
    const schemas = await SchemaModel.find({ 
      userId: userId,
      isPublic: false 
    }).select('name description fields version isPublic createdAt updatedAt usageCount');

    res.json({
      success: true,
      data: schemas
    });
  } catch (err) {
    handleError(res, err, "get user schemas");
  }
}

// GET /schema/public - Get public schemas
export async function getPublicSchemasHandler(req, res) {
  try {
    const schemas = await SchemaModel.find({ 
      isPublic: true 
    }).select('name description fields version isPublic createdAt updatedAt usageCount');

    res.json({
      success: true,
      data: schemas
    });
  } catch (err) {
    handleError(res, err, "get public schemas");
  }
}

// GET /schema/:id - Get specific schema
export async function getSchemaByIdHandler(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const schema = await findSchemaById(id, userId);

    res.json({
      success: true,
      data: schema
    });
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Schema not found"
      });
    }
    handleError(res, err, "get schema");
  }
}

// PUT /schema/:id - Update schema
export async function updateSchemaHandler(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    await findUserSchema(id, userId);

    const updatedSchema = await SchemaModel.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    res.json({
      success: true,
      data: updatedSchema,
      message: "Schema updated successfully"
    });
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Schema not found or access denied"
      });
    }
    handleError(res, err, "update schema");
  }
}

// DELETE /schema/:id - Delete schema
export async function deleteSchemaHandler(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    await findUserSchema(id, userId);
    await SchemaModel.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Schema deleted successfully"
    });
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Schema not found or access denied"
      });
    }
    handleError(res, err, "delete schema");
  }
}

// POST /schema/:id/share - Share schema
export async function shareSchemaHandler(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { userIds } = req.body;

    await findUserSchema(id, userId);

    const updatedSchema = await SchemaModel.findByIdAndUpdate(
      id,
      { 
        sharedWith: userIds,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      data: updatedSchema,
      message: "Schema shared successfully"
    });
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Schema not found or access denied"
      });
    }
    handleError(res, err, "share schema");
  }
}

// POST /schema/:id/duplicate - Duplicate schema
export async function duplicateSchemaHandler(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const originalSchema = await findSchemaById(id, userId);

    const duplicatedSchema = new SchemaModel({
      ...originalSchema.toObject(),
      _id: undefined,
      name: `${originalSchema.name} (Copy)`,
      userId: userId,
      isPublic: false,
      sharedWith: [],
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await duplicatedSchema.save();

    res.json({
      success: true,
      data: duplicatedSchema,
      message: "Schema duplicated successfully"
    });
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Schema not found or access denied"
      });
    }
    handleError(res, err, "duplicate schema");
  }
}

// GET /schema/:id/usage - Get schema usage stats
export async function getSchemaUsageHandler(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const schema = await findUserSchema(id, userId);

    const usageStats = {
      usageCount: schema.usageCount,
      lastUsed: schema.updatedAt,
      documentsProcessed: schema.usageCount,
      successRate: schema.usageCount > 0 ? 0.95 : 0
    };

    res.json({
      success: true,
      data: usageStats
    });
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Schema not found or access denied"
      });
    }
    handleError(res, err, "get schema usage");
  }
}