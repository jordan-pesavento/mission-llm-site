// Header behavior (Header.astro; DESIGN-SPEC section 6 with HERO-REVISION.md). A bundled module: no
// inline script, no CSP hash.
// The nav never changes size, shape, position or color with scroll: one constant near-white bar, no
// scrolled state and no per-section tone switch. This script only runs the interactive menus:
//   1. The audience menu (from 1024), with keyboard and focus handling.
//   2. The sheet (below 1024), with a focus trap, Escape and scroll lock.
const html = document.documentElement;
const nav = document.querySelector<HTMLElement>("[data-nav]");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const desktop = window.matchMedia("(min-width: 1024px)");
const hoverFine = window.matchMedia("(hover: hover) and (pointer: fine)");

if (nav) {
  /* ---------------------------------------------------------- 1. audience menu (desktop) */
  const row = nav.querySelector<HTMLElement>("[data-nav-row]");
  const trigger = nav.querySelector<HTMLButtonElement>("[data-menu-trigger]");
  const menu = nav.querySelector<HTMLElement>("[data-menu]");
  const wrap = nav.querySelector<HTMLElement>("[data-menu-wrap]");
  const menuOpen = () => !!menu?.hasAttribute("data-open");

  let hoverTimer = 0;
  let hideTimer = 0;
  // The closed menu is display:none (hidden), so it never adds to layout; opening unhides it, then
  // sets data-open on the next style pass so the 180ms fade and scale run. It is kept inside the
  // content width: when the panel would pass the row's right edge it shifts left.
  const setMenu = (open: boolean, { focusFirst = false, restore = false } = {}) => {
    if (!menu || !trigger || !row || !wrap) return;
    if (open === menuOpen()) {
      if (!open) return;
    } else if (open) {
      window.clearTimeout(hideTimer);
      menu.hidden = false;
      menu.style.setProperty("--menu-shift", "0px");
      const over = wrap.getBoundingClientRect().left - 12 + menu.offsetWidth - row.getBoundingClientRect().right;
      if (over > 0) menu.style.setProperty("--menu-shift", `${-Math.ceil(over)}px`);
      void menu.offsetWidth; // commit the closed state before opening, so the transition runs
      menu.setAttribute("data-open", "");
    } else {
      menu.removeAttribute("data-open");
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        if (!menuOpen()) menu.hidden = true;
      }, reduce ? 0 : 200);
    }
    trigger.setAttribute("aria-expanded", String(open));
    if (open && focusFirst) menu.querySelector<HTMLElement>("a")?.focus();
    if (!open && restore) trigger.focus();
  };
  if (trigger && menu && wrap) {
    trigger.addEventListener("click", () => setMenu(!menuOpen()));
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMenu(true, { focusFirst: true });
      }
    });
    wrap.addEventListener("pointerenter", () => {
      if (!hoverFine.matches) return;
      window.clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => setMenu(true), 60);
    });
    wrap.addEventListener("pointerleave", () => {
      if (!hoverFine.matches) return;
      window.clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => setMenu(false), 160);
    });
    wrap.addEventListener("focusout", (e) => {
      if (menuOpen() && !wrap.contains(e.relatedTarget as Node | null)) setMenu(false);
    });
    menu.addEventListener("keydown", (e) => {
      const as = [...menu.querySelectorAll<HTMLElement>("a")];
      const i = as.indexOf(document.activeElement as HTMLElement);
      if (i < 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        as[(i + 1) % as.length].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        as[(i - 1 + as.length) % as.length].focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        as[0].focus();
      } else if (e.key === "End") {
        e.preventDefault();
        as[as.length - 1].focus();
      }
    });
    menu.addEventListener("click", (e) => {
      if ((e.target as Element).closest("a")) setMenu(false);
    });
    document.addEventListener("click", (e) => {
      if (menuOpen() && !wrap.contains(e.target as Node)) setMenu(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuOpen()) setMenu(false, { restore: true });
    });
    desktop.addEventListener("change", () => setMenu(false));
  }

  /* ---------------------------------------------------------- 2. sheet (below 1024) */
  const toggle = nav.querySelector<HTMLButtonElement>("[data-sheet-toggle]");
  const sheet = nav.querySelector<HTMLElement>("[data-sheet]");
  const sheetOpen = () => !!sheet?.hasAttribute("data-open");
  const setSheet = (open: boolean, { restore = false, pointer = false } = {}) => {
    if (!sheet || !toggle) return;
    sheet.toggleAttribute("data-open", open);
    nav.toggleAttribute("data-sheet-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    html.classList.toggle("menu-lock", open);
    // A tap focuses the panel itself (no ring on the first row); the keyboard lands on the first row.
    if (open) (pointer ? sheet : sheet.querySelector<HTMLElement>("a"))?.focus({ preventScroll: true });
    if (!open && restore) toggle.focus();
  };
  if (toggle && sheet) {
    sheet.tabIndex = -1;
    toggle.addEventListener("click", (e) => setSheet(!sheetOpen(), { pointer: e.detail > 0 }));
    sheet.addEventListener("click", (e) => {
      if ((e.target as Element).closest("a")) setSheet(false);
    });
    document.addEventListener("keydown", (e) => {
      if (!sheetOpen()) return;
      if (e.key === "Escape") setSheet(false, { restore: true });
      if (e.key === "Tab") {
        const f = [toggle, ...sheet.querySelectorAll<HTMLElement>("a[href], button")];
        const i = f.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && i === f.length - 1) {
          e.preventDefault();
          f[0].focus();
        }
      }
    });
    desktop.addEventListener("change", () => setSheet(false));
  }
}
