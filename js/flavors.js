(function flavors() {
  // Metadata only — colors are defined in the per-flavor CSS files.
  const FLAVORS = {
    mocha: { label: "Mocha", dot: "#f5c2e7" },
    macchiato: { label: "Macchiato", dot: "#f5bde6" },
    frappe: { label: "Frappé", dot: "#f4b8e4" },
    latte: { label: "Latte", dot: "#ea76cb" },
  };
  const ORDER = ["mocha", "macchiato", "frappe", "latte"];

  const root = document.documentElement;
  const ls = window.localStorage;

  function apply(name) {
    const f = FLAVORS[name] || FLAVORS.mocha;
    root.setAttribute("data-flavor", name);          // CSS does the rest
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", f.dot);
  }

  let current = ls.getItem("ctpFlavor");
  if (!ORDER.includes(current)) current = "mocha";
  apply(current);  // the <head> snippet already set this to avoid a flash

  // ---- top-right corner icon button ----
  const bar = document.createElement("div");
  bar.className = "beta-bar";
  bar.innerHTML = `
    <button class="beta-btn" id="flavor-btn" type="button">
      <img class="beta-icon" alt="">
    </button>`;
  // Group the single-item widgets (now-playing + theme toggle) into one
  // top bar. On mobile they sit side by side; on desktop both stay
  // position:fixed, so this wrapper is zero-size and invisible.
  let topbar = document.querySelector(".topbar");
  if (!topbar) {
    topbar = document.createElement("div");
    topbar.className = "topbar";
    document.body.insertBefore(topbar, document.body.firstChild);
    const np = document.getElementById("now-playing");
    if (np) topbar.appendChild(np);
  }
  topbar.appendChild(bar);

  const btn = bar.querySelector("#flavor-btn");
  const icon = bar.querySelector(".beta-icon");

  function paintBtn() {
    const f = FLAVORS[current];
    icon.src = `/images/theme/${current}.png`;   // e.g. /images/theme/mocha.png
    icon.alt = f.label;
    btn.title = `Theme: ${f.label} (click to cycle)`;
  }
  paintBtn();

  btn.addEventListener("click", () => {
    current = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    ls.setItem("ctpFlavor", current);
    apply(current);
    paintBtn();
  });
})();
