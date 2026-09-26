# Mission LLM website

Standalone public product site for Mission LLM (home, download, security, editions, 404). It is not part of the Mission LLM application and shares no code with it. Static Astro output, no UI framework, minimal vanilla JS.

Not deployed. It goes to Vercel later, once the production domain is chosen (set `SITE.origin` in `src/data/site.ts` then).

## Commands

Set `npm_config_cache=D:/DevCache/npm` for every npm command.

| Command | What it does |
| --- | --- |
| `npm run build` | Generates image variants, builds `dist/`, then removes the raw PNGs and `/kit` from `dist/` (`scripts/prune-dist.mjs`) |
| `npm run images` | Regenerates AVIF/WebP variants, phone crops and icons only |
| `npm run check:copy` | Scans `dist/` for em dashes, emojis, certification or affiliation claims, wrong Download links, and lists TODO placeholder links and "Soon" entries |

A local static server already serves `dist/` at http://127.0.0.1:8766/. Verify with the render tool (`scratchpad/tools/render.cjs <url> <out-dir> 390x844,768x1024,1280x800,1440x900,1920x1080,2560x1440 --full`) and read the PNGs.

## Layout

- `src/styles/tokens.css`: every color, type, space, grid, radius, shadow and motion token, plus the tone remaps (`data-tone="light" | "silver" | "dark"`).
- `src/styles/global.css`: reset, type utilities (`.display .h2 .h3 .h4 .lead .body .caption .legal .eyebrow`), grids (`.layout-grid`, `.card-grid`, `.split-grid`), `.data-table` (+ `--stack`), `.dl-grid`, `.note`, `.sr-only`, reveal motion.
- `src/layouts/Base.astro`: head, fonts, icons, skip link, header, footer, reveal script.
- `src/components/ui/`: `Section`, `Container`, `SectionIntro`, `Button`, `ArrowLink`, `Badge`, `Icon`, `Screenshot`, `CodeBlock`. Each file's header comment is its API.
- `src/scripts/tabs.ts` (accessible tabs) and `src/scripts/copy.ts` (copy button).
- `src/data/site.ts`: nav, footer, verified counts, placeholders, page meta. `src/data/images.generated.json` is written by `npm run images`.
- `src/content/copy.md`: the approved copy and its evidence table. Text on the site comes from here.
- `src/components/sections/<page>/`: one component per section. `src/pages/*.astro` compose them.
- `public/images/product/*.png`: placeholder concept renders at 2x (phone details at 3x), with a neutral placeholder account. Keep the filenames. Frame sizes, crops (tour views and phone details) and output widths live in `scripts/image-sources.mjs`. The PNGs never ship; only the AVIF and WebP variants in `generated/` do. Re-render with `scratchpad/site/render-concepts.cjs` (the agent run, Users and workspace model screens are website concepts in `scratchpad/site/concepts/`).
- `public/og/mission-llm.png`: 1200x630 share image, emitted as og:image once `SITE.origin` is set. `public/robots.txt` allows everything; add the sitemap line with the domain.
- `src/pages/kit.astro`: primitives reference at `/kit` (noindex), available in `astro dev` only; the build removes it from `dist/`.

## Rules that are easy to break

- Only capabilities in the Mission LLM code today. Roadmap items only under an "In development" label (`<Badge />`).
- No customers, logos, testimonials, counts, awards or certifications. No DoD or Space Force marks.
- Every product screenshot carries the concept caption (the `Screenshot` default).
- Every Download button points to `/download`. Placeholders (`REGISTRY`, `example.com`, `#`) stay marked TODO. Nav and footer entries whose href is `#` render as "Soon" text, not links (`isPlaceholder` in `src/data/site.ts`).
- No em dashes or emojis. Body text 18px minimum, nothing under 14px.
