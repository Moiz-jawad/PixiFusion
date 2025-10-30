import fs from "fs-extra";
import sharp from "sharp";
import Upscaler from "upscaler";
import dotenv from "dotenv";

dotenv.config();

export const enhanceImage = async (inputPath, outputPath) => {
  try {
    console.log("🚀 Starting enhancement...");

    // Step 1: Upscale using AI
    const upscaler = new Upscaler({
      model:
        "https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-thick@latest/model.json",
    });
    const result = await upscaler.upscale(inputPath);

    // Step 2: Save temporary file
    const tempFile = "output/temp.png";
    const base64Data = result.replace(/^data:image\/png;base64,/, "");
    await fs.writeFile(tempFile, base64Data, "base64");

    // Step 3: Enhance with sharp
    await sharp(tempFile)
      .sharpen()
      .modulate({ brightness: 1.05, saturation: 1.15 })
      .toFile(outputPath);

    // Step 4: Cleanup
    await fs.remove(tempFile);
    console.log(`🎉 Enhanced image saved at: ${outputPath}`);
    return outputPath;
  } catch (err) {
    console.error("❌ Enhancement failed:", err);
    throw err;
  }
};
