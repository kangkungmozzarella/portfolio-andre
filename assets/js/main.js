(() => {
  "use strict";
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const saveData = navigator.connection?.saveData === true;
  const root = document.documentElement;
  const body = document.body;
  const nav = document.querySelector(".nav");
  const hero = document.querySelector(".hero");
  const dialog = document.querySelector(".project-dialog");
  const moving = () => !motion.matches;
  root.classList.toggle("motion", moving());

  function updateTime() {
    const now = new Date();
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = now.getFullYear();
    });
    const clock = document.querySelector(".local-time");
    clock.textContent = new Intl.DateTimeFormat("en-GB", {
      timeZone: clock.dataset.timezone || "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);
  }
  updateTime();
  setInterval(updateTime, 30000);

  // The nav steps aside while reading down and comes back on the way up.
  let lastY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 24);
      const goingDown = y > lastY && y > window.innerHeight * 0.6;
      nav.classList.toggle("is-hidden", goingDown && !body.classList.contains("menu-open") && !nav.contains(document.activeElement));
      lastY = y;
    },
    { passive: true },
  );

  // Mobile menu
  const menu = document.getElementById("menu");
  const menuToggle = document.querySelector(".menu-toggle");
  function setMenu(open) {
    menu.hidden = !open;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.querySelector(".menu-label").textContent = open ? "Close" : "Menu";
    body.classList.toggle("menu-open", open);
    // Keep Tab inside the open menu.
    document.querySelectorAll("main, .footer").forEach((el) => {
      el.inert = open;
    });
    if (open) menu.querySelector("a").focus();
  }
  menuToggle.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("click", (event) => {
    if (!menu.hidden && !nav.contains(event.target)) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      setMenu(false);
      menuToggle.focus();
    }
  });
  window.matchMedia("(min-width: 921px)").addEventListener("change", (event) => {
    if (event.matches) setMenu(false);
  });

  // Mark the section being read in the nav.
  const navLinks = [...document.querySelectorAll(".nav-links a")];
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            if (link.hash === "#" + entry.target.id) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    navLinks.forEach((link) => {
      const section = document.querySelector(link.hash);
      if (section) sectionObserver.observe(section);
    });
  }

  // Links from the previous layout (#projects, #profile) still land somewhere sensible.
  const oldHashes = { projects: "work", profile: "about" };
  const old = oldHashes[location.hash.slice(1)];
  if (old) {
    history.replaceState(null, "", "#" + old);
    document.getElementById(old)?.scrollIntoView();
  }

  // Split headings into words (or letters, for the name) that pop up one after
  // another. Each piece gets its own index and a random starting tilt.
  let pieceCount = 0;
  function piece(text, cls, i) {
    const span = document.createElement("span");
    span.className = cls;
    span.textContent = text;
    span.style.setProperty("--i", i);
    span.style.setProperty("--r", `${Math.round(Math.random() * 24 - 12)}deg`);
    return span;
  }
  function splitWords(node) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType !== Node.TEXT_NODE) return splitWords(child);
      const fragment = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) fragment.append(part);
        else fragment.append(piece(part, "w", pieceCount++));
      });
      child.replaceWith(fragment);
    });
  }
  function splitChars(node, start) {
    const fragment = document.createDocumentFragment();
    let i = start;
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) return fragment.append(" ");
      // Letters of one word stay together so the word never breaks across lines.
      const word = document.createElement("span");
      word.style.whiteSpace = "nowrap";
      [...part].forEach((char) => word.append(piece(char, "ch", i++)));
      fragment.append(word);
    });
    node.replaceChildren(fragment);
    return i;
  }
  const splits = [...document.querySelectorAll("[data-split]")];
  if (moving()) {
    const heroName = document.querySelector(".hero-name");
    heroName.setAttribute("aria-label", heroName.textContent.replace(/\s+/g, " ").trim());
    let chars = 0;
    splits.forEach((el) => {
      pieceCount = 0;
      if (el.dataset.split === "chars") {
        el.setAttribute("aria-hidden", "true");
        chars = splitChars(el, chars);
      } else splitWords(el);
    });
  }
  const reveal = (el) => el.classList.add("is-in");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    [...splits, ...document.querySelectorAll(".rise")].forEach((el) => {
      if (!el.closest(".hero")) revealObserver.observe(el);
    });
  } else {
    [...splits, ...document.querySelectorAll(".rise")].forEach(reveal);
  }

  // Marquee bands drift on their own and speed up with the scroll, the second one
  // running the other way. They hold still for visitors who prefer less motion.
  const bands = [...document.querySelectorAll(".band-track")];
  if (bands.length && moving()) {
    const offsets = bands.map(() => 0);
    let boost = 0;
    let lastScroll = window.scrollY;
    let bandsVisible = false;
    let bandsRunning = false;
    let then = 0;
    window.addEventListener(
      "scroll",
      () => {
        boost = Math.min(1600, boost + Math.abs(window.scrollY - lastScroll) * 6);
        lastScroll = window.scrollY;
      },
      { passive: true },
    );
    const tick = (now) => {
      const dt = Math.min(0.05, (now - then) / 1000);
      then = now;
      boost *= 0.92;
      bands.forEach((track, i) => {
        const width = track.firstElementChild.offsetWidth;
        offsets[i] = (offsets[i] + (70 + boost) * dt) % width;
        const x = i % 2 ? offsets[i] - width : -offsets[i];
        track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
      });
      if (bandsVisible && !document.hidden) requestAnimationFrame(tick);
      else bandsRunning = false;
    };
    const startBands = () => {
      if (bandsRunning || !bandsVisible) return;
      bandsRunning = true;
      then = performance.now();
      requestAnimationFrame(tick);
    };
    new IntersectionObserver(([entry]) => {
      bandsVisible = entry.isIntersecting;
      startBands();
    }).observe(document.querySelector(".bands"));
    document.addEventListener("visibilitychange", startBands);
  }

  // The About statement lights word by word as it scrolls past, so it reads at
  // the pace of the scroll instead of arriving all at once.
  const statement = document.querySelector(".about-statement");
  let words = [];
  if (statement && moving()) {
    const wrap = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) fragment.append(part);
            else {
              const span = document.createElement("span");
              span.className = "word";
              span.textContent = part;
              fragment.append(span);
            }
          });
          child.replaceWith(fragment);
        } else wrap(child);
      });
    };
    wrap(statement);
    words = [...statement.querySelectorAll(".word")];
    root.classList.add("reading");
  }
  function lightWords() {
    if (!words.length) return;
    const box = statement.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.min(1, Math.max(0, (vh * 0.85 - box.top) / (box.height + vh * 0.3)));
    const lit = Math.round(progress * words.length);
    words.forEach((word, i) => word.classList.toggle("is-lit", i < lit));
  }
  window.addEventListener("scroll", lightWords, { passive: true });
  lightWords();

  // Project videos play muted while on screen, unless the visitor asked for less
  // motion or less data. Each frame takes the ratio of its poster.
  const works = [...document.querySelectorAll(".work")];
  const autoplay = () => moving() && !saveData;
  const onScreen = new Set();
  function syncVideos() {
    works.forEach((work) => {
      const video = work.querySelector("video");
      if (!video) return;
      if (onScreen.has(work) && autoplay() && !dialog.open && !document.hidden && !work.classList.contains("has-error")) {
        video.preload = "auto";
        video.play().catch(() => {});
      } else video.pause();
    });
  }
  works.forEach((work) => {
    const media = work.querySelector(".work-video");
    const src = media.poster || media.currentSrc || media.src;
    const probe = new Image();
    probe.addEventListener("load", () => {
      media.style.aspectRatio = `${probe.naturalWidth} / ${probe.naturalHeight}`;
      work.classList.toggle("is-portrait", probe.naturalHeight > probe.naturalWidth);
    });
    probe.src = src;
    // A failed video keeps its poster.
    work.querySelector("video source")?.addEventListener("error", () => work.classList.add("has-error"));
  });
  if ("IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) onScreen.add(entry.target);
          else onScreen.delete(entry.target);
        });
        syncVideos();
      },
      { threshold: 0.25 },
    );
    works.forEach((work) => videoObserver.observe(work));
  }
  document.addEventListener("visibilitychange", syncVideos);
  motion.addEventListener("change", syncVideos);

  // Project index: a small cover follows the pointer over the list.
  const index = document.querySelector(".work-index");
  const thumbs = index?.querySelector(".thumbs");
  if (index && thumbs) {
    const thumbItems = [...thumbs.children];
    index.addEventListener("pointermove", (event) => {
      if (!finePointer.matches || !moving()) return;
      thumbs.style.setProperty("--x", `${event.clientX + 28}px`);
      thumbs.style.setProperty("--y", `${event.clientY - 90}px`);
      const link = event.target.closest("[data-thumb]");
      thumbs.classList.toggle("is-on", !!link);
      if (link) thumbItems.forEach((item, i) => item.classList.toggle("is-on", i === Number(link.dataset.thumb)));
    });
    index.addEventListener("pointerleave", () => thumbs.classList.remove("is-on"));
  }

  // One native dialog provides focus trapping, Escape, and focus restoration.
  const content = dialog.querySelector(".dialog-content");
  const controls = dialog.querySelector(".gallery-controls");
  const count = dialog.querySelector(".gallery-count");
  let images = [];
  let imageIndex = 0;
  function showImage(index) {
    if (!images.length) return;
    imageIndex = (index + images.length) % images.length;
    images.forEach((image, i) => {
      image.hidden = i !== imageIndex;
    });
    count.textContent = `${imageIndex + 1} / ${images.length}`;
  }
  document.querySelectorAll("[data-detail]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      const template = document.getElementById("detail-" + trigger.dataset.detail);
      if (!template || typeof dialog.showModal !== "function") return;
      event.preventDefault();
      content.querySelector("video")?.pause();
      content.replaceChildren(template.content.cloneNode(true));
      content.querySelector("h2").id = "dialog-title";
      images = [...content.querySelectorAll(".gallery-images img")];
      controls.hidden = images.length < 2;
      showImage(0);
      dialog.showModal();
      syncVideos();
      body.classList.add("dialog-open");
      dialog.scrollTop = 0;
      dialog.querySelector(".dialog-close").focus({ preventScroll: true });
    });
  });
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    content.querySelector("video")?.pause();
    body.classList.remove("dialog-open");
    syncVideos();
  });
  let startedOnBackdrop = false;
  function outsideDialog(event) {
    const box = dialog.getBoundingClientRect();
    return (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    );
  }
  dialog.addEventListener("pointerdown", (event) => {
    startedOnBackdrop = outsideDialog(event);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog && startedOnBackdrop && outsideDialog(event)) dialog.close();
    startedOnBackdrop = false;
  });
  dialog.querySelector(".gallery-prev").addEventListener("click", () => showImage(imageIndex - 1));
  dialog.querySelector(".gallery-next").addEventListener("click", () => showImage(imageIndex + 1));
  dialog.addEventListener("keydown", (event) => {
    if (images.length && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      showImage(imageIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
  });

  // Lanyard. The strap is a verlet rope pinned above the viewport; the badge hangs
  // from its last point and turns toward the strap's direction with a little lag.
  // With reduced motion the badge stays on its still CSS strap instead.
  const badge = hero.querySelector("[data-badge]");
  const strap = hero.querySelector("#strap-path");
  const revealHero = () => {
    hero.classList.add("is-in");
    hero.querySelectorAll("[data-split]").forEach(reveal);
  };
  if (!badge || !strap || !moving()) {
    revealHero();
    return;
  }
  root.classList.add("has-physics");
  badge.setAttribute("role", "button");
  badge.tabIndex = 0;
  badge.setAttribute("aria-label", "Swing the ID badge");
  const card = badge.querySelector(".badge-card");
  const strapEdge = hero.querySelector(".strap-edge");
  const strapBand = hero.querySelector(".strap-band");

  const SEGMENTS = 14;
  const GRAVITY = 2600;
  const STEP = 1 / 120;
  const xs = new Float32Array(SEGMENTS + 1);
  const ys = new Float32Array(SEGMENTS + 1);
  const pxs = new Float32Array(SEGMENTS + 1);
  const pys = new Float32Array(SEGMENTS + 1);
  let anchorX = 0;
  let anchorY = 0;
  let length = 0;
  let segment = 0;
  let angle = 0;
  let spin = 0;
  let turn = 0;
  // The strap is elastic: pulling past its length stretches it, and on release the
  // stretch springs back (and overshoots), flinging the badge up so it bounces.
  const STRETCH_K = 110;
  const STRETCH_DAMP = 9;
  const MAX_SPEED = 1500;
  let stretch = 0;
  let stretchVel = 0;
  let maxStretch = 0;
  let dragging = null;
  let running = false;
  let calm = 0;
  let last = 0;
  let accumulator = 0;
  let heroVisible = true;

  function measure() {
    const width = hero.clientWidth;
    const narrow = width <= 860;
    const restTop = nav.getBoundingClientRect().bottom + window.scrollY - hero.offsetTop + (narrow ? 26 : 30);
    anchorX = width * (narrow ? 0.5 : 0.74);
    anchorY = -window.innerHeight * 0.55;
    length = restTop - anchorY;
    segment = length / SEGMENTS;
    maxStretch = Math.min(280, window.innerHeight * 0.34);
  }
  function rest() {
    for (let i = 0; i <= SEGMENTS; i++) {
      xs[i] = pxs[i] = anchorX;
      ys[i] = pys[i] = anchorY + segment * i;
    }
    angle = spin = turn = stretch = stretchVel = 0;
  }
  // The intro: the strap starts slack, off to one side and above the screen, so the
  // badge drops in, snaps taut and swings out the energy.
  function drop() {
    const endX = anchorX + length * 0.24;
    const endY = -badge.offsetHeight - 80;
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS;
      xs[i] = pxs[i] = anchorX + (endX - anchorX) * t;
      ys[i] = pys[i] = anchorY + (endY - anchorY) * t - Math.sin(t * Math.PI) * 60;
    }
    angle = -0.3;
    spin = turn = 0;
  }

  function step() {
    const g = GRAVITY * STEP * STEP;
    for (let i = 1; i <= SEGMENTS; i++) {
      if (i === SEGMENTS && dragging) continue;
      const vx = (xs[i] - pxs[i]) * 0.996;
      const vy = (ys[i] - pys[i]) * 0.996;
      pxs[i] = xs[i];
      pys[i] = ys[i];
      xs[i] += vx;
      ys[i] += vy + g;
    }
    if (dragging) {
      pxs[SEGMENTS] = xs[SEGMENTS];
      pys[SEGMENTS] = ys[SEGMENTS];
      xs[SEGMENTS] = dragging.x;
      ys[SEGMENTS] = dragging.y;
      stretch += (dragging.stretch - stretch) * 0.35;
      stretchVel = 0;
    } else {
      stretchVel += (-STRETCH_K * stretch - STRETCH_DAMP * stretchVel) * STEP;
      stretch = Math.max(-length * 0.2, stretch + stretchVel * STEP);
    }
    const link = (length + stretch) / SEGMENTS;
    // A strap pulls but never pushes: segments only correct when stretched.
    // The badge end is heavy, so the strap gives way before the badge does.
    for (let k = 0; k < 18; k++) {
      for (let i = 1; i <= SEGMENTS; i++) {
        const dx = xs[i] - xs[i - 1];
        const dy = ys[i] - ys[i - 1];
        const d = Math.hypot(dx, dy);
        if (d <= link) continue;
        const wa = i - 1 === 0 ? 0 : 1;
        const wb = i === SEGMENTS ? (dragging ? 0 : 0.2) : 1;
        if (!wa && !wb) continue;
        const diff = (d - link) / (d * (wa + wb));
        xs[i - 1] += dx * diff * wa;
        ys[i - 1] += dy * diff * wa;
        xs[i] -= dx * diff * wb;
        ys[i] -= dy * diff * wb;
      }
    }
    // Cap the badge's speed so a hard snap-back bounces it instead of launching it.
    if (!dragging) {
      const vx = xs[SEGMENTS] - pxs[SEGMENTS];
      const vy = ys[SEGMENTS] - pys[SEGMENTS];
      const speed = Math.hypot(vx, vy) / STEP;
      if (speed > MAX_SPEED) {
        pxs[SEGMENTS] = xs[SEGMENTS] - (vx * MAX_SPEED) / speed;
        pys[SEGMENTS] = ys[SEGMENTS] - (vy * MAX_SPEED) / speed;
      }
    }
    // The badge turns toward the strap's last segment on a damped spring.
    const dx = xs[SEGMENTS] - xs[SEGMENTS - 1];
    const dy = ys[SEGMENTS] - ys[SEGMENTS - 1];
    const target = Math.hypot(dx, dy) > link * 0.6 ? Math.atan2(-dx, dy) : angle;
    spin += ((target - angle) * 70 - spin * 7) * STEP;
    angle += spin * STEP;
    const vx = (xs[SEGMENTS] - pxs[SEGMENTS]) / STEP;
    turn += (Math.max(-40, Math.min(40, vx * 0.04)) - turn) * 0.08;
  }

  function draw() {
    let d = `M${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
    for (let i = 1; i < SEGMENTS; i++) {
      const mx = (xs[i] + xs[i + 1]) / 2;
      const my = (ys[i] + ys[i + 1]) / 2;
      d += ` Q${xs[i].toFixed(1)} ${ys[i].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    d += ` L${xs[SEGMENTS].toFixed(1)} ${ys[SEGMENTS].toFixed(1)}`;
    strap.setAttribute("d", d);
    // A stretched strap gets thinner, like a rubber band.
    const thin = Math.sqrt(length / (length + Math.max(0, stretch)));
    strapEdge.style.strokeWidth = (28 * thin).toFixed(1);
    strapBand.style.strokeWidth = (22 * thin).toFixed(1);
    const half = badge.offsetWidth / 2;
    badge.style.transform = `translate3d(${(xs[SEGMENTS] - half).toFixed(1)}px, ${ys[SEGMENTS].toFixed(1)}px, 0) rotate(${angle.toFixed(4)}rad)`;
    card.style.setProperty("--turn", `${turn.toFixed(2)}deg`);
  }

  function frame(now) {
    if (!running) return;
    accumulator += Math.min(0.05, (now - last) / 1000);
    last = now;
    let energy = 0;
    while (accumulator >= STEP) {
      step();
      accumulator -= STEP;
    }
    for (let i = 1; i <= SEGMENTS; i++) energy = Math.max(energy, Math.abs(xs[i] - pxs[i]) + Math.abs(ys[i] - pys[i]));
    energy = Math.max(energy, Math.abs(spin) * 0.2, Math.abs(stretch) * 0.05, Math.abs(stretchVel) * 0.01);
    draw();
    // Sleep once the badge has settled, and wake on the next touch.
    calm = energy < 0.02 && !dragging ? calm + 1 : 0;
    if (calm > 90 || !heroVisible) {
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  }
  function wake() {
    calm = 0;
    if (running || !heroVisible) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  function local(event) {
    const box = hero.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }
  badge.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const point = local(event);
    dragging = {
      dx: point.x - xs[SEGMENTS],
      dy: point.y - ys[SEGMENTS],
      x: xs[SEGMENTS],
      y: ys[SEGMENTS],
      stretch: 0,
      vx: 0,
      vy: 0,
      time: event.timeStamp,
    };
    badge.classList.add("is-dragging");
    wake();
  });
  // Moves and releases are heard on the window, so the drag holds even when the
  // pointer slips off the badge or lets go outside the page.
  window.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const point = local(event);
    let x = point.x - dragging.dx;
    let y = point.y - dragging.dy;
    // Past the strap's length the pull meets more and more resistance, up to a limit.
    const dx = x - anchorX;
    const dy = y - anchorY;
    const d = Math.hypot(dx, dy);
    dragging.stretch = 0;
    if (d > length) {
      const extra = maxStretch * (1 - Math.exp(-(d - length) / maxStretch));
      x = anchorX + (dx / d) * (length + extra);
      y = anchorY + (dy / d) * (length + extra);
      dragging.stretch = extra;
    }
    // Remember how fast the hand moves, so letting go mid-swing throws the badge.
    const dt = Math.max(1, event.timeStamp - dragging.time) / 1000;
    dragging.vx += ((x - dragging.x) / dt - dragging.vx) * 0.5;
    dragging.vy += ((y - dragging.y) / dt - dragging.vy) * 0.5;
    dragging.time = event.timeStamp;
    dragging.x = x;
    dragging.y = y;
  });
  const release = () => {
    if (!dragging) return;
    const limit = 2600;
    const vx = Math.max(-limit, Math.min(limit, dragging.vx));
    const vy = Math.max(-limit, Math.min(limit, dragging.vy));
    pxs[SEGMENTS] = xs[SEGMENTS] - vx * STEP;
    pys[SEGMENTS] = ys[SEGMENTS] - vy * STEP;
    // A hard pull also sets the badge spinning a little as it snaps back.
    spin += (Math.random() - 0.5) * stretch * 0.05;
    dragging = null;
    badge.classList.remove("is-dragging");
    wake();
  };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  window.addEventListener("blur", release);
  let side = 1;
  badge.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    // The keyboard version of a tug: a sideways nudge plus a stretch that springs back.
    pxs[SEGMENTS] -= 4 * side;
    side = -side;
    stretch = maxStretch * 0.5;
    stretchVel = 0;
    wake();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      if (heroVisible) wake();
    }).observe(hero);
  }
  let width = window.innerWidth;
  window.addEventListener("resize", () => {
    // Phones fire resize when the address bar slides; only a width change re-hangs it.
    if (window.innerWidth === width) return;
    width = window.innerWidth;
    measure();
    rest();
    draw();
    wake();
  });
  measure();
  drop();
  draw();
  wake();
  setTimeout(revealHero, 650);
})();
