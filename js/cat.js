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

/* ============================================================
   Secret cat modes — click the cat to cycle/unlock looks,
   press C to open the picker. (merged from cat-modes.js)
   ============================================================ */
const CAT_MODES = [
  { name: "Classic", filter: "none" },
  { name: "Shadow Cat", filter: "invert(1) drop-shadow(0 0 3px #cba6f7)" },
  { name: "Ghost Cat", filter: "grayscale(1) brightness(1.7) opacity(0.55) drop-shadow(0 0 4px #89dceb)" },
  { name: "CRT Cat", filter: "invert(48%) sepia(80%) saturate(2000%) hue-rotate(85deg) brightness(0.9) contrast(1.2)" },
  { name: "Vaporwave Cat", filter: "invert(60%) sepia(90%) saturate(3000%) hue-rotate(280deg) brightness(0.95)" },
  { name: "Gold Cat", filter: "invert(75%) sepia(85%) saturate(1400%) hue-rotate(8deg) brightness(1.0)" },
  { name: "Sapphire Cat", filter: "invert(45%) sepia(90%) saturate(2500%) hue-rotate(200deg) brightness(1.0)" },
  { name: "Dusty Cat", filter: "invert(60%)" },
];
const UNLOCK_EVERY = 5; // clicks needed to unlock each new mode
const SPRITE = "/images/misc/oneko.gif";
const IDLE_POS = "-96px -96px"; // idle frame of the sprite sheet

(function catModes() {
  const oneko = document.getElementById("oneko");
  if (!oneko) return;

  oneko.style.pointerEvents = "auto";
  oneko.style.cursor = "pointer";

  const ls = window.localStorage;
  let clicks = parseInt(ls.getItem("onekoClicks") || "0", 10);
  let mode = parseInt(ls.getItem("onekoMode") || "0", 10);

  const unlockedCount = () =>
    Math.min(CAT_MODES.length, 1 + Math.floor(clicks / UNLOCK_EVERY));
  const isUnlocked = (i) => i < unlockedCount();
  const apply = (i) => (oneko.style.filter = CAT_MODES[i].filter);

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

  function renderGrid() {
    grid.innerHTML = "";
    CAT_MODES.forEach((c, i) => {
      const unlocked = isUnlocked(i);
      const opt = document.createElement(unlocked ? "button" : "div");
      opt.className =
        "cat-option" + (unlocked ? "" : " locked") + (i === mode ? " current" : "");
      if (unlocked) opt.type = "button";
      const previewFilter = unlocked ? c.filter : "brightness(0) opacity(0.3)";
      opt.innerHTML = `
        <span class="cat-preview" style="background-image:url('${SPRITE}');background-position:${IDLE_POS};filter:${previewFilter}"></span>
        <span class="cat-name">${unlocked ? c.name : "???"}</span>`;
      if (unlocked) opt.addEventListener("click", () => selectMode(i));
      grid.appendChild(opt);
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

  /* ---------- init + cat click ---------- */
  mode = Math.max(0, Math.min(mode, unlockedCount() - 1));
  apply(mode);

  oneko.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const before = unlockedCount();
    clicks += 1;
    ls.setItem("onekoClicks", String(clicks));
    const after = unlockedCount();

    if (after > before) {
      mode = after - 1;
      toast(`✨ Unlocked: ${CAT_MODES[mode].name}!`);
    } else {
      mode = (mode + 1) % after;
      toast(CAT_MODES[mode].name);
    }

    ls.setItem("onekoMode", String(mode));
    apply(mode);
    if (!overlay.hidden) renderGrid();
  });
})();
