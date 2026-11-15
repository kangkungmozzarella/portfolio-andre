"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Clock } from "./Clock";
import { SoundToggle } from "./SoundToggle";
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
  useLayoutEffect(() => {
    const place = () => {
      const link = marked ? nav.current?.querySelector<HTMLElement>(`[data-id="${marked}"]`) : null;
      setPill(link ? { x: link.offsetLeft, width: link.offsetWidth } : null);
    };
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [marked]);

  return (
    <header className={`header${scrolled ? " is-scrolled" : ""}`}>
      <a className="header-name" href={home ? "#top" : "/"} aria-label={home ? `${name}, back to top` : `${name}, home`}>
        {name}
      </a>
      <nav ref={nav} className="header-links" aria-label="Sections" onPointerLeave={() => setHovered("")}>
        <span
          className={`header-pill${pill ? " is-on" : ""}`}
          style={pill ? ({ "--x": `${pill.x}px`, "--w": `${pill.width}px` } as CSSProperties) : undefined}
          aria-hidden="true"
        />
        {sections.map(({ id, label }) => (
          <a
            key={id}
            href={`${home ? "" : "/"}#${id}`}
            data-id={id}
            className={marked === id ? "is-on" : undefined}
            aria-current={current === id ? "true" : undefined}
            onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(id)}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="header-tools">
        <Clock place={place} timezone={timezone} />
        <SoundToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
