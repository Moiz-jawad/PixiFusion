import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import PDFMerger from "pdf-merger-js";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Multer setup (store files temporarily on disk)
const upload = multer({ dest: "uploads/" });

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/output", express.static(path.join(__dirname, "output")));

// Ensure output directories exist
fs.mkdirSync(path.join(__dirname, "output/images"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "output/pdfs"), { recursive: true });

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "templets/index.html"));
});

// PDF merge endpoint
app.post("/merge", upload.array("pdfs", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: "Upload at least 2 PDFs" });
    }

    const merger = new PDFMerger();

    for (const file of req.files) {
      await merger.add(file.path); // merge PDFs from disk
    }

    const outputName = `merged-${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, "output/pdfs", outputName);

    await merger.save(outputPath);

    // Clean up uploaded PDFs
    req.files.forEach((f) => fs.unlinkSync(f.path));

    res.json({ downloadUrl: `/output/pdfs/${outputName}` });
  } catch (err) {
    console.error("PDF merge error:", err);
    res.status(500).json({ error: "Failed to merge PDFs" });
  }
});

// Image enhancement endpoint
app.post("/enhance-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const inputPath = req.file.path;
    const outputName = `enhanced-${Date.now()}.png`;
    const outputPath = path.join(__dirname, "output/images", outputName);

    await sharp(inputPath)
      .modulate({ brightness: 1.01, saturation: 1.02 }) // very slight brightening & color boost
      .linear(1.05, 0) // gentle contrast
      .sharpen(1, 1, 0.3) // soft sharpening
      .withMetadata() // keep orientation & metadata
      .toFile(outputPath);

    fs.unlinkSync(inputPath); // delete original

    res.json({ downloadUrl: `/output/images/${outputName}` });
  } catch (err) {
    console.error("Enhancement error:", err);
    res.status(500).json({ error: "Failed to enhance image" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
