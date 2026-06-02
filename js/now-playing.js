const DISCORD_USER_ID = "1464890289922641993";

(function nowPlaying() {
  const el = document.getElementById("now-playing");
  if (!el) return;

  // Stay hidden until configured (keeps the widget invisible on a fresh clone)
  if (!DISCORD_USER_ID || DISCORD_USER_ID === "REPLACE_WITH_YOUR_DISCORD_USER_ID") {
    return;
  }

  const artEl = el.querySelector(".np-art");
  const labelEl = el.querySelector(".np-label");
  const statusLabelEl = el.querySelector(".np-status-label");
  const trackEl = el.querySelector(".np-track");
  const artistEl = el.querySelector(".np-artist");
  const fillEl = el.querySelector(".np-fill");
  const curEl = el.querySelector(".np-cur");
  const durEl = el.querySelector(".np-dur");

  const STATUS_LABELS = {
    online: "Online",
    idle: "Idle",
    dnd: "Do Not Disturb",
    offline: "Offline",
  };

  let latest = null;        // last presence payload
  let progressTimer = null; // 1s ticker while a track is playing
  let ws = null;
  let heartbeat = null;
  let reconnectDelay = 1000;

  function fmt(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function clamp(n, lo, hi) {
    return Math.min(Math.max(n, lo), hi);
  }

  // ---- snap album-art colour to the active Catppuccin palette ------------
  // The accent vars are read live from CSS, so this follows whichever flavour
  // (mocha / macchiato / frappe / latte) is currently active.
  const ACCENT_VARS = [
    "rosewater", "flamingo", "pink", "mauve", "red", "maroon", "peach",
    "yellow", "green", "teal", "sky", "saphire", "blue", "lavender",
  ];

  function hexToRgb(hex) {
    hex = hex.trim().replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function getThemePalette() {
    const cs = getComputedStyle(document.documentElement);
    const pal = [];
    for (const name of ACCENT_VARS) {
      const v = cs.getPropertyValue("--" + name).trim();
      if (v.startsWith("#")) {
        const [r, g, b] = hexToRgb(v);
        pal.push({ name, r, g, b });
      }
    }
    return pal;
  }

  // Nearest palette swatch using a redmean-weighted distance (closer to how
  // the eye judges colour difference than plain RGB distance).
  function nearestAccent(r, g, b) {
    const pal = getThemePalette();
    let best = null, bestD = Infinity;
    for (const c of pal) {
      const rm = (r + c.r) / 2;
      const dr = r - c.r, dg = g - c.g, db = b - c.b;
      const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  }

  // ---- album-art accent colour -------------------------------------------
  let lastArtUrl = null;
  function applyAccent(url) {
    if (!url || url === lastArtUrl) return;
    lastArtUrl = url;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        const size = 16;
        c.width = size;
        c.height = size;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 125) continue;
          // skip near-black/near-white so the tint stays vivid
          const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          if (lum < 24 || lum > 235) continue;
          r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
        }
        if (!count) { resetAccent(); return; }
        r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
        // Snap the average album colour to the nearest Catppuccin accent
        const near = nearestAccent(r, g, b);
        const rgb = near ? `${near.r}, ${near.g}, ${near.b}` : `${r}, ${g}, ${b}`;
        el.style.setProperty("--np-accent", rgb);
        el.classList.add("has-accent");
        // Drive the whole page's accent (nav, badges, name, link hovers…)
        document.documentElement.style.setProperty("--accent-rgb", rgb);
      } catch (e) {
        resetAccent(); // tainted canvas / CORS — fall back to theme colour
      }
    };
    img.onerror = resetAccent;
    img.src = url;
  }

  function resetAccent() {
    el.classList.remove("has-accent");
    el.style.removeProperty("--np-accent");
    // Hand the page's accent back to the active theme's pink
    document.documentElement.style.removeProperty("--accent-rgb");
  }

  // ---- rendering ----------------------------------------------------------
  function stopProgress() {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
  }

  function tickProgress(spotify) {
    const start = spotify.timestamps && spotify.timestamps.start;
    const end = spotify.timestamps && spotify.timestamps.end;
    if (!start || !end || end <= start) {
      el.classList.remove("has-progress");
      return;
    }
    el.classList.add("has-progress");
    const now = Date.now();
    const elapsed = clamp(now - start, 0, end - start);
    const pct = clamp((elapsed / (end - start)) * 100, 0, 100);
    fillEl.style.width = pct + "%";
    curEl.textContent = fmt(elapsed);
    durEl.textContent = fmt(end - start);
  }

  function render(d) {
    if (!d) return;
    const status = d.discord_status || "offline";
    el.dataset.status = status;

    // Discord status word — always shown (coexists with the track)
    statusLabelEl.textContent = STATUS_LABELS[status] || "Offline";

    const spotify = d.listening_to_spotify && d.spotify ? d.spotify : null;

    if (spotify) {
      el.classList.add("is-live");
      labelEl.textContent = "Now playing";
      trackEl.textContent = spotify.song || "";
      artistEl.textContent = spotify.artist || "";

      if (spotify.album_art_url) {
        artEl.src = spotify.album_art_url;
        artEl.style.display = "";
        applyAccent(spotify.album_art_url);
      } else {
        artEl.style.display = "none";
        resetAccent();
      }

      el.href = spotify.track_id
        ? `https://open.spotify.com/track/${spotify.track_id}`
        : "https://open.spotify.com/";

      stopProgress();
      tickProgress(spotify);
      progressTimer = setInterval(() => tickProgress(spotify), 1000);
    } else {
      // Not listening — just the Discord status (dot + word in the head)
      el.classList.remove("is-live", "has-progress");
      stopProgress();
      resetAccent();
      trackEl.textContent = "";
      artistEl.textContent = "";
      artEl.style.display = "none";
      el.href = "https://discord.gg/TransRights";
    }

    el.hidden = false;
  }

  // ---- Lanyard websocket --------------------------------------------------
  function connect() {
    ws = new WebSocket("wss://api.lanyard.rest/socket");

    ws.addEventListener("message", (evt) => {
      let msg;
      try { msg = JSON.parse(evt.data); } catch (e) { return; }

      // op 1 = Hello: start heartbeat, then subscribe
      if (msg.op === 1) {
        const interval = (msg.d && msg.d.heartbeat_interval) || 30000;
        if (heartbeat) clearInterval(heartbeat);
        heartbeat = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 3 }));
        }, interval);
        ws.send(JSON.stringify({
          op: 2,
          d: { subscribe_to_id: DISCORD_USER_ID },
        }));
        return;
      }

      // op 0 = Event: INIT_STATE or PRESENCE_UPDATE
      if (msg.op === 0) {
        const d = msg.t === "INIT_STATE"
          ? (msg.d && msg.d[DISCORD_USER_ID]) || msg.d
          : msg.d;
        latest = d;
        render(d);
      }
    });

    ws.addEventListener("open", () => { reconnectDelay = 1000; });

    ws.addEventListener("close", () => {
      if (heartbeat) { clearInterval(heartbeat); heartbeat = null; }
      stopProgress();
      // exponential backoff up to 30s
      setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    });

    ws.addEventListener("error", () => { try { ws.close(); } catch (e) {} });
  }

  connect();

  // keep the progress bar honest when returning to the tab
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && latest) render(latest);
  });
})();
