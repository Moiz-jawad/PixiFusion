import fs from "fs-extra";
import Replicate from "replicate";
import { REMBG_MODEL, REMBG_WAIT_OPTIONS } from "./config/replicateConfig.js";

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

  // Use the official client to run the rembg model. It will internally handle
  // prediction creation and polling based on REMBG_WAIT_OPTIONS.
  const output = await replicate.run(REMBG_MODEL, {
    input: {
      // Let the client handle file upload/encoding from a stream.
      image: fs.createReadStream(inputPath),
    },
    wait: REMBG_WAIT_OPTIONS,
  });

  // The output from replicate.run is typically either a URL string or an array.
  const outputUrl = Array.isArray(output) ? output[0] : output;
  if (!outputUrl) {
    throw new Error("Replicate returned no output URL for background removal");
  }

  const imgResponse = await fetch(outputUrl);
  if (!imgResponse.ok) {
    const text = await imgResponse.text();
    throw new Error(
      `Failed to download processed image (${imgResponse.status}): ${text.substring(
        0,
        300
      )}`
    );
  }

  const buffer = await imgResponse.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buffer));

  const durationMs = Date.now() - start;
  console.log(`✅ Background removed successfully in ${durationMs}ms: ${outputPath}`);
}
