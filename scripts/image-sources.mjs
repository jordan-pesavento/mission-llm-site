// Product image sources for site v2 and their CSS sizes.
//
// The PNGs in public/images/product/ are real captures of the Mission LLM app (a test instance with
// fictional sample documents). Replace a capture under the SAME filename and run `npm run images` (or
// `npm run build`) to regenerate every AVIF and WebP variant and src/data/images.generated.json.
// The raw PNGs never ship (scripts/prune-dist.mjs). No placeholder frames: every entry here is shown
// on a page.
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
  // Feature accordion 2 (security and control), one image per item. 714 x 416.
  // security-offline: LLM Preference on a model server on the same machine; security-roles: a course
  // workspace's Members tab; security-history: Workspace Chats; security: Event Logs;
  // security-telemetry: Privacy & Data-Handling with the telemetry switch off.
  "security-offline": { frame: 714 },
  "security-roles": { frame: 714 },
  "security-history": { frame: 714 },
  security: { frame: 714 },
  "security-telemetry": { frame: 714 },
};
// Capture source: D:/AI/MissionLLM/ui-test/seed-course.cjs seeds the UI test copy with a fictional
// course (instructor, students, a syllabus and readings, real answers from the local model) and
// capture-course.cjs takes every image above at 1920 x 1120, device scale 1.5 (2880 x 1680).
