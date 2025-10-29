import express from "express";
import multer from "multer";
import { mergePdfs } from "./merge.js";
import fs from "fs";

const app = express();
const upload = multer({ dest: "/tmp/" }); // use /tmp on Render

app.post("/merge", upload.array("pdfs", 2), async (req, res) => {
  try {
    const [file1, file2] = req.files.map((f) => f.path);
    const mergedPath = await mergePdfs(file1, file2);

    res.download(mergedPath, "merged.pdf", (err) => {
      if (err) console.error("Download error:", err);
      // Cleanup temporary files
      fs.unlink(file1, () => {});
      fs.unlink(file2, () => {});
      fs.unlink(mergedPath, () => {});
    });
  } catch (error) {
    res.status(500).send({ error: "Failed to merge PDFs." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
