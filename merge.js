import PDFMerger from "pdf-merger-js";
import path from "path";
import fs from "fs";

export const mergePdfs = async (files) => {
  const merger = new PDFMerger();

  // Add all uploaded files
  for (const file of files) {
    await merger.add(file.path);
  }

  // Output directory
  const outputDir = process.env.TEMP || "./uploads";
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const mergedPath = path.join(outputDir, `merged-${Date.now()}.pdf`);
  await merger.save(mergedPath);

  // Cleanup old temp files
  for (const file of files) {
    fs.unlink(file.path, () => {});
  }

  return mergedPath;
};
