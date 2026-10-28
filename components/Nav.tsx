"use client";

import { useEffect, useRef, useState } from "react";
import { initials } from "@/lib/media";
import { Icon } from "./Icon";

const sections = [
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];

// Links from the previous layout (#projects, #profile) still land somewhere sensible.
const oldHashes: Record<string, string> = { projects: "work", profile: "about" };

type Props = { name: string; email: string; place: string; timezone: string };

export function Nav({ name, email, place, timezone }: Props) {
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [current, setCurrent] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false });
    const update = () => setTime(format.format(new Date()));
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [timezone]);

  useEffect(() => {
    const old = oldHashes[location.hash.slice(1)];
    if (old) {
      history.replaceState(null, "", `#${old}`);
      document.getElementById(old)?.scrollIntoView();
    }
  }, []);

  // The bar steps aside while reading down and comes back on the way up.
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const focusInside = header.current?.contains(document.activeElement);
      setHidden(y > lastY && y > window.innerHeight * 0.6 && !focusInside);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mark the section being read.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setCurrent(entry.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // While the menu is open: Tab stays inside it, Escape and outside clicks close it.
  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    document.querySelectorAll<HTMLElement>("main, .footer").forEach((el) => (el.inert = menuOpen));
    if (!menuOpen) return;
    header.current?.querySelector<HTMLElement>(".menu a")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      toggle.current?.focus();
    };
    const onClick = (event: MouseEvent) => {
      if (!header.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const wide = window.matchMedia("(min-width: 921px)");
    const onWide = () => wide.matches && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
      wide.removeEventListener("change", onWide);
    };
  }, [menuOpen]);

  const links = sections.map(({ id, label }) => (
    <a key={id} href={`#${id}`} aria-current={current === id ? "true" : undefined}>
      {label}
    </a>
  ));
  const [firstName] = name.split(" ");

  return (
    <header ref={header} className={`nav${hidden && !menuOpen ? " is-hidden" : ""}`}>
      <a className="nav-logo" href="#top" aria-label={`${name}, back to top`}>
        <span className="nav-mark" aria-hidden="true">
          {initials(name)}
        </span>
        <span className="nav-name">{firstName}</span>
      </a>
      <nav className="nav-links" aria-label="Sections">
        {links}
      </nav>
      <p className="clock">
        <span className="clock-place">{place}</span>
        <span className="local-time">{time}</span>
      </p>
      <a className="btn btn-primary nav-cta" href={`mailto:${email}`}>
        Email me
      </a>
      <button ref={toggle} className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="menu" onClick={() => setMenuOpen(!menuOpen)}>
        <span className="menu-icon">
          <Icon name="menu" />
        </span>
        <span className="menu-label">{menuOpen ? "Close" : "Menu"}</span>
      </button>
      <div className="menu" id="menu" hidden={!menuOpen} onClick={(event) => (event.target as HTMLElement).closest("a") && setMenuOpen(false)}>
        <nav aria-label="Sections">{links}</nav>
        <a className="btn btn-primary" href={`mailto:${email}`}>
          Email me
        </a>
      </div>
    </header>
  );
}
