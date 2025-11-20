# pdf-Xchange

A small Node.js/Express service for PDF merging and basic image tools (enhancement and background removal).

## Requirements

- Node.js 18 or newer (for built-in `fetch` and good `sharp`/`express` support)
- A Replicate account and API token for background removal

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```bash
REPLICATE_API_TOKEN=your_token_here
PORT=3000 # optional, defaults to 3000
```

3. Start the server:

```bash
npm start
```

Then open `http://localhost:3000` in your browser.

## Endpoints

- `POST /merge` – merge multiple uploaded PDFs (`pdfs` field) into a single PDF.
- `POST /enhance-image` – enhance a single uploaded image and return a processed PNG.
- `POST /remove-bg` – remove the background from a single uploaded image using Replicate.
