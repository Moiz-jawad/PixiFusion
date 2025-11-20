# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

This is a small Node.js/Express HTTP service for PDF and image processing. It exposes endpoints to:
- Merge multiple PDFs into a single PDF.
- Enhance images using Sharp.
- Remove image backgrounds using the Replicate API.

The project uses native ES modules (`"type": "module"` in `package.json`) and plain JavaScript. There is no frontend framework; an `index.html` is served directly from `templets/` and static assets (if any) are served from `public/`.

## Core commands

All commands are intended to be run from the repository root.

### Install dependencies

```bash
npm install
```

### Run the server

`package.json` defines `server.js` as the main entrypoint and a `start` script:

```bash
npm start
# equivalent to
node server.js
```

The server listens on `process.env.PORT` or `3000` by default.

### Tests and linting

- There is currently **no test framework configured**. `npm test` is just a placeholder that prints an error and exits.
- There are **no lint/format scripts** defined in `package.json`.

If you introduce testing or linting, add the corresponding scripts to `package.json` and update this file.

## Runtime environment & directories

- File uploads are handled by Multer and written to `uploads/`.
- Processed files are written under `output/`:
  - `output/images/` for image outputs.
  - `output/pdfs/` for merged PDFs.
- These output directories are created on startup in `server.js` if they do not exist.

### Environment variables / .env

- `REPLICATE_API_TOKEN` – required. Used by `removeBg.js` to authenticate with the Replicate API. Without it, background removal will fail.
- `PORT` – optional. Port for the HTTP server (defaults to `3000`).
- `NODE_ENV` – optional. Can be used to tune logging/behavior if you add environment-specific logic.
- `upscale.js` calls `dotenv.config()`, so environment variables are typically supplied via a `.env` file in the project root.
- `merge.js` writes merged PDFs to `process.env.TEMP` (or `./uploads` as a fallback) when used directly.

## High-level architecture

### Entry point: `server.js`

`server.js` is the main HTTP server and orchestration layer:
- Creates the Express app and configures Multer for file uploads.
- Serves static assets from `public/` and exposes `output/` for downloading generated files.
- Ensures `output/images` and `output/pdfs` exist before handling requests.
- Serves the main HTML UI from `templets/index.html` on `GET /`.
- Defines the main API endpoints:
  - `POST /merge` – accepts multiple PDFs (`pdfs` field via Multer), merges them with `pdf-merger-js`, saves to `output/pdfs/`, returns a JSON `downloadUrl`, and deletes the temp uploads.
  - `POST /enhance-image` – accepts a single uploaded image, performs basic enhancement via Sharp (brightness/saturation/contrast/sharpen), writes to `output/images/`, cleans up the temp upload, and returns a JSON `downloadUrl`.
  - `POST /remove-bg` – accepts a single uploaded image, calls `removeBackgroundAI` from `removeBg.js`, writes the result to `output/images/`, deletes the temp upload, and returns a JSON `downloadUrl`.

### PDF utilities: `merge.js`

- Exports `mergePdfs(files)` which:
  - Uses `pdf-merger-js` to merge the uploaded file paths.
  - Saves the merged PDF under `process.env.TEMP` (or `./uploads`) with a timestamped filename.
  - Deletes the temporary upload files after merging.
- This module is currently not wired into `server.js`; it can be used for CLI tools, background jobs, or as a candidate for refactoring the `/merge` route logic into a shared utility.

### Background removal: `removeBg.js`

- Exports `removeBackgroundAI(inputPath, outputPath)` which:
  - Uses the official `replicate` Node.js client with the `cjwbw/rembg` model (version ID configured in `config/replicateConfig.js`).
  - Streams the uploaded image from disk into the Replicate prediction.
  - Receives a file-like output from Replicate and writes it directly to `outputPath`.
- Depends on `REPLICATE_API_TOKEN` for authentication.
- If you modify this file, keep the `Replicate` client usage and model identifier in sync with any changes you make to Replicate configuration.

### Image upscaling & enhancement: `upscale.js`

- Exports `enhanceImage(inputPath, outputPath)` which:
  - Uses `upscaler` with the `@upscalerjs/esrgan-thick` model (loaded from a CDN URL) to upscale the image.
  - Writes an intermediate PNG to `output/temp.png`.
  - Uses Sharp to further enhance the image and save to `outputPath`.
  - Cleans up the temporary file and logs progress.
- Currently not invoked from `server.js`; it can be wired into a new endpoint (for example, a higher-quality enhancement route) or reused from scripts.

## Notes for future Warp agents

- This repository is intentionally minimal; most behavior is concentrated in a few top-level `.js` files.
- When adding new routes, prefer factoring reusable logic into separate modules (similar to `merge.js`, `removeBg.js`, `upscale.js`) and keeping `server.js` focused on HTTP wiring and configuration.
- If you change directory layouts (e.g., moving `templets/`, `public/`, or `output/`), update the paths in `server.js` and this file so other agents do not rely on stale assumptions.
