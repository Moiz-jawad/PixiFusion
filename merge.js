import PDFMerger from "pdf-merger-js";
import path from "path";

/**
 * Merges two PDF files and saves the result with metadata.
 * @param {string} file1 - Path to the first PDF file.
 * @param {string} file2 - Path to the second PDF file.
 * @returns {Promise<string>} - Path to the merged PDF file.
 */
export const mergePdfs = async (file1, file2) => {
  const merger = new PDFMerger();

  // Add PDFs to the merger
  await Promise.all([merger.add(file1), merger.add(file2)]);

  // Set metadata
  merger.setMetadata({
    title: "Merged PDF by Moiz Jawad",
    author: "Moiz Jawad",
    creator: "Node.js Express App",
    producer: "pdf-merger-js",
  });

  // Generate output path
  const timestamp = Date.now();
  const outputPath = path.resolve(`./public/merged-${timestamp}.pdf`);

  // Save merged PDF
  await merger.save(outputPath);

  return outputPath;
};
