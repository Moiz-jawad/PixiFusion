import PDFMerger from "pdf-merger-js";
import path from "path";
import fs from "fs";

/**
 * Merges two PDF files and returns the output file path (stored temporarily).
 * @param {string} file1 - Path to the first PDF file.
 * @param {string} file2 - Path to the second PDF file.
 * @returns {Promise<string>} - Temporary path to the merged PDF.
 */
export const mergePdfs = async (file1, file2) => {
  try {
    const merger = new PDFMerger();

    // Add both PDFs
    await Promise.all([merger.add(file1), merger.add(file2)]);

    // Add metadata for professional touch
    merger.setMetadata({
      title: "Merged PDF",
      author: "Moiz Jawad",
      creator: "Node.js PDF Merger",
      producer: "pdf-merger-js",
    });

    // Use /tmp directory (safe for Render, Heroku, etc.)
    const timestamp = Date.now();
    const outputPath = path.join("/tmp", `merged-${timestamp}.pdf`);

    // Save merged file
    await merger.save(outputPath);

    // Ensure file actually exists
    if (!fs.existsSync(outputPath)) {
      throw new Error("Failed to generate merged PDF file.");
    }

    return outputPath;
  } catch (error) {
    console.error("Error merging PDFs:", error);
    throw new Error("PDF merging failed. Please try again.");
  }
};
