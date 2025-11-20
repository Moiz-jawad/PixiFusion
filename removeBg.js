import fs from "fs-extra";

/**
 * Removes background using Replicate API (AI-based)
 * @param {string} inputPath - Local path of the image to process
 * @param {string} outputPath - Path to save the output image
 */
export async function removeBackgroundAI(inputPath, outputPath) {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken)
    throw new Error(
      "Missing REPLICATE_API_TOKEN in environment (.env or process env)."
    );

  const modelVersion =
    "cc2f8dc142bdf1b99b79f92e5e918c1a5b15f5c54b4b428f2c66b9bfb7c4a4d8";

  console.log("🪄 Removing background with Replicate AI...");

  // Read and encode input image
  const imageBuffer = await fs.readFile(inputPath);
  const base64Image = imageBuffer.toString("base64");

  // Create prediction
  const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: modelVersion,
      input: { image: `data:image/png;base64,${base64Image}` },
    }),
  });

  if (!createResponse.ok) {
    const text = await createResponse.text();
    throw new Error(
      `Replicate API error (${createResponse.status}): ${text.substring(0, 300)}`
    );
  }

  const prediction = await createResponse.json();
  if (prediction.error) throw new Error(prediction.error);

  // Poll until the prediction completes or fails
  let outputUrl = null;
  const predictionId = prediction.id;

  while (!outputUrl) {
    const pollResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: { Authorization: `Token ${apiToken}` },
      }
    );

    if (!pollResponse.ok) {
      const text = await pollResponse.text();
      throw new Error(
        `Replicate polling error (${pollResponse.status}): ${text.substring(
          0,
          300
        )}`
      );
    }

    const status = await pollResponse.json();

    if (status.output && status.output.length > 0) {
      outputUrl = status.output[0];
    } else if (["failed", "canceled"].includes(status.status)) {
      throw new Error("Prediction failed");
    } else {
      // Still running; wait a bit and try again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Download processed image
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

  console.log(`✅ Background removed successfully: ${outputPath}`);
}
