// Centralized configuration for Replicate-backed background removal
// Adjust model/version here if you want to switch to a different rembg variant.

export const REMBG_MODEL =
  "cjwbw/rembg:cc2f8dc142bdf1b99b79f92e5e918c1a5b15f5c54b4b428f2c66b9bfb7c4a4d8";

// Polling / timeout behavior for replicate.run
export const REMBG_WAIT_OPTIONS = {
  // Use polling for predictable timing & logging
  mode: "poll",
  interval: 2000, // ms between polls
  timeout: 120, // seconds before falling back from block to poll (if supported)
};
