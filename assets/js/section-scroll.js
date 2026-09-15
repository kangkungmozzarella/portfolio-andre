(() => {
  "use strict";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const sections = [...document.querySelectorAll("main > section")];
  if (!sections.length) return;
  let frame = 0;
  let lastWheel = 0;
  let accumulated = 0;
  let direction = 0;
  let locked = false;
  let gestureFloor = Infinity;
  let cachedStops;
  const invalidateStops = () => {
    cachedStops = undefined;
  };
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(invalidateStops);
    [
      document.body,
      document.querySelector(".site-header"),
      ...sections,
      ...document.querySelectorAll(".project"),
    ]
      .filter(Boolean)
      .forEach((node) => observer.observe(node));
  }
  window.addEventListener("resize", invalidateStops, { passive: true });

  function stops() {
    if (cachedStops) return cachedStops;
    const inset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const maximum = root.scrollHeight - innerHeight;
    const points = [0, maximum];
    const step = Math.max(150, innerHeight - inset - 40);
    for (const section of sections) {
      const start = section.getBoundingClientRect().top + scrollY - inset;
      const end = start + section.offsetHeight - step;
      points.push(start);
      if (section.matches(".hero-scroll.is-pinned")) {
        points.push(
          section.getBoundingClientRect().top +
            scrollY -
            parseFloat(
              getComputedStyle(section).getPropertyValue("--hero-pin-top"),
            ) +
            parseFloat(
              getComputedStyle(section).getPropertyValue("--hero-range"),
            ),
        );
        continue;
      }
      const grid = section.querySelector(".project-grid");
      if (
        grid &&
        getComputedStyle(grid.firstElementChild).position === "sticky"
      ) {
        const gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
        let position = grid.getBoundingClientRect().top + scrollY;
        for (const card of grid.children) {
          points.push(position - parseFloat(getComputedStyle(card).top));
          position += card.offsetHeight + gap;
        }
      } else {
        // Long sections retain intermediate reading positions.
        for (let position = start + step; position < end; position += step)
          points.push(position);
        if (end > start + step * 0.35) points.push(end);
      }
    }
    cachedStops = [
      ...new Set(
        points.map((value) =>
          Math.round(Math.max(0, Math.min(maximum, value))),
        ),
      ),
    ].sort((a, b) => a - b);
    return cachedStops;
  }

  function cancel() {
    cancelAnimationFrame(frame);
    frame = 0;
    locked = false;
    accumulated = 0;
  }

  window.addEventListener(
    "wheel",
    (event) => {
      if (
        reduced.matches ||
        event.ctrlKey ||
        event.defaultPrevented ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      )
        return;
      if (
        event.target.closest(
          "dialog, input, textarea, select, [contenteditable]",
        )
      )
        return;
      for (
        let node = event.target;
        node && node !== document.body;
        node = node.parentElement
      ) {
        if (
          /(auto|scroll)/.test(getComputedStyle(node).overflowY) &&
          node.scrollHeight > node.clientHeight
        )
          return;
      }
      const now = performance.now();
      const idle = now - lastWheel > 90;
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      const magnitude = Math.abs(delta);
      const renewed =
        magnitude >= 24 &&
        magnitude >= gestureFloor + 18 &&
        magnitude > gestureFloor * 2.5;
      gestureFloor = Math.min(gestureFloor, magnitude);
      const nextDirection = Math.sign(event.deltaY);
      const reversed = magnitude >= 10 && nextDirection !== direction;
      lastWheel = now;
      event.preventDefault();
      if (nextDirection !== direction && magnitude < 10 && locked) return;
      if (reversed) cancel();
      if (frame) return;
      // Finishing the animation never starts another step. Only a fresh gesture
      // (a pause plus deliberate input, or a strong rise after decay) can do that.
      if (locked && !(idle && magnitude >= 10) && !renewed) return;
      if (idle) {
        locked = false;
        accumulated = 0;
      }
      if (nextDirection !== direction) accumulated = 0;
      direction = nextDirection;
      accumulated += delta;
      if (Math.abs(accumulated) < 10) return;
      accumulated = 0;
      invalidateStops();
      const positions = stops();
      const target =
        direction > 0
          ? positions.find((value) => value > scrollY + 5)
          : positions.findLast((value) => value < scrollY - 5);
      if (target === undefined) return;
      const targetIndex = positions.indexOf(target);
      const from = scrollY;
      const started = performance.now();
      locked = true;
      gestureFloor = magnitude;
      root.classList.add("section-stepping");
      function animate(time) {
        const progress = Math.min(1, (time - started) / 700);
        const ease = 1 - (1 - progress) ** 3;
        const destination = stops()[targetIndex] ?? target;
        scrollTo({
          top: from + (destination - from) * ease,
          behavior: "instant",
        });
        if (progress < 1) frame = requestAnimationFrame(animate);
        else {
          frame = 0;
        }
      }
      frame = requestAnimationFrame(animate);
    },
    { passive: false },
  );

  // Native touch scrolling, links, keyboard and scrollbar dragging stay usable.
  for (const type of [
    "pointerdown",
    "touchstart",
    "keydown",
    "resize",
    "hashchange",
  ])
    window.addEventListener(type, cancel, { passive: true });
  reduced.addEventListener("change", cancel);
  window.addEventListener(
    "touchstart",
    () => root.classList.remove("section-stepping"),
    { passive: true },
  );
})();
