// Generates responsive AVIF and WebP variants of the product images, the touch icons from the
// emblem, and src/data/images.generated.json (read by src/components/ui/Screenshot.astro).
// Runs before every `astro dev` and `astro build`. Outputs are skipped when already newer than
// their source and this script's configuration, so repeat runs are fast.
//
// Sizes: each image is described in CSS pixels (`frame` in image-sources.mjs, the display width at
// 1440) with its height taken from the file's own aspect ratio. Variants are emitted at 1x, 2x and
// the extra WIDTHS, never above the source width (nothing is upscaled).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { SOURCES, WIDTHS } from "./image-sources.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SRC_DIR = path.join(ROOT, "public/images/product");
const OUT_DIR = path.join(SRC_DIR, "generated");
const PUBLIC_URL = "/images/product";
const MANIFEST = path.join(ROOT, "src/data/images.generated.json");
const EMBLEM = path.join(ROOT, "public/mission-llm-emblem.svg");
const ICON_DIR = path.join(ROOT, "public/icons");
const CONFIG_MTIME = Math.max(
  fs.statSync(path.join(HERE, "image-sources.mjs")).mtimeMs,
  fs.statSync(fileURLToPath(import.meta.url)).mtimeMs,
);

// Screenshots are UI with small text: keep full chroma so glyph edges stay crisp.
const AVIF = { quality: 62, effort: 4, chromaSubsampling: "4:4:4" };
const WEBP = { quality: 88, effort: 5, smartSubsample: true };

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });

const fresh = (out, src) =>
  fs.existsSync(out) && fs.statSync(out).mtimeMs >= Math.max(fs.statSync(src).mtimeMs, CONFIG_MTIME);
let written = 0;
const expected = new Set();

async function emit(src, pipelineFactory, base, width) {
  const files = {};
  for (const [fmt, opts] of [["avif", AVIF], ["webp", WEBP]]) {
    const file = `${base}-${width}.${fmt}`;
    expected.add(file);
    const abs = path.join(OUT_DIR, file);
    if (!fresh(abs, src)) {
      await pipelineFactory().resize({ width, withoutEnlargement: true })[fmt](opts).toFile(abs);
      written++;
    }
    files[fmt] = `${PUBLIC_URL}/generated/${file}`;
  }
  return files;
}

const manifest = {};
for (const [name, cfg] of Object.entries(SOURCES)) {
  const src = path.join(SRC_DIR, `${name}.png`);
  if (!fs.existsSync(src)) throw new Error(`Missing product image: ${src}`);
  const meta = await sharp(src).metadata();
  const cssW = cfg.frame;
  if (meta.width < cssW) console.warn(`images: ${name}.png is ${meta.width}px wide, below its ${cssW}px frame (it will look soft)`);
  if (meta.width < cssW * 2) console.warn(`images: ${name}.png is under 2x its ${cssW}px frame; high-density screens will scale it up`);
  const cssH = Math.round((meta.height / meta.width) * cssW);
  const entry = { width: cssW, height: cssH, variants: [] };
  const widths = [...new Set([...WIDTHS, cssW, cssW * 2, meta.width].map(Math.round).filter((w) => w <= meta.width))].sort((a, b) => a - b);
  for (const w of widths) {
    const files = await emit(src, () => sharp(src), name, w);
    entry.variants.push({ width: w, ...files });
  }
  manifest[name] = entry;
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

// Remove variants no longer produced (renamed crops, changed widths).
let removed = 0;
for (const f of fs.readdirSync(OUT_DIR)) {
  if (!expected.has(f)) {
    fs.rmSync(path.join(OUT_DIR, f));
    removed++;
  }
}

// Touch and fallback icons from the emblem (opaque navy tile for iOS; transparent PNG fallback).
fs.mkdirSync(ICON_DIR, { recursive: true });
const icons = [
  { file: "apple-touch-icon.png", size: 180, pad: 14, bg: "#070F26" },
  { file: "icon-192.png", size: 192, pad: 0 },
  { file: "icon-512.png", size: 512, pad: 0 },
  { file: "favicon-32.png", size: 32, pad: 0 },
];
for (const i of icons) {
  const abs = path.join(ICON_DIR, i.file);
  if (fresh(abs, EMBLEM)) continue;
  const inner = i.size - i.pad * 2;
  const emblem = await sharp(EMBLEM, { density: 384 }).resize(inner, inner).png().toBuffer();
  const base = sharp({ create: { width: i.size, height: i.size, channels: 4, background: i.bg || { r: 0, g: 0, b: 0, alpha: 0 } } });
  await base.composite([{ input: emblem, left: i.pad, top: i.pad }]).png({ compressionLevel: 9 }).toFile(abs);
  written++;
}

console.log(`images: ${Object.keys(manifest).length} screenshots, ${written} file(s) written, ${removed} stale file(s) removed`);
