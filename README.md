# Mission LLM website

Standalone public product site for Mission LLM (home, download, security, editions, contact, 404). It is not part of the Mission LLM application and shares no code with it. Static Astro output, no UI framework, minimal vanilla JS, plus one Vercel Function for the contact form (`api/contact.js`, see [Contact form](#contact-form)).

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
| `npm run check:copy` | Scans `dist/` for em dashes, emojis, certification or affiliation claims, wrong Download and Contact us links, the contact form's action, its no-JavaScript notices and honeypot name, and the confirmation page's noindex, and lists TODO placeholder links and "Soon" entries |
| `npm test` | Runs the contact function's unit tests (`tests/contact.test.mjs`, Node's test runner, Resend mocked) |

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

## Contact form

`/contact` is the site's contact form; `/contact/sent` is the confirmation after a plain form post (noindex, and not in `public/sitemap.xml`). Every "Contact us" link uses `CONTACT_HREF` in `src/data/site.ts`.

| Piece | File |
| --- | --- |
| Page and form markup | `src/pages/contact.astro`, `src/components/sections/contact/ContactSection.astro` |
| Confirmation page | `src/pages/contact/sent.astro`, `src/components/sections/contact/ContactSent.astro` |
| Field rules, limits, roles, labels and every message | `src/lib/contact-rules.js` (one file, used by the page and the function, so both validate the same way) |
| Browser enhancement | `src/scripts/contact-form.ts` (bundled as an external module, so the CSP needs no new hash) |
| Vercel Function | `api/contact.js` (Node.js runtime, `POST /api/contact`) |
| Tests | `tests/contact.test.mjs` (`npm test`) |

### Environment variables

Set these in the Vercel project (Settings > Environment Variables) for Production, and for Preview if previews should send. Never put a key or an address in the repository.

| Variable | Required | Value |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | A Resend API key with sending access |
| `CONTACT_TO` | yes | Where messages go. Several addresses may be separated by commas |
| `CONTACT_FROM` | no | The sender. Default `Mission LLM website <contact@mission-llm.com>`; its domain must be verified in Resend |

Without `RESEND_API_KEY` or `CONTACT_TO` the function answers 503 (`unavailable`: "The contact form is not available right now") and logs `contact: not configured, missing <name>`. Until `mission-llm.com` is verified in Resend, Resend rejects the send and visitors see "could not be delivered" (502 `send_failed`), with the Resend error name in the function log.

### Before launch

Every item here blocks merging the contact form to `master` (each push to `master` deploys to production). They are owner and deploy steps, not code.

- `mission-llm.com` verified in Resend, the variables set, and one real message sent from a preview's `/contact` with JavaScript and one without; both arrive with the right subject and reply-to.
- The Vercel Firewall rule in [Spam and abuse protections](#spam-and-abuse-protections) exists on the `mission-llm-site` project, and an 11th request to `/api/contact` within 10 minutes from one address gets 429. The function's in-memory limits are per instance and best effort; without this rule nothing bounds a flood across instances.
- A Resend usage alert (or a regular look at the Resend dashboard), so a flood that uses up the sending quota is noticed. When the quota is gone, real messages fail with `send_failed` until it resets. The function's daily cap (90 sends per instance) is sized under the free plan's 100 emails a day; raise `RATE_LIMIT.global` in `api/contact.js` with the plan.
- A privacy page. The form says what is sent and why ("We use these details only to reply to you. Your message is delivered by email through our email provider, with your country and browser type to help us reply."); link the privacy page from that line once it exists. The audience includes students, some of whom may be minors.

### How it works

- Without JavaScript the form posts `application/x-www-form-urlencoded` to `/api/contact`. The function answers with a 303 to `/contact/sent`, or to `/contact?error=<code>#error-<code>`; the fragment lets CSS (`:target`) show that code's notice on the static page with no script. For field errors the redirect names the fields: `/contact?error=invalid&fields=email,message#error-invalid-email-message`. The page has one empty jump target per combination of fields (31) before the notices and the fields; sibling selectors then show the notice with one line per named field (that field's rule), a note under each named field and a red edge on it. The name and email inputs carry `pattern` attributes (a letter or number in the name, a full domain in the email), so the browser stops the most common mistakes before posting.
- Without JavaScript the header is not sticky below 1024 (it wraps to 121 to 165px there), and `scroll-padding-top` in `global.css` matches the header that stays on screen (its height plus 16px with JavaScript or from 1024, 16px otherwise), so a notice is never under the header.
- With JavaScript the page validates inline: an error under each field and a summary at the top of the form, rebuilt as fields are fixed. After a failed submit, focus moves to the first field to fix, then one polite announcement lists the fields; the summary is not a live region, so it never interrupts. While errors are shown, the page title starts with "Error: ". It posts JSON with `Accept: application/json`, keeps the button in an `aria-disabled` "Sending..." state (announced once, a quarter second after the click; an answer that comes back sooner cancels it, so "Sending your message." is never read after the result), and shows success ("We will reply to <address>") or the error in place without clearing what was typed. Request errors move focus to the summary. The script removes the message's `maxlength`, so a long paste is counted and flagged instead of cut. After a plain post came back with `?error=`, the script focuses that notice at every width.
- The function is the Web-standard `export default { fetch(request) }`, Vercel's documented form for `/api` functions outside Next.js. The `(req, res)` form was not used: Vercel's Node helpers read the whole request body before such a handler runs, so it could not stop reading at the cap or on a deadline. Astro never reads `/api`, and `vercel.json` only adds headers and `maxDuration` for it.
- Order of checks: POST only (405 with `Allow: POST`), JSON or form content type only (415), origin (403), the per-address attempt limit (429), configuration (503), body over 64 KB (413, read from the stream with a cap) or not fully received within 5 seconds (408 `timeout`), malformed body (400 `bad_request`), honeypot (silent success), timing (400 `too_fast` or `expired`), field validation (400 `invalid` with `fields`), the per-address send limit (429 `rate_limited` with `Retry-After`), the per-instance global cap (503 `unavailable` with `Retry-After`), then the send (502 or 504 `send_failed` on a Resend error or timeout). JSON clients get `{ ok: true }` or `{ ok: false, error, fields?, retryAfterMs? }` with those status codes; plain form posts get the redirects. A form post without `ts` is the no-JavaScript path and always gets redirects, whatever its `Accept`. Every response carries `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- Limits: 64 KB per body, so 5,000 characters of any script fit in both encodings (up to 4 UTF-8 bytes each, tripled by `%XX` in a form post). The character limits are the real bound: name 100, email 254, organization 150, message 20 to 5,000 characters, counted as a person counts them. Every check on visitor text is linear (no backtracking regular expressions): a 64 KB hostile body costs well under a millisecond to normalize.
- Normalization, before any check: NFC, control characters removed, and every invisible or format character removed (Unicode category Cf, such as bidi marks, zero-width spaces, soft hyphens and tag characters, and the other default-ignorable code points, such as the Hangul fillers). Zero-width joiners and non-joiners and the variation selectors stay, because emoji and some scripts need them: U+FE00 to U+FE0F and U+E0100 to U+E01EF (emoji and CJK forms) and the Mongolian free variation selectors U+180B to U+180D and U+180F. Removing tag characters has one visible cost: an emoji tag sequence, such as the Scotland, England or Wales flag, arrives as the plain black flag it is built on. A name or a message with no letter or number left counts as empty. The email must be ASCII before the @ (no look-alike letters) with a full domain after it.
- Sending: `POST https://api.resend.com/emails` with `Authorization: Bearer $RESEND_API_KEY`, `from` `CONTACT_FROM`, `to` `CONTACT_TO`, `reply_to` the visitor's address, subject `Mission LLM contact: <name> (<role>)` (name and role are single-line after normalization, so no header can be injected), a plain text body and an escaped HTML body. The plain text starts with what the website adds (time received in UTC to the minute, `x-vercel-ip-country` when present, and the user agent cut to 200 characters and labelled as sent by the browser), then the visitor's one-line fields, then the message with every line quoted (`> `) between marker lines, so nothing typed can pass for the website's own lines. The `Idempotency-Key` is a SHA-256 of the normalized submission with that metadata, so a double submit within the same minute sends one email; a `409 concurrent_idempotent_requests` is asked again once. Each send has a 10 second timeout (`AbortController`); the function's `maxDuration` is 20 seconds.
- Logs hold only the Resend message id, an error code or status, or a drop reason. Never the message, the name, the email address or the IP.

### Spam and abuse protections

What each control stops:

- Origin is protection against cross-site request forgery, not against spam: a script outside a browser can send any `Origin`. The `Origin` header (or the `Referer` when there is no `Origin`) must be `https://mission-llm.com` or `https://www.mission-llm.com`, or one of this project's own Vercel hosts posting to itself (the `Origin` host equals the request's `Host`, which Vercel sets to the domain the visitor used): `mission-llm-site.vercel.app`, `mission-llm-site-lordtenderbacons-projects.vercel.app`, `mission-llm-site-<9 character deployment hash>-lordtenderbacons-projects.vercel.app` and `mission-llm-site-git-<branch>-lordtenderbacons-projects.vercel.app`. A page on any other host, including a look-alike vercel.app name, cannot pass. A branch URL that Vercel shortens past 63 characters does not match; use the deployment URL.
- The honeypot and the timing check filter naive bots only; a bot that reads the page can pass both. The honeypot is `contact_ref_confirm` (a name autofill tools and password managers do not recognize, plus their ignore attributes), off screen, `aria-hidden`, out of the tab order and with autocomplete off. Any value other than empty text, including an array or a number, counts as filled; the function then answers exactly like a success (same status, body and headers, after 250 to 750 ms, about as long as a real send) and sends nothing. Timing: the script stamps the render time (`ts`) and sends its own clock at submit (`sent`). Under 3 seconds is a retryable `too_fast` error, never a false success: the script waits out the rest and sends again once by itself (a quick person with autofill and a paste is not refused), and a plain form post shows "That was quick. Please check your message and send again." More than 24 hours between the two is `expired`; the script clamps a tab left open over 12 hours, so a person never sees it. A JSON post without `ts` is `bad_request`.
- More than 5 links (`http://`, `https://` or `www.`) in the message is a validation error.
- In-memory limits, per function instance, best effort (a new instance starts empty). A client is an IPv4 address (`x-forwarded-for`, then `x-real-ip`) or an IPv6 /64, so rotating addresses inside one network share one bucket.
  - Attempts: 8 POSTs per client per 10 minutes, valid or not, counted before the body is read, so invalid and bot traffic is not free.
  - Sends: 5 accepted messages per client per 10 minutes.
  - Global, per instance, whoever sends: at most 12 sends in any hour and 90 in any 24 hours. Past either, every visitor on that instance gets 503 `unavailable` ("The contact form is not available right now") with `Retry-After`, and the log says `contact: global_cap (hour)` or `contact: global_cap (day)`; watch for those lines. The hourly window is the flood brake: a burst (12 sends need only 3 addresses at 5 each) closes the form for at most an hour. The daily window only guards the Resend quota: it takes a flood kept up for 7 hours or more to reach it, and then the form stays closed until 24 hours after the flood began. A send refused by the global cap does not count against the visitor's own send limit.
  - The rate-limit message does not blame the visitor ("Too many messages have come from your network in the last few minutes"): a school or district often shares one address. It and the other delivery errors offer GitHub issues as another way to reach the team.
- The real limit is a Vercel Firewall rule (project > Firewall > Configure > New Rule): if Request Path equals `/api/contact`, then Rate Limit, fixed window of 600 seconds, 10 requests, keyed by IP, action Deny with 429. It is above the function's limits on purpose: people reach the function's own limit first and see the page's message (with JavaScript the script shows the same message for the firewall's plain 429), and the firewall only catches floods. Check the plan's rate-limit rule allowance when changing it.
- Not adopted: Vercel BotID would stop scripted clients better, but it needs the `botid` package and a CSP change, a new-dependency decision for the owner. If honeypot false positives ever show up, the no-JavaScript path could send the email with a "[possible spam]" subject instead of dropping it.

### Testing

- `npm test` runs `tests/contact.test.mjs` (Node's test runner, no dependencies). Resend is mocked; the tests cover methods, content types, the size cap (including 5,000 CJK and emoji characters in both encodings), the body read deadline (a body that never ends and one that trickles), CPU cost (a 16 KB run of spaces is normalized in under 20 ms), origins and hosts, every validation rule including invisible characters (with the joiners and variation selectors that stay, Mongolian ones included) and look-alike email addresses, the honeypot (non-text values, repeated fields, the drop delay), timing (`too_fast`, `expired`, clock skew), links, the attempt, send and global limits (a burst closes the form for at most an hour, the daily cap, a global refusal leaves the visitor's own limit untouched) and IPv6 /64 keys, missing configuration, Resend success, errors and timeout, header injection, a message that tries to fake the metadata, and HTML escaping.
- `npm run check:copy` also fails if the form stops posting to `/api/contact`, the page lacks a notice for an error code or a jump target for a field combination, the honeypot is named like a common field again, `/contact/sent` loses its noindex, or a "Contact us" link points anywhere but `/contact`.
- On a preview deployment (after setting the variables for Preview), send a real message from the preview's `/contact` with and without JavaScript, and confirm it arrives with the right subject and reply-to. From a shell, the function needs an allowed `Origin`, for example against production:

```sh
curl -i https://mission-llm.com/api/contact \
  -H "Origin: https://mission-llm.com" -H "Content-Type: application/json" -H "Accept: application/json" \
  --data '{"contact_ref_confirm":"curl check","name":"Test","email":"test@mission-llm.com","role":"other","message":"Test message from curl, please ignore.","ts":1,"sent":60000}'
```

That request fills the honeypot, so it is answered like a success and dropped: a safe way to check the endpoint is up without sending mail. It counts toward the attempt limit. A real send from the shell needs an empty honeypot and a `ts` at least 3 seconds before `sent`.

## Rules that are easy to break

- Only capabilities in the Mission LLM code today. Roadmap items only under an "In development" label (`<Badge />`); unconfirmed Enterprise services under "Planned".
- The evidence in `src/content/copy.md` points at the `JP/local-stack` branch of `D:/OB Vault/mission-llm` (the rename, the upgrade shims `7efcf6b9`, the Helm chart paths). Merge it to `master` before publishing. The `SERVER_HOST` / `COLLECTOR_HOST` loopback option (`c590dee0`) is listed under "In development" on /security until it is on `master`; the home page's loopback item is the Docker port binding, which works with every release.
- No customers, logos, testimonials, counts, awards or certifications. No DoD or Space Force marks.
- Product images show only features the product has (no passage viewer popping up on the right).
- Every Download button points to `/download`. Placeholders (`REGISTRY`, `REPOSITORY_URL`, `#`) stay marked TODO; no `example.com` address is shown. Nav and footer list only destinations that exist (Docs, Documentation, Security policy, Source code, and Licenses and notices are TODO comments in `src/data/site.ts` until they do); an entry whose href is `#` would render as "Soon" text (`isPlaceholder`).
- No standalone "AI" or "I" in Clash Display headings: its capital I and lowercase l are one glyph, so "AI" reads "Al".
- No em dashes or emojis. Reading text 16px minimum; 14px only for labels that are not sentences (stat labels, dates, footer titles, legal lines).
- No generic AI kit: no glows, glass, gradient text, sparkles or starfields. The emblem is the only gradient.
