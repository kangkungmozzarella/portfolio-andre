"use client";

import { useEffect, useRef, useState } from "react";
import type { Content } from "@/lib/content";
import { ExternalLink } from "./Dialog";
import { Lanyard } from "./Lanyard";
import { SplitText } from "./SplitText";

type Props = Pick<Content, "profile" | "hero" | "about" | "experience">;

export function Hero({ profile, hero, about, experience }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [firstName, ...rest] = profile.name.split(" ");
  const lastNames = rest.join(" ");
  const current = experience[0];

  // The text arrives just as the badge snaps taut, so the two land together.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setRevealed(true), reduced ? 0 : 650);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section ref={ref} className={`hero${revealed ? " is-in" : ""}`} id="top" aria-labelledby="hero-name">
      <Lanyard
        heroRef={ref}
        name={profile.name}
        role={current ? current.role : hero.specialty}
        company={current?.company}
        location={profile.location}
        portrait={about.portrait}
      />
      <div className="hero-text">
        <p className="hero-specialty">{hero.specialty}</p>
        <h1 className="hero-name" id="hero-name" aria-label={profile.name}>
          <SplitText className="hero-line" mode="chars" text={firstName} active={revealed} aria-hidden />{" "}
          <SplitText className="hero-line hero-line-mark" mode="chars" text={lastNames} offset={firstName.length} active={revealed} aria-hidden />
        </h1>
        <SplitText as="p" className="hero-tagline" text={`${hero.line1} ${hero.line2}`} accent={hero.accent} active={revealed} />
        <p className="hero-lede">{hero.intro}</p>
        <div className="actions">
          <a className="btn btn-primary" href={`mailto:${profile.email}`}>
            Email {firstName}
          </a>
          {profile.cv && (
            <ExternalLink className="btn" href={profile.cv}>
              View my CV
            </ExternalLink>
          )}
        </div>
      </div>
      <p className="sticker sticker-status">
        <span className="status-dot" aria-hidden="true" />
        {hero.status}
      </p>
      <p className="drag-hint" aria-hidden="true">
        Psst, pull the badge
      </p>
    </section>
  );
}
