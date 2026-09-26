# Mission LLM website

Standalone public product site for Mission LLM (home, download, security, editions, 404). It is not part of the Mission LLM application and shares no code with it. Static Astro output, no UI framework, minimal vanilla JS.

Not deployed. It goes to Vercel later, once the production domain is chosen (set `SITE.origin` in `src/data/site.ts` then).

## Commands

Set `npm_config_cache=D:/DevCache/npm` for every npm command.

| Command | What it does |
| --- | --- |
| `npm run build` | Generates image variants, builds `dist/`, then removes the raw PNGs from `dist/` (`scripts/prune-dist.mjs`) |
| `npm run images` | Regenerates the AVIF/WebP product image variants and the touch icons only |
| `npm run check:copy` | Scans `dist/` for em dashes, emojis, certification or affiliation claims, wrong Download links, and lists TODO placeholder links and "Soon" entries |

A local static server serves `dist/` at http://127.0.0.1:8791/. Verify with the render tool (`scratchpad/tools/render.cjs <url> <out-dir> 390x844,768x1024,1280x800,1440x900,1920x1080,2560x1440 --full`) and read the PNGs.

## Site v2 design

The site is a one-to-one layout match of anythingllm.com (reference captures and computed styles in `D:/DevCache/claude-work/site-ref/`, brief in `REPLICATE-BRIEF.md` there), with Mission LLM branding, product and honest content.

- Fonts, self-hosted: Clash Display 400/500/600 (headings; ITF Free Font License, unmodified official woff2 files in `public/fonts/clash-display/` with `FFL.txt`), Plus Jakarta Sans 400/500/600/700 (body) and JetBrains Mono 400 (code), both SIL OFL via `@fontsource`.
- Palette: the reference's Tailwind slate relationships tinted to the Mission navy (hue 265). Page `#F8FAFC`, headings `#0B1430`, buttons, header Download block, dark bands and footer `#070F26`, one accent `#2B63E0`.

## Layout

- `src/styles/tokens.css`: palette, type scale, spacing rhythm, section padding, layout widths, radii, shadows and motion, plus the dark tone remap (`data-tone="dark"`). Its last block holds v1 token aliases used only by the v1 /download, /security and /editions sections until they are restyled.
- `src/styles/global.css`: reset, type utilities (`.h1 .h2 .h2-lg .h2-cta .h3 .h4 .eyebrow .label .lead .body .body-relaxed .small`), `.container`, `.split` (`--hero`, `--feature`, `--band`), `.dot-list`, `.divider-dotted`, `.data-table`, `.dl-grid`, `.note`, reveal motion. `src/styles/fonts.css`: Clash Display faces.
- `src/layouts/Base.astro`: head, fonts, icons, skip link, header, footer, reveal script.
- `src/components/Header.astro` and `Footer.astro`: the reference's header (full-height dark Download block, mobile menu panel) and footer (four columns, fine print, full-width wordmark).
- `src/components/ui/`: `Container`, `Section` (pads: hero, stats, feature, band, band-sm, section, cta), `DarkBand`, `SectionIntro`, `Eyebrow`, `Button` (primary, secondary, quiet), `ArrowLink` (strong, underline), `Screenshot` (radius 16, always shown whole), `FeatureAccordion` (accordion that swaps the screenshot), `Badge`, `CodeBlock` (scrolls from 640, wraps with a hanging indent on phones, copies the exact source), `Icon` (regular, bold or fill). Each file's header comment is its API.
- `src/components/sections/home/`: one component per home section, in the reference order (see `src/pages/index.astro`). `Works` stands in for the reference's partner-logo strip: plain-type names of the local runtimes and deployment targets it works with, never logos. From 1024 the two feature sections and the grounded band are 800px tall (`.section--h800`), as the reference's.
- `src/data/site.ts`: nav, footer, verified counts, placeholders, page meta. `src/content/copy.md`: v1 copy and the evidence table (facts only; v2 headings are rewritten in the reference's voice).
- `public/images/product/*.png`: neutral placeholder frames at 2x the reference sizes (`hero` 867x506, the others 714x416), to be replaced by real captures of the redesigned app under the same names. `scripts/image-sources.mjs` lists them; `npm run images` makes the AVIF and WebP variants. The PNGs never ship.

## Rules that are easy to break

- Only capabilities in the Mission LLM code today. Roadmap items only under an "In development" label (`<Badge />`); unconfirmed Enterprise services under "Planned".
- The evidence in `src/content/copy.md` points at the `JP/local-stack` branch of `D:/OB Vault/mission-llm` (the rename, the upgrade shims `7efcf6b9`, the Helm chart paths). Merge it to `master` before publishing. The `SERVER_HOST` / `COLLECTOR_HOST` loopback option (`c590dee0`) is listed under "In development" on /security until it is on `master`; the home page's loopback item is the Docker port binding, which works with every release.
- No customers, logos, testimonials, counts, awards or certifications. No DoD or Space Force marks.
- Product images show only features the product has (no passage viewer popping up on the right).
- Every Download button points to `/download`. Placeholders (`REGISTRY`, `REPOSITORY_URL`, `#`) stay marked TODO; no `example.com` address is shown. Nav and footer list only destinations that exist (Docs, Documentation, Security policy, Source code, Licenses and notices and Contact us are TODO comments in `src/data/site.ts` until they do); an entry whose href is `#` would render as "Soon" text (`isPlaceholder`).
- No standalone "AI" or "I" in Clash Display headings: its capital I and lowercase l are one glyph, so "AI" reads "Al".
- No em dashes or emojis. Reading text 16px minimum; 14px only for labels that are not sentences (stat labels, dates, footer titles, legal lines).
- No generic AI kit: no glows, glass, gradient text, sparkles or starfields. The emblem is the only gradient.
