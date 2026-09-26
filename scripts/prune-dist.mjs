// Runs after `astro build`. Removes what must not ship with the site:
// - the raw concept PNGs (public/images/product/*.png). They stay in public/ so they can be
//   swapped in place; only the generated AVIF and WebP variants are published.
// - the internal primitives page (/kit). It stays available in `astro dev`.
import crypto from "node:crypto";
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

// The CSP in vercel.json allows inline scripts only by hash. Fail the build if an inline
// script in dist/ is not listed there, so a changed script can never ship silently broken.
const vercel = JSON.parse(fs.readFileSync(path.resolve(DIST, "../vercel.json"), "utf8"));
const csp = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === "Content-Security-Policy")?.value ?? "";
const missing = new Set();
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs);
    else if (e.name.endsWith(".html")) {
      for (const m of fs.readFileSync(abs, "utf8").matchAll(/<script>([\s\S]*?)<\/script>/g)) {
        const hash = "sha256-" + crypto.createHash("sha256").update(m[1]).digest("base64");
        if (!csp.includes(`'${hash}'`)) missing.add(hash);
      }
    }
  }
};
walk(DIST);
if (missing.size) {
  console.error(`csp: inline script hash not in vercel.json CSP: ${[...missing].join(", ")}`);
  process.exit(1);
}
console.log("csp: every inline script is allowed by hash");
