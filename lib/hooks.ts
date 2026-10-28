"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

const reducedQuery = "(prefers-reduced-motion: reduce)";

// Server render and the first client render assume motion is allowed; the inline
// script in the layout has already set html.motion from the real preference.
export function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(reducedQuery);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(reducedQuery).matches,
    () => false,
  );
}

// True once the element has scrolled into view, and stays true.
export function useInView<T extends Element>(ref: RefObject<T | null>, { margin = "0px 0px -6% 0px", threshold = 0.15 } = {}) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (!("IntersectionObserver" in window)) return setSeen(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin, threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, seen, margin, threshold]);
  return seen;
}

// True while the element is on screen (for things that should pause off screen).
export function useOnScreen<T extends Element>(ref: RefObject<T | null>, threshold = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return visible;
}
