# Mission LLM website

Standalone public product site for Mission LLM (home, download, security, editions, 404). It is not part of the Mission LLM application and shares no code with it. Static Astro output, no UI framework, minimal vanilla JS.

Audience: education first (course instructors running courses, students in those courses, independent students), with companies and organizations second. The home page leads with the classroom story; the security, editions and download pages speak to schools first and stay broad enough for organizations.

## Hosting and deploys

- Live at https://mission-llm.com. `www` 308-redirects to the apex.
- Vercel project `mission-llm-site` (team Kuler Labs). Every push to `master` deploys to production, so stage changes on a branch first; branch pushes get SSO-protected preview deployments.
- DNS is on Cloudflare (zone `mission-llm.com`): `A @ 76.76.21.21` and `CNAME www cname.vercel-dns-0.com`, both DNS only (grey cloud) so Vercel issues and renews the certificates. Do not turn the Cloudflare proxy on.
- Security headers and the CSP live in `vercel.json`. Inline scripts are allowed only by SHA-256 hash; `scripts/prune-dist.mjs` fails the build if an inline script in `dist/` is missing from the CSP, so update the hash in `vercel.json` whenever an inline script changes. Line endings are pinned to LF (`.gitattributes`) so the hash matches on every OS.
- Future installers: publish them as GitHub Release assets on the app repository with SHA-256 checksums (and signatures once code signing is set up), and link to them from the Download page. Never host binaries from a mutable location.

## Commands

Set `npm_config_cache=D:/DevCache/npm` for every npm command.

| Command | What it does |
| --- | --- |
| `npm run build` | Generates image variants, builds `dist/`, then removes the raw PNGs from `dist/` (`scripts/prune-dist.mjs`) |
| `npm run images` | Regenerates the AVIF/WebP product image variants and the touch icons only |
| `npm run check:copy` | Scans `dist/` for em dashes, emojis, certification, compliance or affiliation claims, LMS or invented study features, "every answer" overclaims, "cite", "cites" or "cited" in visible text, wrong Download links, and lists TODO placeholder links and "Soon" entries |
| `node scripts/og/render-og.mjs` | Renders the share card `public/og/mission-llm.png` from `scripts/og/og-card.html` (one-off; local puppeteer-core and Chrome on D:, see the script header) |

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
- `src/data/site.ts`: nav, footer, verified counts, placeholders, page meta. `src/content/copy.md`: the site copy (v1 plus the v2 education pass) and the evidence table, with a path in the Mission LLM repo for every claim.
- `public/images/product/*.png`: real captures of the app at 2880 x 1680 (shown at the reference widths: `hero` 867, the others 714). `scripts/image-sources.mjs` lists them; `npm run images` makes the AVIF and WebP variants and removes variants no longer listed. The PNGs never ship. No placeholder frames: every listed image is shown on a page.
- Recapturing: the images come from the UI test copy of the app (`D:/OB Vault/mission-llm-ui`, 127.0.0.1:3100/3101, its own database), seeded with a fictional course by `D:/AI/MissionLLM/ui-test/seed-course.cjs` (an instructor with the manager role, student accounts, an independent learner, an Intro to Ecology workspace with a syllabus and readings, and real answers from the local model asked by the students) and captured by `D:/AI/MissionLLM/ui-test/capture-course.cjs`, which signs in as the user whose view each image shows. Test-only passwords live in `D:/AI/MissionLLM/secrets/`. The capture hides rows that belong to other fixtures on that shared test copy (the owner's test account, the older engineering sample workspaces); it never adds or edits anything. No real schools, courses or people, and no owner handle, in any capture. `feature-agents` shows the RAG & long-term memory skill opened in the right pane (a view-only click; nothing is toggled or saved); `capture-course.cjs` does not make that click yet, so the September 2026 capture came from the one-off `D:/DevCache/claude-work/site-edu/fix-r2/capture-agents.cjs` (same sign-in, plus the click).

### Illustrations

Every image slot that is not a product screenshot is a hand-authored isometric line illustration in the language of the home steps art. Never a blank placeholder, never drawn product UI in place of a screenshot.

| Files | Slot |
| --- | --- |
| `public/images/steps/install.svg`, `model.svg`, `documents.svg`, `team.svg` | Home steps 1 to 4 (the style source; keep them byte-identical). `model.svg` is reused on /download |
| `public/images/resources/security-overview.svg`, `install-guide.svg`, `editions.svg` | Home Resources cards (light tone), inlined at build by `Resources.astro` |
| `public/images/scenes/lecture-hall.svg` | /editions hero, right column from 1024 (hidden below); also the art on the share card |
| `public/images/scenes/not-found.svg` | 404, above the code |
| `public/images/install/open-app.svg`, `access.svg`, `telemetry-off.svg`, `course-documents.svg` | /download "After you install" steps 1, 3, 4 and 5 (`access.svg` is the `team.svg` Users panel with its words drawn as ink bars and a padlock in the header, since the labels are illegible at 160 to 200px) |
| `public/og/mission-llm.png` | Share card (Open Graph and X), rendered from `scripts/og/og-card.html` |

Style kit:
- `viewBox="0 0 250 250"` (wider only where the slot needs it: resources `0 0 443 215`, lecture hall `0 0 400 300`), `fill="none"`, round caps and joins, stroke widths 0.7 to 1.6. The resources art uses a root stroke of 1.15 (accents 1.4 and 1.6; `install-guide.svg` draws its scene at 1.3x with a 0.88 group stroke): its cards render 304 to 455px wide, so lines land near 0.8px at 1024 and 1.15px at 1440, close to the steps row. A group drawn at a scale divides its stroke (and any dash values) by that scale, so the rendered weights stay the kit's.
- True isometric planes: top `matrix(0.87 0.5 -0.87 0.5 X Y)`, left wall `matrix(0.87 0.5 0 1 X Y)`, right wall `matrix(0.87 -0.5 0 1 X Y)`; standalone UI panels use the gentler skew of `documents.svg` (`matrix(0.94 0.34 0 1 ...)`) or `team.svg` (`matrix(0.94 0.3 0 1 ...)`) with the back panel offset (+4, -2.4).
- Palette only: `#47546F` outlines, `#CCD4E5` inner lines, `#92A0BC` dashed guides (`stroke-dasharray="1.5 3"`), fills `#F8FAFC` / `#FFFFFF` / `#E6ECF8` / `#E3E8F2`, mids `#A3AFC8` / `#A9BAD6`, dark accents `#33405B` / `#111B37` / `#070F26` / `#0B1430`, blue `#5B95FF` / `#9BBEFF` / `#C4D8FF` at most once per scene. The emblem arrow is the only solid dark fill.
- No text (two steps files carry small `<text>` labels; new art must not copy that), no `<style>`, `<image>`, data URIs, gradients or filters. Presentation attributes only. A `<title>` and one comment describing the scene.
- Under about 8 KB per file. Files inlined into a page (the resources art) prefix every id per file (`sec-`, `inst-`, `ed-`) and keep `width="443" height="215"` next to each other on the root `<svg>` (the inliner's regex needs them; the build fails otherwise).
- Show only real things: no passage viewer, no inline citations, no features that are in development.
- Wiring: `<img>` with `width` and `height`, `alt=""` when decorative, `loading="lazy"` below the fold.

## Rules that are easy to break

- Only capabilities in the Mission LLM code today. Roadmap items only under an "In development" label (`<Badge />`); unconfirmed Enterprise services under "Planned".
- The evidence in `src/content/copy.md` points at the `JP/local-stack` branch of `D:/OB Vault/mission-llm` (the rename, the upgrade shims `7efcf6b9`, the Helm chart paths). Merge it to `master` before publishing. The `SERVER_HOST` / `COLLECTOR_HOST` loopback option (`c590dee0`) is listed under "In development" on /security until it is on `master`; loopback binding with the Docker port (`-p 127.0.0.1:3001:3001`, works with every release) is step 8 of /security#hardening and is not on the home page.
- Sources appear only when documents were retrieved: never write "every answer cites" or "sources under each answer". Say "lists its sources", not "cites", where inline citations would be implied (they are in development).
- The manager role is server-wide (admins and managers open every workspace and read all chat history). Never describe an instructor role scoped to one course, and never promise students privacy from admins or managers.
- No compliance claims (FERPA, COPPA, HIPAA, SOC 2, ISO 27001, "compliant"), no LMS integration, no quizzes, flashcards or grading, no named schools, courses or programs. `npm run check:copy` bans these terms, "every answer" and "cite" wording.
- No customers, logos, testimonials, counts, awards or certifications. No DoD or Space Force marks.
- Product images show only features the product has (no passage viewer popping up on the right).
- Every Download button points to `/download`. Placeholders (`REGISTRY`, `REPOSITORY_URL`, `#`) stay marked TODO; no `example.com` address is shown. Nav and footer list only destinations that exist (Docs, Documentation, Security policy, Source code, Licenses and notices and Contact us are TODO comments in `src/data/site.ts` until they do); an entry whose href is `#` would render as "Soon" text (`isPlaceholder`).
- No standalone "AI" or "I" in Clash Display headings: its capital I and lowercase l are one glyph, so "AI" reads "Al".
- No em dashes or emojis. Reading text 16px minimum; 14px only for labels that are not sentences (stat labels, dates, footer titles, legal lines).
- No generic AI kit: no glows, glass, gradient text, sparkles or starfields. The emblem is the only gradient.
