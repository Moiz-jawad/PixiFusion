import express from "express";
import multer from "multer";
import { mergePdfs } from "./merge.js";
import fs from "fs";

const app = express();

// Use /tmp for Render (read-only FS) or uploads/ locally
const upload = multer({ dest: process.env.TEMP || "uploads/" });

// ✅ Serve frontend files from /public
app.use(express.static("public"));

app.post("/merge", upload.array("pdfs", 2), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: "Please upload two PDF files." });
    }

    const [file1, file2] = req.files.map((f) => f.path);
    const mergedPath = await mergePdfs(file1, file2);

    // Send merged file for download
    res.download(mergedPath, "merged.pdf", (err) => {
      if (err) console.error("Download error:", err);
      // Cleanup temporary files
      [file1, file2, mergedPath].forEach((f) => fs.unlink(f, () => {}));
    });
  } catch (error) {
    console.error("❌ Error merging PDFs:", error);
    res.status(500).json({ error: "Failed to merge PDFs." });
  }
});

// Default route
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/templets/index.html");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
