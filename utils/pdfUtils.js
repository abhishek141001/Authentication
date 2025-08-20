import path from "path";
import fs from "fs";
import { fromPath } from "pdf2pic";
import Tesseract from "tesseract.js";
import logger from "./logger.js";

const DPI = process.env.OCR_DPI ? parseInt(process.env.OCR_DPI) : 300;
const LANG = process.env.OCR_LANG || "eng";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

// Convert PDF to images (one per page)
export async function pdfToImages(pdfPath, outDir) {
  const options = {
    density: DPI,
    saveFilename: "page",
    savePath: outDir,
    format: "png",
    width: 1654, // ~A4 at 300dpi
    height: 2339,
  };
  const storeAsImage = fromPath(pdfPath, options);
  const numPages = await getPdfPageCount(pdfPath);
  const imagePaths = [];
  for (let i = 1; i <= numPages; i++) {
    const res = await storeAsImage(i);
    imagePaths.push(res.path);
  }
  return imagePaths;
}

// Get number of pages in PDF
async function getPdfPageCount(pdfPath) {
  // pdf2pic doesn't expose this, so use pdfjs-dist or a shell util if needed
  // For now, assume 1 page (improve as needed)
  return 1;
}

// OCR a single image with advanced preprocessing
export async function ocrImage(imagePath, lang = LANG) {
  try {
    const preprocessedPath = imagePath + '.preprocessed.png';
    await sharp(imagePath)
      .grayscale()
      .normalize() // increases contrast
      .sharpen()
      .threshold(150) // binarize: adjust value as needed
      .resize({ width: 2 * 1654, height: 2 * 2339 }) // scale up for small text, adjust as needed
      .toFile(preprocessedPath);

    const { data: { text } } = await Tesseract.recognize(preprocessedPath, lang, {
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,()-',
      preserve_interword_spaces: '1',
      tessedit_do_invert: '0',
      logger: m => logger.info(`Tesseract: ${m.status} ${m.progress}`)
    });

    fs.unlinkSync(preprocessedPath);
    return text.trim();
  } catch (err) {
    logger.error(`OCR failed: ${err}`);
    throw err;
  }
}

// OCR a region of an image (crop first)
import sharp from "sharp";
export async function ocrRegion(imagePath, region, lang = LANG) {
  const { x, y, width, height } = region;
  const croppedPath = imagePath + `.crop.png`;
  
  // Get image metadata to debug dimensions
  const metadata = await sharp(imagePath).metadata();
  logger.info(`Image dimensions: ${metadata.width}x${metadata.height}`);
  logger.info(`Cropping region: x=${x}, y=${y}, width=${width}, height=${height}`);
  
  await sharp(imagePath).extract({ left: x, top: y, width, height }).toFile(croppedPath);
  logger.info(`Cropped image saved to: ${croppedPath}`);
  
  const result = await ocrImage(croppedPath, lang);
  logger.info(`OCR result: "${result}"`);
  return result;
} 

// Fuzzy text matching for OCR errors
function findSimilarText(ocrText, targetText, threshold = 0.6) {
  const words = ocrText.split(/\s+/);
  const targetWords = targetText.split(/\s+/);
  
  for (let i = 0; i <= words.length - targetWords.length; i++) {
    let matchScore = 0;
    for (let j = 0; j < targetWords.length; j++) {
      const wordSimilarity = calculateSimilarity(words[i + j], targetWords[j]);
      matchScore += wordSimilarity;
    }
    const averageScore = matchScore / targetWords.length;
    if (averageScore >= threshold) {
      return words.slice(i, i + targetWords.length).join(' ');
    }
  }
  return null;
}

// Calculate similarity between two strings (simple Levenshtein-based)
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// Simple Levenshtein distance calculation
function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

// Enhanced OCR with fuzzy matching
export async function ocrImageWithFuzzy(ocrText, targetText) {
  const exactMatch = ocrText.includes(targetText);
  if (exactMatch) return targetText;
  
  const fuzzyMatch = findSimilarText(ocrText, targetText);
  if (fuzzyMatch) {
    logger.info(`Fuzzy match found: "${targetText}" -> "${fuzzyMatch}"`);
    return fuzzyMatch;
  }
  
  // If no fuzzy match found, return the original target text as fallback
  logger.info(`No fuzzy match found for "${targetText}", returning original`);
  return targetText;
}

// Template-based extraction: Find reference text position and extract from relative position
export async function ocrImageWithTemplate(imagePath, templateField, lang = LANG) {
  try {
    const { referenceText, offsetX = 0, offsetY = 0, width, height } = templateField;
    
    // First, get OCR data with word positions
    const preprocessedPath = imagePath + '.preprocessed.png';
    await sharp(imagePath)
      .grayscale()
      .normalize()
      .sharpen()
      .threshold(150)
      .resize({ width: 2 * 1654, height: 2 * 2339 })
      .toFile(preprocessedPath);

    const { data } = await Tesseract.recognize(preprocessedPath, lang, {
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      preserve_interword_spaces: '1',
      logger: m => logger.info(`Tesseract: ${m.status} ${m.progress}`)
    });

    fs.unlinkSync(preprocessedPath);

    // Find the reference text position
    const referencePosition = findTextPosition(data.words, referenceText);
    
    if (!referencePosition) {
      logger.warn(`Reference text "${referenceText}" not found in image`);
      return "";
    }

    // Calculate extraction region based on reference position
    const extractX = Math.max(0, referencePosition.x + offsetX);
    const extractY = Math.max(0, referencePosition.y + offsetY);
    const extractWidth = width || 200; // default width if not specified
    const extractHeight = height || 50; // default height if not specified

    logger.info(`Extracting from position: x=${extractX}, y=${extractY}, width=${extractWidth}, height=${extractHeight}`);

    // Extract the region and OCR it
    const croppedPath = imagePath + `.template.crop.png`;
    await sharp(imagePath).extract({ 
      left: extractX, 
      top: extractY, 
      width: extractWidth, 
      height: extractHeight 
    }).toFile(croppedPath);

    const result = await ocrImage(croppedPath, lang);
    fs.unlinkSync(croppedPath);
    
    return result.trim();
  } catch (err) {
    logger.error(`Template extraction failed: ${err}`);
    throw err;
  }
}

// Find the position of text in OCR data
function findTextPosition(words, targetText) {
  // Try exact match first
  for (const word of words) {
    if (word.text.toLowerCase().includes(targetText.toLowerCase())) {
      return {
        x: word.bbox.x0,
        y: word.bbox.y0,
        width: word.bbox.x1 - word.bbox.x0,
        height: word.bbox.y1 - word.bbox.y0
      };
    }
  }

  // Try fuzzy match if exact match fails
  for (const word of words) {
    const similarity = calculateSimilarity(word.text.toLowerCase(), targetText.toLowerCase());
    if (similarity > 0.8) { // 80% similarity threshold
      return {
        x: word.bbox.x0,
        y: word.bbox.y0,
        width: word.bbox.x1 - word.bbox.x0,
        height: word.bbox.y1 - word.bbox.y0
      };
    }
  }

  // Try multi-word match
  const targetWords = targetText.toLowerCase().split(/\s+/);
  for (let i = 0; i <= words.length - targetWords.length; i++) {
    let matchFound = true;
    for (let j = 0; j < targetWords.length; j++) {
      const similarity = calculateSimilarity(words[i + j].text.toLowerCase(), targetWords[j]);
      if (similarity < 0.8) {
        matchFound = false;
        break;
      }
    }
    if (matchFound) {
      // Return position of first word in the sequence
      return {
        x: words[i].bbox.x0,
        y: words[i].bbox.y0,
        width: words[i + targetWords.length - 1].bbox.x1 - words[i].bbox.x0,
        height: words[i].bbox.y1 - words[i].bbox.y0
      };
    }
  }

  return null;
} 

// Generate a regex pattern from OCR text and a selected value, using static context
export function generateRegexFromContext(ocrText, value, contextLength = 30) {
  const idx = ocrText.indexOf(value);
  if (idx === -1) return null;
  // Get context before and after
  const before = ocrText.slice(Math.max(0, idx - contextLength), idx);
  const after = ocrText.slice(idx + value.length, idx + value.length + contextLength);
  // Escape regex special chars in context
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const beforeEsc = escape(before.trim());
  const afterEsc = escape(after.trim());
  // Build regex: before + (capture group) + after
  let pattern = '';
  if (beforeEsc) pattern += beforeEsc + '\\s*';
  pattern += '(.+?)';
  if (afterEsc) pattern += '\\s*' + afterEsc;
  return pattern;
} 