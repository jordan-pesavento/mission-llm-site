// Generates responsive AVIF and WebP variants of the product screenshots and their named crops,
// the touch icons from the emblem, and src/data/images.generated.json (read by Screenshot.astro).
// Runs before every `astro dev` and `astro build`. Outputs are skipped when already newer than
// their source and this script's configuration, so repeat runs are fast.
//
// Sizes: every image is described in CSS pixels (its size at 1x) plus pixel variants. Sources are
// 2x or 3x renders, so each crop is emitted at 1x, 2x and (when the source has the pixels) 3x,
// and whole frames at the WIDTHS in image-sources.mjs. Nothing is ever upscaled.
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

/** Pixel widths for an image that is `css` CSS pixels wide and `px` image pixels wide. */
const widthsFor = (css, px, extra = []) =>
  [...new Set([css, css * 2, css * 3, ...extra, px].map(Math.round).filter((w) => w <= px))].sort((a, b) => a - b);

const manifest = {};
for (const [name, cfg] of Object.entries(SOURCES)) {
  const src = path.join(SRC_DIR, `${name}.png`);
  if (!fs.existsSync(src)) throw new Error(`Missing screenshot: ${src}`);
  const meta = await sharp(src).metadata();
  const scale = meta.width / cfg.frame[0];
  if (Math.abs(scale - Math.round(scale)) > 0.01) throw new Error(`${name}: ${meta.width}px is not a whole multiple of the ${cfg.frame[0]}px frame`);
  const cssW = cfg.frame[0];
  const cssH = cfg.frame[1] ?? Math.round(meta.height / scale);
  const entry = { width: cssW, height: cssH, scale: Math.round(scale), variants: [], crops: {} };

  const frameWidths = cfg.full === false ? [] : widthsFor(cssW, meta.width, cssW >= 1000 ? WIDTHS : []);
  for (const w of frameWidths) {
    const files = await emit(src, () => sharp(src), name, w);
    entry.variants.push({ width: w, ...files });
  }

  for (const [crop, box] of Object.entries(cfg.crops || {})) {
    if (box.x + box.w > cssW || box.y + box.h > cssH) throw new Error(`Crop ${name}/${crop} is outside the ${cssW}x${cssH} frame`);
    const extract = {
      left: Math.round(box.x * scale),
      top: Math.round(box.y * scale),
      width: Math.round(box.w * scale),
      height: Math.round(box.h * scale),
    };
    const c = { width: box.w, height: box.h, variants: [] };
    for (const w of widthsFor(box.w, extract.width)) {
      const files = await emit(src, () => sharp(src).extract(extract), `${name}--${crop}`, w);
      c.variants.push({ width: w, ...files });
    }
    entry.crops[crop] = c;
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
