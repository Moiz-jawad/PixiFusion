import fs from "fs-extra";
import Replicate from "replicate";
import { REMBG_MODEL } from "./config/replicateConfig.js";

/**
 * Removes background using Replicate (AI-based)
 * @param {string} inputPath - Local path of the image to process
 * @param {string} outputPath - Path to save the output image
 */
export async function removeBackgroundAI(inputPath, outputPath) {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken)
    throw new Error(
      "Missing REPLICATE_API_TOKEN in environment (.env or process env)."
    );

  const replicate = new Replicate({
    auth: apiToken,
  });

  console.log("🪄 Removing background with Replicate AI...", {
    model: REMBG_MODEL,
    inputPath,
  });

  const start = Date.now();

  // Use the official client to run the rembg model. The JS client returns a
  // FileOutput (or array of FileOutputs) which can be written directly.
  const output = await replicate.run(REMBG_MODEL, {
    input: {
      image: fs.createReadStream(inputPath),
    },
  });

  if (Array.isArray(output)) {
    if (!output.length) {
      throw new Error("Replicate returned an empty output array");
    }
    await fs.writeFile(outputPath, output[0]);
  } else {
    await fs.writeFile(outputPath, output);
  }

  const durationMs = Date.now() - start;
  console.log(`✅ Background removed successfully in ${durationMs}ms: ${outputPath}`);
}
