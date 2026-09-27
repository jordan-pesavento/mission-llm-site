// Renders scripts/og/og-card.html to the share card, public/og/mission-llm.png (1200 x 630).
// One-off tool, not part of `npm run build`. The site has no browser dependency, so this uses a
// local puppeteer-core and Chrome (both on D:, per the owner's rule); override them with the
// PUPPETEER_CORE and CHROME environment variables.
//   node scripts/og/render-og.mjs
// The raw capture goes to D:/DevCache/claude-work/site-redesign/build/og/ (OG_WORK_DIR), then sharp writes the
// compressed PNG. Fails if any image on the card (lockup, lecture hall art) or font did not load.
// OG_PREVIEW=1 writes only the raw capture (og-preview.png) and tolerates a missing image.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const SRC = path.join(HERE, "og-card.html");
const OUT = path.join(ROOT, "public/og/mission-llm.png");
const WORK = process.env.OG_WORK_DIR || "D:/DevCache/claude-work/site-redesign/build/og";
const PUPPETEER = process.env.PUPPETEER_CORE || "D:/OB Vault/mission-llm/collector/node_modules/puppeteer-core";
const CHROME = process.env.CHROME || "D:/DevCache/puppeteer/chrome/win64-119.0.6045.105/chrome-win64/chrome.exe";
const PREVIEW = process.env.OG_PREVIEW === "1";

const puppeteer = createRequire(import.meta.url)(PUPPETEER);
fs.mkdirSync(WORK, { recursive: true });
const profile = path.join("D:/DevCache/render-profiles", `og-${process.pid}`);
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  userDataDir: profile,
  args: ["--allow-file-access-from-files", "--force-color-profile=srgb", "--hide-scrollbars"],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(SRC).href, { waitUntil: "networkidle0" });
  const state = await page.evaluate(async () => {
    await document.fonts.ready;
    return {
      broken: [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute("src")),
      fonts: [...document.fonts].filter((f) => f.status !== "loaded").map((f) => `${f.family} ${f.weight} ${f.status}`),
    };
  });
  if (state.broken.length && !PREVIEW) throw new Error(`og: image did not load: ${state.broken.join(", ")}`);
  if (state.fonts.length) throw new Error(`og: font did not load: ${state.fonts.join(", ")}`);
  const raw = path.join(WORK, PREVIEW ? "og-preview.png" : "og-raw.png");
  await page.screenshot({ path: raw, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  if (PREVIEW) {
    console.log(`og: preview ${raw}${state.broken.length ? ` (missing: ${state.broken.join(", ")})` : ""}`);
  } else {
    await sharp(raw).png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 }).toFile(OUT);
    console.log(`og: wrote ${path.relative(ROOT, OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
  }
} finally {
  await browser.close();
  fs.rmSync(profile, { recursive: true, force: true });
}
