// FeatureAccordion behavior. One item is always open: a click on a closed item opens it and closes the
// rest; the frames crossfade (CSS, 220ms opacity). Without JS every panel stays open.
// Deep links: an accordion with data-anchor-prefix (for example "for-") opens the item named by
// #<prefix><id> on load, on hashchange, and on a click of a link to the hash already in the address
// bar (which fires no hashchange). The header's audience menu links to /#for-<id>.
for (const root of document.querySelectorAll<HTMLElement>("[data-facc]")) {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-facc-btn]")];
  const shots = [...root.querySelectorAll<HTMLElement>("[data-facc-media]")];
  const panels = buttons.map((b) => document.getElementById(b.getAttribute("aria-controls") || ""));
  const ids = buttons.map((b) => b.dataset.faccBtn || "");

  const open = (id: string) => {
    if (!ids.includes(id)) return;
    buttons.forEach((b, i) => {
      const on = ids[i] === id;
      b.setAttribute("aria-expanded", String(on));
      panels[i]?.toggleAttribute("data-open", on);
    });
    shots.forEach((s) => {
      const on = s.dataset.faccMedia === id;
      s.toggleAttribute("data-active", on);
      if (on) s.removeAttribute("aria-hidden");
      else s.setAttribute("aria-hidden", "true");
    });
  };
  buttons.forEach((b, i) => b.addEventListener("click", () => open(ids[i])));
  open(ids[Number(root.dataset.initial) || 0]);

  const prefix = root.dataset.anchorPrefix;
  if (prefix) {
    const fromHash = (hash: string) => {
      if (hash.startsWith(`#${prefix}`)) open(decodeURIComponent(hash.slice(prefix.length + 1)));
    };
    fromHash(location.hash);
    window.addEventListener("hashchange", () => fromHash(location.hash));
    document.addEventListener("click", (e) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.pathname !== location.pathname || a.origin !== location.origin) return;
      fromHash(a.hash);
    });
  }
}
