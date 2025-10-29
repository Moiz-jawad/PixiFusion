import PDFMerger from "pdf-merger-js";
import path from "path";
import fs from "fs";

export const mergePdfs = async (file1, file2) => {
  const merger = new PDFMerger();
  await merger.add(file1);
  await merger.add(file2);

  // Use /tmp on Render, or local uploads folder
  const outputDir = process.env.TEMP || "./uploads";
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const mergedPath = path.join(outputDir, `merged-${Date.now()}.pdf`);
  await merger.save(mergedPath);
  return mergedPath;
};
