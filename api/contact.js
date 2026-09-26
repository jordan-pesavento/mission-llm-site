// POST /api/contact: the website contact form. A Vercel Function (Node.js runtime) next to the static
// Astro site. Vercel builds every file in /api as a function (zero config); Astro never reads /api.
//
// Entry point: the Web-standard `export default { fetch(request) }`. Vercel's recommended form for
// /api functions outside Next.js. It is used instead of the `(req, res)` signature because Vercel's
// Node helpers read the whole request body before a `(req, res)` handler runs, so that handler could
// not enforce the body cap or the read deadline. With `fetch`, request.body is the live stream.
//
// Configuration comes from the environment only (never commit a key or an address):
//   RESEND_API_KEY  Resend API key (required)
//   CONTACT_TO      recipient address, or several separated by commas (required)
//   CONTACT_FROM    sender, default "Mission LLM website <contact@mission-llm.com>" (optional)
// Without RESEND_API_KEY or CONTACT_TO it answers 503 and logs which variable is missing.
//
// Logs never contain the message, the sender's name or email, or the IP: only a Resend message id,
// an error code or a drop reason.
import crypto from "node:crypto";
import { FIELDS, HONEYPOT, TIMING, normalizeLine, roleLabel, validate } from "../src/lib/contact-rules.js";

// 5,000 characters of any script fit in both encodings: 4 UTF-8 bytes each, tripled by %XX in a form
// post, is 60,000 bytes plus the other fields. The character limits (contact-rules.js) are the real bound.
export const MAX_BODY_BYTES = 64 * 1024;
// A body that has not fully arrived after this long is refused (408), so a slow or endless upload
// cannot hold the function open until the platform timeout.
export const BODY_TIMEOUT_MS = 5_000;
// Best effort, in memory per function instance. The real limit is the Vercel Firewall rule (README),
// 10 requests per 10 minutes per IP; these stay under it so people see the page's own message first.
//   attempts: every POST that passes the origin check, valid or not, per client
//   sends:    submissions that passed every check and go to Resend, per client
//   global:   sends per instance, whoever sends them (a flood from many addresses), in two windows
//             that must both have room:
//     hour:   the flood brake. A burst fills it and closes the form for at most an hour, not a day.
//     day:    a guard for the Resend sending quota (the free plan allows 100 emails a day). Only a
//             flood kept up for hours reaches it; raise it with the plan.
// A client is an IPv4 address or an IPv6 /64 (one household or network usually holds a whole /64).
export const RATE_LIMIT = Object.freeze({
  attempts: Object.freeze({ max: 8, windowMs: 10 * 60 * 1000 }),
  sends: Object.freeze({ max: 5, windowMs: 10 * 60 * 1000 }),
  global: Object.freeze([
    Object.freeze({ name: "hour", max: 12, windowMs: 60 * 60 * 1000 }),
    Object.freeze({ name: "day", max: 90, windowMs: 24 * 60 * 60 * 1000 }),
  ]),
});
export const RESEND_URL = "https://api.resend.com/emails";
export const RESEND_TIMEOUT_MS = 10_000;
export const DEFAULT_FROM = "Mission LLM website <contact@mission-llm.com>";

const FORM = "application/x-www-form-urlencoded";
const JSON_TYPE = "application/json";

// Origins the form may be posted from:
// - the production domains, always;
// - this project's own vercel.app hosts, only when the post goes to that same host (Origin equals
//   https:// plus the request's Host, which Vercel sets to the domain the visitor used). A page on
//   any other host, including a look-alike vercel.app name, cannot pass: its Origin never matches the
//   Host of the request it sends. The hosts are the project's production alias, and Vercel's
//   generated URLs for this project and team (docs: Deployments > Generated URLs):
//     mission-llm-site.vercel.app
//     mission-llm-site-lordtenderbacons-projects.vercel.app
//     mission-llm-site-<9 character deployment hash>-lordtenderbacons-projects.vercel.app
//     mission-llm-site-git-<branch>-lordtenderbacons-projects.vercel.app
//   A branch URL that Vercel shortens past 63 characters does not match; use the deployment URL.
const PRODUCTION_ORIGINS = new Set(["https://mission-llm.com", "https://www.mission-llm.com"]);
const PROJECT_HOST =
  /^mission-llm-site(?:-lordtenderbacons-projects|-[a-z0-9]{9}-lordtenderbacons-projects|-git-[a-z0-9]+(?:-[a-z0-9]+)*-lordtenderbacons-projects)?\.vercel\.app$/;

const BASE_HEADERS = Object.freeze({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });

function json(status, body, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...BASE_HEADERS, "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

function redirect(location) {
  return new Response(null, { status: 303, headers: { ...BASE_HEADERS, Location: location } });
}

/** True when a post from `origin` to the host `host` (the request's Host header) is allowed. */
export function isAllowedOrigin(origin, host) {
  if (typeof origin !== "string" || origin.length > 120) return false;
  if (PRODUCTION_ORIGINS.has(origin)) return true;
  if (!origin.startsWith("https://")) return false;
  const originHost = origin.slice("https://".length);
  return PROJECT_HOST.test(originHost) && typeof host === "string" && originHost === host.trim().toLowerCase();
}

/** The Origin header, or the origin of the Referer when Origin is absent. */
function requestOrigin(headers) {
  const origin = headers.get("origin");
  if (origin !== null) return origin.trim();
  const referer = headers.get("referer");
  if (!referer) return "";
  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
}

/** The host the visitor asked for: the Host header (Vercel sets it to the public domain), else the URL's host. */
function requestHost(request) {
  const host = request.headers.get("host");
  if (host) return host;
  try {
    return new URL(request.url).host;
  } catch {
    return "";
  }
}

/**
 * The rate-limit key for an address: an IPv4 address as is (also when written as ::ffff:a.b.c.d), an
 * IPv6 address as its /64 prefix, so rotating addresses inside one network share one bucket.
 */
export function clientKey(ip) {
  const s = String(ip || "").trim().toLowerCase().slice(0, 100);
  if (!s) return "unknown";
  const v4 = s.match(/^(?:::ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4) return v4[1];
  if (!s.includes(":")) return s.slice(0, 64);
  const addr = s.replace(/^\[/, "").replace(/\](?::\d+)?$/, "").replace(/%.*$/, "");
  const halves = addr.split("::");
  if (halves.length > 2) return addr.slice(0, 64);
  const words = (h) => (h ? h.split(":") : []);
  const left = words(halves[0]);
  const right = halves.length === 2 ? words(halves[1]) : [];
  const last = (halves.length === 2 ? right : left).at(-1) || "";
  const size = left.length + right.length + (last.includes(".") ? 1 : 0);
  const full = halves.length === 2 ? [...left, ...Array(Math.max(0, 8 - size)).fill("0"), ...right] : left;
  const prefix = full.slice(0, 4);
  if (prefix.length < 4 || !prefix.every((w) => /^[0-9a-f]{1,4}$/.test(w))) return addr.slice(0, 64);
  return `${prefix.map((w) => parseInt(w, 16).toString(16)).join(":")}::/64`;
}

function clientAddress(headers) {
  const forwarded = (headers.get("x-forwarded-for") || "").split(",")[0].trim();
  return forwarded || (headers.get("x-real-ip") || "").trim();
}

/**
 * Sliding windows of events per key, in memory, with a bounded number of keys. `windows` is one
 * { max, windowMs, name? } or a list of them; an event is allowed only when every window has room,
 * and a refused event is not recorded. check() answers without recording; take() records when allowed.
 * A refusal is { ok: false, retryAfter (seconds), window (the name of the full window, if any) }.
 * `maxKeys` (default 10,000) may be given in the options or, for a single window, next to max.
 */
export function createRateLimiter(windows, options = {}) {
  const list = (Array.isArray(windows) ? windows : [windows]).map((w) => ({ name: w.name, max: w.max, windowMs: w.windowMs }));
  const maxKeys = options.maxKeys || (!Array.isArray(windows) && windows.maxKeys) || 10_000;
  const longest = Math.max(...list.map((w) => w.windowMs));
  const hits = new Map();
  const recentFor = (key, now) => (hits.get(key) || []).filter((t) => now - t < longest);
  const verdict = (recent, now) => {
    let refused = null;
    for (const w of list) {
      const inWindow = recent.filter((t) => now - t < w.windowMs);
      if (inWindow.length < w.max) continue;
      // Room returns when enough of the oldest events in this window have expired.
      const retryAfter = Math.max(1, Math.ceil((inWindow[inWindow.length - w.max] + w.windowMs - now) / 1000));
      if (!refused || retryAfter > refused.retryAfter) refused = { ok: false, retryAfter, window: w.name };
    }
    return refused || { ok: true };
  };
  return {
    check(key, now) {
      return verdict(recentFor(key, now), now);
    },
    take(key, now) {
      const recent = recentFor(key, now);
      hits.delete(key);
      const result = verdict(recent, now);
      if (result.ok) recent.push(now);
      if (recent.length) hits.set(key, recent);
      if (hits.size > maxKeys) hits.delete(hits.keys().next().value);
      return result;
    },
  };
}

/**
 * Reads the body as UTF-8 text. Stops as soon as it passes `limit` bytes ({ error: "too_large" }) or
 * when it has not ended within `deadlineMs` ({ error: "timeout" }). Otherwise { text }.
 */
async function readBody(request, limit, deadlineMs) {
  const declared = (request.headers.get("content-length") || "").trim();
  if (/^\d+$/.test(declared) && Number(declared) > limit) return { error: "too_large" };
  if (!request.body) return { text: "" };
  const reader = request.body.getReader();
  let timedOut = false;
  // Cancelling the reader ends a pending read() at once, so the loop below sees the flag.
  const timer = setTimeout(() => {
    timedOut = true;
    reader.cancel().catch(() => {});
  }, deadlineMs);
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      let step;
      try {
        step = await reader.read();
      } catch (error) {
        if (timedOut) return { error: "timeout" };
        throw error;
      }
      if (timedOut) return { error: "timeout" };
      if (step.done) break;
      size += step.value.byteLength;
      if (size > limit) {
        await reader.cancel().catch(() => {});
        return { error: "too_large" };
      }
      chunks.push(step.value);
    }
  } finally {
    clearTimeout(timer);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { text: new TextDecoder("utf-8").decode(bytes) };
}

const pick = (obj, key) => (Object.hasOwn(obj, key) ? obj[key] : undefined);

/** Any honeypot value other than empty text counts as filled: arrays, objects, numbers, true. */
function isFilled(value) {
  if (value === undefined || value === null || value === "" || value === false) return false;
  if (typeof value === "string") return normalizeLine(value) !== "";
  return true;
}

function toMillis(value) {
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return value;
  if (typeof value === "string" && /^\d{1,16}$/.test(value.trim())) return Number(value.trim());
  return null;
}

function parseRecipients(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/** "2026-09-26 14:05 UTC": minute precision, so a repeated submission builds an identical email. */
function formatUtc(ms) {
  const iso = new Date(ms).toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

export const TEXT_MARKERS = Object.freeze({
  website: "===== Added by the website =====",
  visitor: "===== Typed by the visitor =====",
  message: 'Message (every line of it starts with "> "):',
  end: "===== End of the visitor's message =====",
});

/**
 * Builds the Resend payload: subject, plain text and escaped HTML with every field and the metadata.
 * Plain text: what the website adds (time, country, user agent) comes first, then the visitor's
 * one-line fields, then the message with every line quoted ("> "), so nothing a visitor types can
 * pass for the website's own lines. The user agent is labelled as the browser's claim.
 */
export function buildEmail(values, meta, { from, to }) {
  const role = roleLabel(values.role);
  // Name and role are single-line after normalization; strip line breaks again so no header can be injected.
  const subject = `Mission LLM contact: ${values.name} (${role})`.replace(/[\r\n\u2028\u2029]+/g, " ").slice(0, 250);
  const fields = [
    ["Name", values.name],
    ["Email", values.email],
    ["Organization or school", values.organization || "Not given"],
    ["Role", role],
  ];
  const details = [["Received", formatUtc(meta.receivedAt)]];
  if (meta.country) details.push(["Country (from IP address)", meta.country]);
  details.push(["User agent (as sent by the browser)", meta.userAgent || "Not given"]);
  const oneLine = (v) => String(v).replace(/[\r\n\u2028\u2029]+/g, " ");
  const quoted = values.message.split("\n").map((line) => (line ? `> ${line}` : ">"));

  const text = [
    "New message from the Mission LLM website contact form.",
    "",
    TEXT_MARKERS.website,
    ...details.map(([k, v]) => `${k}: ${oneLine(v)}`),
    "",
    TEXT_MARKERS.visitor,
    ...fields.map(([k, v]) => `${k}: ${oneLine(v)}`),
    "",
    TEXT_MARKERS.message,
    ...quoted,
    TEXT_MARKERS.end,
    "",
    "Reply to this email to answer the sender directly.",
  ].join("\n");

  const row = ([k, v]) =>
    `<tr><th align="left" valign="top" style="padding:4px 16px 4px 0;font-weight:600;white-space:nowrap">${escapeHtml(k)}</th><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`;
  const html = [
    '<!doctype html><html><body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#0b1430">',
    '<p style="margin:0 0 16px">New message from the Mission LLM website contact form.</p>',
    `<table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse">${fields.map(row).join("")}</table>`,
    '<p style="margin:20px 0 6px;font-weight:600">Message</p>',
    `<div style="white-space:pre-wrap;border-left:3px solid #ccd4e5;padding:4px 0 4px 12px">${escapeHtml(values.message)}</div>`,
    '<p style="margin:24px 0 4px;font-size:13px;font-weight:600;color:#47546f">Added by the website</p>',
    `<table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:13px;color:#47546f">${details.map(row).join("")}</table>`,
    '<p style="margin:16px 0 0;font-size:13px;color:#47546f">Reply to this email to answer the sender directly.</p>',
    "</body></html>",
  ].join("");

  return { from, to, reply_to: values.email, subject, text, html };
}

/** Same submission, same minute, same sender details: same key, so Resend sends it once. */
export function idempotencyKey(values, meta) {
  const minute = Math.floor(meta.receivedAt / 60_000);
  const material = JSON.stringify([
    values.name,
    values.email.toLowerCase(),
    values.organization,
    values.role,
    values.message,
    minute,
    meta.country,
    meta.userAgent,
  ]);
  return `contact-${crypto.createHash("sha256").update(material).digest("hex")}`;
}

const safeToken = (s, max) => (typeof s === "string" ? s.replace(/[^A-Za-z0-9_-]/g, "").slice(0, max) : "");

async function deliver({ fetchImpl, apiKey, key, payload, log, sleep, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let attempt = 1; ; attempt++) {
      const res = await fetchImpl(RESEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        log.log(`contact: sent id=${safeToken(data && data.id, 100) || "unknown"}`);
        return { ok: true };
      }
      const name = safeToken(data && data.name, 60);
      // The same submission is already being sent (a double submit): wait once, then ask again;
      // Resend answers with the first request's result.
      if (res.status === 409 && name === "concurrent_idempotent_requests" && attempt === 1) {
        await sleep(1000);
        continue;
      }
      log.error(`contact: resend_error status=${res.status}${name ? ` name=${name}` : ""}`);
      return { ok: false, status: 502 };
    }
  } catch (error) {
    if (controller.signal.aborted) {
      log.error("contact: resend_timeout");
      return { ok: false, status: 504 };
    }
    log.error(`contact: resend_unreachable ${safeToken(error && error.name, 40) || "Error"}`);
    return { ok: false, status: 502 };
  } finally {
    clearTimeout(timer);
  }
}

/** Where a plain form post goes after a failure. `fields` (for "invalid") names the fields to fix. */
export function failLocation(error, fields) {
  if (error === "invalid" && fields && fields.length) {
    return `/contact?error=invalid&fields=${fields.join(",")}#error-invalid-${fields.join("-")}`;
  }
  return `/contact?error=${error}#error-${error}`;
}

/**
 * Creates the request handler. Every dependency can be replaced (tests):
 * env (default process.env), fetch (default globalThis.fetch), now, log (default console),
 * limiters ({ attempts, sends, global }, each with take(key, now), and sends also with check(key,
 * now); see createRateLimiter), sleep, timeoutMs (Resend,
 * default RESEND_TIMEOUT_MS), bodyTimeoutMs (default BODY_TIMEOUT_MS), dropDelayMs (the pause
 * before answering a honeypot hit, default 250 to 750 ms so it takes as long as a real send).
 */
export function createContactHandler(options = {}) {
  const getEnv = () => options.env || process.env;
  const fetchImpl = (...args) => (options.fetch || globalThis.fetch)(...args);
  const now = options.now || Date.now;
  const log = options.log || console;
  const limiters = {
    attempts: createRateLimiter(RATE_LIMIT.attempts),
    sends: createRateLimiter(RATE_LIMIT.sends),
    global: createRateLimiter(RATE_LIMIT.global),
    ...options.limiters,
  };
  const sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const timeoutMs = options.timeoutMs || RESEND_TIMEOUT_MS;
  const bodyTimeoutMs = options.bodyTimeoutMs || BODY_TIMEOUT_MS;
  const dropDelayMs = options.dropDelayMs || (() => 250 + Math.floor(Math.random() * 500));

  async function handle(request, reply) {
    const t = now();

    // Only JSON and classic form posts. The type is known from here on, so every later failure
    // answers in kind: JSON for the page's script, a 303 back to the page for a plain form post.
    const type = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (type !== FORM && type !== JSON_TYPE) return json(415, { ok: false, error: "unsupported_type" });
    reply.json = type === JSON_TYPE || /\bapplication\/json\b/i.test(request.headers.get("accept") || "");

    // Cross-site request forgery protection: only this site's own pages may post here.
    if (!isAllowedOrigin(requestOrigin(request.headers), requestHost(request))) {
      log.warn("contact: rejected origin");
      return reply.fail(403, "forbidden");
    }

    // Every post from here on counts, valid or not, before the body is even read.
    const client = clientKey(clientAddress(request.headers));
    const attempt = limiters.attempts.take(client, t);
    if (!attempt.ok) {
      log.warn("contact: rate_limited (attempts)");
      return reply.fail(429, "rate_limited", undefined, { "Retry-After": String(attempt.retryAfter) });
    }

    const env = getEnv();
    const apiKey = String(env.RESEND_API_KEY || "").trim();
    const to = parseRecipients(env.CONTACT_TO);
    if (!apiKey || !to.length) {
      const missing = [!apiKey && "RESEND_API_KEY", !to.length && "CONTACT_TO"].filter(Boolean).join(" and ");
      log.error(`contact: not configured, missing ${missing}`);
      return reply.fail(503, "unavailable");
    }

    const body = await readBody(request, MAX_BODY_BYTES, bodyTimeoutMs);
    if (body.error === "too_large") return reply.fail(413, "too_large");
    if (body.error === "timeout") {
      log.warn("contact: body_timeout");
      return reply.fail(408, "timeout");
    }

    let raw;
    let honeypot;
    if (type === JSON_TYPE) {
      try {
        raw = JSON.parse(body.text);
      } catch {
        return reply.fail(400, "bad_request");
      }
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return reply.fail(400, "bad_request");
      honeypot = isFilled(pick(raw, HONEYPOT));
    } else {
      const params = new URLSearchParams(body.text);
      raw = Object.create(null);
      for (const [k, v] of params) if (!Object.hasOwn(raw, k)) raw[k] = v;
      honeypot = params.getAll(HONEYPOT).some(isFilled);
    }

    // A filled honeypot is a strong bot signal: answer exactly like a success (same status, body and
    // headers, after about as long as a real send takes) and send nothing.
    if (honeypot) {
      log.log("contact: dropped (honeypot)");
      await sleep(dropDelayMs());
      return reply.ok();
    }

    // `ts` is the render time the page's script stamps; `sent` is the same clock at submit, so the
    // fill time does not depend on the visitor's clock matching ours. Both come from the client, so
    // this only filters naive bots. Without JavaScript the static page cannot stamp a time, so a
    // plain form post may omit `ts`: that is the no-JavaScript path, always answered with redirects.
    const ts = toMillis(pick(raw, "ts"));
    const sent = toMillis(pick(raw, "sent"));
    if (ts === null) {
      if (type === JSON_TYPE) return reply.fail(400, "bad_request");
      reply.json = false;
    } else {
      const measured = sent !== null && sent >= ts;
      const fill = measured ? sent - ts : t - ts;
      if (fill < TIMING.minFillMs) {
        log.log("contact: too_fast");
        return reply.fail(400, "too_fast", { retryAfterMs: Math.min(TIMING.minFillMs, TIMING.minFillMs - Math.max(0, fill)) });
      }
      if (fill > TIMING.maxAgeMs) {
        log.log("contact: expired");
        return reply.fail(400, "expired");
      }
    }

    const { values, errors } = validate(raw);
    const invalid = FIELDS.filter((f) => errors[f]);
    if (invalid.length) return reply.fail(400, "invalid", { fields: errors }, undefined, invalid);

    // The client's send limit is checked, the global cap taken, and only then the client's send
    // recorded, so a submission refused by either limit uses up neither.
    const limit = limiters.sends.check(client, t);
    if (!limit.ok) {
      log.warn("contact: rate_limited (sends)");
      return reply.fail(429, "rate_limited", undefined, { "Retry-After": String(limit.retryAfter) });
    }
    const global = limiters.global.take("all", t);
    if (!global.ok) {
      log.error(`contact: global_cap (${safeToken(global.window, 20) || "all"})`);
      return reply.fail(503, "unavailable", undefined, { "Retry-After": String(global.retryAfter) });
    }
    limiters.sends.take(client, t);

    const country = (request.headers.get("x-vercel-ip-country") || "").trim().toUpperCase();
    const meta = {
      receivedAt: t,
      country: /^[A-Z]{2}$/.test(country) ? country : "",
      userAgent: normalizeLine(request.headers.get("user-agent")).slice(0, 200),
    };
    const from = normalizeLine(env.CONTACT_FROM) || DEFAULT_FROM;
    const payload = buildEmail(values, meta, { from, to });
    const result = await deliver({ fetchImpl, apiKey, key: idempotencyKey(values, meta), payload, log, sleep, timeoutMs });
    return result.ok ? reply.ok() : reply.fail(result.status, "send_failed");
  }

  return async function handleContact(request) {
    if (request.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" }, { Allow: "POST" });
    const reply = {
      json: true,
      ok() {
        return this.json ? json(200, { ok: true }) : redirect("/contact/sent");
      },
      fail(status, error, extra, headers, fields) {
        // The fragment lets the page show the message without JavaScript (CSS :target).
        return this.json ? json(status, { ok: false, error, ...extra }, headers) : redirect(failLocation(error, fields));
      },
    };
    try {
      return await handle(request, reply);
    } catch (error) {
      log.error(`contact: unexpected ${safeToken(error && error.name, 40) || "Error"}`);
      return reply.fail(500, "server_error");
    }
  };
}

const handleContact = createContactHandler();

export default {
  fetch(request) {
    return handleContact(request);
  },
};
