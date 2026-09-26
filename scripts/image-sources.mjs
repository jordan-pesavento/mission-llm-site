// Product image sources for site v2 and their CSS sizes.
//
// The PNGs in public/images/product/ are neutral placeholder frames at 2x the reference sizes, until
// the orchestrator drops in real captures of the redesigned Mission LLM app under the SAME filenames.
// Swapping a PNG and running `npm run images` (or `npm run build`) regenerates every AVIF and WebP
// variant and src/data/images.generated.json. The raw PNGs never ship (scripts/prune-dist.mjs).
//
// `frame` is the image's display width in CSS pixels at 1440 (the reference measurement). A capture
// may use any density and any height: the height is derived from the file's own aspect ratio, and
// Screenshot.astro always shows the whole image (never cropped). Captures should be at least 2x the
// frame width for sharp rendering on high-density screens.

/** Extra output widths in image pixels (skipped when above the source width). */
export const WIDTHS = [480, 720, 960, 1440, 1920];

export const SOURCES = {
  // Hero, right column: 867 x 506 at 1440 (reference ratio 1.713).
  hero: { frame: 867 },
  // Feature accordion 1 ("Preconfigured" style), one image per item: 714 x 416 (ratio 1.716).
  "feature-documents": { frame: 714 },
  "feature-agents": { frame: 714 },
  "feature-models": { frame: 714 },
  "feature-workspaces": { frame: 714 },
  "feature-users": { frame: 714 },
  // Dark band: answers with their sources list. 714 x 416.
  grounded: { frame: 714 },
  // Feature accordion 2 (security and control). 714 x 416.
  security: { frame: 714 },
  // Deploy band (optional; the band's main visual is a real code block). 714 x 416.
  deploy: { frame: 714 },
};
