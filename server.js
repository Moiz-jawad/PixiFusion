import express from "express";
import path from "path";
import multer from "multer";
import { mergePdfs } from "./merge.js";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Multer config
const upload = multer({
  dest: path.join(__dirname, "uploads"),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed."));
    } else {
      cb(null, true);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Static files
app.use("/static", express.static(path.join(__dirname, "public")));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "templets", "index.html"));
});

app.post("/merge", upload.array("pdfs", 2), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length < 2) {
      return res.status(400).send("Please upload two PDF files.");
    }

    const pdf1 = path.resolve(files[0].path);
    const pdf2 = path.resolve(files[1].path);

    const mergedPath = await mergePdfs(pdf1, pdf2);

    files.forEach((file) => fs.unlink(file.path, () => {}));

    res.redirect(`/static/${path.basename(mergedPath)}`);
  } catch (err) {
    console.error("Error merging PDFs:", err);
    res.status(500).send("Failed to merge PDFs. Try again later.");
  }
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).send("Something went wrong on the server.");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
