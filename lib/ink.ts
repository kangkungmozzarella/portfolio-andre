// The theme change spreads like a drop of ink in water: the new theme bleeds out
// from the switch behind a churning, wispy edge until it covers the page.
//
// The browser's View Transitions API keeps a picture of the old theme on screen
// with the live page (already in the new theme) on top. Each frame, the live page
// is clipped to the ink shape, which is the contour of a noise field traced on a
// coarse grid. Browsers without the API, and visitors who prefer less motion,
// get an instant change.

const DURATION = 1900;
const RULE = "html.ink::view-transition-new(root)";

type Noise = (x: number, y: number) => number;

// 2D gradient noise in roughly -1..1, shuffled differently for every transition.
function createNoise(seed: number): Noise {
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const swap = perm[i];
    perm[i] = perm[j];
    perm[j] = swap;
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  const grad = (hash: number, x: number, y: number) => {
    switch (hash & 7) {
      case 0: return x + y;
      case 1: return x - y;
      case 2: return y - x;
      case 3: return -x - y;
      case 4: return x * 1.4;
      case 5: return -x * 1.4;
      case 6: return y * 1.4;
      default: return -y * 1.4;
    }
  };
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
    const a = perm[xi & 255] + (yi & 255);
    const b = perm[(xi + 1) & 255] + (yi & 255);
    const top = grad(perm[a], xf, yf) + u * (grad(perm[b], xf - 1, yf) - grad(perm[a], xf, yf));
    const bottom = grad(perm[a + 1], xf, yf - 1) + u * (grad(perm[b + 1], xf - 1, yf - 1) - grad(perm[a + 1], xf, yf - 1));
    return top + v * (bottom - top);
  };
}

// Builds the function that returns the ink outline, as SVG path data, for a moment
// between 0 (nothing covered) and 1 (everything covered).
export function createInk(width: number, height: number, originX: number, originY: number, seed: number) {
  const noise = createNoise(seed);
  // Thin wisps need a fine grid; very large screens get slightly larger cells.
  const cell = Math.max(7, Math.ceil(Math.max(width, height) / 230));
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const reach = Math.max(
    Math.hypot(originX, originY),
    Math.hypot(width - originX, originY),
    Math.hypot(originX, height - originY),
    Math.hypot(width - originX, height - originY),
  );
  // The size of the swirls, relative to the screen.
  const scale = 1 / (Math.max(width, height) * 0.2);
  // Threads fan out around the origin. Their angle wraps somewhere, and that seam
  // is pointed away from the middle of the screen, where it cannot be seen.
  const seam = Math.atan2(height / 2 - originY, width / 2 - originX) + Math.PI;
  const values = new Float32Array((cols + 1) * (rows + 1));
  const point = (n: number) => Math.round(n * 10) / 10;

  return (progress: number) => {
    if (progress >= 1) return `M0 0H${width}V${height}H0Z`;
    // Fast at first, then a long slow creep into the far corner.
    const eased = 1 - Math.pow(1 - progress, 1.9);
    // How far the edge wanders from a plain circle. It grows with the blot and
    // shrinks again at the very end, so the last wisps close up.
    const fringe = Math.min(reach * 0.2, 10 + eased * reach * 0.3) * Math.min(1, (1 - progress) * 4 + 0.3);
    // Past the far corner by the end, so nothing is left uncovered.
    const radius = eased * reach * 1.14 - fringe * 0.3;
    const band = fringe * 1.5;
    const drift = progress * 1.2;

    // Negative inside the ink, positive outside.
    for (let j = 0, k = 0; j <= rows; j++) {
      const y = j * cell;
      for (let i = 0; i <= cols; i++, k++) {
        const x = i * cell;
        const dx = x - originX;
        const dy = y - originY;
        const distance = Math.hypot(dx, dy);
        const edge = distance - radius;
        // Only the band around the edge needs the noise.
        if (edge > band) values[k] = 1;
        else if (edge < -band) values[k] = -1;
        else {
          const u = x * scale;
          const v = y * scale;
          // A slow swirl bends everything, so nothing runs straight.
          const swirl = noise(u * 1.1 + 5.2 + drift, v * 1.1 + 1.3);
          const curl = noise(u * 1.1 - 3.7, v * 1.1 + 8.1 - drift);
          // Soft lobes give the blot its uneven outline...
          const lobes = noise(u * 1.3 + curl, v * 1.3 + swirl) + 0.45 * noise(u * 3.1 + 17 + swirl, v * 3.1 - 9 + curl);
          // ...and threads running outward from the origin give it the feathered
          // edge of ink in water: wide tongues, thinner fingers, then hair.
          let angle = Math.atan2(dy, dx) - seam;
          if (angle < 0) angle += Math.PI * 2;
          angle += swirl * 0.5;
          const along = distance * scale;
          const threads =
            0.5 * noise(angle * 7, along * 0.5 + curl * 0.8) +
            0.42 * noise(angle * 19 + 11, along * 0.8 + 5 + swirl) +
            0.24 * noise(angle * 37 - 7, along * 1.5 - 3 + curl * 1.5);
          values[k] = edge + fringe * (0.55 * lobes + 1.25 * threads);
        }
      }
    }

    // Trace the outline cell by cell (marching squares). Covered cells merge into
    // one strip per row; cells on the edge add the covered part as a small polygon.
    // Every piece runs clockwise, so they fill as one seamless shape.
    let d = "";
    for (let j = 0; j < rows; j++) {
      const y0 = j * cell;
      const y1 = y0 + cell;
      let run = -1;
      for (let i = 0; i <= cols; i++) {
        const k = j * (cols + 1) + i;
        const tl = values[k];
        const tr = values[k + 1];
        const bl = values[k + cols + 1];
        const br = values[k + cols + 2];
        const full = i < cols && tl < 0 && tr < 0 && bl < 0 && br < 0;
        if (full) {
          if (run < 0) run = i;
          continue;
        }
        if (run >= 0) {
          d += `M${run * cell} ${y0}H${i * cell}V${y1}H${run * cell}Z`;
          run = -1;
        }
        if (i === cols || (tl >= 0 && tr >= 0 && bl >= 0 && br >= 0)) continue;
        const x0 = i * cell;
        const x1 = x0 + cell;
        let piece = "";
        const add = (x: number, y: number) => (piece += `${piece ? "L" : "M"}${point(x)} ${point(y)}`);
        if (tl < 0) add(x0, y0);
        if (tl < 0 !== tr < 0) add(x0 + (tl / (tl - tr)) * cell, y0);
        if (tr < 0) add(x1, y0);
        if (tr < 0 !== br < 0) add(x1, y0 + (tr / (tr - br)) * cell);
        if (br < 0) add(x1, y1);
        if (br < 0 !== bl < 0) add(x0 + (bl / (bl - br)) * cell, y1);
        if (bl < 0) add(x0, y1);
        if (bl < 0 !== tl < 0) add(x0, y0 + (tl / (tl - bl)) * cell);
        d += `${piece}Z`;
      }
    }
    return d || "M0 0Z";
  };
}

let sheet: CSSStyleSheet | null = null;
let active: ViewTransition | null = null;

// Runs `change` (which switches the theme) and reveals the result as spreading ink
// from the given point.
export function inkReveal(origin: { x: number; y: number }, change: () => void) {
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || typeof document.startViewTransition !== "function") return change();
  // A second press while the ink is still spreading starts over from the new state.
  active?.skipTransition();

  if (!sheet) {
    const style = document.createElement("style");
    document.head.append(style);
    sheet = style.sheet;
    sheet?.insertRule(`${RULE}{clip-path:inset(50%)}`);
  }
  const rule = sheet?.cssRules[0] as CSSStyleRule | undefined;
  if (!rule) return change();
  rule.style.clipPath = "inset(50%)";

  // The picture can be taller than the window on phones (it includes the area
  // behind the address bar), so the ink covers a little extra.
  const width = window.innerWidth + 32;
  const height = Math.round(window.innerHeight * 1.12) + 32;
  const ink = createInk(width, height, origin.x, origin.y, (Math.random() * 2 ** 32) >>> 0);

  root.classList.add("ink");
  const transition = document.startViewTransition(change);
  active = transition;
  let running = true;
  transition.ready
    .then(() => {
      // An animation that changes nothing keeps the transition open and is the clock.
      const clock = root.animate({ opacity: [1, 1] }, { duration: DURATION, pseudoElement: "::view-transition-new(root)" });
      const frame = () => {
        if (!running) return;
        rule.style.clipPath = `path("${ink(Number(clock.currentTime ?? 0) / DURATION)}")`;
        requestAnimationFrame(frame);
      };
      frame();
    })
    .catch(() => {});
  transition.finished.finally(() => {
    running = false;
    if (active !== transition) return;
    active = null;
    root.classList.remove("ink");
  });
}
