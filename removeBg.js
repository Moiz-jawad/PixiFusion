import fs from "fs-extra";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Removes background using local Python rembg script.
 * @param {string} inputPath - Local path of the image to process
 * @param {string} outputPath - Path to save the output image
 */
export async function removeBackgroundAI(inputPath, outputPath) {
  const pythonExecutable = process.env.PYTHON_PATH || "python";
  const scriptPath = path.join(__dirname, "rembg_runner.py");

  console.log("🪄 Removing background locally using rembg...", {
    pythonExecutable,
    scriptPath,
    inputPath,
    outputPath,
  });

  const start = Date.now();

  // Ensure the input file exists before invoking Python
  const exists = await fs.pathExists(inputPath);
  if (!exists) {
    throw new Error(`Input file does not exist: ${inputPath}`);
  }

  await new Promise((resolve, reject) => {
    const child = spawn(pythonExecutable, [scriptPath, inputPath, outputPath]);

    let stderr = "";

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `rembg script exited with code ${code}. STDERR: ${stderr.trim()}`
          )
        );
      }
    });
  });

  const durationMs = Date.now() - start;
  console.log(
    `✅ Background removed locally in ${durationMs}ms and saved to: ${outputPath}`
  );
}
