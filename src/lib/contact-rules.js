// Contact form rules: the one source of truth for the /contact page (its script and markup) and the
// Vercel function in api/contact.js, so the browser and the server validate exactly the same way.
// Plain JavaScript with no imports: it runs in the browser (bundled by Astro) and in Node on Vercel.
//
// Every function here is linear in the length of its input (no backtracking regular expressions on
// visitor text), so a hostile body cannot cost the function more than a few milliseconds.

export const LIMITS = Object.freeze({
  name: 100,
  email: 254,
  organization: 150,
  messageMin: 20,
  messageMax: 5000,
  // More links than this in the message is treated as spam.
  maxLinks: 5,
});

/** The "Which best describes you?" choices. `value` is what the form posts; `label` is shown and used in the email. */
export const ROLES = Object.freeze([
  { value: "instructor", label: "Course instructor" },
  { value: "student", label: "Student in a course" },
  { value: "independent", label: "Independent learner" },
  { value: "school-it", label: "School or district IT" },
  { value: "company", label: "Company or organization" },
  { value: "other", label: "Something else" },
]);

/** Field names the form posts, in display order. */
export const FIELDS = Object.freeze(["name", "email", "organization", "role", "message"]);

/** Each field's label, as the page shows it (the page adds "(optional)" to the organization). */
export const FIELD_LABELS = Object.freeze({
  name: "Name",
  email: "Email",
  organization: "Organization or school",
  role: "Which best describes you?",
  message: "Message",
});

/**
 * The honeypot: a field people never see or fill. The name means nothing to autofill tools and
 * password managers (a name like "website" can be autofilled), so only bots that fill every field fill it.
 */
export const HONEYPOT = "contact_ref_confirm";

/** Timing rules for the hidden render timestamp (milliseconds). */
export const TIMING = Object.freeze({ minFillMs: 3000, maxAgeMs: 24 * 60 * 60 * 1000 });

export const roleLabel = (value) => (ROLES.find((r) => r.value === value) || { label: "" }).label;

// Invisible and format characters, removed from every field before any check: every Unicode format
// character (category Cf: bidi marks, embeddings, overrides and isolates, U+061C, zero-width space,
// word joiner, soft hyphen, the byte order mark, tag characters U+E0000-U+E007F) and every other
// default-ignorable code point (the Hangul fillers U+115F, U+1160, U+3164 and U+FFA0, the combining
// grapheme joiner, U+2060-U+206F). Kept: the zero-width non-joiner and joiner (U+200C, U+200D; Persian,
// Indic scripts and emoji sequences need them) and variation selectors (U+FE00-U+FE0F and
// U+E0100-U+E01EF for emoji and CJK forms, and the Mongolian free variation selectors U+180B-U+180D and
// U+180F, which pick a letter's written form). Removing tag characters turns an emoji tag sequence
// (the Scotland, England and Wales flags) into the plain black flag it is built on.
const INVISIBLE = /(?![\u180B-\u180D\u180F\u200C\u200D\uFE00-\uFE0F\u{E0100}-\u{E01EF}])[\p{Cf}\p{Default_Ignorable_Code_Point}]/gu;
// C0 and C1 control characters and DEL.
const CONTROLS = /[\u0000-\u001F\u007F-\u009F]/g;
const CONTROLS_EXCEPT_TAB_LF = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g;
// A name or a message must contain at least one letter or number once invisible characters are gone.
const HAS_WORD = /[\p{L}\p{N}]/u;

const str = (v) => (typeof v === "string" ? v : typeof v === "number" && Number.isFinite(v) ? String(v) : "");

/** One-line fields: NFC, line breaks and tabs become spaces, controls and invisible characters removed, spaces collapsed. */
export function normalizeLine(value) {
  return str(value)
    .normalize("NFC")
    .replace(/[\t\r\n\u2028\u2029]/g, " ")
    .replace(CONTROLS, "")
    .replace(INVISIBLE, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Removes trailing spaces, tabs and no-break spaces from one line. A plain loop: linear on any input. */
function trimLineEnd(line) {
  let end = line.length;
  while (end > 0) {
    const c = line.charCodeAt(end - 1);
    if (c === 0x20 || c === 0x09 || c === 0xa0) end--;
    else break;
  }
  return end === line.length ? line : line.slice(0, end);
}

/** The message: NFC, one kind of line break, controls and invisible characters removed, trailing spaces and extra blank lines trimmed. */
export function normalizeText(value) {
  return str(value)
    .normalize("NFC")
    .replace(/\r\n?|[\u2028\u2029]/g, "\n")
    .replace(CONTROLS_EXCEPT_TAB_LF, "")
    .replace(INVISIBLE, "")
    .split("\n")
    .map(trimLineEnd)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Length in characters as a person counts them (code points, so an emoji is one). */
export const charCount = (s) => Array.from(s).length;

// The part before the @: ASCII letters, digits and the other characters RFC 5322 allows unquoted.
// Non-ASCII is refused: it allows look-alike addresses and many mail services cannot deliver to it.
const EMAIL_LOCAL = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
const DOMAIN_LABEL = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

/**
 * Checks an address. Returns null when it is usable, "too_long", "invalid" (the whole address or the
 * part before the @) or "domain" (the part after the @: it needs a full domain such as school.edu).
 */
export function emailError(s) {
  if (typeof s !== "string" || !s) return "invalid";
  if (s.length > LIMITS.email) return "too_long";
  const at = s.lastIndexOf("@");
  if (at < 1) return "invalid";
  const local = s.slice(0, at);
  if (local.length > 64 || !EMAIL_LOCAL.test(local)) return "invalid";
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return "invalid";
  const domain = s.slice(at + 1);
  if (!domain || domain.length > 253) return "domain";
  const labels = domain.split(".");
  if (labels.length < 2) return "domain";
  for (const label of labels) if (label.length > 63 || !DOMAIN_LABEL.test(label)) return "domain";
  if (!/^[a-z]{2,63}$/i.test(labels[labels.length - 1])) return "domain";
  return null;
}

/** A practical address check: one @, an ASCII local part, and a dotted ASCII domain with a letter TLD. */
export const isEmail = (s) => emailError(s) === null;

/** Links in a text: each http(s):// or www. address counts once. */
export function countLinks(s) {
  const m = str(s).match(/(?:\bhttps?:\/\/|\bwww\.)[^\s<>"'()[\]]+/gi);
  return m ? m.length : 0;
}

const own = (obj, key) => (obj && typeof obj === "object" && Object.hasOwn(obj, key) ? obj[key] : undefined);

/**
 * Normalizes and validates a submission. Returns { values, errors }: `values` holds the normalized
 * fields, `errors` maps a field name to a code: required, too_short, too_long, invalid, domain,
 * too_many_links.
 */
export function validate(input) {
  const values = {
    name: normalizeLine(own(input, "name")),
    email: normalizeLine(own(input, "email")),
    organization: normalizeLine(own(input, "organization")),
    role: normalizeLine(own(input, "role")),
    message: normalizeText(own(input, "message")),
  };
  const errors = {};

  if (!values.name || !HAS_WORD.test(values.name)) errors.name = "required";
  else if (charCount(values.name) > LIMITS.name) errors.name = "too_long";

  if (!values.email) errors.email = "required";
  else {
    const problem = emailError(values.email);
    if (problem) errors.email = problem;
  }

  if (charCount(values.organization) > LIMITS.organization) errors.organization = "too_long";

  if (!values.role) errors.role = "required";
  else if (!ROLES.some((r) => r.value === values.role)) errors.role = "invalid";

  const len = charCount(values.message);
  if (!values.message || !HAS_WORD.test(values.message)) errors.message = "required";
  else if (len < LIMITS.messageMin) errors.message = "too_short";
  else if (len > LIMITS.messageMax) errors.message = "too_long";
  else if (countLinks(values.message) > LIMITS.maxLinks) errors.message = "too_many_links";

  return { values, errors };
}

/** What the page says for each field error code. */
export const FIELD_MESSAGES = Object.freeze({
  name: {
    required: "Enter your name.",
    too_long: `Keep your name to ${LIMITS.name} characters or fewer.`,
  },
  email: {
    required: "Enter your email address so we can reply.",
    too_long: `Keep your email address to ${LIMITS.email} characters or fewer.`,
    invalid: "Enter your email address in the form name@school.edu.",
    domain: "Check the part after the @. It needs a full domain, like school.edu or gmail.com.",
  },
  organization: {
    too_long: `Keep this to ${LIMITS.organization} characters or fewer.`,
  },
  role: {
    required: "Choose one option.",
    invalid: "Choose one of the listed options.",
  },
  message: {
    required: "Enter a message.",
    too_short: `Write at least ${LIMITS.messageMin} characters so we can help.`,
    too_long: `Keep your message to ${LIMITS.messageMax.toLocaleString("en-US")} characters or fewer.`,
    too_many_links: `Include no more than ${LIMITS.maxLinks} links in your message.`,
  },
});

/**
 * Each field's rule in one sentence. Shown after a plain form post (no JavaScript) comes back with
 * ?error=invalid&fields=...: the redirect names the fields, not the exact problem.
 */
export const FIELD_HELP = Object.freeze({
  name: `Enter your name, up to ${LIMITS.name} characters.`,
  email: "Enter your full email address, like name@school.edu.",
  organization: `Keep this to ${LIMITS.organization} characters or fewer.`,
  role: "Choose one option.",
  message: `Write ${LIMITS.messageMin} to ${LIMITS.messageMax.toLocaleString("en-US")} characters, with no more than ${LIMITS.maxLinks} links.`,
});

/** What the page says for each request error code (the function's `error` value and ?error=). */
export const ERROR_MESSAGES = Object.freeze({
  invalid: "Your message was not sent. Some details need a change.",
  too_large: "Your message is too long to send. Shorten it and send again.",
  too_fast: "That was quick. Please check your message and send again.",
  expired: "This page was open for a long time. Reload it, then send your message again.",
  timeout: "Your message took too long to arrive. Check your connection and send again.",
  rate_limited: "Too many messages have come from your network in the last few minutes. Wait about 10 minutes, then send again.",
  unavailable: "The contact form is not available right now. Please try again later.",
  send_failed: "Your message could not be delivered just now. Please try again in a few minutes.",
  forbidden: "We could not confirm that this message came from this site. Reload the page and send again.",
  bad_request: "Your message could not be read. Reload the page and send again.",
  server_error: "Something went wrong on our side. Please try again later.",
  network: "Your message could not be sent. Check your connection and try again.",
});

/** Request errors where the page also offers another way to reach the team (GitHub issues). */
export const OFFER_ALTERNATIVE = Object.freeze(["rate_limited", "unavailable", "send_failed", "server_error", "timeout"]);
