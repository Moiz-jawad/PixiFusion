import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import PDFMerger from "pdf-merger-js";
import sharp from "sharp";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import { removeBackgroundAI } from "./removeBg.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🔐 Security middleware (CSP disabled so CDN scripts/styles work)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Small helper to safely remove temporary files without crashing the app
async function safeRemove(filePath) {
  if (!filePath) return;
  try {
    await fs.remove(filePath);
  } catch (err) {
    console.error("Failed to remove temp file", filePath, err);
  }
}

// ⏱️ Basic rate limiting (per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/", apiLimiter);

// 🧩 Multer setups with size/type limits
const pdfUpload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB per file
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

const imageUpload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per image
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (
      ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(
        file.mimetype
      )
    )
      cb(null, true);
    else cb(new Error("Only image files (png, jpg, jpeg, webp) are allowed"));
  },
});

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
app.post("/merge", pdfUpload.array("pdfs", 10), async (req, res) => {
  const files = req.files || [];
  try {
    if (!files.length || files.length < 2) {
      return res.status(400).json({ error: "Upload at least 2 PDFs" });
    }

    const merger = new PDFMerger();
    for (const file of files) await merger.add(file.path);

    const outputName = `merged-${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, "output/pdfs", outputName);

    await merger.save(outputPath);

    res.json({ downloadUrl: `/output/pdfs/${outputName}` });
  } catch (err) {
    console.error("PDF merge error:", err);
    res.status(500).json({ error: "Failed to merge PDFs" });
  } finally {
    // Async cleanup of temp PDF uploads regardless of success/failure
    await Promise.all(files.map((f) => safeRemove(f.path)));
  }
});

// 🖼 Enhance Image
app.post("/enhance-image", imageUpload.single("image"), async (req, res) => {
  let inputPath;
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    inputPath = req.file.path;
    const outputName = `enhanced-${Date.now()}.png`;
    const outputPath = path.join(__dirname, "output/images", outputName);

    await sharp(inputPath)
      .modulate({ brightness: 1.01, saturation: 1.02 })
      .linear(1.05, 0)
      .sharpen(1, 1, 0.3)
      .withMetadata()
      .toFile(outputPath);

    res.json({ downloadUrl: `/output/images/${outputName}` });
  } catch (err) {
    console.error("Enhancement error:", err);
    res.status(500).json({ error: "Failed to enhance image" });
  } finally {
    if (inputPath) await safeRemove(inputPath);
  }
});

// 🪄 Remove Background (local version)

app.post("/remove-bg", imageUpload.single("image"), async (req, res) => {
  let inputPath;
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    inputPath = req.file.path;
    const outputName = `no-bg-${Date.now()}.png`;
    const outputPath = path.join(__dirname, "output/images", outputName);

    await removeBackgroundAI(inputPath, outputPath);

    res.json({ downloadUrl: `/output/images/${outputName}` });
  } catch (err) {
    console.error("❌ Background removal failed:", err);
    res.status(500).json({ error: "Failed to remove background" });
  } finally {
    if (inputPath) await safeRemove(inputPath);
  }
});

// Global error handler (Multer + generic errors)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  // Multer/file upload errors
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Uploaded file is too large" });
  }

  if (err && err.name === "MulterError") {
    return res.status(400).json({ error: err.message });
  }

  if (err && err.message && /Only .* files are allowed/i.test(err.message)) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: "Internal server error" });
});

// 🚀 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});
