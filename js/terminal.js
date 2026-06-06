/* =====================================================================
 * terminal.js — the homepage's interactive terminal.
 *
 * Flow: a short boot log streams in, the side chrome fades in alongside
 * it, then the banner + a pinned prompt appear. You type a command (or a
 * social's name) and the output is appended to the scrollback BELOW the
 * input — the input itself never moves.
 * ===================================================================== */
(function terminal() {
  const root = document.getElementById("terminal");
  if (!root) return;

  // ---- socials (keyword -> destination) ----------------------------------
  const SOCIALS = {
    github: { label: "GitHub", sub: "@doughmination", url: "https://github.com/doughmination" },
    gitgay: { label: "Git.Gay", sub: "@doughmination", url: "https://git.gay/doughmination", aliases: ["git.gay", "gitea"] },
    twitter: { label: "Twitter", sub: "@DoughminCEO", url: "https://x.com/DoughminCEO", aliases: ["x"] },
    bluesky: { label: "Bluesky", sub: "@doughmination.win", url: "https://bsky.app/profile/doughmination.win", aliases: ["bsky"] },
    linkedin: { label: "LinkedIn", sub: "Clove Twilight", url: "https://www.linkedin.com/in/estrogen/" },
    spotify: { label: "Spotify", sub: "doughmination", url: "https://open.spotify.com/user/x060f5w4ftwv8zc8fi9662t70" },
    discord: { label: "Discord", sub: "Girls Discord Server", url: "https://discord.gg/TransRights" },
    twitch: { label: "Twitch", sub: "@doughminationgaming", url: "https://www.twitch.tv/doughminationgaming" },
    reddit: { label: "Reddit", sub: "u/XerinDotZero", url: "https://www.reddit.com/user/XerinDotZero/" },
    youtube: { label: "YouTube", sub: "@CloveTwiGaming", url: "https://www.youtube.com/@CloveTwiGaming", aliases: ["yt"] },
    mastodon: { label: "Mastodon", sub: "@doughmination@mastodon.social", url: "https://mastodon.social/@doughmination" },
    email: { label: "Email", sub: "admin@doughmination.win", url: "mailto:admin@doughmination.win", aliases: ["mail"] },
    portfolio: { label: "Portfolio", sub: "doughmination.co.uk", url: "https://doughmination.co.uk/", aliases: ["website", "site"] }
  };
  const ALIASES = {};
  Object.keys(SOCIALS).forEach((k) => {
    (SOCIALS[k].aliases || []).forEach((a) => { ALIASES[a] = k; });
  });
  // keyword -> svg filename in /assets/socials
  const SOCIAL_ICON = {
    github: "github", gitgay: "git-gay", twitter: "twitter", bluesky: "bluesky",
    linkedin: "linkedin", spotify: "spotify", discord: "discord", twitch: "twitch",
    reddit: "reddit", youtube: "youtube", mastodon: "mastodon", email: "email",
    company: "site", portfolio: "site"
  };
  function iconImg(key) {
    return '<img class="t-social-ic" src="/assets/socials/' + (SOCIAL_ICON[key] || "site") + '.svg" alt="">';
  }

  // ---- friends (keyword -> who they are) ---------------------------------
  // Edit these freely. `desc` is the sentence shown by `whois`; add a `url`
  // (+ optional `urlLabel`) to attach a clickable link.
  const FRIENDS = {
    ari: { name: "Ari", desc: "my girlfriend 💜 — the best. her corner of the web:", url: "https://REPLACE-with-aris-site.example", urlLabel: "ari's site" },
    camilla: { name: "Camilla", desc: "a close friend. (add a blurb + link here)", url: "" },
    ria: { name: "Ria", desc: "a close friend. (add a blurb + link here)", url: "" }
  };

  let cache = null;
  async function checkDomain(subdomain) {
    if (!cache) {
      const response = await fetch("https://raw.is-a.dev/v2.json");
      cache = await response.json();
    }
    return cache.some((d) => d.subdomain === subdomain);
  }

  // arch.ascii (hyfetch format) is fetched once at startup for `hyfetch`.
  let archLines = null;
  function loadArt() {
    fetch("/arch.ascii").then(function (r) { return r.ok ? r.text() : ""; }).then(function (t) {
      if (!t) return;
      var lines = t.replace(/\r/g, "").split("\n");
      if (lines[0] && lines[0].trim().charAt(0) === "{") lines.shift(); // drop hyfetch json header
      lines = lines.map(function (l) { return l.replace(/\$\{c\d\}/g, ""); });
      while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
      archLines = lines;
    }).catch(function () { });
  }

  // ---- ascii banner -------------------------------------------------------
  const BANNER = [
    " ██████╗██╗      ██████╗ ██╗   ██╗███████╗",
    "██╔════╝██║     ██╔═══██╗██║   ██║██╔════╝",
    "██║     ██║     ██║   ██║██║   ██║█████╗  ",
    "██║     ██║     ██║   ██║╚██╗ ██╔╝██╔══╝  ",
    "╚██████╗███████╗╚██████╔╝ ╚████╔╝ ███████╗",
    " ╚═════╝╚══════╝ ╚═════╝   ╚═══╝  ╚══════╝"
  ].join("\n");

  // ---- boot log -----------------------------------------------------------
  const BOOT = [
    ["info", "starting clovesh..."],
    ["info", "mounting /dev/estrogen..."],
    ["ok", "estrogen levels nominal"],
    ["info", "loading kernel modules (catppuccin)..."],
    ["ok", "modules loaded"],
    ["info", "summoning cats..."],
    ["ok", "oneko ready"],
    ["info", "connecting to discord via lanyard..."],
    ["ok", "presence online"],
    ["info", "mounting button wall..."],
    ["ok", "88x31 buttons hung"],
    ["info", "starting terminal..."],
    ["ok", "ready — type 'help'"]
  ];

  // ---- build DOM ----------------------------------------------------------
  root.innerHTML =
    '<pre class="t-boot" id="t-boot" aria-hidden="true"></pre>' +
    '<div class="t-main" id="t-main" hidden>' +
    '<pre class="t-banner">' + esc(BANNER) + "</pre>" +
    '<div class="t-greet">Hi! I\'m <b>Clove</b> <span class="t-dim">(fae/faer)</span>. ' +
    "Type <b>help</b> for commands, or <b>socials</b> to browse.</div>" +
    '<div class="t-inputline">' +
    '<span class="t-prompt">clove@doughmination<span class="t-path">:~$</span></span>' +
    '<input class="t-input" id="t-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false">' +
    "</div>" +
    '<div class="t-output" id="t-output"></div>' +
    "</div>";

  const bootEl = root.querySelector("#t-boot");
  const mainEl = root.querySelector("#t-main");
  const input = root.querySelector("#t-input");
  const output = root.querySelector("#t-output");

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function stamp() {
    return new Date().toLocaleTimeString("en-GB", { hour12: false });
  }

  // ---- command handlers ---------------------------------------------------
  const COMMANDS = {
    help() {
      const rows = [
        ["help", "show this list"],
        ["socials", "list all socials"],
        ["<social>", "show a social & ask to open it (e.g. github)"],
        ["<social> -open", "open a social straight away"],
        ["friends", "people I know"],
        ["whois <name>", "details about a friend (e.g. ari)"],
        ["about", "a little about me"],
        ["hyfetch", "system info, with flair"]
      ];
      let out = "Available commands:\n";
      out += rows.map((r) => "  " + r[0].padEnd(12) + r[1]).join("\n");
      out += "\n\nTip: type a social's name (try 'socials') to open it.";
      return { text: out };
    },
    socials() {
      const items = Object.keys(SOCIALS)
        .map((k) => '<span class="t-ls-item">' + esc(k) + "</span>").join("");
      return {
        html: '<div class="t-ls">' + items + "</div>" +
          '<div class="t-dim t-ls-foot">type one to view it, or <b>&lt;name&gt; -open</b> to open</div>'
      };
    },
    about() {
      return {
        text:
          "Clove Twilight — fae/faer\n" +
          "Transfem developer from Southampton, UK. I make Discord bots,\n" +
          "personal-site nonsense, and run a small corner of the internet\n" +
          "under 'doughmination'. Big on Linux, Catppuccin, and cats.\n\n" +
          "This site is the beta playground for clove.is-a.dev — expect things\n" +
          "to break in fun ways. Type 'socials' to find me elsewhere."
      };
    },
    friends() {
      const items = Object.keys(FRIENDS)
        .map((k) => '<span class="t-ls-item">' + esc(k) + "</span>").join("");
      return {
        html: '<div class="t-ls">' + items + "</div>" +
          '<div class="t-dim t-ls-foot">run <b>whois &lt;name&gt;</b> for details</div>'
      };
    },
    whois(args) {
      const who = (args[0] || "").toLowerCase();
      if (!who) return { text: "usage: whois <name>  —  try 'friends' for the list." };
      const f = FRIENDS[who];
      if (!f) return { text: "whois: no record of '" + who + "'.\ntype 'friends' to see who I know.", error: true };
      let html = '<div class="t-whois">' +
        '<div class="t-whois-name"><b class="t-accent">' + esc(f.name) + "</b></div>" +
        "<div>" + esc(f.desc || "");
      if (f.url) {
        html += ' <a class="t-sc-url" href="' + esc(f.url) + '" target="_blank" rel="noopener">' +
          esc(f.urlLabel || f.url) + "</a>";
      }
      html += "</div></div>";
      return { html: html };
    },
    hyfetch() {
      const flavor = document.documentElement.getAttribute("data-flavor") || "mocha";
      const info = [
        '<b class="t-accent">clove</b>@<b class="t-accent">doughmination</b>',
        "-----------------------",
        "OS........ Arch Linux (btw)",
        "Host...... doughmination.is-a.dev",
        "Kernel.... catppuccin-" + flavor,
        "Shell..... clovesh 1.0",
        "Theme..... " + flavor.charAt(0).toUpperCase() + flavor.slice(1),
        "Pronouns.. fae/faer",
        "Uptime.... " + uptime(),
        "Cats...... too many"
      ].join("\n");


      // paint the arch logo in the trans flag, hyfetch-style
      if (!archLines || !archLines.length) {
        return { html: '<pre class="hf-info">' + info + "</pre>" };
      }
      const colors = ["#5bcefa", "#f5a9b8", "#ffffff", "#f5a9b8", "#5bcefa"];
      const n = archLines.length;
      const logo = archLines.map(function (ln, i) {
        const c = colors[Math.min(colors.length - 1, Math.floor((i / n) * colors.length))];
        return '<span style="color:' + c + '">' + esc(ln) + "</span>";
      }).join("\n");
      return {
        html: '<div class="hf"><pre class="hf-logo">' + logo + "</pre>" +
          '<pre class="hf-info">' + info + "</pre></div>"
      };
    },
    async isadotdev(parts) {
      const arg = (parts[0] || "").toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
      if (!arg || !arg.endsWith(".is-a.dev")) {
        return { text: "usage: isadotdev <subdomain>.is-a.dev", error: true };
      }
      const sub = arg.replace(/\.is-a\.dev$/, "");
      if (["clove", "doughmination"].indexOf(sub) >= 0) {
        return { text: "nice try 👀", error: true };
      }
      showResult({ text: "checking " + arg + "…" });
      let found;
      try { found = await checkDomain(sub); }
      catch (e) { return { text: "couldn't reach the is-a.dev registry — try again later.", error: true }; }
      if (!found) return { text: arg + " isn't registered on is-a.dev.", error: true };
      window.open("https://" + arg, "_blank", "noopener");
      return { html: 'opening <b class="t-accent">' + esc(arg) + "</b> …" };
    },
  };

  // ---- runtime ------------------------------------------------------------
  const startedAt = Date.now();
  function uptime() {
    let s = Math.floor((Date.now() - startedAt) / 1000);
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    const parts = [];
    if (h) parts.push(h + "h");
    if (m) parts.push(m + "m");
    parts.push(s + "s");
    return parts.join(" ");
  }

  const history = [];
  let histIdx = -1;
  let pendingSocial = null;

  // Single-output model: each command REPLACES whatever was on screen.
  function showResult(result) {
    output.innerHTML = "";
    if (!result) return;
    const box = document.createElement("div");
    box.className = "t-result";
    if (result.error) box.classList.add("is-error");
    if (result.html != null) box.innerHTML = result.html;
    else if (result.text != null) box.textContent = result.text;
    output.appendChild(box);
    output.scrollTop = 0;
  }

  // Runs a command handler that may be sync (returns a result) or async
  // (returns a Promise of a result), and shows whatever it resolves to.
  function runCommand(fn, args) {
    let r;
    try { r = fn(args); }
    catch (e) { showResult({ text: "error running that command.", error: true }); return; }
    if (r && typeof r.then === "function") {
      r.then(showResult).catch(function () { showResult({ text: "something went wrong.", error: true }); });
    } else {
      showResult(r);
    }
  }

  function run(raw) {
    const cmd = raw.trim();
    output.innerHTML = "";          // clear the previous output first
    if (!cmd) { pendingSocial = null; return; }
    history.push(cmd); histIdx = history.length;

    const parts = cmd.split(/\s+/);
    const name = parts[0].toLowerCase();
    const flags = parts.slice(1).map((p) => p.toLowerCase());
    const wantsOpen = flags.indexOf("-open") >= 0 || flags.indexOf("--open") >= 0 || flags.indexOf("-o") >= 0;

    // answering a pending "open it?" prompt
    if (pendingSocial) {
      if (["y", "yes", "open", "o"].indexOf(name) >= 0) { openSocial(pendingSocial); return; }
      if (["n", "no"].indexOf(name) >= 0) { pendingSocial = null; showResult({ text: "okay, leaving it closed." }); return; }
      pendingSocial = null; // anything else: fall through to normal handling
    }

    // "open <social>" or a bare social name
    const socialKey = resolveSocial(name === "open" ? flags[0] : name);
    if (socialKey) {
      if (wantsOpen || name === "open") openSocial(socialKey);
      else promptSocial(socialKey);
      return;
    }

    if (name.endsWith(".is-a.dev")) {
      runCommand(COMMANDS.isadotdev, [name]);
      return;
    }

    if (COMMANDS[name]) { runCommand(COMMANDS[name], parts.slice(1)); return; }

    showResult({ text: "clovesh: command not found: " + name + "\nType 'help' for a list, or 'socials' to browse.", error: true });
  }

  function promptSocial(key) {
    const s = SOCIALS[key];
    pendingSocial = key;
    showResult({
      html:
        '<div class="t-social-card">' +
        '<div class="t-sc-head">' + iconImg(key) +
        '<span><b class="t-accent">' + esc(s.label) + "</b> " +
        '<span class="t-dim">' + esc(s.sub) + "</span></span></div>" +
        '<a class="t-sc-url" href="' + esc(s.url) + '"' +
        (s.url.startsWith("mailto:") ? "" : ' target="_blank" rel="noopener"') + ">" + esc(s.url) + "</a>" +
        '<div class="t-sc-ask t-dim">open it? type <b>y</b>  ·  or run <b>' + esc(key) + " -open</b>  ·  <b>n</b> to cancel</div>" +
        "</div>"
    });
  }

  function resolveSocial(key) {
    if (!key) return null;
    if (SOCIALS[key]) return key;
    if (ALIASES[key]) return ALIASES[key];
    return null;
  }
  function openSocial(key) {
    pendingSocial = null;
    const s = SOCIALS[key];
    showResult({
      html: '<a class="t-social-open" href="' + esc(s.url) + '"' +
        (s.url.startsWith("mailto:") ? "" : ' target="_blank" rel="noopener"') + ">" +
        iconImg(key) + "opening <b class=\"t-accent\">" + esc(s.label) + "</b> " +
        '<span class="t-dim">' + esc(s.url) + "</span> …</a>"
    });
    if (s.url.startsWith("mailto:")) { window.location.href = s.url; }
    else { window.open(s.url, "_blank", "noopener"); }
  }

  // ---- tab-complete + history --------------------------------------------
  const COMPLETIONS = Object.keys(COMMANDS).concat(["open", "socials", "isadotdev"], Object.keys(SOCIALS), Object.keys(ALIASES), Object.keys(FRIENDS));
  function complete(prefix) {
    if (!prefix) return null;
    const hits = COMPLETIONS.filter((c) => c.indexOf(prefix) === 0);
    if (hits.length === 1) return hits[0];
    return null;
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const v = input.value;
      input.value = "";
      run(v);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (histIdx > 0) { histIdx--; input.value = history[histIdx] || ""; moveCaretEnd(); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx] || ""; }
      else { histIdx = history.length; input.value = ""; }
      moveCaretEnd();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const c = complete(input.value.trim().toLowerCase());
      if (c) input.value = c;
    }
  });
  function moveCaretEnd() {
    requestAnimationFrame(() => { input.selectionStart = input.selectionEnd = input.value.length; });
  }

  // clicking anywhere on the terminal focuses the prompt (unless selecting text)
  root.addEventListener("click", () => {
    if ((window.getSelection() + "") === "") input.focus();
  });

  // ---- boot then reveal ---------------------------------------------------
  document.body.classList.add("term-booting");

  let booted = false;
  function finishBoot() {
    if (booted) return;
    booted = true;
    bootEl.hidden = true;
    mainEl.hidden = false;
    document.body.classList.remove("term-booting");
    document.body.classList.add("term-ready");
    input.focus();
  }

  function streamBoot(i) {
    if (booted) return;
    if (i >= BOOT.length) { setTimeout(finishBoot, 350); return; }
    const [kind, msg] = BOOT[i];
    const tag = kind === "ok"
      ? '<span class="b-ok">  OK  </span>'
      : '<span class="b-info"> INFO </span>';
    bootEl.insertAdjacentHTML("beforeend",
      '<span class="b-line">[<span class="b-time">' + stamp() + "</span>] [" + tag + "] " + esc(msg) + "</span>\n");
    bootEl.scrollTop = bootEl.scrollHeight;
    setTimeout(() => streamBoot(i + 1), 120 + Math.random() * 120);
  }

  // let users skip the boot
  function skipHandler(e) {
    if (e.type === "keydown" || e.type === "click") finishBoot();
  }
  document.addEventListener("keydown", skipHandler, { once: false });

  // kick things off; reveal side chrome almost immediately
  loadArt();
  requestAnimationFrame(() => document.body.classList.add("term-chrome-in"));
  streamBoot(0);
})();