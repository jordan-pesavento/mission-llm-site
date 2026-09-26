// Runs after `astro build`. Removes what must not ship with the site:
// - the raw concept PNGs (public/images/product/*.png). They stay in public/ so they can be
//   swapped in place; only the generated AVIF and WebP variants are published.
// - the internal primitives page (/kit). It stays available in `astro dev`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
if (!fs.existsSync(DIST)) {
  console.error("prune: dist/ not found");
  process.exit(1);
}

let removed = 0;
const productDir = path.join(DIST, "images/product");
if (fs.existsSync(productDir)) {
  for (const f of fs.readdirSync(productDir)) {
    if (f.endsWith(".png")) {
      fs.rmSync(path.join(productDir, f));
      removed++;
    }
  }
}
for (const p of ["kit"]) {
  const abs = path.join(DIST, p);
  if (fs.existsSync(abs)) {
    fs.rmSync(abs, { recursive: true, force: true });
    removed++;
  }
}
console.log(`prune: removed ${removed} path(s) from dist/`);
