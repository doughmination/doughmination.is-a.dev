(function siteSwitcher() {
  var SITES = [
    { id: "clove", label: "clove.is-a.dev", url: "https://clove.is-a.dev", note: "Link Center" },
    { id: "doughmination", label: "doughmination.is-a.dev", url: "https://doughmination.is-a.dev", note: "Beta Link Center" },
  ];

  var host = (location.hostname || "").replace(/^www\./, "");
  var currentId = null;
  for (var i = 0; i < SITES.length; i++) {
    if (host === SITES[i].url.replace("https://", "")) currentId = SITES[i].id;
  }

  var css = `
  .site-switcher { position: relative; }
  .site-switcher-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    background: var(--surface-1);
    border: 1px solid var(--surface-2);
    color: var(--text);
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
    transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  }
  .site-switcher-btn:hover {
    border-color: rgb(var(--accent-rgb));
    transform: translateX(2px);
  }
  .site-switcher-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: rgb(var(--accent-rgb)); flex-shrink: 0;
  }
  .site-switcher-caret {
    font-size: 0.7rem; line-height: 1; opacity: 0.8;
    transition: transform 0.15s ease;
  }
  .site-switcher.open .site-switcher-caret { transform: rotate(180deg); }

  .site-switcher-menu {
    position: absolute;
    left: 0;
    bottom: calc(100% + 0.45rem);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 210px;
    padding: 0.4rem;
    border-radius: 12px;
    background: var(--surface-0);
    border: 1px solid var(--surface-1);
    box-shadow: 0 10px 28px -8px rgba(17, 17, 27, 0.7);
    opacity: 0;
    transform: translateY(6px);
    pointer-events: none;
    transition: opacity 0.15s ease, transform 0.15s ease;
    z-index: 30;
  }
  .site-switcher.open .site-switcher-menu {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
  .site-switcher-item {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
    text-decoration: none;
    color: var(--text);
    border: 1px solid transparent;
    transition: background 0.12s ease, border-color 0.12s ease;
  }
  .site-switcher-item:hover { background: var(--surface-1); }
  .site-switcher-item .ss-label { font-size: 0.82rem; font-weight: 500; }
  .site-switcher-item .ss-note  { font-size: 0.68rem; color: var(--subtext-0); }
  .site-switcher-item.current {
    border-color: rgb(var(--accent-rgb));
    background: rgba(var(--accent-rgb), 0.12);
  }
  .site-switcher-item.current .ss-label { color: rgb(var(--accent-rgb)); }

  @media (max-width: 640px) {
    .site-switcher-menu { left: 50%; transform: translate(-50%, 6px); }
    .site-switcher.open .site-switcher-menu { transform: translate(-50%, 0); }
  }`;

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---- markup -------------------------------------------------------------
  var current = SITES.filter(function (s) { return s.id === currentId; })[0];
  var btnLabel = current ? current.label : "Sites";

  var wrap = document.createElement("div");
  wrap.className = "site-switcher";

  var menuItems = SITES.map(function (s) {
    var isCur = s.id === currentId;
    return (
      '<a class="site-switcher-item' + (isCur ? " current" : "") + '"' +
      ' role="menuitem"' + (isCur ? ' aria-current="page"' : "") +
      ' href="' + s.url + '">' +
      '<span class="ss-label">' + s.label + "</span>" +
      '<span class="ss-note">' + s.note + (isCur ? " · you are here" : "") + "</span>" +
      "</a>"
    );
  }).join("");

  wrap.innerHTML =
    '<button class="site-switcher-btn" type="button" aria-haspopup="true" aria-expanded="false">' +
    '<span class="site-switcher-dot" aria-hidden="true"></span>' +
    "<span>" + btnLabel + "</span>" +
    '<span class="site-switcher-caret" aria-hidden="true">▾</span>' +
    "</button>" +
    '<div class="site-switcher-menu" role="menu">' + menuItems + "</div>";

  // ---- mount: into the existing nav, else float bottom-left ---------------
  var navLinks = document.querySelector(".nav-links");
  if (navLinks) {
    var stale = navLinks.querySelector(".nav-link.is-a-dev");
    if (stale) stale.remove();
    navLinks.appendChild(wrap);
  } else {
    wrap.style.position = "fixed";
    wrap.style.left = "1rem";
    wrap.style.bottom = "1rem";
    wrap.style.zIndex = "6";
    document.body.appendChild(wrap);
  }

  // ---- behaviour ----------------------------------------------------------
  var btn = wrap.querySelector(".site-switcher-btn");

  function setOpen(open) {
    wrap.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(!wrap.classList.contains("open"));
  });

  document.addEventListener("click", function (e) {
    if (!wrap.contains(e.target)) setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });
})();
