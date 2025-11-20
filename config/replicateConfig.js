// Centralized configuration for Replicate-backed background removal
// Adjust model/version here if you want to switch to a different rembg variant.

export const REMBG_MODEL =
  "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003";

// Polling / timeout behavior for replicate.run
export const REMBG_WAIT_OPTIONS = {
  // Use polling for predictable timing & logging
  mode: "poll",
  interval: 2000, // ms between polls
  timeout: 120, // seconds before falling back from block to poll (if supported)
};
