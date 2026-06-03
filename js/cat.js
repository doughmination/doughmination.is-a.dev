// oneko.js: https://github.com/adryd325/oneko.js

(function oneko() {
  const isReducedMotion =
    window.matchMedia(`(prefers-reduced-motion: reduce)`) === true ||
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

  if (isReducedMotion) return;

  const nekoEl = document.createElement("div");
  let persistPosition = true;

  let nekoPosX = 32;
  let nekoPosY = 32;

  let mousePosX = 0;
  let mousePosY = 0;

  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;

  const nekoSpeed = 10;
  const spriteSets = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [
      [-5, 0],
      [-6, 0],
      [-7, 0],
    ],
    scratchWallN: [
      [0, 0],
      [0, -1],
    ],
    scratchWallS: [
      [-7, -1],
      [-6, -2],
    ],
    scratchWallE: [
      [-2, -2],
      [-2, -3],
    ],
    scratchWallW: [
      [-4, 0],
      [-4, -1],
    ],
    tired: [[-3, -2]],
    sleeping: [
      [-2, 0],
      [-2, -1],
    ],
    N: [
      [-1, -2],
      [-1, -3],
    ],
    NE: [
      [0, -2],
      [0, -3],
    ],
    E: [
      [-3, 0],
      [-3, -1],
    ],
    SE: [
      [-5, -1],
      [-5, -2],
    ],
    S: [
      [-6, -3],
      [-7, -2],
    ],
    SW: [
      [-5, -3],
      [-6, -1],
    ],
    W: [
      [-4, -2],
      [-4, -3],
    ],
    NW: [
      [-1, 0],
      [-1, -1],
    ],
  };

  function init() {
    let nekoFile = "./oneko.gif"
    const curScript = document.currentScript
    if (curScript && curScript.dataset.cat) {
      nekoFile = curScript.dataset.cat
    }
    if (curScript && curScript.dataset.persistPosition) {
      if (curScript.dataset.persistPosition === "") {
        persistPosition = true;
      } else {
        persistPosition = JSON.parse(curScript.dataset.persistPosition.toLowerCase());
      }
    }

    if (persistPosition) {
      let storedNeko = JSON.parse(window.localStorage.getItem("oneko"));
      if (storedNeko !== null) {
        nekoPosX = storedNeko.nekoPosX;
        nekoPosY = storedNeko.nekoPosY;
        mousePosX = storedNeko.mousePosX;
        mousePosY = storedNeko.mousePosY;
        frameCount = storedNeko.frameCount;
        idleTime = storedNeko.idleTime;
        idleAnimation = storedNeko.idleAnimation;
        idleAnimationFrame = storedNeko.idleAnimationFrame;
        nekoEl.style.backgroundPosition = storedNeko.bgPos;
      }
    }

    nekoEl.id = "oneko";
    nekoEl.ariaHidden = true;
    nekoEl.style.width = "32px";
    nekoEl.style.height = "32px";
    nekoEl.style.position = "fixed";
    nekoEl.style.pointerEvents = "none";
    nekoEl.style.imageRendering = "pixelated";
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
    nekoEl.style.zIndex = 2147483647;

    nekoEl.style.backgroundImage = `url(${nekoFile})`;

    document.body.appendChild(nekoEl);

    document.addEventListener("mousemove", function (event) {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    });

    if (persistPosition) {
      window.addEventListener("beforeunload", function (event) {
        window.localStorage.setItem("oneko", JSON.stringify({
          nekoPosX: nekoPosX,
          nekoPosY: nekoPosY,
          mousePosX: mousePosX,
          mousePosY: mousePosY,
          frameCount: frameCount,
          idleTime: idleTime,
          idleAnimation: idleAnimation,
          idleAnimationFrame: idleAnimationFrame,
          bgPos: nekoEl.style.backgroundPosition
        }));
      });
    }

    window.requestAnimationFrame(onAnimationFrame);
  }

  let lastFrameTimestamp;

  function onAnimationFrame(timestamp) {
    // Stops execution if the neko element is removed from DOM
    if (!nekoEl.isConnected) {
      return;
    }
    if (!lastFrameTimestamp) {
      lastFrameTimestamp = timestamp;
    }
    if (timestamp - lastFrameTimestamp > 100) {
      lastFrameTimestamp = timestamp;
      frame();
    }
    window.requestAnimationFrame(onAnimationFrame);
  }

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;

    // every ~ 20 seconds
    if (
      idleTime > 10 &&
      Math.floor(Math.random() * 200) == 0 &&
      idleAnimation == null
    ) {
      let avalibleIdleAnimations = ["sleeping", "scratchSelf"];
      if (nekoPosX < 32) {
        avalibleIdleAnimations.push("scratchWallW");
      }
      if (nekoPosY < 32) {
        avalibleIdleAnimations.push("scratchWallN");
      }
      if (nekoPosX > window.innerWidth - 32) {
        avalibleIdleAnimations.push("scratchWallE");
      }
      if (nekoPosY > window.innerHeight - 32) {
        avalibleIdleAnimations.push("scratchWallS");
      }
      idleAnimation =
        avalibleIdleAnimations[
        Math.floor(Math.random() * avalibleIdleAnimations.length)
        ];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) {
          resetIdleAnimation();
        }
        break;
      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setSprite(idleAnimation, idleAnimationFrame);
        if (idleAnimationFrame > 9) {
          resetIdleAnimation();
        }
        break;
      default:
        setSprite("idle", 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  function frame() {
    frameCount += 1;
    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < nekoSpeed || distance < 48) {
      idle();
      return;
    }

    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
      setSprite("alert", 0);
      // count down after being alerted before moving
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    let direction;
    direction = diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";
    setSprite(direction, frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;

    nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
    nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);

    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
  }

  init();
})();

const BASE_SPRITE = "/assets/oneko/cats/classic.png";
const ONEKO = (f) => `/assets/oneko/cats/${f}`;
const PRIDE = (g) => `/assets/oneko/pride/${g}`;

const CAT_MODES = [
  // -- Pride --

  { name: "Bisexual", sprite: PRIDE("bisexual.png"), is_unlocked: "gay", category: "Pride"},
  { name: "Genderfae", sprite: PRIDE("genderfae.png"), is_unlocked: "gay", category: "Pride"},
  { name: "Genderfluid", sprite: PRIDE("genderfluid.png"), is_unlocked: "gay", category: "Pride"},
  { name: "Lesbian", sprite: PRIDE("lesbian.png"), is_unlocked: "gay", category: "Pride" },
  { name: "MLM", sprite: PRIDE("mlm.png"), is_unlocked: "gay", category: "Pride"},
  { name: "Non Binary", sprite: PRIDE("nb.png"), is_unlocked: "gay", category: "Pride" },
  { name: "Transgender", sprite: PRIDE("trans.png"), is_unlocked: "gay", category: "Pride" },

  // -- Classics --
  { name: "Classic", filter: "none", is_unlocked: "gay", category: "Classics" },
  { name: "Sapphire Cat", sprite: ONEKO("sapphire.png"), is_unlocked: "filter", category: "Classics" },
  { name: "Dusty Cat", sprite: ONEKO("dusty.png"), is_unlocked: "filter", category: "Classics" },
  { name: "Ghost Spirit", sprite: ONEKO("ghostspirit.png"), filter: "drop-shadow(0 0 4px #89dceb)", is_unlocked: "filter", category: "Classics" },

  // -- Konami --
  { name: "Ace", sprite: ONEKO("ace.png"), is_unlocked: "weed", category: "Classics" },
  { name: "Black", sprite: ONEKO("black.png"), is_unlocked: "konami", category: "Classics" },
  { name: "Calico", sprite: ONEKO("calico.png"), is_unlocked: "konami", category: "Classics" },
  { name: "Dog", sprite: ONEKO("dog.png"), is_unlocked: "konami", category: "Classics" },
  { name: "Gray", sprite: ONEKO("gray.png"), is_unlocked: "konami", category: "Classics" },
  { name: "Silver", sprite: ONEKO("silver.png"), is_unlocked: "konami", category: "Classics" },
  { name: "Silver Sky", sprite: ONEKO("silversky.png"), is_unlocked: "konami", category: "Classics" },
  { name: "Kina", sprite: ONEKO("kina.png"), is_unlocked: "konami", category: "Classics" },
  { name: "Tora", sprite: ONEKO("tora.png"), is_unlocked: "konami", category: "Classics" },
  { name: "Spirit", sprite: ONEKO("spirit.png"), is_unlocked: "konami", category: "Classics" },
  { name: "Mike", sprite: ONEKO("mike.png"), is_unlocked: "konami", category: "Classics" },
  { name: "Maria", sprite: ONEKO("maria.png"), is_unlocked: "konami", category: "Classics" },
  { name: "Maia", sprite: ONEKO("maia.png"), is_unlocked: "konami", category: "Classics" },
  { name: "Lucy", sprite: ONEKO("lucy.png"), is_unlocked: "konami", category: "Classics" },
  { name: "Jess", sprite: ONEKO("jess.png"), is_unlocked: "konami", category: "Classics" },

  // -- Weed --
  { name: "Vaporwave", sprite: ONEKO("vaporwave.png"), is_unlocked: "weed", category: "Classics" },
  { name: "Snuupy", sprite: ONEKO("snuupy.png"), is_unlocked: "weed", category: "Classics" },
  { name: "Ghost", sprite: ONEKO("ghost.png"), is_unlocked: "weed", category: "Classics" },

  // -- Romance --
  { name: "Esmeralda", sprite: ONEKO("esmeralda.png"), is_unlocked: "romance", category: "Romance" },
  { name: "Valentine", sprite: ONEKO("valentine.png"), is_unlocked: "romance", category: "Romance" },

  // -- Pokemon --

  { name: "Eevee", sprite: ONEKO("eevee.png"), is_unlocked: "pokemon", category: "Pokémon" },
  { name: "Fox", sprite: ONEKO("fox.png"), is_unlocked: "pokemon", category: "Pokémon" },
  { name: "Bunny", sprite: ONEKO("bunny.png"), is_unlocked: "pokemon", category: "Pokémon" },


  // -- Rare (usually ones hard to get) --
  { name: "Gold Cat", sprite: ONEKO("gold.png"), is_unlocked: "gold", category: "Rare" },
];

// Order the category sections appear in the menu
const CATEGORY_ORDER = ["Classics", "Pride", "Romance", "Pokémon", "Rare"];

// click-count goals (total clicks on the cat)
const CLICK_GOALS = { filter: 13, romance: 69, weed: 420 };
const SPRITE = BASE_SPRITE; // base sprite used for filter modes + previews
const IDLE_POS = "-97px -97px"; // idle frame, inset 1px to avoid neighbour-frame bleed
const spriteFor = (c) => c.sprite || BASE_SPRITE;

(function catModes() {
  const oneko = document.getElementById("oneko");
  if (!oneko) return;

  oneko.style.pointerEvents = "auto";
  oneko.style.cursor = "pointer";

  const ls = window.localStorage;
  let clicks = parseInt(ls.getItem("onekoClicks") || "0", 10);
  let mode = parseInt(ls.getItem("onekoMode") || "0", 10);

  // permanently-earned methods (konami, gold, pokemon, + any click goal hit)
  let unlocks;
  try { unlocks = new Set(JSON.parse(ls.getItem("onekoUnlocks") || "[]")); }
  catch (e) { unlocks = new Set(); }
  const saveUnlocks = () => ls.setItem("onekoUnlocks", JSON.stringify([...unlocks]));

  // Returns true if a method was newly unlocked (false if already had it)
  function unlockMethod(key) {
    if (unlocks.has(key)) return false;
    unlocks.add(key);
    saveUnlocks();
    if (overlay && !overlay.hidden) renderGrid();
    return true;
  }

  const methodOf = (c) => c.is_unlocked || "gay";
  const isUnlocked = (i) => {
    const key = methodOf(CAT_MODES[i]);
    if (key === "gay") return true;
    if (key in CLICK_GOALS) return clicks >= CLICK_GOALS[key] || unlocks.has(key);
    return unlocks.has(key);              // konami / gold / pokemon
  };
  const unlockedIndices = () =>
    CAT_MODES.map((_, i) => i).filter(isUnlocked);

  const apply = (i) => {
    const c = CAT_MODES[i];
    oneko.style.backgroundImage = `url('${spriteFor(c)}')`;
    oneko.style.filter = c.filter || "none";
  };

  /* ---------- picker overlay (no visible trigger — press C to find it) ---------- */
  const overlay = document.createElement("div");
  overlay.className = "cat-picker";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="cat-picker-panel" role="dialog" aria-label="Choose a cat">
      <div class="cat-picker-head">
        <span>Cat collection</span>
        <button class="cat-picker-close" type="button" aria-label="Close">&times;</button>
      </div>
      <div class="cat-grid"></div>
      <p class="cat-hint">Some cats are still hidden&hellip; &middot; press C to toggle</p>
    </div>`;
  document.body.appendChild(overlay);
  const grid = overlay.querySelector(".cat-grid");

  function makeOption(i) {
    const c = CAT_MODES[i];
    const unlocked = isUnlocked(i);
    const opt = document.createElement(unlocked ? "button" : "div");
    opt.className =
      "cat-option" + (unlocked ? "" : " locked") + (i === mode ? " current" : "");
    if (unlocked) opt.type = "button";
    const previewFilter = unlocked ? (c.filter || "none") : "brightness(0) opacity(0.3)";
    opt.innerHTML = `
      <span class="cat-preview" style="background-image:url('${spriteFor(c)}');background-position:${IDLE_POS};filter:${previewFilter}"></span>
      <span class="cat-name">${unlocked ? c.name : "???"}</span>`;
    if (unlocked) opt.addEventListener("click", () => selectMode(i));
    return opt;
  }

  function renderGrid() {
    grid.innerHTML = "";

    // bucket cat indices by category
    const byCat = {};
    CAT_MODES.forEach((c, i) => {
      const cat = c.category || "Classics";
      (byCat[cat] = byCat[cat] || []).push(i);
    });

    // known categories first (in order), then any stragglers
    const order = CATEGORY_ORDER.filter((c) => byCat[c])
      .concat(Object.keys(byCat).filter((c) => !CATEGORY_ORDER.includes(c)));

    order.forEach((cat) => {
      const section = document.createElement("div");
      section.className = "cat-section";

      const title = document.createElement("h4");
      title.className = "cat-section-title";
      title.textContent = cat;
      section.appendChild(title);

      const items = document.createElement("div");
      items.className = "cat-section-items";
      byCat[cat].forEach((i) => items.appendChild(makeOption(i)));
      section.appendChild(items);

      grid.appendChild(section);
    });
  }

  function selectMode(i) {
    mode = i;
    ls.setItem("onekoMode", String(i));
    apply(i);
    renderGrid();
  }

  const openPicker = () => {
    renderGrid();
    overlay.hidden = false;
  };
  const closePicker = () => (overlay.hidden = true);
  const togglePicker = () => (overlay.hidden ? openPicker() : closePicker());

  // let other scripts (e.g. the theme-bar button) open the cat menu
  window.toggleCatPicker = togglePicker;

  overlay
    .querySelector(".cat-picker-close")
    .addEventListener("click", closePicker);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePicker();
  });
  document.addEventListener("keydown", (e) => {
    // ignore while typing in a field or with modifier keys held
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
    if (e.key === "Escape" && !overlay.hidden) {
      closePicker();
    } else if (
      (e.key === "c" || e.key === "C") &&
      !e.ctrlKey && !e.metaKey && !e.altKey && !typing
    ) {
      togglePicker();
    }
  });

  /* ---------- toast ---------- */
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "cat-toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.remove("show");
    void toastEl.offsetWidth;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1700);
  }

  /* ---------- squeak / boop sound on click ---------- */
  const boop = new Audio("/assets/oneko/boop.mp3");
  boop.preload = "auto";
  function playBoop() {
    try {
      boop.currentTime = 0;      // rewind so rapid clicks each squeak
      boop.play().catch(() => {}); // ignore autoplay/missing-file errors
    } catch (e) { /* no-op */ }
  }

  /* ---------- init + cat click ---------- */
  if (!isUnlocked(mode)) mode = 0; // fall back to Classic if current is locked
  apply(mode);

  // Clicking the cat no longer changes its look — it only counts toward
  // the click-based unlocks (13 / 69 / 420). Pick a cat from the menu.
  oneko.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    playBoop();
    clicks += 1;
    ls.setItem("onekoClicks", String(clicks));

    // Did this click hit a click-count goal exactly? (13 / 69 / 420)
    for (const key in CLICK_GOALS) {
      if (clicks === CLICK_GOALS[key]) {
        unlocks.add(key);
        saveUnlocks();
        const idx = CAT_MODES.findIndex((c) => methodOf(c) === key);
        const name = idx >= 0 ? CAT_MODES[idx].name : key;
        toast(`✨ Unlocked: ${name}! — open the cat menu 🐱`);
        if (!overlay.hidden) renderGrid();
      }
    }
  });

  /* ---------- Konami code → press Enter to confirm ---------- */
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let kProg = 0, kArmed = false;
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;

    if (kArmed && e.key === "Enter") {
      kArmed = false;
      if (unlockMethod("konami")) toast("✨ Konami cats unlocked!");
      return;
    }

    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === KONAMI[kProg]) {
      kProg += 1;
      if (kProg === KONAMI.length) {
        kProg = 0;
        kArmed = true;
        toast("Konami code… press Enter ↵");
      }
    } else {
      kProg = key === KONAMI[0] ? 1 : 0; // allow a fresh start on ↑
    }
  });

  /* ---------- Gold → opened the site while Discord status is Idle ---------- */
  const np = document.getElementById("now-playing");
  if (np) {
    const checkIdle = () => {
      if (np.dataset.status === "idle" && unlockMethod("gold")) {
        toast("✨ Gold Cat unlocked!");
      }
    };
    checkIdle();
    new MutationObserver(checkIdle)
      .observe(np, { attributes: true, attributeFilter: ["data-status"] });
  }

  /* ---------- Pokémon → find & click the hidden pokéball ---------- */
  const poke = document.getElementById("pokeball-secret");
  if (poke) {
    poke.addEventListener("click", (e) => {
      e.preventDefault();
      poke.classList.add("found");
      if (unlockMethod("pokemon")) toast("✨ Pokémon cats unlocked!");
    });
  }
})();
