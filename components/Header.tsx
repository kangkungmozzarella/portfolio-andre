"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Clock } from "./Clock";
import { ThemeToggle } from "./ThemeToggle";

const sections = [
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];

// Parts of the page the menu has no link for; the pill rests on nothing there.
const unlisted = ["top", "stack", "certificates"];

// Links from older layouts (#projects, #profile) still land somewhere sensible.
const oldHashes: Record<string, string> = { projects: "work", profile: "about" };

type Props = { name: string; place: string; timezone: string; home?: boolean };

// The header: the name, the sections, the local time, and the switches, in one bar
// fixed to the top. It is bare at the top of the page and frosts over once the page
// moves. A pill slides to the link being pointed at and rests on the section being
// read. On phones the links move into a bar at the bottom, within reach of a thumb.
// `home` is false on project pages, where the links lead back to the home page.
export function Header({ name, place, timezone, home = true }: Props) {
  const nav = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [current, setCurrent] = useState("");
  const [hovered, setHovered] = useState("");
  const [pill, setPill] = useState<{ x: number; width: number } | null>(null);
  const [held, setHeld] = useState(false);
  const [stretch, setStretch] = useState(0);
  const drag = useRef<{ id: number; startX: number; lastX: number; lastT: number; moved: boolean } | null>(null);
  const settle = useRef<number | undefined>(undefined);
  const marked = hovered || current;

  useEffect(() => {
    const old = oldHashes[location.hash.slice(1)];
    if (old) {
      history.replaceState(null, "", `#${old}`);
      document.getElementById(old)?.scrollIntoView();
    }
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!home) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) setCurrent(unlisted.includes(entry.target.id) ? "" : entry.target.id);
        }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    [...unlisted, ...sections.map(({ id }) => id)].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [home]);

  // Move the pill under the marked link, and keep it there when sizes change.
  // While the bubble is held, the pointer places it instead.
  useLayoutEffect(() => {
    if (held) return;
    const place = () => {
      const link = marked ? nav.current?.querySelector<HTMLElement>(`[data-id="${marked}"]`) : null;
      setPill(link ? { x: link.offsetLeft, width: link.offsetWidth } : null);
    };
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [marked, held]);

  const links = () => [...(nav.current?.querySelectorAll<HTMLAnchorElement>("a[data-id]") ?? [])];

  // The link whose middle is closest to a point along the bar.
  const nearest = (x: number) =>
    links().reduce((best, link) =>
      Math.abs(link.offsetLeft + link.offsetWidth / 2 - x) < Math.abs(best.offsetLeft + best.offsetWidth / 2 - x) ? link : best,
    );

  // Centre the bubble on the pointer, kept inside the bar, sized like the link below it.
  const follow = (clientX: number) => {
    const box = nav.current;
    if (!box) return;
    const x = clientX - box.getBoundingClientRect().left - box.clientLeft;
    const under = nearest(x);
    const width = under.offsetWidth;
    const inset = links()[0].offsetLeft;
    const left = Math.min(Math.max(x - width / 2, inset), box.clientWidth - inset - width);
    setPill({ x: left, width });
    setHovered(under.dataset.id ?? "");
    return x;
  };

  // Press and hold: the bubble swells under the finger. Slide it along the bar and
  // it follows, stretching with the speed; let go and it settles on the nearest link,
  // which is then followed. A plain tap stays an ordinary link click.
  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    drag.current = { id: event.pointerId, startX: event.clientX, lastX: event.clientX, lastT: event.timeStamp, moved: false };
    setHeld(true);
    follow(event.clientX);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    if (!state.moved) {
      if (Math.abs(event.clientX - state.startX) < 6) return;
      state.moved = true;
      // Capture only once it is a drag, so a tap still lands on its link.
      nav.current?.setPointerCapture(event.pointerId);
    }
    const speed = (event.clientX - state.lastX) / Math.max(event.timeStamp - state.lastT, 1);
    state.lastX = event.clientX;
    state.lastT = event.timeStamp;
    setStretch(Math.min(Math.abs(speed) * 0.12, 0.28));
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => setStretch(0), 90);
    follow(event.clientX);
  };

  const release = (event: ReactPointerEvent<HTMLElement>, cancelled = false) => {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    drag.current = null;
    window.clearTimeout(settle.current);
    setStretch(0);
    setHeld(false);
    const box = nav.current;
    if (cancelled || !box) {
      setHovered("");
      return;
    }
    const target = nearest(event.clientX - box.getBoundingClientRect().left - box.clientLeft);
    // A mouse is still over the link it let go on; a finger has left the screen.
    setHovered(event.pointerType === "mouse" ? (target.dataset.id ?? "") : "");
    // Rest the bubble on the chosen link now instead of waiting for the scroll to get there.
    setCurrent(target.dataset.id ?? "");
    // After a drag the click lands on the bar, not a link, so follow the link here.
    if (state.moved) target.click();
  };

  return (
    <header className={`header${scrolled ? " is-scrolled" : ""}`}>
      <a className="header-name" href={home ? "#top" : "/"} aria-label={home ? `${name}, back to top` : `${name}, home`}>
        {name}
      </a>
      <nav
        ref={nav}
        className={`header-links${held ? " is-held" : ""}`}
        aria-label="Sections"
        onPointerLeave={() => !drag.current && setHovered("")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => release(event)}
        onPointerCancel={(event) => release(event, true)}
      >
        <span
          className={`header-pill${pill ? " is-on" : ""}`}
          style={
            pill
              ? ({ "--x": `${pill.x}px`, "--w": `${pill.width}px`, "--sx": 1 + stretch, "--sy": 1 - stretch * 0.45 } as CSSProperties)
              : undefined
          }
          aria-hidden="true"
        />
        {sections.map(({ id, label }) => (
          <a
            key={id}
            href={`${home ? "" : "/"}#${id}`}
            data-id={id}
            draggable={false}
            className={marked === id ? "is-on" : undefined}
            aria-current={current === id ? "true" : undefined}
            onPointerEnter={(event) => event.pointerType === "mouse" && !drag.current && setHovered(id)}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="header-tools">
        <Clock place={place} timezone={timezone} />
        <ThemeToggle />
      </div>
    </header>
  );
}
