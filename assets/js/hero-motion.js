(() => {
  const hero = document.querySelector(".hero");
  const track = hero?.closest(".hero-scroll");
  const art = hero?.querySelector(".hero-motion");
  if (!art || !track) return;
  const header = document.querySelector(".site-header");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const pieces = [...art.querySelectorAll(".web-piece")].map((node) => ({
    node,
    ...Object.fromEntries(
      Object.entries(node.dataset).map(([key, value]) => [key, Number(value)]),
    ),
  }));
  const shell = art.querySelector(".web-shell");
  let frame = 0;
  let distance = 0;
  let pinTop = 0;
  function measure() {
    pinTop = Math.min(
      header?.offsetHeight || 0,
      innerHeight - hero.offsetHeight,
    );
    distance = reduced.matches ? 0 : Math.round(innerHeight * 0.65);
    track.style.setProperty("--hero-pin-top", `${pinTop}px`);
    track.style.setProperty("--hero-range", `${distance}px`);
    track.style.height = distance ? `${hero.offsetHeight + distance}px` : "";
    track.classList.toggle("is-pinned", distance > 0);
    schedule();
  }
  function render() {
    frame = 0;
    const rect = track.getBoundingClientRect();
    const progress = reduced.matches
      ? 1
      : Math.max(0, Math.min(1, (pinTop - rect.top) / distance));
    const eased = progress * progress * (3 - 2 * progress);
    for (const { node, x, y, angle, cx, cy } of pieces) {
      const spread = 1 - eased;
      node.setAttribute(
        "transform",
        `translate(${x * spread} ${y * spread}) rotate(${angle * spread} ${cx} ${cy})`,
      );
    }
    shell.style.opacity = (0.08 + eased * 0.92).toFixed(3);
    art.dataset.progress = progress.toFixed(3);
  }
  function schedule() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(render);
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  document.addEventListener("visibilitychange", schedule);
  reduced.addEventListener("change", measure);
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(measure);
    observer.observe(hero);
    if (header) observer.observe(header);
  }
  measure();
})();
