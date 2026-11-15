"use client";

import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "./Icon";

type Props = {
  // Names the row for screen readers.
  label: string;
  // The title row (and anything else) shown above the cards.
  head: ReactNode;
  // When this changes (a new filter), the row starts again from its first card.
  resetKey?: string;
  className?: string;
  children: ReactNode;
};

// A row of cards that pins to the screen while scrolling down slides it sideways;
// once the last card is in view the page carries on down. The section is as tall as
// the row is long, so however many cards there are, they never stack down the page.
// A row that already fits on screen simply sits still. Without JavaScript, or for
// visitors who prefer less motion, the row scrolls sideways on its own instead.
export function PinnedRow({ label, head, resetKey = "", className = "", children }: Props) {
  const outer = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [pinned, setPinned] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPinned(true);
  }, []);

  useEffect(() => {
    const box = outer.current;
    const row = track.current;
    const panel = stage.current;
    if (!pinned || !box || !row || !panel) return;
    let distance = 0;
    let stick = 0;

    const place = () => {
      // How far the page has scrolled since the panel stuck.
      const travelled = stick - box.getBoundingClientRect().top;
      const progress = distance > 0 ? Math.min(1, Math.max(0, travelled / distance)) : 0;
      row.style.transform = `translate3d(${(-progress * distance).toFixed(1)}px, 0, 0)`;
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
    };
    const measure = () => {
      // How far the row runs past the right edge of its frame.
      distance = Math.max(0, row.scrollWidth - (row.parentElement?.clientWidth ?? 0));
      // The panel is as tall as its content and sticks centred on the screen (never
      // under the header), so no empty screen-height opens up before it.
      const header = document.querySelector(".header")?.getBoundingClientRect().height ?? 68;
      // Whole pixels: a sticky panel on a half pixel shimmers as the page scrolls.
      stick = Math.round(Math.max(header + 8, (window.innerHeight - panel.offsetHeight) / 2));
      panel.style.top = `${stick}px`;
      box.style.height = `${panel.offsetHeight + distance}px`;
      box.classList.toggle("is-still", distance === 0);
      place();
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(row);
    window.addEventListener("resize", measure);
    // Placed in the scroll event itself, so the row moves in the same frame as the page.
    window.addEventListener("scroll", place, { passive: true });
    return () => {
      resize.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", place);
      box.style.height = "";
      panel.style.top = "";
      row.style.transform = "";
      box.classList.remove("is-still");
    };
  }, [pinned, resetKey]);

  // A new filter starts the row from its beginning, wherever the page was.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const box = outer.current;
    const panel = stage.current;
    if (!pinned || !box || !panel) return;
    const stick = parseFloat(panel.style.top || "0");
    if (box.getBoundingClientRect().top < stick) window.scrollTo({ top: box.getBoundingClientRect().top + window.scrollY - stick });
  }, [resetKey, pinned]);

  return (
    <div ref={outer} className={`pin${pinned ? " is-pinned" : ""} ${className}`}>
      <div ref={stage} className="pin-stage">
        <div className="pin-head">{head}</div>
        <div className="pin-frame">
          <div ref={track} key={resetKey} className="pin-track" role="list" aria-label={label}>
            {Children.toArray(children).map((child, i) => (
              <div key={i} role="listitem" className="pin-item" style={{ "--n": i } as CSSProperties}>
                {child}
              </div>
            ))}
          </div>
        </div>
        <div className="pin-foot" aria-hidden="true">
          <span className="pin-progress">
            <span ref={bar} />
          </span>
          <span className="pin-hint">
            Scroll <Icon name="right" />
          </span>
        </div>
      </div>
    </div>
  );
}
