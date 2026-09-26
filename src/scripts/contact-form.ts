// Contact form enhancement (ContactSection.astro). Without this script the form still posts to
// /api/contact and the function redirects; with it, the form validates inline with the same rules
// as the function (src/lib/contact-rules.js), posts JSON with fetch, and shows success or errors in
// place without losing what was typed.
//
// Screen readers: after a failed submit, focus moves to the first field to fix (its error is read with
// it), then one polite announcement lists every field to fix. The summary above the fields is not a
// live region, so keeping it in sync as fields are fixed never interrupts. Request errors move focus to
// the summary. While errors are shown, the page title starts with "Error: ".
import {
  ERROR_MESSAGES,
  FIELDS,
  FIELD_HELP,
  FIELD_LABELS,
  FIELD_MESSAGES,
  HONEYPOT,
  LIMITS,
  OFFER_ALTERNATIVE,
  TIMING,
  charCount,
  normalizeLine,
  normalizeText,
  validate,
} from "../lib/contact-rules.js";

type FieldName = (typeof FIELDS)[number];
type Errors = Partial<Record<FieldName, string>>;
type Result = { ok: true } | { fields: Errors } | { error: string };

const MAX_BODY_BYTES = 64 * 1024; // api/contact.js MAX_BODY_BYTES
const REQUEST_TIMEOUT_MS = 20_000;
// A tab left open longer than this still belongs to a person: the render time sent is clamped so the
// function's staleness rule (meant for replayed forms) never refuses a real message.
const MAX_TS_AGE_MS = 12 * 60 * 60 * 1000;

const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
if (form) enhance(form);

function enhance(form: HTMLFormElement) {
  const q = <T extends Element>(sel: string) => form.querySelector<T>(sel);
  const control = (name: FieldName) => form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  const errorEl = (name: FieldName) => document.getElementById(`contact-${name}-error`) as HTMLElement;

  const ts = q<HTMLInputElement>("[data-contact-ts]")!;
  const honeypot = form.elements.namedItem(HONEYPOT) as HTMLInputElement;
  const summary = q<HTMLElement>("[data-summary]")!;
  // Outside the form, so it still speaks while the form is hidden after a success.
  const status = form.parentElement!.querySelector<HTMLElement>("[data-status]")!;
  const iconTemplate = q<HTMLTemplateElement>("[data-alert-icon]");
  const alternativeTemplate = q<HTMLTemplateElement>("[data-alternative]");
  const submit = q<HTMLButtonElement>("[data-submit]")!;
  const submitLabel = q<HTMLElement>("[data-submit-label]")!;
  const message = control("message") as HTMLTextAreaElement;
  const count = q<HTMLElement>("[data-count]");
  const countValue = q<HTMLElement>("[data-count-value]");
  const countSr = q<HTMLElement>("[data-count-sr]");
  const countStatus = q<HTMLElement>("[data-count-status]");
  const card = form.parentElement!;
  const success = card.querySelector<HTMLElement>("[data-contact-success]")!;
  const successTitle = card.querySelector<HTMLElement>("[data-success-title]")!;
  const successEmail = card.querySelector<HTMLElement>("[data-success-email]")!;
  const baseTitle = document.title;

  // The script validates inline instead of the browser's bubbles. maxlength would cut a pasted message
  // silently (and counts UTF-16 units, not characters); without it the counter and the too_long error
  // say what is wrong. The markup keeps maxlength for the no-JavaScript path.
  form.noValidate = true;
  message.removeAttribute("maxlength");
  message.setAttribute("aria-describedby", "contact-message-hint contact-message-count");

  let attempted = false;
  let sending = false;
  // The field errors on screen right now; the summary is always rebuilt from this.
  const shown: Errors = {};
  let summaryMode: "fields" | "request" | null = null;

  const updateTitle = () => {
    const hasErrors = FIELDS.some((f) => shown[f]) || summaryMode === "request" || !!form.querySelector(".form-notice.is-shown");
    document.title = hasErrors ? `Error: ${baseTitle}` : baseTitle;
  };

  /** One polite announcement, made after focus has moved so it does not cut off what is being read. */
  let announceTimer = 0;
  const announce = (text: string) => {
    window.clearTimeout(announceTimer);
    status.textContent = "";
    announceTimer = window.setTimeout(() => (status.textContent = text), 250);
  };

  // ---------- Character count ----------
  let lastAnnounced = "";
  const updateCount = () => {
    const n = charCount(normalizeText(message.value));
    const text = n.toLocaleString("en-US");
    if (countValue) countValue.textContent = text;
    if (countSr) countSr.textContent = text;
    count?.classList.toggle("is-over", n > LIMITS.messageMax);
    // Announce only the moments that matter, not every keystroke.
    const left = LIMITS.messageMax - n;
    let note = "";
    if (n >= LIMITS.messageMin && n < LIMITS.messageMin + 5) note = "Minimum length reached.";
    else if (left < 0) note = `${Math.abs(left).toLocaleString("en-US")} characters over the limit.`;
    else if (left <= 100) note = `${left} characters left.`;
    if (countStatus && note && note !== lastAnnounced) {
      countStatus.textContent = note;
      lastAnnounced = note;
    }
  };
  message.addEventListener("input", updateCount);
  updateCount();

  // ---------- Errors ----------
  const readValues = () => {
    const values: Record<string, string> = {};
    for (const name of FIELDS) values[name] = control(name).value;
    return values;
  };

  const fieldMessage = (name: FieldName, errorCode: string) =>
    errorCode === "help"
      ? FIELD_HELP[name]
      : (FIELD_MESSAGES as Record<string, Record<string, string>>)[name]?.[errorCode] || FIELD_HELP[name];

  // "Name: Enter your name." but "Which best describes you? Choose one option."
  const labelled = (name: FieldName, text: string) => {
    const label = FIELD_LABELS[name];
    return /[?!.]$/.test(label) ? `${label} ${text}` : `${label}: ${text}`;
  };

  const setFieldError = (name: FieldName, errorCode: string | undefined) => {
    const el = control(name);
    const err = errorEl(name);
    const describedBy = (el.getAttribute("aria-describedby") || "").split(" ").filter((id) => id && id !== err.id);
    if (errorCode) {
      err.textContent = fieldMessage(name, errorCode);
      err.hidden = false;
      el.setAttribute("aria-invalid", "true");
      describedBy.unshift(err.id);
    } else {
      err.textContent = "";
      err.hidden = true;
      el.removeAttribute("aria-invalid");
    }
    if (describedBy.length) el.setAttribute("aria-describedby", describedBy.join(" "));
    else el.removeAttribute("aria-describedby");
    if (errorCode) shown[name] = errorCode;
    else delete shown[name];
  };

  const clearSummary = () => {
    summary.replaceChildren();
    summaryMode = null;
    updateTitle();
  };

  const renderSummary = (title: string, items: { text: string; field?: FieldName }[] = [], alternative = false) => {
    const body = document.createElement("div");
    const heading = document.createElement("p");
    heading.className = "form-alert__title";
    heading.textContent = title;
    body.append(heading);
    if (items.length) {
      const list = document.createElement("ul");
      for (const item of items) {
        const li = document.createElement("li");
        if (item.field) {
          const a = document.createElement("a");
          a.href = `#contact-${item.field}`;
          a.textContent = item.text;
          a.addEventListener("click", (e) => {
            e.preventDefault();
            const el = control(item.field!);
            el.focus();
            el.scrollIntoView({ block: "center" });
          });
          li.append(a);
        } else li.textContent = item.text;
        list.append(li);
      }
      body.append(list);
    }
    const extra = alternative ? alternativeTemplate?.content.firstElementChild?.cloneNode(true) : null;
    if (extra) body.append(extra);
    const icon = iconTemplate?.content.firstElementChild?.cloneNode(true);
    summary.replaceChildren(...(icon ? [icon] : []), body);
  };

  const fieldsTitle = (n: number) => (n === 1 ? "Check this field before sending:" : `Check these ${n} fields before sending:`);

  /** Rebuilds the summary from the errors on screen. Never moves focus and never announces. */
  const syncSummary = () => {
    const invalid = FIELDS.filter((name) => shown[name]);
    if (!invalid.length) {
      if (summaryMode === "fields") clearSummary();
      updateTitle();
      return invalid;
    }
    summaryMode = "fields";
    renderSummary(
      fieldsTitle(invalid.length),
      invalid.map((name) => ({ field: name, text: labelled(name, fieldMessage(name, shown[name]!)) })),
    );
    updateTitle();
    return invalid;
  };

  const showFieldErrors = (errors: Errors) => {
    for (const name of FIELDS) setFieldError(name, errors[name]);
    const invalid = syncSummary();
    if (!invalid.length) return;
    control(invalid[0]).focus();
    announce(`${fieldsTitle(invalid.length)} ${invalid.map((name) => FIELD_LABELS[name].replace(/\?$/, "")).join(", ")}.`);
  };

  const showRequestError = (errorCode: string) => {
    const code = errorCode in ERROR_MESSAGES ? errorCode : "server_error";
    summaryMode = "request";
    renderSummary((ERROR_MESSAGES as Record<string, string>)[code], [], (OFFER_ALTERNATIVE as readonly string[]).includes(code));
    updateTitle();
    // Focus reads the message; the summary is not a live region, so it is read once.
    summary.focus({ preventScroll: true });
    summary.scrollIntoView({ block: "center" });
  };

  // ---------- ?error=<code>&fields=... after a plain form post (the redirect path) ----------
  const params = new URLSearchParams(location.search);
  const code = params.get("error");
  // With JavaScript the notices follow .is-shown only (the CSS :target rules apply without it), so
  // hiding them here works even while the old #error-... fragment is still the document's target.
  const hideNotices = () => {
    form.querySelectorAll(".form-notice.is-shown").forEach((n) => n.classList.remove("is-shown"));
    updateTitle();
  };
  const invalidNotice = document.getElementById("error-invalid");
  const syncInvalidNotice = () => {
    if (!invalidNotice?.classList.contains("is-shown")) return;
    let any = false;
    invalidNotice.querySelectorAll<HTMLElement>("[data-notice-field]").forEach((li) => {
      const on = !!shown[li.dataset.noticeField as FieldName];
      li.classList.toggle("is-shown", on);
      any ||= on;
    });
    if (!any) invalidNotice.classList.remove("is-shown");
  };
  if (code && /^[a-z_]{1,32}$/.test(code)) {
    const notice = document.getElementById(`error-${code}`) || document.getElementById("error-server_error");
    if (notice) {
      notice.classList.add("is-shown");
      if (notice === invalidNotice) {
        const fields = (params.get("fields") || "").split(",").filter((f): f is FieldName => (FIELDS as readonly string[]).includes(f));
        attempted = fields.length > 0;
        for (const name of fields) setFieldError(name, "help");
        notice.querySelectorAll<HTMLElement>("[data-notice-field]").forEach((li) => {
          li.classList.toggle("is-shown", !fields.length || fields.includes(li.dataset.noticeField as FieldName));
        });
      }
      updateTitle();
      // Always focus the notice, so screen readers start there at every width.
      notice.focus();
    }
    // A reload should not show the old error again.
    history.replaceState(history.state, "", location.pathname);
  }

  // After the first attempt, each field re-checks itself as it changes, so errors clear as they are
  // fixed, and the summary and page title follow.
  const recheck = (name: FieldName) => {
    if (!attempted) return;
    const { errors } = validate(readValues());
    setFieldError(name, (errors as Errors)[name]);
    // After a plain post came back with ?error=invalid, its notice is the summary: keep that one in sync.
    if (invalidNotice?.classList.contains("is-shown")) syncInvalidNotice();
    else if (summaryMode !== "request") syncSummary();
    updateTitle();
  };
  for (const name of FIELDS) {
    const el = control(name);
    el.addEventListener(el instanceof HTMLSelectElement ? "change" : "input", () => recheck(name));
    el.addEventListener("blur", () => recheck(name));
  }

  // ---------- Sending ----------
  const setSending = (on: boolean) => {
    sending = on;
    // aria-disabled rather than disabled, so keyboard focus stays on the button while it waits.
    if (on) submit.setAttribute("aria-disabled", "true");
    else submit.removeAttribute("aria-disabled");
    submitLabel.textContent = on ? "Sending..." : "Send message";
    if (on) announce("Sending your message.");
    else {
      // A fast answer (a 429, 403 or 503 comes back before any email is sent) can arrive before the
      // delayed "Sending" announcement: cancel it and clear the region, so it is never read after the
      // result. showFieldErrors makes its own announcement afterwards.
      window.clearTimeout(announceTimer);
      status.textContent = "";
    }
  };

  const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const post = async (values: Record<string, string>, rendered: number): Promise<Result> => {
    const sent = Date.now();
    const payload = { ...values, [HONEYPOT]: honeypot.value, ts: Math.max(rendered, sent - MAX_TS_AGE_MS), sent };
    const body = JSON.stringify(payload);
    if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) return { error: "too_large" };
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body,
        credentials: "same-origin",
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.ok) return { ok: true };
      if (data && data.error === "invalid" && data.fields) return { fields: data.fields as Errors };
      // Responses without our JSON (a Vercel Firewall 429, a platform error) still get a fitting message.
      const byStatus: Record<number, string> = { 403: "forbidden", 408: "timeout", 413: "too_large", 429: "rate_limited", 503: "unavailable" };
      const fallback = byStatus[res.status] || (res.status >= 500 ? "server_error" : "bad_request");
      return { error: data && typeof data.error === "string" ? data.error : fallback };
    } catch {
      return { error: "network" };
    } finally {
      window.clearTimeout(timer);
    }
  };

  const showSuccess = (email: string) => {
    successEmail.textContent = email;
    form.hidden = true;
    success.hidden = false;
    successTitle.focus();
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) return;
    attempted = true;
    hideNotices();

    const values = readValues();
    const { errors } = validate(values);
    if (Object.keys(errors).length) {
      if (summaryMode === "request") clearSummary();
      showFieldErrors(errors as Errors);
      return;
    }
    showFieldErrors({});
    clearSummary();

    setSending(true);
    const rendered = Number(ts.value) || Date.now();
    let result = await post(values, rendered);
    if ("error" in result && result.error === "too_fast") {
      // The function wants a few seconds between loading the page and sending (a filter for naive bots).
      // A quick person (autofill and a pasted message) is not refused: wait for the rest, then send once more.
      await wait(Math.min(TIMING.minFillMs, Math.max(0, rendered + TIMING.minFillMs + 250 - Date.now())));
      result = await post(values, rendered);
    }
    // Leave the sending state before showing anything, so the result is announced normally.
    setSending(false);
    if ("ok" in result) showSuccess(normalizeLine(values.email));
    else if ("fields" in result) showFieldErrors(result.fields);
    else showRequestError(result.error);
  });

  // "Send another message": a fresh, empty form (without JavaScript the link reloads /contact).
  card.querySelector<HTMLElement>("[data-send-another]")?.addEventListener("click", (event) => {
    event.preventDefault();
    form.reset();
    attempted = false;
    for (const name of FIELDS) setFieldError(name, undefined);
    clearSummary();
    updateCount();
    ts.value = String(Date.now());
    success.hidden = true;
    form.hidden = false;
    control("name").focus();
  });

  // Stamp the render time last: if anything above had failed, a native post would carry no `ts` and
  // take the no-JavaScript path instead of being timed against a stamp the script never used.
  ts.value = String(Date.now());
}
