(function devMode() {
  var host = (location.hostname || "").replace(/^www\./, "");

  // True for localhost (any port), loopback, *.local, and private LAN IPs.
  var isDev =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    host === "::1" ||
    /\.local$/.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host);

  // Expose for other scripts (e.g. site-switcher.js).
  window.DevMode = {
    isDev: isDev,
    host: host,
    origin: location.origin
  };

  if (!isDev) return;

  // ---- styles -------------------------------------------------------------
  var css = `
  .dev-mode-badge {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 6;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    background: rgba(var(--accent-rgb), 0.5);
    color: var(--text);
    font: inherit;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    box-shadow: 0 6px 18px -6px rgba(var(--accent-rgb), 0.5);
    pointer-events: none;
    user-select: none;
    transition: top 0.2s ease;
  }
  .dev-mode-badge .dev-mode-pulse {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--text);
    animation: devModePulse 1.4s ease-in-out infinite;
  }
  @keyframes devModePulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(0.75); }
  }`;

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---- badge --------------------------------------------------------------
  function mountBadge() {
    if (document.querySelector(".dev-mode-badge")) return;
    var badge = document.createElement("div");
    badge.className = "dev-mode-badge";
    badge.setAttribute("title", "You're viewing a local dev build — not the live site.");
    badge.innerHTML =
      '<span class="dev-mode-pulse" aria-hidden="true"></span>' +
      "<span>Dev Mode</span>";
    document.body.appendChild(badge);
    
    var np = document.getElementById("now-playing");

    function reposition() {
      var gap = 8; // px below the widget
      var rect = np ? np.getBoundingClientRect() : null;
      // A fixed element has no offsetParent, so judge visibility by its
      // rendered size instead.
      var visible = np && !np.hidden && rect.height > 0 && rect.width > 0;
      if (visible) {
        badge.style.top = (rect.bottom + gap) + "px";
        badge.style.left = rect.left + "px";
      } else {
        badge.style.top = "";  // back to the 1rem default
        badge.style.left = "";
      }
    }

    reposition();
    window.addEventListener("resize", reposition);

    if (np) {
      if (window.ResizeObserver) new ResizeObserver(reposition).observe(np);
      // now-playing.js toggles [hidden] / inline styles when presence loads.
      new MutationObserver(reposition).observe(np, {
        attributes: true,
        attributeFilter: ["hidden", "style", "class"]
      });
    }
  }

  if (document.body) {
    mountBadge();
  } else {
    document.addEventListener("DOMContentLoaded", mountBadge);
  }
})();
