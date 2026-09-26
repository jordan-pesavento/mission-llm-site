// Unit tests for the contact function (api/contact.js) and its shared rules (src/lib/contact-rules.js).
// Run: npm test   (node --test). Resend is never called: every test injects a mocked fetch.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import contactModule, {
  BODY_TIMEOUT_MS,
  DEFAULT_FROM,
  MAX_BODY_BYTES,
  RATE_LIMIT,
  RESEND_TIMEOUT_MS,
  RESEND_URL,
  TEXT_MARKERS,
  clientKey,
  createContactHandler,
  createRateLimiter,
  failLocation,
  isAllowedOrigin,
} from "../api/contact.js";
import {
  FIELDS,
  HONEYPOT,
  countLinks,
  emailError,
  isEmail,
  normalizeLine,
  normalizeText,
  validate,
} from "../src/lib/contact-rules.js";

const URL_ = "https://mission-llm.com/api/contact";
const ORIGIN = "https://mission-llm.com";
const NOW = Date.UTC(2026, 8, 26, 14, 5, 30);
const ENV = { RESEND_API_KEY: "re_test_not_a_real_key", CONTACT_TO: "owner@example.test" };
const ch = (...codes) => String.fromCodePoint(...codes);
const LS = ch(0x2028); // Unicode line separator
const RLO = ch(0x202e); // right-to-left override

const validFields = (overrides = {}) => ({
  name: "Ada Lovelace",
  email: "ada@school.edu",
  organization: "Analytical College",
  role: "instructor",
  message: "I teach a data systems course and would like to try Mission LLM with my students.",
  [HONEYPOT]: "",
  ts: NOW - 45_000,
  sent: NOW - 1_000,
  ...overrides,
});

const baseHeaders = (extra = {}) => ({ origin: ORIGIN, "x-forwarded-for": "203.0.113.7", "user-agent": "TestBrowser/1.0", ...extra });

function jsonRequest(body, headers = {}, url = URL_) {
  return new Request(url, {
    method: "POST",
    headers: baseHeaders({ "content-type": "application/json", accept: "application/json", ...headers }),
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function formBody(fields) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) params.append(k, String(v));
  return params.toString();
}

function formRequest(fields, headers = {}) {
  return new Request(URL_, {
    method: "POST",
    headers: baseHeaders({ "content-type": "application/x-www-form-urlencoded", accept: "text/html,*/*;q=0.8", ...headers }),
    body: typeof fields === "string" ? fields : formBody(fields),
  });
}

function okResend() {
  return new Response(JSON.stringify({ id: "4ef9a417-02e9-4d39-ad75-9611e0fcc33c" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

/** Limits high enough that a test sending many requests from one address is not rate limited. */
const roomy = () => ({
  attempts: createRateLimiter({ max: 10_000, windowMs: 60_000 }),
  sends: createRateLimiter({ max: 10_000, windowMs: 60_000 }),
  global: createRateLimiter({ max: 10_000, windowMs: 60_000 }),
});

/** A handler with a mocked Resend and captured logs. `fetch` can be replaced per test. */
function setup(options = {}) {
  const calls = [];
  const logs = [];
  const sleeps = [];
  const fetchImpl =
    options.fetch ||
    (async (url, init) => {
      calls.push({ url, init, payload: JSON.parse(init.body) });
      return okResend();
    });
  const log = {
    log: (...a) => logs.push(a.join(" ")),
    warn: (...a) => logs.push(a.join(" ")),
    error: (...a) => logs.push(a.join(" ")),
  };
  let now = options.now ?? NOW;
  const handler = createContactHandler({
    env: options.env ?? ENV,
    fetch: async (url, init) => {
      if (options.fetch) calls.push({ url, init, payload: JSON.parse(init.body) });
      return fetchImpl(url, init);
    },
    now: () => now,
    log,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
    timeoutMs: options.timeoutMs,
    bodyTimeoutMs: options.bodyTimeoutMs,
    dropDelayMs: options.dropDelayMs,
    limiters: options.limiters === undefined ? roomy() : options.limiters,
  });
  return { handler, calls, logs, sleeps, setNow: (t) => (now = t) };
}

async function jsonOf(res) {
  return JSON.parse(await res.text());
}

function assertCommonHeaders(res) {
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
}

async function expectJsonError(res, status, error) {
  assertCommonHeaders(res);
  assert.equal(res.status, status);
  const body = await jsonOf(res);
  assert.equal(body.ok, false);
  assert.equal(body.error, error);
  return body;
}

/** Milliseconds for the fastest of a few runs of fn (the first run warms up the JIT). */
function fastest(fn, runs = 5) {
  let best = Infinity;
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    fn();
    best = Math.min(best, performance.now() - start);
  }
  return best;
}

// ---------------------------------------------------------------------------------------------

describe("entry point", () => {
  test("default export is the Web-standard { fetch } handler Vercel runs", () => {
    assert.equal(typeof contactModule.fetch, "function");
    assert.equal(RESEND_TIMEOUT_MS, 10_000);
    assert.equal(MAX_BODY_BYTES, 64 * 1024);
    assert.equal(BODY_TIMEOUT_MS, 5_000);
  });

  test("default export reads process.env and globalThis.fetch at request time", async () => {
    const saved = { fetch: globalThis.fetch, key: process.env.RESEND_API_KEY, to: process.env.CONTACT_TO };
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url, payload: JSON.parse(init.body) });
      return okResend();
    };
    process.env.RESEND_API_KEY = ENV.RESEND_API_KEY;
    process.env.CONTACT_TO = ENV.CONTACT_TO;
    const origLog = console.log;
    console.log = () => {};
    try {
      const t = Date.now();
      const res = await contactModule.fetch(jsonRequest(validFields({ ts: t - 30_000, sent: t })));
      assert.equal(res.status, 200);
      assert.deepEqual(await jsonOf(res), { ok: true });
      assert.equal(calls.length, 1);
      assert.equal(calls[0].url, RESEND_URL);
    } finally {
      console.log = origLog;
      globalThis.fetch = saved.fetch;
      if (saved.key === undefined) delete process.env.RESEND_API_KEY;
      else process.env.RESEND_API_KEY = saved.key;
      if (saved.to === undefined) delete process.env.CONTACT_TO;
      else process.env.CONTACT_TO = saved.to;
    }
  });
});

describe("method", () => {
  for (const method of ["GET", "HEAD", "PUT", "DELETE", "OPTIONS", "PATCH"]) {
    test(`${method} is 405 with Allow: POST`, async () => {
      const { handler, calls } = setup();
      const res = await handler(new Request(URL_, { method, headers: baseHeaders() }));
      assert.equal(res.status, 405);
      assert.equal(res.headers.get("allow"), "POST");
      assertCommonHeaders(res);
      if (method !== "HEAD") assert.equal((await jsonOf(res)).error, "method_not_allowed");
      assert.equal(calls.length, 0);
    });
  }
});

describe("content types", () => {
  for (const type of ["text/plain", "multipart/form-data; boundary=x", "application/xml", ""]) {
    test(`"${type || "(none)"}" is 415`, async () => {
      const { handler, calls } = setup();
      const headers = baseHeaders(type ? { "content-type": type } : {});
      // A byte body carries no default Content-Type (a string body would default to text/plain).
      const req = new Request(URL_, { method: "POST", headers, body: new TextEncoder().encode("name=x") });
      assert.equal(req.headers.get("content-type"), type || null);
      await expectJsonError(await handler(req), 415, "unsupported_type");
      assert.equal(calls.length, 0);
    });
  }

  test("application/json with a charset parameter is accepted", async () => {
    const { handler, calls } = setup();
    const res = await handler(jsonRequest(validFields(), { "content-type": "application/json; charset=utf-8" }));
    assert.equal(res.status, 200);
    assert.equal(calls.length, 1);
  });

  test("a form post is accepted and answered with a 303 to /contact/sent", async () => {
    const { handler, calls } = setup();
    const res = await handler(formRequest(validFields()));
    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), "/contact/sent");
    assertCommonHeaders(res);
    assert.equal(calls.length, 1);
  });

  test("a form post with a timestamp that accepts JSON gets JSON", async () => {
    const { handler } = setup();
    const res = await handler(formRequest(validFields(), { accept: "application/json" }));
    assert.equal(res.status, 200);
    assert.deepEqual(await jsonOf(res), { ok: true });
  });

  test("a form post without a timestamp is the no-JavaScript path: always redirects, even when it accepts JSON", async () => {
    const { handler, calls } = setup();
    const ok = await handler(formRequest(validFields({ ts: undefined, sent: undefined }), { accept: "application/json" }));
    assert.equal(ok.status, 303);
    assert.equal(ok.headers.get("location"), "/contact/sent");
    const bad = await handler(formRequest(validFields({ ts: undefined, sent: undefined, email: "x" }), { accept: "application/json" }));
    assert.equal(bad.status, 303);
    assert.equal(bad.headers.get("location"), "/contact?error=invalid&fields=email#error-invalid-email");
    assert.equal(calls.length, 1);
  });

  test("malformed JSON and non-object JSON are 400 bad_request", async () => {
    const { handler, calls } = setup();
    await expectJsonError(await handler(jsonRequest("{not json")), 400, "bad_request");
    await expectJsonError(await handler(jsonRequest("[1,2]")), 400, "bad_request");
    await expectJsonError(await handler(jsonRequest("null")), 400, "bad_request");
    assert.equal(calls.length, 0);
  });
});

describe("size cap", () => {
  test("a declared Content-Length over 64 KB is 413 before reading", async () => {
    const { handler, calls } = setup();
    const res = await handler(jsonRequest(validFields(), { "content-length": String(MAX_BODY_BYTES + 1) }));
    await expectJsonError(res, 413, "too_large");
    assert.equal(calls.length, 0);
  });

  test("a streamed body stops being read once it passes 64 KB", async () => {
    const { handler, calls } = setup();
    let pulled = 0;
    const chunk = new Uint8Array(4096).fill(0x61);
    const body = new ReadableStream({
      pull(controller) {
        pulled += chunk.byteLength;
        if (pulled > 4 * 1024 * 1024) controller.close();
        else controller.enqueue(chunk);
      },
    });
    const req = new Request(URL_, {
      method: "POST",
      headers: baseHeaders({ "content-type": "application/json", accept: "application/json" }),
      body,
      duplex: "half",
    });
    const res = await handler(req);
    await expectJsonError(res, 413, "too_large");
    assert.ok(pulled < 256 * 1024, `read ${pulled} bytes; the cap should stop near 64 KB`);
    assert.equal(calls.length, 0);
  });

  test("a body of exactly 64 KB is read", async () => {
    const { handler } = setup();
    const base = JSON.stringify(validFields());
    const padded = base.slice(0, -1) + `,"pad":"${"x".repeat(MAX_BODY_BYTES - base.length - 9)}"}`;
    assert.equal(Buffer.byteLength(padded), MAX_BODY_BYTES);
    const res = await handler(jsonRequest(padded));
    assert.equal(res.status, 200);
  });

  test("a form post over the cap is redirected with error=too_large", async () => {
    const { handler } = setup();
    const res = await handler(formRequest(validFields({ message: "x".repeat(MAX_BODY_BYTES) })));
    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), "/contact?error=too_large#error-too_large");
  });

  // 5,000 characters of any script fit in both encodings.
  const cjk = "\u5B66\u7FD2\u306E\u305F\u3081\u306B\u6559\u5E2B\uD559\uC2B5"; // 10 CJK and Hangul characters, 3 UTF-8 bytes each
  const bigCjk = cjk.repeat(500);
  const bigEmoji = "Hi " + ch(0x1f393).repeat(4997); // 4 UTF-8 bytes each
  for (const [label, message] of [
    ["5,000 CJK characters", bigCjk],
    ["5,000 characters, mostly 4-byte emoji", bigEmoji],
  ]) {
    test(`${label} are accepted as JSON and as a form post`, async () => {
      const { handler, calls } = setup();
      assert.equal(Array.from(message).length, 5000);
      const asJson = await handler(jsonRequest(validFields({ message })));
      assert.equal(asJson.status, 200, JSON.stringify(await asJson.clone().json()));
      const body = formBody(validFields({ message, email: "b@school.edu" }));
      assert.ok(Buffer.byteLength(body) > 44_000 && Buffer.byteLength(body) <= MAX_BODY_BYTES, `form body is ${Buffer.byteLength(body)} bytes`);
      const asForm = await handler(formRequest(body));
      assert.equal(asForm.status, 303);
      assert.equal(asForm.headers.get("location"), "/contact/sent");
      assert.equal(calls.length, 2);
    });
  }
});

describe("body read deadline", () => {
  const streamRequest = (body, type = "application/json", accept = "application/json") =>
    new Request(URL_, { method: "POST", headers: baseHeaders({ "content-type": type, accept }), body, duplex: "half" });

  test("a body that never ends is 408 timeout once the deadline passes", async () => {
    const { handler, calls, logs } = setup({ bodyTimeoutMs: 60 });
    const never = new ReadableStream({ pull: () => new Promise(() => {}) });
    const started = Date.now();
    await expectJsonError(await handler(streamRequest(never)), 408, "timeout");
    assert.ok(Date.now() - started < 2000);
    assert.ok(logs.includes("contact: body_timeout"));
    assert.equal(calls.length, 0);
  });

  test("a body that trickles in forever is 408 even though it never passes the size cap", async () => {
    const { handler } = setup({ bodyTimeoutMs: 80 });
    let timer;
    const trickle = new ReadableStream({
      pull(controller) {
        return new Promise((resolve) => {
          timer = setTimeout(() => {
            controller.enqueue(new Uint8Array([0x20]));
            resolve();
          }, 10);
        });
      },
      cancel() {
        clearTimeout(timer);
      },
    });
    await expectJsonError(await handler(streamRequest(trickle)), 408, "timeout");
  });

  test("a form post that times out is redirected with error=timeout", async () => {
    const { handler } = setup({ bodyTimeoutMs: 40 });
    const never = new ReadableStream({ pull: () => new Promise(() => {}) });
    const res = await handler(streamRequest(never, "application/x-www-form-urlencoded", "text/html"));
    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), "/contact?error=timeout#error-timeout");
  });
});

describe("CPU cost of hostile input", () => {
  test("a 16 KB run of spaces before one letter is normalized in under 20 ms", () => {
    for (const pad of [" ", "\t", "\u00A0", " \t\u00A0"]) {
      const input = pad.repeat(Math.ceil(16_384 / pad.length)) + "x";
      assert.equal(normalizeText(input), "x");
      const ms = fastest(() => normalizeText(input));
      assert.ok(ms < 20, `normalizeText took ${ms.toFixed(1)} ms for ${JSON.stringify(pad)}`);
    }
    // The same run on many lines, and at the full 64 KB cap.
    const lines = ("x" + " ".repeat(200) + "y\n").repeat(80);
    assert.ok(fastest(() => normalizeText(lines)) < 20);
    const big = " ".repeat(64 * 1024) + "x";
    assert.ok(fastest(() => validate({ message: big })) < 20);
  });

  test("the whole request with a 16 KB space run takes under 20 ms", async () => {
    const { handler } = setup();
    const message = " ".repeat(16_250) + "x";
    await handler(jsonRequest(validFields({ message }))); // warm up
    let best = Infinity;
    for (let i = 0; i < 5; i++) {
      const started = performance.now();
      const res = await handler(jsonRequest(validFields({ message })));
      best = Math.min(best, performance.now() - started);
      assert.equal(res.status, 400);
    }
    assert.ok(best < 20, `request took ${best.toFixed(1)} ms`);
  });

  test("long hostile emails and links are checked quickly", () => {
    const hostile = ["a".repeat(240) + "@" + "b".repeat(12), "a@" + "b-".repeat(120) + "!", "a@" + "b.".repeat(120) + "-"];
    for (const s of hostile) assert.ok(fastest(() => emailError(s)) < 5, s.slice(0, 20));
    const links = "http://" + "a".repeat(60_000);
    assert.ok(fastest(() => countLinks(links)) < 20);
  });
});

describe("origin", () => {
  // [origin, host of the request]
  const allowed = [
    ["https://mission-llm.com", "mission-llm.com"],
    ["https://www.mission-llm.com", "mission-llm.com"],
    ["https://mission-llm.com", "anything.example"], // production origins do not depend on Host
    ["https://mission-llm-site.vercel.app", "mission-llm-site.vercel.app"],
    ["https://mission-llm-site-lordtenderbacons-projects.vercel.app", "mission-llm-site-lordtenderbacons-projects.vercel.app"],
    ["https://mission-llm-site-git-master-lordtenderbacons-projects.vercel.app", "mission-llm-site-git-master-lordtenderbacons-projects.vercel.app"],
    ["https://mission-llm-site-git-jp-site-contact-lordtenderbacons-projects.vercel.app", "mission-llm-site-git-jp-site-contact-lordtenderbacons-projects.vercel.app"],
    ["https://mission-llm-site-gznxe8qyo-lordtenderbacons-projects.vercel.app", "mission-llm-site-gznxe8qyo-lordtenderbacons-projects.vercel.app"],
    ["https://mission-llm-site.vercel.app", "MISSION-LLM-SITE.vercel.app"],
  ];
  const rejected = [
    ["null", "mission-llm.com"],
    ["", "mission-llm.com"],
    ["http://mission-llm.com", "mission-llm.com"],
    ["https://mission-llm.com.evil.example", "mission-llm.com"],
    ["https://evil.example", "evil.example"],
    ["https://mission-llm.com:8443", "mission-llm.com"],
    ["https://sub.mission-llm.com", "sub.mission-llm.com"],
    // Look-alike vercel.app names: not this project's patterns.
    ["https://mission-llm-site-evil-lordtenderbacons-projects.vercel.app", "mission-llm-site-evil-lordtenderbacons-projects.vercel.app"],
    ["https://other-app-lordtenderbacons-projects.vercel.app", "other-app-lordtenderbacons-projects.vercel.app"],
    ["https://mission-llm-site-abc-someone-else.vercel.app", "mission-llm-site-abc-someone-else.vercel.app"],
    ["https://mission-llm-site-git-x-lordtenderbacons-projects.vercel.app.evil.example", "mission-llm-site-git-x-lordtenderbacons-projects.vercel.app.evil.example"],
    ["https://mission-llm-site_abc-lordtenderbacons-projects.vercel.app", "mission-llm-site_abc-lordtenderbacons-projects.vercel.app"],
    ["https://mission-llm-site-git--lordtenderbacons-projects.vercel.app", "mission-llm-site-git--lordtenderbacons-projects.vercel.app"],
    // A project host posting to another host (a cross-site post from a look-alike page): never.
    ["https://mission-llm-site-git-evil-lordtenderbacons-projects.vercel.app", "mission-llm.com"],
    ["https://mission-llm-site-abcdefghi-lordtenderbacons-projects.vercel.app", "mission-llm-site.vercel.app"],
    ["https://mission-llm-site.vercel.app", "mission-llm-site-git-master-lordtenderbacons-projects.vercel.app"],
    ["https://mission-llm-site.vercel.app", ""],
    ["https://mission-llm-site.vercel.app", undefined],
  ];
  for (const [o, h] of allowed) test(`allows ${o} posting to ${h}`, () => assert.equal(isAllowedOrigin(o, h), true));
  for (const [o, h] of rejected) test(`rejects ${JSON.stringify(o)} posting to ${h}`, () => assert.equal(isAllowedOrigin(o, h), false));

  test("a foreign Origin is 403 and nothing is sent", async () => {
    const { handler, calls } = setup();
    await expectJsonError(await handler(jsonRequest(validFields(), { origin: "https://evil.example" })), 403, "forbidden");
    assert.equal(calls.length, 0);
  });

  test("the Host header decides for a vercel.app origin (falls back to the request URL's host)", async () => {
    const { handler, calls } = setup();
    const preview = "https://mission-llm-site-git-jp-site-contact-lordtenderbacons-projects.vercel.app";
    // Same host: allowed.
    assert.equal((await handler(jsonRequest(validFields(), { origin: preview }, `${preview}/api/contact`))).status, 200);
    // The production alias from its own host: allowed.
    const alias = "https://mission-llm-site.vercel.app";
    assert.equal((await handler(jsonRequest(validFields(), { origin: alias, host: "mission-llm-site.vercel.app" }, `${alias}/api/contact`))).status, 200);
    // A preview origin posting to production: refused.
    await expectJsonError(await handler(jsonRequest(validFields(), { origin: preview })), 403, "forbidden");
    // A look-alike host that matches the deployment pattern, posting cross-site: refused.
    const lookalike = "https://mission-llm-site-abcdefghi-lordtenderbacons-projects.vercel.app";
    await expectJsonError(await handler(jsonRequest(validFields(), { origin: lookalike }, `${alias}/api/contact`)), 403, "forbidden");
    assert.equal(calls.length, 2);
  });

  test("without Origin, the Referer decides", async () => {
    const { handler, calls } = setup();
    const noOrigin = (referer) => {
      const h = baseHeaders({ "content-type": "application/json", accept: "application/json" });
      delete h.origin;
      if (referer) h.referer = referer;
      return new Request(URL_, { method: "POST", headers: h, body: JSON.stringify(validFields()) });
    };
    assert.equal((await handler(noOrigin("https://mission-llm.com/contact"))).status, 200);
    await expectJsonError(await handler(noOrigin("https://evil.example/contact")), 403, "forbidden");
    await expectJsonError(await handler(noOrigin("not a url")), 403, "forbidden");
    await expectJsonError(await handler(noOrigin(null)), 403, "forbidden");
    assert.equal(calls.length, 1);
  });

  test("Origin wins over an allowed Referer", async () => {
    const { handler } = setup();
    const res = await handler(jsonRequest(validFields(), { origin: "https://evil.example", referer: "https://mission-llm.com/contact" }));
    await expectJsonError(res, 403, "forbidden");
  });

  test("a form post from a foreign origin is redirected with error=forbidden", async () => {
    const { handler, calls } = setup();
    const res = await handler(formRequest(validFields(), { origin: "https://evil.example" }));
    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), "/contact?error=forbidden#error-forbidden");
    assert.equal(calls.length, 0);
  });
});

describe("validation", () => {
  const ZWSP = ch(0x200b);
  const HANGUL_FILLER = ch(0x3164);
  const cases = [
    ["name", { name: "" }, "required"],
    ["name", { name: "   " }, "required"],
    ["name", { name: ZWSP + ZWSP }, "required"],
    ["name", { name: HANGUL_FILLER }, "required"],
    ["name", { name: ch(0x115f, 0x1160, 0xffa0, 0x200e, 0x200f, 0x061c, 0x00ad, 0x2060, 0xfeff) }, "required"],
    ["name", { name: ch(0xe0041, 0xe0042) }, "required"], // tag characters
    ["name", { name: "!!! ..." }, "required"],
    ["name", { name: "a".repeat(101) }, "too_long"],
    ["email", { email: "" }, "required"],
    ["email", { email: "not-an-email" }, "invalid"],
    ["email", { email: "ada@school" }, "domain"],
    ["email", { email: "ada@school." }, "domain"],
    ["email", { email: "ada@-school.edu" }, "domain"],
    ["email", { email: "ada@school.e" }, "domain"],
    ["email", { email: "ada@@school.edu" }, "invalid"],
    ["email", { email: "ada lovelace@school.edu" }, "invalid"],
    ["email", { email: ".ada@school.edu" }, "invalid"],
    ["email", { email: "ada..l@school.edu" }, "invalid"],
    ["email", { email: "\u0430dmin@school.edu" }, "invalid"], // Cyrillic a, a look-alike
    ["email", { email: "\u00E9l\u00E8ve@school.edu" }, "invalid"],
    ["email", { email: `${"a".repeat(64)}@${"b".repeat(60)}.${"c".repeat(60)}.${"d".repeat(60)}.${"e".repeat(10)}.edu` }, "too_long"],
    ["organization", { organization: "o".repeat(151) }, "too_long"],
    ["role", { role: "" }, "required"],
    ["role", { role: "hacker" }, "invalid"],
    ["message", { message: "" }, "required"],
    ["message", { message: ZWSP.repeat(40) }, "required"],
    ["message", { message: HANGUL_FILLER.repeat(40) }, "required"],
    ["message", { message: "?!".repeat(20) }, "required"],
    ["message", { message: "Too short to help." }, "too_short"],
    ["message", { message: "x".repeat(5001) }, "too_long"],
    ["message", { message: `Links: ${Array.from({ length: 6 }, (_, i) => `https://spam${i}.example/x`).join(" ")}` }, "too_many_links"],
  ];
  for (const [field, override, code] of cases) {
    test(`${field} ${JSON.stringify(override).slice(0, 60)} is ${code}`, async () => {
      const { handler, calls } = setup();
      const body = await expectJsonError(await handler(jsonRequest(validFields(override))), 400, "invalid");
      assert.equal(body.fields[field], code);
      assert.equal(Object.keys(body.fields).length, 1, `only ${field} should fail: ${JSON.stringify(body.fields)}`);
      assert.equal(calls.length, 0);
    });
  }

  test("every missing required field is reported at once", async () => {
    const { handler } = setup();
    const body = await expectJsonError(await handler(jsonRequest({ ts: NOW - 30_000, sent: NOW })), 400, "invalid");
    assert.deepEqual(body.fields, { name: "required", email: "required", role: "required", message: "required" });
  });

  test("limits hold at their edges", async () => {
    const { handler, calls } = setup();
    const res = await handler(
      jsonRequest(
        validFields({
          name: "n".repeat(100),
          organization: "o".repeat(150),
          message: `${"m".repeat(4960)} https://a.example https://b.example www.c.example https://d.example https://e.example`.slice(0, 5000),
        }),
      ),
    );
    assert.equal(res.status, 200, JSON.stringify(await res.clone().json()));
    assert.equal(calls.length, 1);
  });

  test("exactly 5 links and exactly 20 characters are fine", async () => {
    const { handler } = setup();
    const five = Array.from({ length: 5 }, (_, i) => `https://site${i}.example`).join(" ");
    assert.equal((await handler(jsonRequest(validFields({ message: `See ${five} please` })))).status, 200);
    assert.equal((await handler(jsonRequest(validFields({ message: "x".repeat(20), email: "b@school.edu" })))).status, 200);
  });

  test("an emoji counts as one character", async () => {
    const { handler } = setup();
    const cap = ch(0x1f393);
    const short = await expectJsonError(await handler(jsonRequest(validFields({ message: "a" + cap.repeat(18) }))), 400, "invalid");
    assert.equal(short.fields.message, "too_short");
    assert.equal((await handler(jsonRequest(validFields({ message: "a" + cap.repeat(19) })))).status, 200);
  });

  test("a form post with invalid fields is redirected with the fields to fix", async () => {
    const { handler } = setup();
    const one = await handler(formRequest(validFields({ email: "nope" })));
    assert.equal(one.status, 303);
    assert.equal(one.headers.get("location"), "/contact?error=invalid&fields=email#error-invalid-email");
    const two = await handler(formRequest(validFields({ message: "short", name: "" })));
    assert.equal(two.headers.get("location"), "/contact?error=invalid&fields=name,message#error-invalid-name-message");
  });

  test("every combination of fields has a redirect the page can target", () => {
    assert.equal(failLocation("invalid", ["name", "email", "organization", "role", "message"]), "/contact?error=invalid&fields=name,email,organization,role,message#error-invalid-name-email-organization-role-message");
    assert.equal(failLocation("invalid", []), "/contact?error=invalid#error-invalid");
    assert.equal(failLocation("send_failed"), "/contact?error=send_failed#error-send_failed");
  });

  test("non-string JSON values are treated as empty, not crashed on", async () => {
    const { handler } = setup();
    const body = await expectJsonError(
      await handler(jsonRequest(validFields({ name: { $gt: "" }, role: ["instructor"] }))),
      400,
      "invalid",
    );
    assert.deepEqual(body.fields, { name: "required", role: "required" });
  });

  test("fields are normalized: control and invisible characters stripped, spaces collapsed, line breaks unified", async () => {
    const { handler, calls } = setup();
    const res = await handler(
      jsonRequest(
        validFields({
          name: `  Ada\u0000 \t Love${RLO}lace${ch(0x200e, 0x200f, 0x061c, 0x00ad, 0xe0041)}  `,
          organization: `Analytical\u0007  College${LS}`,
          message: "First line\r\nSecond line\u0001\r\rThird line after gaps   \n\n\n\n\nEnd.",
        }),
      ),
    );
    assert.equal(res.status, 200);
    const { payload } = calls[0];
    assert.equal(payload.subject, "Mission LLM contact: Ada Lovelace (Course instructor)");
    assert.match(payload.text, /^Name: Ada Lovelace$/m);
    assert.match(payload.text, /^Organization or school: Analytical College$/m);
    assert.ok(payload.text.includes("> First line\n> Second line\n>\n> Third line after gaps\n>\n> End."), payload.text);
  });

  test("joiners and variation selectors that emoji and scripts need are kept", () => {
    const family = ch(0x1f469, 0x200d, 0x1f467); // woman, ZWJ, girl
    const persian = "\u0645\u06CC\u200C\u062E\u0648\u0627\u0647\u0645"; // with a zero-width non-joiner
    assert.equal(normalizeLine(`${family} ${persian}`), `${family} ${persian}`);
    assert.equal(normalizeLine(`\u2764\uFE0F`), `\u2764\uFE0F`);
    // CJK ideographic variation sequence (U+845B with VS17).
    assert.equal(normalizeLine(ch(0x845b, 0xe0100)), ch(0x845b, 0xe0100));
  });

  test("Mongolian free variation selectors are kept, in names and messages", async () => {
    for (const fvs of [0x180b, 0x180c, 0x180d, 0x180f]) {
      const word = ch(0x182d, fvs, 0x1820); // letter, free variation selector, letter
      assert.equal(normalizeLine(word), word, `U+${fvs.toString(16).toUpperCase()}`);
      assert.equal(normalizeText(`${word} ${word}`), `${word} ${word}`);
    }
    // The Mongolian vowel separator (U+180E, category Cf) is not a variation selector and is still removed.
    assert.equal(normalizeLine(ch(0x182d, 0x180e, 0x1820)), ch(0x182d, 0x1820));
    const { handler, calls } = setup();
    const name = ch(0x182d, 0x180b, 0x1820, 0x182f);
    const res = await handler(jsonRequest(validFields({ name })));
    assert.equal(res.status, 200);
    assert.ok(calls[0].payload.subject.includes(name));
  });

  test("tag characters are removed, so an emoji tag sequence (a subdivision flag) becomes the plain black flag", () => {
    const scotland = ch(0x1f3f4, 0xe0067, 0xe0062, 0xe0073, 0xe0063, 0xe0074, 0xe007f);
    assert.equal(normalizeLine(`Go ${scotland}`), `Go ${ch(0x1f3f4)}`);
  });
});

describe("honeypot and timing", () => {
  test("a filled honeypot answers exactly like a success, after a real send's delay, and sends nothing (JSON)", async () => {
    const { handler, calls, logs, sleeps } = setup({ dropDelayMs: () => 480 });
    const res = await handler(jsonRequest(validFields({ [HONEYPOT]: "https://spam.example" })));
    assert.equal(res.status, 200);
    assertCommonHeaders(res);
    assert.deepEqual(await jsonOf(res), { ok: true });
    assert.equal(calls.length, 0);
    assert.deepEqual(sleeps, [480]);
    assert.ok(logs.some((l) => l.includes("dropped (honeypot)")));
    // Same headers as a real success.
    const { handler: h2 } = setup();
    const real = await h2(jsonRequest(validFields()));
    assert.deepEqual([...res.headers.keys()].sort(), [...real.headers.keys()].sort());
  });

  test("the default drop delay is between 250 and 750 ms", async () => {
    const sleeps = [];
    const handler = createContactHandler({
      env: ENV,
      fetch: async () => okResend(),
      now: () => NOW,
      log: { log() {}, warn() {}, error() {} },
      sleep: async (ms) => sleeps.push(ms),
    });
    for (let i = 0; i < 5; i++) await handler(jsonRequest(validFields({ [HONEYPOT]: "x" }), { "x-forwarded-for": `198.51.100.${i}` }));
    assert.equal(sleeps.length, 5);
    for (const ms of sleeps) assert.ok(ms >= 250 && ms < 750, String(ms));
  });

  test("a filled honeypot answers like a success and sends nothing (form)", async () => {
    const { handler, calls } = setup();
    const res = await handler(formRequest(validFields({ [HONEYPOT]: "spam" })));
    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), "/contact/sent");
    assert.equal(calls.length, 0);
  });

  test("honeypot values that are not text still count as filled", async () => {
    for (const value of [["x"], { a: 1 }, 1, true, [""]]) {
      const { handler, calls } = setup();
      const res = await handler(jsonRequest(validFields({ [HONEYPOT]: value })));
      assert.deepEqual(await jsonOf(res), { ok: true }, JSON.stringify(value));
      assert.equal(calls.length, 0, JSON.stringify(value));
    }
    // A repeated form field: the second value is filled.
    const { handler, calls } = setup();
    const body = `${formBody(validFields())}&${HONEYPOT}=spam`;
    const res = await handler(formRequest(body));
    assert.equal(res.headers.get("location"), "/contact/sent");
    assert.equal(calls.length, 0);
  });

  test("an empty or whitespace honeypot is not a bot", async () => {
    for (const value of ["", "   ", null]) {
      const { handler, calls } = setup();
      await handler(jsonRequest(validFields({ [HONEYPOT]: value })));
      assert.equal(calls.length, 1, JSON.stringify(value));
    }
  });

  test("the old honeypot name is an ordinary unknown field now", async () => {
    const { handler, calls } = setup();
    assert.equal(HONEYPOT, "contact_ref_confirm");
    await handler(jsonRequest(validFields({ website: "https://my-school.example" })));
    assert.equal(calls.length, 1);
  });

  test("the honeypot wins even when other fields are invalid", async () => {
    const { handler, calls } = setup();
    const res = await handler(jsonRequest({ [HONEYPOT]: "x", ts: NOW - 30_000 }));
    assert.deepEqual(await jsonOf(res), { ok: true });
    assert.equal(calls.length, 0);
  });

  test("submitted under 3 seconds after render: a retryable too_fast error, nothing sent", async () => {
    const { handler, calls } = setup();
    const res = await handler(jsonRequest(validFields({ ts: NOW - 2_000, sent: NOW - 800 })));
    const body = await expectJsonError(res, 400, "too_fast");
    assert.equal(body.retryAfterMs, 1_800);
    assert.equal(calls.length, 0);
    // The page's script sends again once the 3 seconds have passed, with the same render time.
    const again = await handler(jsonRequest(validFields({ ts: NOW - 2_000, sent: NOW + 1_100 })));
    assert.equal(again.status, 200);
    assert.equal(calls.length, 1);
  });

  test("too_fast on a plain form post redirects to its notice", async () => {
    const { handler } = setup();
    const res = await handler(formRequest(validFields({ ts: NOW - 500, sent: undefined })));
    assert.equal(res.headers.get("location"), "/contact?error=too_fast#error-too_fast");
  });

  test("more than 24 hours between render and submit: expired, nothing sent", async () => {
    const { handler, calls } = setup();
    await expectJsonError(await handler(jsonRequest(validFields({ ts: NOW - 24 * 3600_000 - 1_000, sent: NOW }))), 400, "expired");
    assert.equal(calls.length, 0);
  });

  test("3 seconds and just under 24 hours are both fine", async () => {
    const { handler, calls } = setup();
    await handler(jsonRequest(validFields({ ts: NOW - 3_000, sent: NOW })));
    await handler(jsonRequest(validFields({ ts: NOW - 24 * 3600_000 + 60_000, sent: NOW, email: "c@school.edu" })));
    assert.equal(calls.length, 2);
  });

  test("the fill time uses the visitor's own clock when `sent` is given (clock ahead or behind by a day)", async () => {
    const { handler, calls } = setup();
    for (const skew of [3600_000, 26 * 3600_000, -26 * 3600_000]) {
      const clock = NOW + skew;
      const res = await handler(jsonRequest(validFields({ ts: clock - 40_000, sent: clock, email: `s${skew < 0 ? "m" : "p"}${Math.abs(skew)}@school.edu` })));
      assert.equal(res.status, 200, String(skew));
    }
    assert.equal(calls.length, 3);
  });

  test("without `sent`, the server clock measures the fill time", async () => {
    const { handler, calls } = setup();
    const fast = await handler(formRequest(validFields({ ts: NOW - 1_000, sent: undefined })));
    assert.equal(fast.headers.get("location"), "/contact?error=too_fast#error-too_fast");
    assert.equal(calls.length, 0);
    await handler(formRequest(validFields({ ts: NOW - 60_000, sent: undefined })));
    assert.equal(calls.length, 1);
  });

  test("a JSON post without a timestamp is refused as bad_request, not answered with a false success", async () => {
    const { handler, calls } = setup();
    await expectJsonError(await handler(jsonRequest(validFields({ ts: undefined, sent: undefined }))), 400, "bad_request");
    assert.equal(calls.length, 0);
  });

  test("a form post without a timestamp (no JavaScript) is sent", async () => {
    const { handler, calls } = setup();
    const res = await handler(formRequest(validFields({ ts: "", sent: undefined })));
    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), "/contact/sent");
    assert.equal(calls.length, 1);
  });
});

describe("rate limit", () => {
  const withDefaults = () => setup({ limiters: {} });
  const msg = (i) => `Message number ${i} with enough characters to send.`;

  test("the limits stay under the Vercel Firewall rule (10 per 10 minutes)", () => {
    assert.ok(RATE_LIMIT.attempts.max < 10 && RATE_LIMIT.sends.max <= RATE_LIMIT.attempts.max);
    assert.equal(RATE_LIMIT.attempts.windowMs, 600_000);
    assert.equal(RATE_LIMIT.sends.windowMs, 600_000);
  });

  test("the 6th valid submission from one address within 10 minutes is 429 with Retry-After", async () => {
    const { handler, calls } = withDefaults();
    for (let i = 0; i < 5; i++) assert.equal((await handler(jsonRequest(validFields({ message: msg(i) })))).status, 200);
    const res = await handler(jsonRequest(validFields()));
    await expectJsonError(res, 429, "rate_limited");
    assert.equal(res.headers.get("retry-after"), "600");
    assert.equal(calls.length, 5);
  });

  test("invalid posts and bots count too: the 9th post of any kind within 10 minutes is 429", async () => {
    const { handler, calls, logs } = withDefaults();
    for (let i = 0; i < 4; i++) await handler(jsonRequest(validFields({ email: "bad" })));
    for (let i = 0; i < 4; i++) await handler(jsonRequest(validFields({ [HONEYPOT]: "x" })));
    const res = await handler(jsonRequest(validFields()));
    await expectJsonError(res, 429, "rate_limited");
    assert.ok(logs.includes("contact: rate_limited (attempts)"));
    assert.equal(calls.length, 0);
  });

  test("the attempt limit applies before the body is read", async () => {
    const { handler } = withDefaults();
    for (let i = 0; i < 8; i++) await handler(jsonRequest("{not json"));
    let pulled = false;
    // highWaterMark 0: pull() runs only when someone reads.
    const body = new ReadableStream(
      {
        pull(controller) {
          pulled = true;
          controller.close();
        },
      },
      { highWaterMark: 0 },
    );
    const req = new Request(URL_, { method: "POST", headers: baseHeaders({ "content-type": "application/json", accept: "application/json" }), body, duplex: "half" });
    await expectJsonError(await handler(req), 429, "rate_limited");
    assert.equal(pulled, false);
  });

  test("other addresses are not affected, x-real-ip is used when x-forwarded-for is missing", async () => {
    const { handler, calls } = withDefaults();
    for (let i = 0; i < 5; i++) await handler(jsonRequest(validFields({ message: msg(i) }), { "x-forwarded-for": "198.51.100.1, 10.0.0.1" }));
    await expectJsonError(await handler(jsonRequest(validFields(), { "x-forwarded-for": "198.51.100.1" })), 429, "rate_limited");
    assert.equal((await handler(jsonRequest(validFields(), { "x-forwarded-for": "198.51.100.2" }))).status, 200);
    const noXff = baseHeaders({ "content-type": "application/json", accept: "application/json", "x-real-ip": "192.0.2.9" });
    delete noXff["x-forwarded-for"];
    assert.equal((await handler(new Request(URL_, { method: "POST", headers: noXff, body: JSON.stringify(validFields()) }))).status, 200);
    assert.equal(calls.length, 7);
  });

  test("IPv6 addresses in one /64 share a bucket; another /64 does not", async () => {
    const { handler, calls } = withDefaults();
    for (let i = 1; i <= 5; i++) {
      const res = await handler(jsonRequest(validFields({ message: msg(i) }), { "x-forwarded-for": `2001:db8:abcd:12::${i.toString(16)}` }));
      assert.equal(res.status, 200);
    }
    const rotated = await handler(jsonRequest(validFields(), { "x-forwarded-for": "2001:0db8:abcd:0012:ffff:1:2:3" }));
    await expectJsonError(rotated, 429, "rate_limited");
    assert.equal((await handler(jsonRequest(validFields(), { "x-forwarded-for": "2001:db8:abcd:13::1" }))).status, 200);
    assert.equal(calls.length, 6);
  });

  test("clientKey: IPv4 as is, IPv4-mapped IPv6 as IPv4, IPv6 as its /64", () => {
    assert.equal(clientKey("203.0.113.7"), "203.0.113.7");
    assert.equal(clientKey("::ffff:203.0.113.7"), "203.0.113.7");
    assert.equal(clientKey("2001:db8:abcd:12::1"), "2001:db8:abcd:12::/64");
    assert.equal(clientKey("2001:0DB8:ABCD:0012:0000:0000:0000:0001"), "2001:db8:abcd:12::/64");
    assert.equal(clientKey("[2001:db8:abcd:12::1]:443"), "2001:db8:abcd:12::/64");
    assert.equal(clientKey("2001:db8::1"), "2001:db8:0:0::/64");
    assert.equal(clientKey("fe80::1%eth0"), "fe80:0:0:0::/64");
    assert.equal(clientKey("::1"), "0:0:0:0::/64");
    assert.equal(clientKey(""), "unknown");
    assert.equal(clientKey("garbage::x::y"), "garbage::x::y");
  });

  test("a small global cap per instance stops a flood from many addresses (503 unavailable)", async () => {
    const { handler, calls, logs } = setup({
      limiters: { ...roomy(), global: createRateLimiter({ name: "hour", max: 3, windowMs: 3600_000 }) },
    });
    for (let i = 0; i < 3; i++) assert.equal((await handler(jsonRequest(validFields(), { "x-forwarded-for": `198.51.100.${i}` }))).status, 200);
    const res = await handler(jsonRequest(validFields(), { "x-forwarded-for": "198.51.100.99" }));
    await expectJsonError(res, 503, "unavailable");
    assert.equal(res.headers.get("retry-after"), "3600");
    assert.ok(logs.includes("contact: global_cap (hour)"), logs.join("\n"));
    assert.equal(calls.length, 3);
  });

  test("the default global cap: 12 sends an hour (the flood brake) and 90 a day (the Resend quota guard)", () => {
    const [hour, day] = RATE_LIMIT.global;
    assert.deepEqual({ ...hour }, { name: "hour", max: 12, windowMs: 3600_000 });
    assert.deepEqual({ ...day }, { name: "day", max: 90, windowMs: 24 * 3600_000 });
    // Under the Resend free plan's 100 emails a day.
    assert.ok(day.max < 100);
  });

  // A client per send, so only the global cap can refuse.
  const burst = async (handler, at, n, tag) => {
    const statuses = [];
    for (let i = 0; i < n; i++) {
      const res = await handler(jsonRequest(validFields({ message: msg(i), ts: at - 30_000, sent: at }), { "x-forwarded-for": `198.${tag}.${i >> 8}.${i & 255}` }));
      statuses.push(res.status);
    }
    return statuses;
  };

  test("a burst closes the form for at most an hour, not a day", async () => {
    const { handler, calls, logs, setNow } = withDefaults();
    assert.deepEqual(await burst(handler, NOW, 12, 1), Array(12).fill(200));
    const refused = await handler(jsonRequest(validFields(), { "x-forwarded-for": "192.0.2.50" }));
    await expectJsonError(refused, 503, "unavailable");
    assert.equal(refused.headers.get("retry-after"), "3600");
    assert.ok(logs.includes("contact: global_cap (hour)"));
    // Still closed just before the hour is over; open again right after it.
    for (const [at, status] of [[NOW + 3600_000 - 1000, 503], [NOW + 3600_000 + 1, 200]]) {
      setNow(at);
      const res = await handler(jsonRequest(validFields({ ts: at - 30_000, sent: at }), { "x-forwarded-for": `192.0.2.${status === 200 ? 52 : 51}` }));
      assert.equal(res.status, status, `at +${at - NOW} ms`);
    }
    assert.equal(calls.length, 13);
  });

  test("the daily cap stops a flood kept up for hours at 90 sends, and frees up 24 hours after its start", async () => {
    const { handler, calls, logs, setNow } = withDefaults();
    // 12 an hour for 7 hours, then 6: 90 sends.
    for (let h = 0; h < 8; h++) {
      const at = NOW + h * 3600_000;
      setNow(at);
      assert.deepEqual(await burst(handler, at, h < 7 ? 12 : 6, 10 + h), Array(h < 7 ? 12 : 6).fill(200), `hour ${h}`);
    }
    assert.equal(calls.length, 90);
    const at8 = NOW + 8 * 3600_000;
    setNow(at8);
    const refused = await handler(jsonRequest(validFields({ ts: at8 - 30_000, sent: at8 }), { "x-forwarded-for": "192.0.2.60" }));
    await expectJsonError(refused, 503, "unavailable");
    assert.equal(refused.headers.get("retry-after"), String(16 * 3600));
    assert.ok(logs.includes("contact: global_cap (day)"));
    const at24 = NOW + 24 * 3600_000 + 1;
    setNow(at24);
    assert.equal((await handler(jsonRequest(validFields({ ts: at24 - 30_000, sent: at24 }), { "x-forwarded-for": "192.0.2.61" }))).status, 200);
    assert.equal(calls.length, 91);
  });

  test("a send refused by the global cap does not use up the visitor's own send limit", async () => {
    const { handler, setNow } = setup({
      limiters: {
        attempts: createRateLimiter({ max: 1000, windowMs: 600_000 }),
        sends: createRateLimiter(RATE_LIMIT.sends),
        // One send a minute, so the cap opens again inside the visitor's own 10 minute window.
        global: createRateLimiter({ name: "minute", max: 1, windowMs: 60_000 }),
      },
    });
    assert.equal((await handler(jsonRequest(validFields(), { "x-forwarded-for": "192.0.2.70" }))).status, 200);
    // The global cap is full: the visitor tries five times and is refused each time.
    for (let i = 0; i < 5; i++) await expectJsonError(await handler(jsonRequest(validFields({ message: msg(i) }))), 503, "unavailable");
    // Within the next 5 minutes all five of the visitor's own sends are still there (one a minute, as
    // the cap allows); only the 6th meets the visitor's own limit.
    for (let k = 1; k <= 6; k++) {
      const at = NOW + k * 60_001;
      setNow(at);
      const res = await handler(jsonRequest(validFields({ message: msg(10 + k), ts: at - 30_000, sent: at })));
      assert.equal(res.status, k <= 5 ? 200 : 429, `send ${k}`);
    }
  });

  test("createRateLimiter: several windows, check() records nothing, a refusal records nothing", () => {
    const limiter = createRateLimiter([
      { name: "short", max: 2, windowMs: 1000 },
      { name: "long", max: 3, windowMs: 10_000 },
    ]);
    assert.equal(limiter.check("k", 0).ok, true);
    assert.equal(limiter.take("k", 0).ok, true);
    assert.equal(limiter.take("k", 100).ok, true);
    assert.deepEqual(limiter.check("k", 200), { ok: false, retryAfter: 1, window: "short" });
    assert.deepEqual(limiter.take("k", 200), { ok: false, retryAfter: 1, window: "short" });
    // The refusals above were not recorded: at 1000 ms the first event has left the short window.
    assert.equal(limiter.take("k", 1000).ok, true);
    // Now the long window is full (3 in 10 s) and the short one too (2 in 1 s): the later one wins.
    assert.deepEqual(limiter.take("k", 1050), { ok: false, retryAfter: 9, window: "long" });
    assert.equal(limiter.take("k", 10_000).ok, true);
  });

  test("the window slides: after 10 minutes the address can send again", async () => {
    const { handler, setNow } = withDefaults();
    for (let i = 0; i < 5; i++) await handler(jsonRequest(validFields({ message: msg(i) })));
    assert.equal((await handler(jsonRequest(validFields()))).status, 429);
    const later = NOW + 10 * 60_000 + 1;
    setNow(later);
    const res = await handler(jsonRequest(validFields({ ts: later - 30_000, sent: later })));
    assert.equal(res.status, 200);
  });

  test("a form post over the limit is redirected with error=rate_limited", async () => {
    const { handler } = withDefaults();
    for (let i = 0; i < 5; i++) await handler(formRequest(validFields({ message: msg(i) })));
    const res = await handler(formRequest(validFields()));
    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), "/contact?error=rate_limited#error-rate_limited");
  });

  test("the limiter keeps its memory bounded", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1000, maxKeys: 3 });
    for (const ip of ["a", "b", "c", "d"]) assert.equal(limiter.take(ip, 0).ok, true);
    // "a" was evicted as the oldest key, so it may send again; "d" may not.
    assert.equal(limiter.take("a", 1).ok, true);
    assert.equal(limiter.take("d", 1).ok, false);
  });
});

describe("configuration", () => {
  for (const [label, env, missing] of [
    ["RESEND_API_KEY", { CONTACT_TO: ENV.CONTACT_TO }, "RESEND_API_KEY"],
    ["CONTACT_TO", { RESEND_API_KEY: ENV.RESEND_API_KEY }, "CONTACT_TO"],
    ["both", {}, "RESEND_API_KEY and CONTACT_TO"],
    ["blank values", { RESEND_API_KEY: "  ", CONTACT_TO: " , " }, "RESEND_API_KEY and CONTACT_TO"],
  ]) {
    test(`missing ${label}: 503 with a generic message and a clear server log`, async () => {
      const { handler, calls, logs } = setup({ env });
      const res = await handler(jsonRequest(validFields()));
      await expectJsonError(res, 503, "unavailable");
      assert.equal(calls.length, 0);
      assert.ok(logs.some((l) => l === `contact: not configured, missing ${missing}`), logs.join("\n"));
      assert.ok(!logs.join("\n").includes(ENV.RESEND_API_KEY));
    });
  }

  test("missing configuration on a form post redirects with error=unavailable", async () => {
    const { handler } = setup({ env: {} });
    const res = await handler(formRequest(validFields()));
    assert.equal(res.headers.get("location"), "/contact?error=unavailable#error-unavailable");
  });

  test("CONTACT_FROM overrides the sender; CONTACT_TO can list several addresses", async () => {
    const { handler, calls } = setup({
      env: { ...ENV, CONTACT_FROM: "Team <team@mission-llm.com>", CONTACT_TO: "a@example.test, b@example.test" },
    });
    await handler(jsonRequest(validFields()));
    assert.equal(calls[0].payload.from, "Team <team@mission-llm.com>");
    assert.deepEqual(calls[0].payload.to, ["a@example.test", "b@example.test"]);
  });
});

describe("sending with Resend", () => {
  test("success: the request, the payload and the log", async () => {
    const { handler, calls, logs } = setup();
    const res = await handler(
      jsonRequest(validFields(), { "x-vercel-ip-country": "us", "user-agent": `Mozilla/5.0 ${"x".repeat(400)}` }),
    );
    assert.equal(res.status, 200);
    assert.deepEqual(await jsonOf(res), { ok: true });
    assertCommonHeaders(res);
    assert.equal(calls.length, 1);

    const { url, init, payload } = calls[0];
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(init.method, "POST");
    assert.equal(init.headers.Authorization, `Bearer ${ENV.RESEND_API_KEY}`);
    assert.equal(init.headers["Content-Type"], "application/json");
    assert.match(init.headers["Idempotency-Key"], /^contact-[0-9a-f]{64}$/);
    assert.ok(init.signal instanceof AbortSignal);

    assert.equal(payload.from, DEFAULT_FROM);
    assert.deepEqual(payload.to, [ENV.CONTACT_TO]);
    assert.equal(payload.reply_to, "ada@school.edu");
    assert.equal(payload.subject, "Mission LLM contact: Ada Lovelace (Course instructor)");
    for (const piece of [
      "Name: Ada Lovelace",
      "Email: ada@school.edu",
      "Organization or school: Analytical College",
      "Role: Course instructor",
      `> ${validFields().message}`,
      "Received: 2026-09-26 14:05 UTC",
      "Country (from IP address): US",
    ])
      assert.ok(payload.text.includes(piece), `text is missing "${piece}"`);
    const ua = payload.text.match(/^User agent \(as sent by the browser\): (.*)$/m)[1];
    assert.equal(ua.length, 200);
    assert.ok(payload.html.includes("Ada Lovelace") && payload.html.includes("Course instructor"));

    assert.ok(logs.includes("contact: sent id=4ef9a417-02e9-4d39-ad75-9611e0fcc33c"));
    const allLogs = logs.join("\n");
    assert.ok(!allLogs.includes("ada@school.edu") && !allLogs.includes("data systems") && !allLogs.includes("203.0.113.7"));
  });

  test("an empty organization and no country are shown as such", async () => {
    const { handler, calls } = setup();
    await handler(jsonRequest(validFields({ organization: "" })));
    assert.ok(calls[0].payload.text.includes("Organization or school: Not given"));
    assert.ok(!calls[0].payload.text.includes("Country"));
  });

  test("the idempotency key is stable for the same submission and differs for another", async () => {
    const { handler, calls } = setup();
    await handler(jsonRequest(validFields()));
    await handler(jsonRequest(validFields({ email: "ADA@school.edu" })));
    await handler(jsonRequest(validFields({ message: "A different message with enough characters." })));
    const keys = calls.map((c) => c.init.headers["Idempotency-Key"]);
    assert.equal(keys[0], keys[1]);
    assert.notEqual(keys[0], keys[2]);
  });

  test("a Resend error is 502 send_failed and logs only the status and error name", async () => {
    const { handler, logs } = setup({
      fetch: async () =>
        new Response(JSON.stringify({ statusCode: 422, name: "validation_error", message: "Invalid `to` for ada@school.edu" }), {
          status: 422,
        }),
    });
    await expectJsonError(await handler(jsonRequest(validFields())), 502, "send_failed");
    assert.ok(logs.includes("contact: resend_error status=422 name=validation_error"), logs.join("\n"));
    assert.ok(!logs.join("\n").includes("ada@school.edu"));
  });

  test("a Resend error on a form post redirects with error=send_failed", async () => {
    const { handler } = setup({ fetch: async () => new Response("oops", { status: 500 }) });
    const res = await handler(formRequest(validFields()));
    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), "/contact?error=send_failed#error-send_failed");
  });

  test("a network failure is 502 send_failed", async () => {
    const { handler, logs } = setup({
      fetch: async () => {
        throw new TypeError("fetch failed");
      },
    });
    await expectJsonError(await handler(jsonRequest(validFields())), 502, "send_failed");
    assert.ok(logs.includes("contact: resend_unreachable TypeError"));
  });

  test("a Resend call that does not answer is aborted: 504 send_failed", async () => {
    let aborted = false;
    const { handler, logs } = setup({
      timeoutMs: 50,
      fetch: (url, init) =>
        new Promise((_, reject) => {
          init.signal.addEventListener("abort", () => {
            aborted = true;
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        }),
    });
    const started = Date.now();
    await expectJsonError(await handler(jsonRequest(validFields())), 504, "send_failed");
    assert.ok(aborted);
    assert.ok(Date.now() - started < 2000);
    assert.ok(logs.includes("contact: resend_timeout"));
  });

  test("a concurrent duplicate (409) is asked again once with the same key", async () => {
    let n = 0;
    const { handler, calls } = setup({
      fetch: async () =>
        ++n === 1
          ? new Response(JSON.stringify({ name: "concurrent_idempotent_requests" }), { status: 409 })
          : okResend(),
    });
    const res = await handler(jsonRequest(validFields()));
    assert.equal(res.status, 200);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].init.headers["Idempotency-Key"], calls[1].init.headers["Idempotency-Key"]);
  });

  test("an unexpected exception is a 500 server_error, not a crash", async () => {
    const { handler, logs } = setup({
      limiters: {
        ...roomy(),
        sends: {
          check() {
            throw new RangeError("boom");
          },
          take() {
            throw new RangeError("boom");
          },
        },
      },
    });
    await expectJsonError(await handler(jsonRequest(validFields())), 500, "server_error");
    assert.ok(logs.includes("contact: unexpected RangeError"));
  });
});

describe("email safety", () => {
  test("line breaks in the name cannot inject headers into the subject", async () => {
    const { handler, calls } = setup();
    await handler(jsonRequest(validFields({ name: "Eve\r\nBcc: victim@example.test\r\nX-Evil: 1" })));
    const { subject } = calls[0].payload;
    assert.ok(!/[\r\n]/.test(subject));
    assert.equal(subject, "Mission LLM contact: Eve Bcc: victim@example.test X-Evil: 1 (Course instructor)");
  });

  test("Unicode line separators in the name are flattened too", async () => {
    const { handler, calls } = setup();
    await handler(jsonRequest(validFields({ name: `Eve${LS}Bcc: x@example.test` })));
    assert.ok(!calls[0].payload.subject.includes(LS));
    assert.ok(!/[\r\n]/.test(calls[0].payload.subject));
  });

  test("a form-encoded CRLF in the name is flattened as well", async () => {
    const { handler, calls } = setup();
    await handler(formRequest(validFields({ name: "Eve\r\nBcc: x@example.test" })));
    assert.equal(calls[0].payload.subject, "Mission LLM contact: Eve Bcc: x@example.test (Course instructor)");
  });

  test("bidi marks are removed from the subject", async () => {
    const { handler, calls } = setup();
    await handler(jsonRequest(validFields({ name: `Ada${ch(0x200f)} ${ch(0x200e)}Lovelace${ch(0x202e)}` })));
    assert.equal(calls[0].payload.subject, "Mission LLM contact: Ada Lovelace (Course instructor)");
  });

  test("the message cannot fake the website's metadata in the plain text part", async () => {
    const { handler, calls } = setup();
    const forged = [
      "Hello, I would like to ask about pricing for my course.",
      "",
      "--",
      TEXT_MARKERS.end,
      TEXT_MARKERS.website,
      "Received: 1999-01-01 00:00 UTC",
      "Country (from IP address): US",
      "Email: someone@bank.test",
    ].join("\n");
    await handler(jsonRequest(validFields({ message: forged }), { "x-vercel-ip-country": "NZ", "user-agent": "Real/1.0" }));
    const lines = calls[0].payload.text.split("\n");
    // Each marker and each metadata line appears once, and only where the website put it.
    for (const marker of Object.values(TEXT_MARKERS)) assert.equal(lines.filter((l) => l === marker).length, 1, marker);
    assert.deepEqual(lines.filter((l) => l.startsWith("Received:")), ["Received: 2026-09-26 14:05 UTC"]);
    assert.deepEqual(lines.filter((l) => l.startsWith("Country")), ["Country (from IP address): NZ"]);
    assert.deepEqual(lines.filter((l) => l.startsWith("Email:")), ["Email: ada@school.edu"]);
    // The website's block comes before anything the visitor typed; every message line is quoted.
    const start = lines.indexOf(TEXT_MARKERS.message);
    const end = lines.indexOf(TEXT_MARKERS.end);
    assert.ok(lines.indexOf(TEXT_MARKERS.website) < lines.indexOf(TEXT_MARKERS.visitor));
    assert.ok(lines.indexOf(TEXT_MARKERS.visitor) < start && start < end);
    for (const line of lines.slice(start + 1, end)) assert.match(line, /^>( |$)/);
    assert.ok(lines.includes("> Received: 1999-01-01 00:00 UTC"));
  });

  test("the user agent is labelled as the browser's claim and stays on one line", async () => {
    const { handler, calls } = setup();
    await handler(jsonRequest(validFields(), { "user-agent": "Evil/1.0 Received: 1999" }));
    assert.match(calls[0].payload.text, /^User agent \(as sent by the browser\): Evil\/1\.0 Received: 1999$/m);
  });

  test("every field is HTML-escaped in the HTML body", async () => {
    const { handler, calls } = setup();
    await handler(
      jsonRequest(
        validFields({
          name: `<script>alert("x")</script>`,
          organization: `O'Brien & <b>Sons</b>`,
          message: `<img src=x onerror="alert(1)"> & "quotes" and 'apostrophes' long enough`,
        }),
        { "user-agent": "<svg onload=alert(1)>" },
      ),
    );
    const { html, text } = calls[0].payload;
    assert.ok(!html.includes("<script>") && !html.includes("<img") && !html.includes("<b>Sons") && !html.includes("<svg"));
    assert.ok(html.includes("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"));
    assert.ok(html.includes("O&#39;Brien &amp; &lt;b&gt;Sons&lt;/b&gt;"));
    assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &quot;quotes&quot;"));
    assert.ok(html.includes("&lt;svg onload=alert(1)&gt;"));
    // The plain text part is not HTML, so it keeps the characters as typed.
    assert.ok(text.includes(`Name: <script>alert("x")</script>`));
  });
});

describe("shared rules", () => {
  test("isEmail and emailError", () => {
    for (const ok of ["a@b.co", "first.last+tag@sub.school.edu", "o'neil@example.org", "x@xn--bcher-kva.example"])
      assert.equal(isEmail(ok), true, ok);
    for (const bad of ["", "a", "a@", "@b.co", "a@b", "a@b.c", "a@-b.co", "a b@c.co", "a@b..co", "a.@b.co", "<a>@b.co", "\u0430@b.co"])
      assert.equal(isEmail(bad), false, bad);
    assert.equal(emailError("ada@school"), "domain");
    assert.equal(emailError("ada"), "invalid");
    assert.equal(emailError("\u0430da@school.edu"), "invalid");
  });

  test("countLinks counts each address once", () => {
    assert.equal(countLinks("see https://www.a.example and http://b.example/x?y=1, www.c.example"), 3);
    assert.equal(countLinks("no links, just a.b and email me at a@b.co"), 0);
  });

  test("normalizeLine and normalizeText", () => {
    assert.equal(normalizeLine(`  a\u0000\u0007 b${RLO}\t\nc  `), "a b c");
    assert.equal(normalizeText("x\r\ny\rz\n\n\n\nw  "), "x\ny\nz\n\nw");
    assert.equal(normalizeText("a \t\u00A0\nb"), "a\nb");
    assert.equal(normalizeText(`a${ch(0x200b)}b${ch(0x3164)}c`), "abc");
    assert.equal(normalizeLine(42), "42");
    assert.equal(normalizeLine(null), "");
  });

  test("validate returns normalized values", () => {
    const { values, errors } = validate({ name: " Ada ", email: " ada@school.edu ", role: "student", message: "m".repeat(25) });
    assert.deepEqual(errors, {});
    assert.equal(values.name, "Ada");
    assert.equal(values.email, "ada@school.edu");
    assert.equal(values.organization, "");
  });

  test("FIELDS are the fields the form posts", () => {
    assert.deepEqual([...FIELDS], ["name", "email", "organization", "role", "message"]);
  });
});
