(() => {
  "use strict";
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = navigator.connection?.saveData === true;
  const body = document.body;
  const topbar = document.querySelector(".topbar");
  const dialog = document.querySelector(".project-dialog");

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

  window.addEventListener(
    "scroll",
    () => topbar.classList.toggle("is-scrolled", window.scrollY > 24),
    { passive: true },
  );

  // Reveal profile blocks on scroll. Blocks inside the hidden tab start observing
  // as soon as the tab is shown, because hidden elements never intersect.
  if ("IntersectionObserver" in window) {
    const root = document.documentElement;
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
    root.classList.toggle("motion-enabled", !motion.matches);
    motion.addEventListener("change", () =>
      root.classList.toggle("motion-enabled", !motion.matches),
    );
  }

  // Tabs: Projects and Profile are two screens of one page, like a console home.
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panelOf = (tab) =>
    document.getElementById(tab.getAttribute("aria-controls"));
  function showTab(name, { focus = false, target = null } = {}) {
    tabs.forEach((tab) => {
      const active = tab.getAttribute("aria-controls") === name;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      panelOf(tab).hidden = !active;
      if (active && focus) tab.focus();
    });
    body.dataset.tab = name;
    syncStage();
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }
  // Old section links (#work, #about, #experience, #contact) still land in the right tab.
  function route(id) {
    if (id === "projects" || id === "work") {
      showTab("projects");
      return true;
    }
    const el = id && document.getElementById(id);
    if (el && el.closest("#profile")) {
      showTab("profile", { target: id === "profile" ? null : el });
      return true;
    }
    return false;
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const next = tabs[(i + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      showTab(next.getAttribute("aria-controls"), { focus: true });
      history.replaceState(null, "", next.hash);
    });
  });
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.hash === "#main") return;
    if (route(link.hash.slice(1))) {
      event.preventDefault();
      history.replaceState(null, "", link.hash);
    }
  });
  window.addEventListener("hashchange", () => route(location.hash.slice(1)));

  // Project selection drives the tiles, the info block, and the background stage.
  const tiles = [...document.querySelectorAll(".tile[data-index]")];
  const infos = [...document.querySelectorAll(".project-info")];
  const slides = [...document.querySelectorAll(".stage-slide")];
  const sound = document.querySelector(".sound-toggle");
  let current = 0;
  let soundOn = false;
  const autoplay = () => !motion.matches && !saveData;

  function select(index, { focus = false } = {}) {
    if (!tiles.length) return;
    current = (index + tiles.length) % tiles.length;
    tiles.forEach((tile, i) => tile.setAttribute("aria-pressed", String(i === current)));
    infos.forEach((info, i) => {
      info.hidden = i !== current;
    });
    slides.forEach((slide, i) => slide.classList.toggle("is-active", i === current));
    if (focus) tiles[current].focus({ preventScroll: true });
    tiles[current].scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: motion.matches ? "auto" : "smooth",
    });
    syncStage();
  }

  function syncStage() {
    const live = body.dataset.tab === "projects" && !document.hidden && !dialog.open;
    slides.forEach((slide, i) => {
      const video = slide.querySelector("video");
      if (!video) return;
      if (i === current && live && autoplay() && !slide.classList.contains("has-error")) {
        video.muted = !soundOn;
        video.preload = "auto";
        video.play().catch(() => {
          // Browsers may refuse audible autoplay; fall back to a muted preview.
          soundOn = false;
          video.muted = true;
          video.play().catch(() => {});
          updateSound();
        });
      } else {
        video.pause();
      }
    });
    updateSound();
  }

  function updateSound() {
    if (!sound) return;
    const slide = slides[current];
    sound.hidden = !(slide?.querySelector("video") && autoplay() && !slide.classList.contains("has-error"));
    sound.setAttribute("aria-pressed", String(soundOn));
    sound.setAttribute("aria-label", soundOn ? "Mute preview" : "Unmute preview");
  }

  slides.forEach((slide) => {
    const backdrop = slide.querySelector(".stage-backdrop");
    const markOrientation = () =>
      slide.classList.toggle("is-portrait", backdrop.naturalHeight > backdrop.naturalWidth);
    if (backdrop.complete) markOrientation();
    else backdrop.addEventListener("load", markOrientation);
    // A failed video keeps its poster and drops the sound control.
    slide.querySelector("video source")?.addEventListener("error", () => {
      slide.classList.add("has-error");
      updateSound();
    });
  });

  tiles.forEach((tile, i) => {
    tile.addEventListener("click", () => {
      // First press selects, a second press on the selected tile opens it.
      if (i === current) infos[current].querySelector("[data-detail]").click();
      else select(i);
    });
  });
  document.querySelectorAll("[data-select]").forEach((card) => {
    card.addEventListener("click", () => select(Number(card.dataset.select), { focus: true }));
  });
  sound?.addEventListener("click", () => {
    soundOn = !soundOn;
    syncStage();
  });
  document.addEventListener("visibilitychange", syncStage);
  motion.addEventListener("change", syncStage);

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || dialog.open) return;
    const target = event.target;
    if (target.closest("input, textarea, select, [contenteditable], [role='tab']")) return;
    const key = event.key.toLowerCase();
    if (key === "p") {
      const next = body.dataset.tab === "projects" ? "profile" : "projects";
      showTab(next);
      history.replaceState(null, "", "#" + next);
      return;
    }
    if (body.dataset.tab !== "projects" || !tiles.length) return;
    if (key === "arrowright" || key === "arrowleft") {
      event.preventDefault();
      select(current + (key === "arrowright" ? 1 : -1), {
        focus: target.classList.contains("tile"),
      });
    } else if (key === "m" && sound && !sound.hidden) {
      sound.click();
    } else if (key === "enter" && (target === body || target.id === "main")) {
      infos[current].querySelector("[data-detail]").click();
    }
  });

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
      syncStage();
      body.classList.add("dialog-open");
      dialog.scrollTop = 0;
      dialog.querySelector(".dialog-close").focus({ preventScroll: true });
    });
  });
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    content.querySelector("video")?.pause();
    body.classList.remove("dialog-open");
    syncStage();
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

  if (!route(location.hash.slice(1))) showTab("projects");
})();
