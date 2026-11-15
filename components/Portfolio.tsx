import type { ReactNode } from "react";
import type { Content } from "@/lib/content";
import { Img, Lines, pad } from "@/lib/media";
import { AboutStatement } from "./AboutStatement";
import { CopyEmail } from "./CopyEmail";
import { CertificateLink, DialogProvider, ExternalLink } from "./Dialog";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Icon } from "./Icon";
import { Kinetic } from "./Kinetic";
import { PinnedRow } from "./PinnedRow";
import { Reveal } from "./Reveal";
import { SplitText } from "./SplitText";
import { StackCloud } from "./StackCloud";
import { Projects } from "./Work";

// A section with its number and name in a rail on the left that stays in view
// while the content on the right scrolls past.
function Section({ id, number, title, className = "", children }: { id: string; number: number; title: string; className?: string; children: ReactNode }) {
  return (
    <section className={`section ${className}`} id={id} aria-labelledby={`${id}-title`}>
      <header className="rail">
        <span className="rail-num">{pad(number)}</span>
        <h2 className="rail-title" id={`${id}-title`}>
          {title}
        </h2>
      </header>
      <div className="section-body">{children}</div>
    </section>
  );
}

// The whole page. Interactive pieces are client components; everything else is
// rendered to static HTML at build time.
export function Portfolio({ content }: { content: Content }) {
  const { profile, hero, about, projects, experience, certificates, sections } = content;
  // Sections number themselves, so hiding one (no certificates) leaves no gap.
  let count = 0;

  return (
    <DialogProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header name={profile.name} place={profile.location.split(",")[0]} timezone={profile.timezone} />
      <main id="main" tabIndex={-1}>
        <Hero profile={profile} hero={hero} about={about} />

        <section className="work-section" id="work" aria-labelledby="work-title">
          {projects.length ? (
            <Projects
              projects={projects}
              head={
                <div className="work-head">
                  <header className="rail">
                    <span className="rail-num">{pad(++count)}</span>
                    <h2 className="rail-title" id="work-title">
                      Selected work
                    </h2>
                  </header>
                  {profile.github && (
                    <p className="work-more">
                      <ExternalLink href={profile.github}>More on GitHub</ExternalLink>
                    </p>
                  )}
                </div>
              }
            />
          ) : (
            <div className="empty-state">
              <h2 className="rail-title" id="work-title">
                Selected work
              </h2>
              <p>No projects to show yet.</p>
              {profile.github && <ExternalLink href={profile.github}>See my work on GitHub</ExternalLink>}
            </div>
          )}
        </section>

        <Section id="about" number={++count} title="About">
          <AboutStatement lead={`${about.heading} ${about.line2}`} accent={about.accent} rest={about.paragraphs[0] || ""} />
          <div className="prose">
            {about.paragraphs.slice(1).map((text, i) => (
              <Reveal as="p" key={i}>
                {text}
              </Reveal>
            ))}
          </div>
          <dl className="facts">
            {about.facts.map((fact) => (
              <Reveal key={fact.label} className="fact">
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </Reveal>
            ))}
          </dl>
        </Section>

        <Section id="experience" number={++count} title="Experience">
          <div className="lead">
            <SplitText as="p" className="lead-title" text={sections.experienceHeading} accent={sections.experienceAccent} />
            <p className="lead-note">
              <Lines text={sections.experienceIntro} />
            </p>
          </div>
          <ol className="timeline">
            {experience.map((item, i) => (
              <Reveal as="li" key={item.id}>
                <details className="experience-row" name="experience" open={i === 0}>
                  <summary>
                    <Img value={item.logo} alt="" className="experience-logo" width={48} height={48} loading="lazy" />
                    <span className="experience-role">
                      {item.role}
                      <span>{item.company}</span>
                    </span>
                    <span className="experience-date">{item.period}</span>
                    <span className="expand-icon" aria-hidden="true">
                      <Icon name="plus" />
                    </span>
                  </summary>
                  <ul className="experience-points">
                    {item.bullets.map((bullet, k) => (
                      <li key={k}>{bullet}</li>
                    ))}
                  </ul>
                </details>
              </Reveal>
            ))}
          </ol>
        </Section>

        <Section id="stack" number={++count} title="Stack">
          <StackCloud groups={about.skills} />
        </Section>

        {certificates.length > 0 && (
          <section className="work-section" id="certificates" aria-labelledby="certificates-title">
            <PinnedRow
              label="Certificates"
              className="pin-certificates"
              head={
                <div className="work-head">
                  <header className="rail">
                    <span className="rail-num">{pad(++count)}</span>
                    <h2 className="rail-title" id="certificates-title">
                      Certificates
                    </h2>
                  </header>
                </div>
              }
            >
              {certificates.map((item) => (
                <CertificateLink key={item.id} certificate={item} name={profile.name}>
                  <span className="certificate-media">
                    <Img value={item.image} alt="" width={640} height={425} loading="lazy" draggable={false} />
                  </span>
                  <span className="certificate-text">
                    <strong>{item.title}</strong>
                    <small>
                      {item.organization} · {item.period}
                    </small>
                  </span>
                </CertificateLink>
              ))}
            </PinnedRow>
          </section>
        )}

        <section className="contact" id="contact" aria-labelledby="contact-title">
          <p className="contact-intro">
            <Lines text={sections.contactIntro} />
          </p>
          <Kinetic as="h2" className="contact-title" id="contact-title">
            <SplitText as="a" href={`mailto:${profile.email}`} mode="chars" text={sections.contactHeading} accent={sections.contactAccent} />
          </Kinetic>
          <Reveal className="contact-row">
            <a className="btn btn-primary" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <CopyEmail email={profile.email} />
          </Reveal>
          <Reveal className="contact-links">
            {profile.github && <ExternalLink href={profile.github}>GitHub</ExternalLink>}
            {profile.linkedin && <ExternalLink href={profile.linkedin}>LinkedIn</ExternalLink>}
            {profile.instagram && <ExternalLink href={profile.instagram}>Instagram</ExternalLink>}
            {profile.cv && <ExternalLink href={profile.cv}>CV</ExternalLink>}
          </Reveal>
        </section>
      </main>
      <Footer name={profile.name} note={profile.footer} />
    </DialogProvider>
  );
}
