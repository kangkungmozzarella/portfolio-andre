"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type Props = {
  as?: ElementType;
  className?: string;
  children?: ReactNode;
  [attribute: string]: unknown;
};

// How far the pointer's pull reaches, in pixels, and the weight right under it.
const RADIUS = 240;
const PEAK = 800;

// Type that reacts to the pointer: the letters inside (the `.ch` pieces that
// SplitText renders) grow heavier as the pointer comes near and relax as it leaves.
// The typeface is a variable font, so the weight changes smoothly. It needs a mouse;
// on touch screens and with reduced motion the heading simply stays as set.
export function Kinetic({ as: Tag = "div", className, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const letters = [...el.querySelectorAll<HTMLElement>(".ch")];
    if (!letters.length) return;
    const base = Number(getComputedStyle(letters[0]).fontWeight) || 500;
    const weights = letters.map(() => base);
    let x = -1e5;
    let y = -1e5;
    let frame = 0;

    const tick = () => {
      frame = 0;
      // Read every position first, then write, so the browser lays out once per frame.
      const boxes = letters.map((letter) => letter.getBoundingClientRect());
      let moving = false;
      letters.forEach((letter, i) => {
        const box = boxes[i];
        const pull = Math.max(0, 1 - Math.hypot(x - box.left - box.width / 2, y - box.top - box.height / 2) / RADIUS);
        const target = base + (PEAK - base) * pull * pull;
        weights[i] += (target - weights[i]) * 0.16;
        if (Math.abs(target - weights[i]) > 0.5) moving = true;
        else weights[i] = target;
        letter.style.fontWeight = weights[i] === base ? "" : weights[i].toFixed(0);
      });
      if (moving) frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      wake();
    };
    const onLeave = () => {
      x = y = -1e5;
      wake();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    // The letters move under a still pointer when the page scrolls.
    window.addEventListener("scroll", wake, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", wake);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      letters.forEach((letter) => (letter.style.fontWeight = ""));
    };
  }, []);

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
