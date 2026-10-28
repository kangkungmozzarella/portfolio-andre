"use client";

import Lenis from "lenis";
import { useEffect } from "react";

// Eased wheel scrolling on desktop. Touch keeps the phone's native scroll, and
// visitors who prefer less motion keep the browser's own scrolling entirely.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nav = document.querySelector<HTMLElement>(".nav");
    const lenis = new Lenis({
      autoRaf: true,
      // In-page links glide too, and land clear of the floating header.
      anchors: { offset: -((nav?.getBoundingClientRect().bottom ?? 80) + 16) },
      stopInertiaOnNavigate: true,
    });
    // The dialog and the open menu lock the page; pause the glide with them.
    const sync = () => {
      const locked = document.body.classList.contains("dialog-open") || document.body.classList.contains("menu-open");
      if (locked) lenis.stop();
      else lenis.start();
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => {
      observer.disconnect();
      lenis.destroy();
    };
  }, []);
  return null;
}
