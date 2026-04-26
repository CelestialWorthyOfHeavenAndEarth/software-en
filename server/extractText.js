import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import mammoth from "mammoth";

const require = createRequire(import.meta.url);

/**
 * @param {string} filePath
 * @param {string} originalName
 * @returns {Promise<{ text: string; error?: string }>}
 */
export async function extractResumeText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const buffer = await fs.readFile(filePath);

  try {
    if (ext === ".pdf") {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      return { text: normalizeWhitespace(data.text || "") };
    }
    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      return { text: normalizeWhitespace(result.value || "") };
    }
    if (ext === ".doc") {
      try {
        const result = await mammoth.extractRawText({ buffer });
        if (result.value && result.value.trim().length > 20) {
          return { text: normalizeWhitespace(result.value) };
        }
      } catch {
        // Old .doc binary format often unsupported
      }
      return {
        text: "",
        error: "Could not extract text from .doc file. Please upload PDF or DOCX for full parsing.",
      };
    }
    if (ext === ".txt" || ext === ".rtf") {
      return { text: normalizeWhitespace(buffer.toString("utf8")) };
    }
    return {
      text: "",
      error: `Unsupported file type ${ext || "unknown"}. Use PDF, DOCX, or TXT.`,
    };
  } catch (err) {
    return {
      text: "",
      error: err instanceof Error ? err.message : "Failed to read resume file.",
    };
  }
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}
