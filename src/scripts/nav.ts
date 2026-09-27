// Header behavior (Header.astro; DESIGN-SPEC section 6 with HERO-REVISION.md). A bundled module: no
// inline script, no CSP hash.
// The nav never changes size, shape or position with scroll: there is no scrolled state. The only
// thing this script changes while scrolling is the tone attribute below.
//   1. Tone: html[data-under="dark"] while a [data-tone="dark"] section crosses the nav's middle, so
//      the nav shows its light skin over dark sections (and "light" otherwise). The observer's root is
//      a 2px line at that middle; it is rebuilt on resize because --nav-h steps with the width.
//   2. The node: a copy of the logo's node that rests over it and slides to the current, hovered or
//      focused link (desktop only).
//   3. The audience menu (from 1024) and the sheet (below 1024), with keyboard and focus handling.
// Reduced motion: the node jumps; CSS turns every transition off (the tone switches instantly).
const html = document.documentElement;
const nav = document.querySelector<HTMLElement>("[data-nav]");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const desktop = window.matchMedia("(min-width: 1024px)");
const hoverFine = window.matchMedia("(hover: hover) and (pointer: fine)");

if (nav) {
  /* ---------------------------------------------------------- 1. tone under the nav */
  const darks = [...document.querySelectorAll<HTMLElement>('[data-tone="dark"]')];
  // At the top of the page the nav covers the body's padding (--nav-h), not a section, so the first
  // section counts as reaching up behind the nav: a box over that padding takes its tone. The navy
  // home hero then gets the light bar at rest, and the switch happens exactly where the hero ends.
  // Use the first tone BAND, not main's literal first child: Astro can hoist a component's <script> to
  // the front of <main> (e.g. the 404 page's Art script), which would otherwise hide the dark hero.
  const first = document.querySelector<HTMLElement>("main > [data-tone]");
  if (first?.dataset.tone === "dark") {
    const top = document.createElement("div");
    top.setAttribute("aria-hidden", "true");
    top.dataset.navTop = "";
    top.style.cssText = "position:absolute;top:0;left:0;right:0;height:var(--nav-h);visibility:hidden;pointer-events:none";
    document.body.prepend(top);
    darks.push(top);
  }
  const hits = new Set<Element>();
  let toneIO: IntersectionObserver | null = null;
  const setupTone = () => {
    if (!("IntersectionObserver" in window)) return;
    toneIO?.disconnect();
    hits.clear();
    const mid = Math.round(nav.querySelector<HTMLElement>("[data-nav-row]")!.getBoundingClientRect().height / 2);
    toneIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) hits.add(e.target);
          else hits.delete(e.target);
        }
        html.setAttribute("data-under", hits.size ? "dark" : "light");
      },
      { rootMargin: `-${mid - 1}px 0px -${Math.max(window.innerHeight - mid - 1, 0)}px 0px`, threshold: 0 },
    );
    darks.forEach((d) => toneIO!.observe(d));
  };
  setupTone();
  let toneTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(toneTimer);
    toneTimer = window.setTimeout(setupTone, 120);
  });

  /* ---------------------------------------------------------- 2. the node */
  const row = nav.querySelector<HTMLElement>("[data-nav-row]");
  const links = nav.querySelector<HTMLElement>("[data-links]");
  const node = nav.querySelector<HTMLElement>("[data-node]");
  const logoNode = nav.querySelector<SVGGraphicsElement>("[data-brand] .lk-node");
  const trigger = nav.querySelector<HTMLButtonElement>("[data-menu-trigger]");
  const menu = nav.querySelector<HTMLElement>("[data-menu]");
  const wrap = nav.querySelector<HTMLElement>("[data-menu-wrap]");
  // The links the node can mark: the menu button and the page links (not the no-JS menu link).
  const items = links ? [...links.querySelectorAll<HTMLElement>(".nav__link")].filter((a) => !a.classList.contains("nav__menu-link")) : [];
  const current = items.find((a) => a.getAttribute("aria-current") === "page") ?? null;
  const menuOpen = () => !!menu?.hasAttribute("data-open");
  let shown: HTMLElement | null | undefined; // what the node marks now (null: the logo)

  const place = (el: HTMLElement | null, instant = false) => {
    if (!node || !row || !desktop.matches) return;
    const rr = row.getBoundingClientRect();
    let x: number, y: number, s: number;
    if (el) {
      const r = el.getBoundingClientRect();
      x = r.left - rr.left + r.width / 2;
      y = r.bottom - rr.top - 2;
      s = 1;
    } else if (logoNode && logoNode.ownerSVGElement) {
      // Measured through the lockup's matrix, so the load settle (a CSS transform on the node) never
      // skews the rest position.
      const bb = logoNode.getBBox();
      const m = logoNode.ownerSVGElement.getScreenCTM();
      if (!m) return;
      x = m.a * (bb.x + bb.width / 2) + m.e - rr.left;
      y = m.d * (bb.y + bb.height / 2) + m.f - rr.top;
      s = (bb.width * m.a) / Math.SQRT2 / 7; // the logo node's side over the indicator's 7px side
    } else return;
    const px = parseFloat(node.style.getPropertyValue("--nx")) || x;
    const py = parseFloat(node.style.getPropertyValue("--ny")) || y;
    const dist = Math.hypot(x - px, y - py);
    node.style.setProperty("--node-t", `${Math.round(Math.min(420, 180 + dist * 0.28))}ms`);
    const still = instant || reduce;
    if (still) node.classList.add("is-still");
    node.style.setProperty("--nx", `${x.toFixed(2)}px`);
    node.style.setProperty("--ny", `${y.toFixed(2)}px`);
    node.style.setProperty("--ns", s.toFixed(4));
    node.style.setProperty("--node-o", "1");
    shown = el;
    if (still) requestAnimationFrame(() => requestAnimationFrame(() => node.classList.remove("is-still")));
  };
  const rest = () => place(menuOpen() ? trigger : current);

  if (links && node) {
    items.forEach((a) => {
      a.addEventListener("pointerenter", () => place(a));
      a.addEventListener("focus", () => place(a));
    });
    links.addEventListener("pointerleave", rest);
    links.addEventListener("focusout", (e) => {
      if (!links.contains(e.relatedTarget as Node | null)) rest();
    });
    window.addEventListener("resize", () => place(shown === undefined ? current : shown, true));
    desktop.addEventListener("change", () => place(current, true));
    // First load: the logo's node settles into the V (CSS, 240ms); then the indicator appears over it
    // and, on a page with a current link, slides out to that link once.
    const start = () => {
      place(null, true);
      if (current) window.setTimeout(() => place(current), reduce ? 0 : 380);
    };
    const ready = document.fonts ? document.fonts.ready : Promise.resolve();
    ready.then(() => window.setTimeout(start, reduce ? 0 : 340));
  }

  /* ---------------------------------------------------------- 3a. audience menu (desktop) */
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
    if (open) place(trigger);
    else rest();
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

  /* ---------------------------------------------------------- 3b. sheet (below 1024) */
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
