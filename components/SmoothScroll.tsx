"use client";

import Lenis from "lenis";
import { useEffect } from "react";

// Eased wheel scrolling on desktop. Touch keeps the phone's native scroll, and
// visitors who prefer less motion keep the browser's own scrolling entirely.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      // In-page links glide too, and land clear of the fixed header.
      anchors: { offset: -88 },
      stopInertiaOnNavigate: true,
    });
    // The dialog locks the page; pause the glide with it.
    const sync = () => {
      if (document.body.classList.contains("dialog-open")) lenis.stop();
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
