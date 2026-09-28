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
  const dataLine = art.querySelector(".web-data-line");
  const dataArea = art.querySelector(".web-data-area");
  const dataDot = art.querySelector(".web-data-dot");
  // The dash is set here, not in CSS, so the chart stays drawn without JS.
  if (dataLine) dataLine.style.strokeDasharray = "1";
  const introStart = performance.now();
  const introDuration = 1600;
  let frame = 0;
  let distance = 0;
  let holdDistance = 0;
  let pinTop = 0;
  function measure() {
    track.style.setProperty("--hero-viewport", `${innerHeight}px`);
    track.style.setProperty("--hero-header-height", `${header?.offsetHeight || 0}px`);
    pinTop = Math.min(
      header?.offsetHeight || 0,
      innerHeight - hero.offsetHeight,
    );
    distance = reduced.matches ? 0 : Math.round(innerHeight * 0.85);
    // Keep the completed website in view before the sticky hero releases.
    holdDistance = reduced.matches ? 0 : Math.round(innerHeight * 0.25);
    track.style.setProperty("--hero-pin-top", `${pinTop}px`);
    track.style.setProperty("--hero-range", `${distance}px`);
    track.style.height = distance
      ? `${hero.offsetHeight + distance + holdDistance}px`
      : "";
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
    // On load the pieces drift in from further out; scrolling then assembles them.
    const intro = reduced.matches
      ? 1
      : Math.min(1, (performance.now() - introStart) / introDuration);
    const introEased = 1 - (1 - intro) ** 3;
    // The chart line starts partly drawn and completes with the assembled site.
    const draw = reduced.matches ? 1 : 0.4 * introEased + 0.6 * eased;
    if (dataLine) dataLine.style.strokeDashoffset = (1 - draw).toFixed(3);
    const filled = Math.max(0, (draw - 0.7) / 0.3);
    if (dataArea) dataArea.style.opacity = (0.3 * filled).toFixed(3);
    if (dataDot) dataDot.style.opacity = filled.toFixed(3);
    for (const { node, x, y, angle, cx, cy } of pieces) {
      const spread = (1 - eased) * (1 + 0.5 * (1 - introEased));
      node.setAttribute(
        "transform",
        `translate(${x * spread} ${y * spread}) rotate(${angle * spread} ${cx} ${cy})`,
      );
    }
    shell.style.opacity = (0.08 + eased * 0.92).toFixed(3);
    art.dataset.progress = progress.toFixed(3);
    if (intro < 1) schedule();
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
