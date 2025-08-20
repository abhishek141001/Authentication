import path from "path";
import fs from "fs/promises";
import AdmZip from "adm-zip";
import { pdfToImages, ocrImage } from "../utils/pdfUtils.js";
import logger from "../utils/logger.js";

// Helper function to cleanup temp directories
async function cleanupDir(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
    logger.debug("Cleaned up directory", { dirPath });
  } catch (err) {
    logger.warn("Failed to cleanup directory", { dirPath, error: err.message });
  }
}

// POST /upload-pdf
export async function uploadPdfHandler(req, res) {
  const pdfPath = req.file.path;
  const outDir = path.join(path.dirname(pdfPath), path.basename(pdfPath, path.extname(pdfPath)));

  try {
    await fs.mkdir(outDir, { recursive: true });
    const imagePaths = await pdfToImages(pdfPath, outDir);

    const ocrResults = [];
    const textCache = {};

    for (const img of imagePaths) {
      if (!textCache[img]) textCache[img] = await ocrImage(img);
      ocrResults.push({ image: img, text: textCache[img] });
    }

    logger.info("PDF processed successfully", { pdfPath, pages: imagePaths.length });
    res.json({ message: "PDF processed", ocrResults });
  } catch (err) {
    logger.error("Failed to process PDF", { pdfPath, error: err.message, stack: err.stack });
    res.status(500).json({ error: "Failed to process PDF" });
  } finally {
    await cleanupDir(outDir);
  }
}

// Helper: Recursively find all PDFs in a directory
async function findAllPdfsRecursive(dir) {
  const results = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...await findAllPdfsRecursive(fullPath));
    } else if (item.name.endsWith('.pdf')) {
      results.push(fullPath);
    }
  }
  return results;
}

// POST /upload-zip
export async function uploadZipHandler(req, res) {
  const zipPath = req.file.path;
  const extractDir = path.join(path.dirname(zipPath), path.basename(zipPath, path.extname(zipPath)));

  try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractDir, true);

    // Find all PDFs recursively
    const pdfFiles = await findAllPdfsRecursive(extractDir);
    console.log(`Found ${pdfFiles.length} PDFs in ZIP:`, pdfFiles.map(f => path.basename(f)));
    
    const results = [];

    for (const pdfPath of pdfFiles) {
      const pdfOutDir = path.join(path.dirname(pdfPath), path.basename(pdfPath, path.extname(pdfPath)));
      await fs.mkdir(pdfOutDir, { recursive: true });

      const imagePaths = await pdfToImages(pdfPath, pdfOutDir);
      const ocrResults = [];
      const textCache = {};

      for (const img of imagePaths) {
        if (!textCache[img]) textCache[img] = await ocrImage(img);
        ocrResults.push({ image: img, text: textCache[img] });
      }

      results.push({ pdf: pdfPath, ocrResults });
    }

    logger.info("ZIP processed successfully", { zipPath, pdfCount: pdfFiles.length });
    res.json({ message: "ZIP processed", results });
  } catch (err) {
    logger.error("Failed to process ZIP", { zipPath, error: err.message, stack: err.stack });
    res.status(500).json({ error: "Failed to process ZIP" });
  } finally {
    await cleanupDir(extractDir);
  }
}
