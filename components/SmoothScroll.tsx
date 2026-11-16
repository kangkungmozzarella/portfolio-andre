"use client";

import Lenis from "lenis";
import { useEffect } from "react";

// In-page links land clear of the fixed header.
const OFFSET = -88;
// How long the page takes to fade out before a leap, in ms (matches the CSS).
const FADE = 180;

// The sideways rows (Work, Certificates) turn a long stretch of scrolling into a
// sideways slide. A link that glides straight through one shows only cards running
// past and seems to stall, so such a trip leaps instead: the page fades, jumps to just
// short of the target, and glides the last stretch in as it fades back.
function startFor(from: number, to: number) {
  const down = to > from;
  const pins = [...document.querySelectorAll<HTMLElement>(".pin.is-pinned:not(.is-still)")].map((pin) => {
    const top = pin.getBoundingClientRect().top + window.scrollY;
    return { top, bottom: top + pin.offsetHeight };
  });
  const crossed = pins.filter(({ top, bottom }) => Math.min(from, to) < bottom && Math.max(from, to) > top);
  if (!crossed.length) return null;
  // Begin a short glide away from the target, but never inside a row, where the
  // glide would end on cards sliding past again.
  const lead = Math.min(window.innerHeight * 0.6, Math.abs(to - from));
  let start = down ? to - lead : to + lead;
  for (const { top, bottom } of crossed) {
    if (start > top && start < bottom) start = down ? Math.min(bottom, to) : Math.max(top - window.innerHeight * 0.1, to);
  }
  return start;
}

// Eased wheel scrolling on desktop. Touch keeps the phone's native scroll, and
// visitors who prefer less motion keep the browser's own scrolling entirely.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, stopInertiaOnNavigate: true });
    const root = document.documentElement;
    let timer: number | undefined;

    const go = (target: HTMLElement) => {
      window.clearTimeout(timer);
      root.classList.remove("is-leaping");
      const from = window.scrollY;
      const to = Math.max(0, Math.min(target.getBoundingClientRect().top + from + OFFSET, lenis.limit));
      const start = startFor(from, to);
      if (start === null) {
        lenis.scrollTo(to, { duration: Math.min(1.4, 0.6 + Math.abs(to - from) / 4000) });
        return;
      }
      root.classList.add("is-leaping");
      timer = window.setTimeout(() => {
        lenis.scrollTo(start, { immediate: true, force: true });
        root.classList.remove("is-leaping");
        lenis.scrollTo(to, { duration: 0.9, force: true });
      }, FADE);
    };

    // Every link to a part of this page, the header's included.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      const id = link?.getAttribute("href")?.slice(1);
      if (!link || id === undefined) return;
      const target = id ? document.getElementById(id) : document.body;
      if (!target) return;
      event.preventDefault();
      if (id) history.pushState(null, "", `#${id}`);
      go(target);
      // Keep what the browser would do for keyboard users: the skip link moves focus.
      if (target.hasAttribute("tabindex")) target.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);

    // The dialog locks the page; pause the glide with it.
    const sync = () => {
      if (document.body.classList.contains("dialog-open")) lenis.stop();
      else lenis.start();
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => {
      document.removeEventListener("click", onClick);
      window.clearTimeout(timer);
      root.classList.remove("is-leaping");
      observer.disconnect();
      lenis.destroy();
    };
  }, []);
  return null;
}
