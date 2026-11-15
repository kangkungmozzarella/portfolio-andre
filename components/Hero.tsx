import type { Content } from "@/lib/content";
import { Img } from "@/lib/media";
import { ExternalLink } from "./Dialog";
import { Kinetic } from "./Kinetic";
import { Reveal } from "./Reveal";
import { SplitText } from "./SplitText";

type Props = Pick<Content, "profile" | "hero" | "about">;

// The opening screen: one large sentence whose letters lean toward the pointer, and
// beside it the portrait, whole and uncropped, standing in front of a tall pill.
export function Hero({ profile, hero, about }: Props) {
  const [firstName] = profile.name.split(" ");
  const sentence = `${hero.line1} ${hero.line2} ${hero.accent}`;
  // The three pieces continue one stagger, so the sentence arrives left to right.
  const letters = (text: string) => text.replace(/\s/g, "").length;

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <Reveal as="p" className="hero-kicker">
        {hero.specialty}
      </Reveal>
      <Kinetic as="h1" className="hero-title" id="hero-title" aria-label={sentence}>
        <SplitText className="hero-line" mode="chars" text={hero.line1} aria-hidden />{" "}
        <SplitText className="hero-line" mode="chars" text={hero.line2} offset={letters(hero.line1)} aria-hidden />{" "}
        <em className="hero-line" aria-hidden="true">
          <SplitText mode="chars" text={hero.accent} offset={letters(hero.line1 + hero.line2)} />
        </em>
      </Kinetic>
      <div className="hero-portrait">
        <span className="hero-portrait-photo">
          <Img value={about.portrait} alt={profile.name} width={892} height={1223} fetchPriority="high" />
        </span>
      </div>
      <div className="hero-foot">
        <Reveal className="hero-intro">
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
        </Reveal>
        <Reveal as="p" className="hero-status">
          <span className="status-dot" aria-hidden="true" />
          {hero.status}
        </Reveal>
      </div>
    </section>
  );
}
