"use client";

import { useEffect, useRef } from "react";
import type { ImageValue } from "@/lib/content";
import { Img, initials } from "@/lib/media";

type Props = {
  heroRef: React.RefObject<HTMLElement | null>;
  name: string;
  role: string;
  company?: string;
  location: string;
  portrait: ImageValue;
};

const SEGMENTS = 14;
const GRAVITY = 2600;
const STEP = 1 / 120;
// The strap is elastic: pulling past its length stretches it, and on release the
// stretch springs back (and overshoots), flinging the badge up so it bounces.
const STRETCH_K = 110;
const STRETCH_DAMP = 9;
const MAX_SPEED = 1500;

export function Lanyard({ heroRef, name, role, company, location, portrait }: Props) {
  const badgeRef = useRef<HTMLDivElement>(null);
  const strapRef = useRef<SVGPathElement>(null);
  const edgeRef = useRef<SVGUseElement>(null);
  const bandRef = useRef<SVGUseElement>(null);
  const strapText = `${name} · ${role} · `.toUpperCase();

  useEffect(() => {
    const hero = heroRef.current;
    const badge = badgeRef.current;
    const strap = strapRef.current;
    const edge = edgeRef.current;
    const band = bandRef.current;
    const nav = document.querySelector(".nav");
    // With reduced motion the badge stays on its still CSS strap.
    if (!hero || !badge || !strap || !edge || !band || !nav || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.classList.add("has-physics");
    const card = badge.querySelector<HTMLElement>(".badge-card")!;

    // The strap is a verlet rope pinned above the viewport; the badge hangs from its
    // last point and turns toward the strap's direction with a little lag.
    const xs = new Float32Array(SEGMENTS + 1);
    const ys = new Float32Array(SEGMENTS + 1);
    const pxs = new Float32Array(SEGMENTS + 1);
    const pys = new Float32Array(SEGMENTS + 1);
    let anchorX = 0;
    let anchorY = 0;
    let length = 0;
    let segment = 0;
    let maxStretch = 0;
    let angle = 0;
    let spin = 0;
    let turn = 0;
    let stretch = 0;
    let stretchVel = 0;
    let dragging: { dx: number; dy: number; x: number; y: number; stretch: number; vx: number; vy: number; time: number } | null = null;
    let running = false;
    let frameId = 0;
    let calm = 0;
    let last = 0;
    let accumulator = 0;
    let heroVisible = true;

    function measure() {
      const width = hero!.clientWidth;
      const narrow = width <= 860;
      const restTop = nav!.getBoundingClientRect().bottom + window.scrollY - hero!.offsetTop + (narrow ? 26 : 30);
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
      const endY = -badge!.offsetHeight - 80;
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
      strap!.setAttribute("d", d);
      // A stretched strap gets thinner, like a rubber band.
      const thin = Math.sqrt(length / (length + Math.max(0, stretch)));
      edge!.style.strokeWidth = (28 * thin).toFixed(1);
      band!.style.strokeWidth = (22 * thin).toFixed(1);
      const half = badge!.offsetWidth / 2;
      badge!.style.transform = `translate3d(${(xs[SEGMENTS] - half).toFixed(1)}px, ${ys[SEGMENTS].toFixed(1)}px, 0) rotate(${angle.toFixed(4)}rad)`;
      card.style.setProperty("--turn", `${turn.toFixed(2)}deg`);
    }

    function frame(now: number) {
      if (!running) return;
      accumulator += Math.min(0.05, (now - last) / 1000);
      last = now;
      while (accumulator >= STEP) {
        step();
        accumulator -= STEP;
      }
      let energy = Math.max(Math.abs(spin) * 0.2, Math.abs(stretch) * 0.05, Math.abs(stretchVel) * 0.01);
      for (let i = 1; i <= SEGMENTS; i++) energy = Math.max(energy, Math.abs(xs[i] - pxs[i]) + Math.abs(ys[i] - pys[i]));
      draw();
      // Sleep once the badge has settled, and wake on the next touch.
      calm = energy < 0.02 && !dragging ? calm + 1 : 0;
      if (calm > 90 || !heroVisible) {
        running = false;
        return;
      }
      frameId = requestAnimationFrame(frame);
    }
    function wake() {
      calm = 0;
      if (running || !heroVisible) return;
      running = true;
      last = performance.now();
      frameId = requestAnimationFrame(frame);
    }

    const local = (event: PointerEvent) => {
      const box = hero!.getBoundingClientRect();
      return { x: event.clientX - box.left, y: event.clientY - box.top };
    };
    const onDown = (event: PointerEvent) => {
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
      badge!.classList.add("is-dragging");
      wake();
    };
    // Moves and releases are heard on the window, so the drag holds even when the
    // pointer slips off the badge or lets go outside the page.
    const onMove = (event: PointerEvent) => {
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
    };
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
      badge!.classList.remove("is-dragging");
      wake();
    };
    let side = 1;
    // The keyboard version of a tug: a sideways nudge plus a stretch that springs back.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      pxs[SEGMENTS] -= 4 * side;
      side = -side;
      stretch = maxStretch * 0.5;
      stretchVel = 0;
      wake();
    };
    let width = window.innerWidth;
    const onResize = () => {
      // Phones fire resize when the address bar slides; only a width change re-hangs it.
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      measure();
      rest();
      draw();
      wake();
    };

    badge.setAttribute("role", "button");
    badge.tabIndex = 0;
    badge.setAttribute("aria-label", "Pull the ID badge");
    badge.addEventListener("pointerdown", onDown);
    badge.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    window.addEventListener("resize", onResize);
    const visibility = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      if (heroVisible) wake();
    });
    visibility.observe(hero);

    measure();
    drop();
    draw();
    wake();

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      visibility.disconnect();
      badge.removeEventListener("pointerdown", onDown);
      badge.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      window.removeEventListener("resize", onResize);
      badge.removeAttribute("role");
      badge.removeAttribute("tabindex");
      badge.removeAttribute("aria-label");
      badge.style.transform = "";
      root.classList.remove("has-physics");
    };
  }, [heroRef]);

  return (
    <>
      <div className="lanyard" aria-hidden="true">
        <svg className="strap" width="100%" height="100%">
          <defs>
            <path ref={strapRef} id="strap-path" d="" />
          </defs>
          <use ref={edgeRef} className="strap-edge" href="#strap-path" />
          <use ref={bandRef} className="strap-band" href="#strap-path" />
          <text className="strap-text" dy="4">
            <textPath href="#strap-path">{strapText.repeat(8)}</textPath>
          </text>
        </svg>
      </div>
      <div ref={badgeRef} className="badge">
        <span className="badge-clip" />
        <div className="badge-card">
          <div className="badge-photo">
            <Img value={portrait} alt="" width={892} height={1223} draggable={false} fetchPriority="high" />
          </div>
          <div className="badge-text">
            <p className="badge-name">{name}</p>
            <p className="badge-role">{role}</p>
            {company && <p className="badge-company">{company}</p>}
          </div>
          <p className="badge-foot">
            <span>{location}</span>
            <span className="badge-mark">{initials(name)}</span>
          </p>
        </div>
      </div>
    </>
  );
}
