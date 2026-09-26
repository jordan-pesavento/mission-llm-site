/*
 * Accessible tabs (WAI-ARIA tabs pattern, automatic activation), shared by the product tour and
 * the Download install options. Import it from a component's <script>: import "../../scripts/tabs.ts";
 *
 * Markup contract (server-rendered so the page is complete without JS):
 *   <div data-tabs [data-tabs-hash] [data-tabs-disclosure="(max-width: 959.98px)"]>
 *     <div role="tablist" aria-label="..." hidden>            <- hidden until JS runs
 *       <button role="tab" id="t-docker" aria-controls="p-docker" aria-selected="true">Docker</button>
 *       <button role="tab" id="t-helm" aria-controls="p-helm" aria-selected="false">Helm</button>
 *     </div>
 *     <div role="tabpanel" id="p-docker" aria-labelledby="t-docker">...</div>
 *     <div role="tabpanel" id="p-helm" aria-labelledby="t-helm">...</div>
 *   </div>
 * Without JS the tablist stays hidden and every panel shows in order (give each panel its own
 * heading). With JS: the arrow keys (Left and Up for the previous tab, Right and Down for the
 * next, whatever the layout), Home and End move between tabs; inactive panels get `hidden`; the
 * new panel crossfades in over 200ms (instant with reduced motion); no auto-advance.
 * data-tabs-hash: selecting a tab updates location.hash to the panel id, and a matching hash on
 * load selects that tab (for links such as /download#p-helm).
 * data-tabs-disclosure: a media query. While it matches (an accordion layout), the same markup
 * behaves as a disclosure list: the tabs become plain buttons with aria-expanded, every one is a
 * Tab stop, the panels are regions, and arrow keys are left to the browser. The tabs roles and
 * the roving tabindex come back when the query stops matching.
 * Every change dispatches a "tabs:change" CustomEvent on the root with { index, tab, panel }.
 */
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initTabs(root: HTMLElement) {
  if (root.dataset.tabsReady) return;
  root.dataset.tabsReady = "true";
  const list = root.querySelector<HTMLElement>('[role="tablist"]');
  if (!list) return;
  const tabs = [...list.querySelectorAll<HTMLElement>('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls") || ""));
  if (!tabs.length || panels.some((p) => !p)) return;
  const syncHash = root.hasAttribute("data-tabs-hash");
  const disclosureQuery = root.dataset.tabsDisclosure ? window.matchMedia(root.dataset.tabsDisclosure) : null;
  let disclosure = false;
  let current = 0;

  const applyState = () => {
    tabs.forEach((tab, i) => {
      const on = i === current;
      if (disclosure) {
        tab.removeAttribute("aria-selected");
        tab.setAttribute("aria-expanded", String(on));
        tab.tabIndex = 0;
      } else {
        tab.removeAttribute("aria-expanded");
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
      }
    });
  };

  const setMode = (on: boolean) => {
    disclosure = on;
    root.toggleAttribute("data-tabs-disclosed", on);
    if (on) {
      list.removeAttribute("role");
      tabs.forEach((t) => t.removeAttribute("role"));
      panels.forEach((p) => p!.setAttribute("role", "region"));
    } else {
      list.setAttribute("role", "tablist");
      tabs.forEach((t) => t.setAttribute("role", "tab"));
      panels.forEach((p) => p!.setAttribute("role", "tabpanel"));
    }
    applyState();
  };

  const select = (index: number, { focus = false, animate = true, fromHash = false } = {}) => {
    current = index;
    panels.forEach((panel, i) => {
      const on = i === index;
      const wasHidden = panel!.hidden;
      panel!.hidden = !on;
      if (on && wasHidden && animate && !reduced()) {
        panel!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "cubic-bezier(.23,1,.32,1)" });
      }
    });
    applyState();
    if (focus) tabs[index].focus();
    if (syncHash && !fromHash) history.replaceState(null, "", `#${panels[index]!.id}`);
    root.dispatchEvent(new CustomEvent("tabs:change", { detail: { index, tab: tabs[index], panel: panels[index] } }));
  };

  let start = Math.max(0, tabs.findIndex((t) => t.getAttribute("aria-selected") === "true"));
  if (syncHash && location.hash) {
    const i = panels.findIndex((p) => `#${p!.id}` === location.hash);
    if (i >= 0) start = i;
  }
  panels.forEach((p) => {
    if (!p!.hasAttribute("tabindex")) p!.tabIndex = 0;
  });
  list.hidden = false;
  current = start;
  setMode(!!disclosureQuery?.matches);
  select(start, { animate: false, fromHash: true });
  disclosureQuery?.addEventListener("change", (e) => setMode(e.matches));

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i));
    tab.addEventListener("keydown", (e) => {
      if (disclosure) return;
      let to = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") to = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") to = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") to = 0;
      else if (e.key === "End") to = tabs.length - 1;
      if (to < 0) return;
      e.preventDefault();
      select(to, { focus: true });
    });
  });

  if (syncHash) {
    window.addEventListener("hashchange", () => {
      const i = panels.findIndex((p) => `#${p!.id}` === location.hash);
      if (i >= 0) select(i, { fromHash: true });
    });
  }
}

document.querySelectorAll<HTMLElement>("[data-tabs]").forEach(initTabs);
