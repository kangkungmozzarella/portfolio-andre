/* Custom animated cursor: a small dot that tracks the pointer exactly and a
   glowing ring that trails behind it with easing. Skipped entirely on touch
   devices (no fine pointer) and under prefers-reduced-motion. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);
  document.documentElement.classList.add('custom-cursor');

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;
  let shown = false;

  function show() {
    if (shown) return;
    shown = true;
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  }

  window.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
    show();
  });

  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', show);

  function tick() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  const hoverSelector = 'a, button, .tab-btn, .proj-card, .cert-card, .skill-card, ' +
    '.exp-card, .soc-btn, .mgimg, .ci, .ahi, [onclick]';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverSelector)) ring.classList.add('hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverSelector)) ring.classList.remove('hover');
  });

  window.addEventListener('mousedown', () => ring.classList.add('active'));
  window.addEventListener('mouseup', () => ring.classList.remove('active'));
})();
