// One-time line drawing for inline art (Art.astro with `draw`; DESIGN-SPEC section 8).
// Each drawing draws once when 20 percent of it is in view. Only strokes animate (pathLength 1,
// stroke-dashoffset 2 to 0 over 900ms, starts spread over 560ms in document order). Every filled shape
// keeps its fill from the first frame, so faces always hide the lines behind them and nothing goes
// see-through. Dashed guides, text and the blue node fade in instead.
// Nothing is hidden without JS or with reduced motion: the drawing is simply complete.
// Other scripts can wait for a drawing: each .art element dispatches "art:drawn" when it finishes.
const SHAPES = "path, polygon, polyline, rect, circle, ellipse, line, text";
const SPREAD_MS = 560;
const DONE_MS = 1700; // the last stroke's start (560) plus its 900ms draw plus slack
const NODE_FILL = /43, 99, 224|91, 149, 255/; // #2B63E0 and #5B95FF, the node in either tone

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const arts = [...document.querySelectorAll<HTMLElement>(".art[data-draw]")].filter((a) => !a.dataset.drawReady);

function arm(art: HTMLElement) {
  art.dataset.drawReady = "true";
  const els = [...art.querySelectorAll<SVGGraphicsElement>(SHAPES)].filter((el) => !el.closest("defs, mask, clipPath"));
  const n = els.length;
  els.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const dashed = el.hasAttribute("stroke-dasharray") || cs.strokeDasharray !== "none";
    const stroked = !!cs.stroke && cs.stroke !== "none";
    const isNode = el.hasAttribute("data-node") || NODE_FILL.test(cs.fill);
    if (el.tagName === "text" || dashed || isNode) el.classList.add("fade");
    else if (stroked) {
      el.setAttribute("pathLength", "1");
      el.classList.add("draw");
    }
    el.style.setProperty("--d", `${Math.round((i / Math.max(n - 1, 1)) * SPREAD_MS)}ms`);
  });
  art.classList.add("is-armed");
}

function play(art: HTMLElement) {
  art.classList.add("is-drawing");
  window.setTimeout(() => {
    art.classList.add("is-drawn");
    art.classList.remove("is-armed", "is-drawing");
    art.dispatchEvent(new CustomEvent("art:drawn", { bubbles: true }));
  }, DONE_MS);
}

if (arts.length) {
  if (reduce || !("IntersectionObserver" in window)) {
    arts.forEach((a) => {
      a.dataset.drawReady = "true";
      a.classList.add("is-drawn");
    });
  } else {
    arts.forEach(arm);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          requestAnimationFrame(() => play(e.target as HTMLElement));
        }
      },
      { threshold: 0.2 },
    );
    arts.forEach((a) => io.observe(a));
    // Printing never shows a half-drawn picture.
    window.addEventListener("beforeprint", () => arts.forEach((a) => a.classList.remove("is-armed", "is-drawing")));
  }
}
