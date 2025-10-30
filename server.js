import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import PDFMerger from "pdf-merger-js";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { removeBackgroundAI } from "./removeBg.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🧩 Multer setup
const upload = multer({ dest: "uploads/" });

// 🗂 Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/output", express.static(path.join(__dirname, "output")));

// 📁 Ensure output directories exist
fs.mkdirSync(path.join(__dirname, "output/images"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "output/pdfs"), { recursive: true });

// 🏠 Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "templets/index.html"));
});

// 🧾 Merge PDFs
app.post("/merge", upload.array("pdfs", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: "Upload at least 2 PDFs" });
    }

    const merger = new PDFMerger();
    for (const file of req.files) await merger.add(file.path);

    const outputName = `merged-${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, "output/pdfs", outputName);

    await merger.save(outputPath);

    req.files.forEach((f) => fs.unlinkSync(f.path)); // cleanup
    res.json({ downloadUrl: `/output/pdfs/${outputName}` });
  } catch (err) {
    console.error("PDF merge error:", err);
    res.status(500).json({ error: "Failed to merge PDFs" });
  }
});

// 🖼 Enhance Image
app.post("/enhance-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const inputPath = req.file.path;
    const outputName = `enhanced-${Date.now()}.png`;
    const outputPath = path.join(__dirname, "output/images", outputName);

    await sharp(inputPath)
      .modulate({ brightness: 1.01, saturation: 1.02 })
      .linear(1.05, 0)
      .sharpen(1, 1, 0.3)
      .withMetadata()
      .toFile(outputPath);

    await fs.remove(inputPath);
    res.json({ downloadUrl: `/output/images/${outputName}` });
  } catch (err) {
    console.error("Enhancement error:", err);
    res.status(500).json({ error: "Failed to enhance image" });
  }
});

// 🪄 Remove Background (local version)

app.post("/remove-bg", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const inputPath = req.file.path;
    const outputName = `no-bg-${Date.now()}.png`;
    const outputPath = path.join(__dirname, "output/images", outputName);

    await removeBackgroundAI(inputPath, outputPath);
    await fs.remove(inputPath);

    res.json({ downloadUrl: `/output/images/${outputName}` });
  } catch (err) {
    console.error("❌ Background removal failed:", err);
    res.status(500).json({ error: "Failed to remove background" });
  }
});

// 🚀 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});
