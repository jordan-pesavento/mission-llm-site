// Honesty and copy guard for the built site. Run after `npm run build`: npm run check:copy
// Fails (exit 1) on: em dashes or emojis in visible text, certification, compliance or affiliation
// claims, LMS integration or invented study features (quizzes, flashcards, grading), "every answer"
// overclaims, "cite" wording (inline citations are in development), "Sigmatech", Space Force or DoD
// names outside the non-affiliation line, any Download link that does not point to /download, any
// "Contact us" link that does not point to /contact, a contact form that does not post to
// /api/contact or lacks a no-JavaScript notice for an error code the function can return, and a
// /contact/sent page that is not noindex. Lists every TODO placeholder link, and every entry shown as
// "Soon" text until its destination exists, so none ships unnoticed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ERROR_MESSAGES, FIELDS, HONEYPOT } from "../src/lib/contact-rules.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
if (!fs.existsSync(DIST)) {
  console.error("dist/ not found. Run npm run build first.");
  process.exit(2);
}

const NON_AFFILIATION =
  "Mission LLM is not affiliated with or endorsed by the U.S. Department of Defense or the U.S. Space Force.";
const BANNED = [
  [/\bFedRAMP\b/i, "certification claim (FedRAMP)"],
  [/\bCMMC\b/i, "certification claim (CMMC)"],
  [/\bATO\b/, "authorization claim (ATO)"],
  [/\bIL\s?[2-6]\b|\bImpact Level\b/i, "impact level claim"],
  [/\bSigmatech\b/i, "undecided company name (Sigmatech)"],
  [/\btrusted by\b|\bused by\b/i, "social proof claim"],
  [/\btestimonial/i, "testimonial"],
  [/\bcertified\b|\baccredited\b/i, "certification wording"],
  // Education pass: no compliance claims, no LMS integration, no invented study features, and no
  // "every answer" (sources appear only when documents are retrieved). "compliance" itself stays
  // allowed: /security uses it in a non-claim ("Student privacy compliance: None claimed.").
  [/\bFERPA\b|\bCOPPA\b|\bHIPAA\b|\bSOC ?2\b|\bISO ?27001\b/i, "compliance or certification claim"],
  [/\bcompliant\b/i, "compliance claim"],
  [/\bLMS\b|\bCanvas\b|\bBlackboard\b|\bMoodle\b/, "LMS integration claim"],
  [/\bquiz(zes)?\b|\bflashcards?\b|\bgrading\b|\bgradebook\b/i, "invented study feature"],
  [/\bevery answer\b/i, "overclaim: sources appear only when documents are retrieved"],
  // Say "lists its sources", not "cites": inline citations are in development (/security). The
  // In development line itself says "citations", which this does not match.
  [/\bcite[sd]?\b|\bciting\b/i, "cite wording (say lists its sources; inline citations are in development)"],
];

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const pages = walk(DIST).filter((f) => f.endsWith(".html"));

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

const visibleText = (html) =>
  decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(title|meta)[^>]*>/gi, (m) => {
        const c = m.match(/content="([^"]*)"/);
        return c ? ` ${c[1]} ` : " ";
      })
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ");

let errors = 0;
const todos = new Map();
for (const file of pages) {
  const rel = path.relative(DIST, file).replace(/\\/g, "/");
  const html = fs.readFileSync(file, "utf8");
  const text = visibleText(html);
  const fail = (msg) => {
    errors++;
    console.log(`ERROR ${rel}: ${msg}`);
  };

  if (/—/.test(text)) fail("em dash in visible text");
  if (/–/.test(text)) fail("en dash in visible text (use 'to' or a hyphen)");
  const emoji = text.match(/(?![©®™])\p{Extended_Pictographic}/gu);
  if (emoji) fail(`emoji or pictograph: ${[...new Set(emoji)].join(" ")}`);
  for (const [re, why] of BANNED) {
    const m = text.match(re);
    if (m) fail(`${why}: "${text.slice(Math.max(0, m.index - 40), m.index + 40).trim()}"`);
  }
  const stripped = text.split(NON_AFFILIATION).join(" ");
  if (/Space Force|Department of Defense|\bDoD\b|\bUSSF\b/.test(stripped)) fail("Space Force or DoD named outside the non-affiliation line");
  if (!text.includes(NON_AFFILIATION)) fail("non-affiliation line missing");
  if (!text.includes("Mission LLM is built on the open-source AnythingLLM project (MIT License).")) fail("upstream credit missing");

  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = m[1];
    const label = visibleText(m[2]).trim();
    const href = (attrs.match(/href="([^"]*)"/) || [])[1] || "";
    if (/^download$/i.test(label) && href !== "/download") fail(`Download link points to "${href}"`);
    if (/^contact us$/i.test(label) && href !== "/contact") fail(`Contact us link points to "${href}"`);
    if (href === "#" || /example\.com/.test(href)) {
      const key = `${label || "(no text)"} -> ${href}`;
      todos.set(key, (todos.get(key) || new Set()).add(rel));
    }
  }
  if (rel === "contact/index.html") {
    const formTag = (html.match(/<form\b[^>]*>/i) || [""])[0];
    if (!/\bmethod="post"/i.test(formTag) || !/\baction="\/api\/contact"/.test(formTag))
      fail('contact form must be <form method="post" action="/api/contact">');
    // Without JavaScript, every ?error=<code> the function can send needs its own notice (#error-<code>),
    // and every ?fields= combination its jump target (#error-invalid-<fields>).
    for (const code of Object.keys(ERROR_MESSAGES)) {
      if (code !== "network" && !html.includes(`id="error-${code}"`)) fail(`no notice for ?error=${code}`);
    }
    for (let mask = 1; mask < 1 << FIELDS.length; mask++) {
      const id = `error-invalid-${FIELDS.filter((_, i) => mask & (1 << i)).join("-")}`;
      if (!html.includes(`id="${id}"`)) fail(`no jump target #${id}`);
    }
    if (!html.includes(`name="${HONEYPOT}"`) || /\bname="website"/.test(html)) fail(`honeypot must be named ${HONEYPOT}`);
  }
  if (rel === "contact/sent/index.html" && !/<meta name="robots" content="noindex"/.test(html)) fail("/contact/sent must be noindex");

  // Entries whose destination does not exist yet render as "Soon" text (Header, Footer).
  for (const m of html.matchAll(/<span\b[^>]*aria-disabled="true"[^>]*data-todo="([^"]*)"[^>]*>([\s\S]*?)<\/span>/gi)) {
    const label = visibleText(m[2]).replace(/\s*Soon$/, "").trim();
    const key = `${label} -> (not linked yet: ${m[1]})`;
    todos.set(key, (todos.get(key) || new Set()).add(rel));
  }
}

console.log(`\nchecked ${pages.length} page(s)`);
if (todos.size) {
  console.log("\nTODO placeholder links (owner must supply before launch):");
  for (const [k, v] of todos) console.log(`  ${k}  [${[...v].join(", ")}]`);
}
if (errors) {
  console.log(`\n${errors} error(s)`);
  process.exit(1);
}
console.log("\nno honesty or copy errors");
