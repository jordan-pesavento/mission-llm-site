// Product screenshot sources, their named crops, and the output widths.
//
// The PNGs in public/images/product/ are concept renders, placeholders until the final app design
// is approved. Keep these exact filenames: swapping a PNG and running `npm run images` (or
// `npm run build`) regenerates every AVIF and WebP variant and src/data/images.generated.json.
// The raw PNGs never ship: scripts/prune-dist.mjs removes them from dist/ after the build.
//
// Renders are high density: `frame` is the screen's size in CSS pixels, and the PNG is 2x (or 3x
// for the phone details) that size. Crop boxes are { x, y, w, h } in CSS pixels of the frame, so
// they stay valid whatever density a replacement render uses. If a replacement moves the UI,
// update the boxes here. Render script: scratchpad/site/render-concepts.cjs.
//
// Crops are used two ways by src/components/ui/Screenshot.astro:
// - view: a detail shown at every width instead of the whole frame (tour panels, grounded band).
// - phone: a detail shown below 640px, never wider than its own CSS width, so UI text stays
//   11px or larger on a 390px phone instead of shrinking the whole frame.
// Sources shown only through their crops set `full: false`, so no whole-frame variants are
// generated for them (they would never be requested).

/** Output widths in image pixels for whole frames (widths above the source width are skipped). */
export const WIDTHS = [960, 1440, 1920, 2880, 3840];

export const SOURCES = {
  // dir-c "Grounded document", default state.
  "chat-sources": {
    frame: [1920, 1080],
    crops: {
      // The sources band and the three listed documents (hero, phones).
      sources: { x: 1050, y: 0, w: 306, h: 262 },
      // The source list beside the passage viewer (tour: Document knowledge).
      documents: { x: 1050, y: 10, w: 870, h: 544 },
    },
  },
  // dir-c with the citation popover open on marker 2.
  "chat-cite": {
    frame: [1920, 1080],
    full: false,
    crops: {
      // The chat pane: header controls, question, answer and the popover (grounded band).
      answer: { x: 296, y: 0, w: 752, h: 612 },
      // The popover alone (grounded band, phones).
      popover: { x: 446, y: 369, w: 398, h: 216 },
    },
  },
  // dir-a "Quiet precision", empty state. Kept for the kit page and future use.
  "chat-empty": {
    frame: [1920, 1080],
    full: false,
    crops: {
      start: { x: 736, y: 300, w: 728, h: 400 },
    },
  },
  // dir-b "Mission frame", default state.
  "chat-frame": {
    frame: [1920, 1080],
    full: false,
    crops: {
      // The workspace rail beside the thread (tour: Workspaces and threads).
      workspaces: { x: 0, y: 0, w: 1200, h: 750 },
      // The rail alone (tour: Workspaces and threads, phones).
      rail: { x: 0, y: 0, w: 287, h: 488 },
    },
  },
  // Phone detail of dir-c: the source document card reflowed to 388px (tour: Document knowledge).
  "chat-sources-phone": { frame: [420, null], crops: {} },
  // Website concepts on the final design system (scratchpad/site/concepts).
  "agent-run": { frame: [1200, 750], crops: {} },
  "agent-run-phone": { frame: [420, null], crops: {} },
  "admin-users": { frame: [1200, 750], crops: {} },
  "admin-users-phone": { frame: [420, null], crops: {} },
  "workspace-model": { frame: [1200, 750], crops: {} },
  "workspace-model-phone": { frame: [420, null], crops: {} },
};
