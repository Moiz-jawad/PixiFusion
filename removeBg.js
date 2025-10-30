/**
 * Removes background using Replicate API (AI-based)
 * @param {string} inputPath - Local path of the image to process
 * @param {string} outputPath - Path to save the output image
 */
export async function removeBackgroundAI(inputPath, outputPath) {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) throw new Error("Missing REPLICATE_API_TOKEN in .env file");

  const model = "cjwbw/rembg"; // stable, reliable model

  console.log("🪄 Removing background with Replicate AI...");

  const imageBuffer = await fs.readFile(inputPath);
  const base64Image = imageBuffer.toString("base64");

  const response = await fetch(`https://api.replicate.com/v1/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version:
        "cc2f8dc142bdf1b99b79f92e5e918c1a5b15f5c54b4b428f2c66b9bfb7c4a4d8",
      input: { image: `data:image/png;base64,${base64Image}` },
    }),
  });

  const result = await response.json();

  if (result.error) throw new Error(result.error);

  // Poll until the prediction completes
  let outputUrl = null;
  while (!outputUrl) {
    const poll = await fetch(
      `https://api.replicate.com/v1/predictions/${result.id}`,
      {
        headers: { Authorization: `Token ${apiToken}` },
      }
    );
    const status = await poll.json();
    if (status.output) outputUrl = status.output[0];
    else if (["failed", "canceled"].includes(status.status))
      throw new Error("Prediction failed");
    else await new Promise((r) => setTimeout(r, 2000));
  }

  const imgResponse = await fetch(outputUrl);
  const buffer = await imgResponse.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buffer));

  console.log(`✅ Background removed successfully: ${outputPath}`);
}
