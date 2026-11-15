"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { Pair } from "@/lib/content";
import { parts } from "@/lib/media";
import { monogram, stackMark } from "@/lib/stack-icons";

// Deterministic 0..1 values per tile, so the server and the browser render the same
// scattered positions.
const hash = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// The tools as icon tiles grouped by kind. Before the section arrives the tiles are
// strewn about and drifting; as it scrolls into view they gather into their rows and
// settle. The scroll position drives it (as --p, 0 to 1), so it plays both ways.
// Without JavaScript, or with reduced motion, the tiles simply sit in their rows.
export function StackCloud({ groups }: { groups: Pair[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 as the block's top enters at the bottom of the screen, 1 once it has
      // risen to a fifth of the way down.
      const raw = Math.min(1, Math.max(0, (vh - box.top) / (vh * 0.8)));
      const eased = 1 - Math.pow(1 - raw, 3);
      el.style.setProperty("--p", eased.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    el.classList.add("is-live");
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      el.classList.remove("is-live");
      el.style.removeProperty("--p");
    };
  }, []);

  let n = 0;
  return (
    <div ref={ref} className="stack-cloud">
      {groups.map((group) => (
        <div key={group.label} className="stack-group">
          <h3>{group.label}</h3>
          <ul className="stack-tiles">
            {parts(group.value).map((name) => {
              const i = n++;
              const mark = stackMark(name);
              const style = {
                "--dx": `${((hash(i) - 0.5) * 70).toFixed(1)}vw`,
                "--dy": `${((hash(i + 101) - 0.5) * 520).toFixed(0)}px`,
                "--r": `${((hash(i + 202) - 0.5) * 120).toFixed(0)}deg`,
                "--d": `${(-hash(i + 303) * 3).toFixed(2)}s`,
                "--brand": mark?.color ?? "var(--ink)",
              } as CSSProperties;
              return (
                <li key={name} className="tile" style={style}>
                  <span className="tile-body">
                    {mark ? (
                      <svg className="tile-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d={mark.path} />
                      </svg>
                    ) : (
                      <span className="tile-icon tile-monogram" aria-hidden="true">
                        {monogram(name)}
                      </span>
                    )}
                    {name}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
