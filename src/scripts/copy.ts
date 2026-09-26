// Copy-to-clipboard for CodeBlock. Progressive enhancement: the Copy button stays hidden without
// JS, and the status is announced through the block's aria-live region ("Copied").
// Also makes each code block's <pre> a Tab stop only while it actually scrolls sideways, so
// keyboard users can scroll long lines without meeting empty stops on blocks that fit.
const RESET_MS = 2000;

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

const scrollables = new ResizeObserver((entries) => {
  for (const { target } of entries) syncTabStop(target as HTMLElement);
});
function syncTabStop(pre: HTMLElement) {
  if (pre.scrollWidth > pre.clientWidth + 1) pre.tabIndex = 0;
  else pre.removeAttribute("tabindex");
}

function init(root: HTMLElement) {
  if (root.dataset.copyReady) return;
  root.dataset.copyReady = "true";
  const pre = root.querySelector<HTMLElement>("pre");
  if (pre) {
    syncTabStop(pre);
    scrollables.observe(pre);
  }
  const button = root.querySelector<HTMLButtonElement>("[data-copy]");
  const code = root.querySelector<HTMLElement>("pre code");
  const status = root.querySelector<HTMLElement>("[data-copy-status]");
  const label = root.querySelector<HTMLElement>("[data-copy-label]");
  if (!button || !code) return;
  button.hidden = false;
  let timer: number | undefined;
  button.addEventListener("click", async () => {
    // The exact source (CodeBlock data-code); innerText is only a fallback. Lines wrapped on a phone
    // never add line breaks to what is copied.
    const ok = await writeClipboard(root.dataset.code ?? code.innerText.replace(/\n$/, ""));
    const text = ok ? "Copied" : "Copy failed";
    if (label) label.textContent = text;
    if (status) status.textContent = ok ? "Copied to clipboard" : "Copy failed. Select the text to copy it.";
    button.dataset.state = ok ? "copied" : "failed";
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (label) label.textContent = "Copy";
      if (status) status.textContent = "";
      delete button.dataset.state;
    }, RESET_MS);
  });
}

document.querySelectorAll<HTMLElement>("[data-codeblock]").forEach(init);
