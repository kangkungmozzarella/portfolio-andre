"use client";

import { useEffect, useRef } from "react";

// Two strips of tape crossing under the hero. They list the tools and drift on
// their own, speeding up with the scroll (the second one runs the other way).
// They hold still for visitors who prefer less motion.
export function Bands({ rows }: { rows: string[][] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tracks = [...el.querySelectorAll<HTMLElement>(".band-track")];
    const offsets = tracks.map(() => 0);
    let boost = 0;
    let lastScroll = window.scrollY;
    let visible = false;
    let running = false;
    let frameId = 0;
    let then = 0;
    const onScroll = () => {
      boost = Math.min(1600, boost + Math.abs(window.scrollY - lastScroll) * 6);
      lastScroll = window.scrollY;
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - then) / 1000);
      then = now;
      boost *= 0.92;
      tracks.forEach((track, i) => {
        const width = (track.firstElementChild as HTMLElement).offsetWidth;
        offsets[i] = (offsets[i] + (70 + boost) * dt) % width;
        const x = i % 2 ? offsets[i] - width : -offsets[i];
        track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
      });
      if (visible && !document.hidden) frameId = requestAnimationFrame(tick);
      else running = false;
    };
    const start = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      then = performance.now();
      frameId = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    observer.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", start);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", start);
    };
  }, []);

  const styles = ["band-ink", "band-yellow"];
  return (
    <div ref={ref} className="bands" aria-hidden="true">
      {rows.map((items, i) =>
        items.length ? (
          <div key={i} className={`band ${styles[i % 2]}`}>
            <div className="band-track">
              {[0, 1].map((copy) => (
                <p key={copy} className="band-set">
                  {items.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </p>
              ))}
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
}
