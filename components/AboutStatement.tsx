"use client";

import { useEffect, useRef, useState } from "react";

// One large statement that lights word by word as it scrolls past, so it reads at
// the pace of the scroll instead of arriving all at once.
export function AboutStatement({ lead, accent, rest }: { lead: string; accent: string; rest: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [lit, setLit] = useState(0);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setReading(true);
    const total = el.querySelectorAll(".word").length;
    const update = () => {
      const box = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (vh * 0.85 - box.top) / (box.height + vh * 0.3)));
      setLit(Math.round(progress * total));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  let i = 0;
  const words = (text: string) =>
    text
      .split(/(\s+)/)
      .filter(Boolean)
      .map((part) => {
        if (/^\s+$/.test(part)) return " ";
        const index = i++;
        return (
          <span key={index} className={`word${index < lit ? " is-lit" : ""}`}>
            {part}
          </span>
        );
      });

  return (
    <h2 ref={ref} className={`about-statement${reading ? " is-reading" : ""}`} id="about-title">
      {words(lead)} <em>{words(accent)}</em> {words(rest)}
    </h2>
  );
}
