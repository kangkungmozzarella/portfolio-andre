import type { Content } from "@/lib/content";
import { Img, Lines, pad, parts } from "@/lib/media";
import { AboutStatement } from "./AboutStatement";
import { Bands } from "./Bands";
import { CertificateLink, DialogProvider, ExternalLink } from "./Dialog";
import { Hero } from "./Hero";
import { Icon } from "./Icon";
import { Nav } from "./Nav";
import { Reveal } from "./Reveal";
import { SplitText } from "./SplitText";
import { Chips, ProjectCard, WorkIndex, tones } from "./Work";

// The whole page. Interactive pieces are client components; everything else is
// rendered to static HTML at build time.
export function Portfolio({ content }: { content: Content }) {
  const { profile, hero, about, projects, experience, certificates, sections } = content;

  return (
    <DialogProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav name={profile.name} email={profile.email} place={profile.location.split(",")[0]} timezone={profile.timezone} />
      <main id="main" tabIndex={-1}>
        <Hero profile={profile} hero={hero} about={about} experience={experience} />

        {/* The two bands carry the first two skill groups. */}
        <Bands rows={about.skills.slice(0, 2).map((group) => parts(group.value))} />

        <section className="section work-section" id="work" aria-labelledby="work-title">
          <header className="section-head">
            <p className="section-label">
              Selected work <span className="count">{pad(projects.length)}</span>
            </p>
            <SplitText as="h2" className="section-title" id="work-title" text="Things I have" accent="built." />
          </header>
          {projects.length ? (
            <>
              <WorkIndex projects={projects} />
              <div className="work-list">
                {projects.map((project, i) => (
                  <ProjectCard key={project.id} project={project} index={i} total={projects.length} />
                ))}
              </div>
              {profile.github && (
                <p className="work-more">
                  <ExternalLink className="btn btn-big" href={profile.github}>
                    More on GitHub
                  </ExternalLink>
                </p>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>No projects to show yet.</p>
              {profile.github && <ExternalLink href={profile.github}>See my work on GitHub</ExternalLink>}
            </div>
          )}
        </section>

        <section className="section about" id="about" aria-labelledby="about-title">
          <p className="section-label">About</p>
          <AboutStatement lead={`${about.heading} ${about.line2}`} accent={about.accent} rest={about.paragraphs[0] || ""} />
          <div className="about-body">
            <div className="prose">
              {about.paragraphs.slice(1).map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>
            <dl className="facts">
              {about.facts.map((fact, i) => (
                <Reveal key={fact.label} className={`fact tone-${tones[i % 3]}`}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        <section className="section experience" id="experience" aria-labelledby="experience-title">
          <header className="section-head section-head-split">
            <div>
              <p className="section-label">Experience</p>
              <SplitText as="h2" className="section-title" id="experience-title" text={sections.experienceHeading} accent={sections.experienceAccent} />
            </div>
            <p className="section-intro">
              <Lines text={sections.experienceIntro} />
            </p>
          </header>
          <div className="experience-list">
            {experience.map((item, i) => (
              <Reveal as="details" key={item.id} className="experience-row" name="experience" open={i === 0}>
                <summary>
                  <span className="experience-date">{item.period}</span>
                  <span className="experience-role">
                    {item.role}
                    <span>{item.company}</span>
                  </span>
                  <Img value={item.logo} alt="" className="experience-logo" width={48} height={48} loading="lazy" />
                  <span className="expand-icon" aria-hidden="true">
                    <Icon name="plus" />
                  </span>
                </summary>
                <ul className="experience-points">
                  {item.bullets.map((bullet, k) => (
                    <li key={k}>{bullet}</li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="section toolbox" aria-labelledby="toolbox-title">
          <p className="section-label">Toolbox</p>
          <SplitText as="h2" className="section-title" id="toolbox-title" text="The tools I" accent="work with." />
          <div className="toolbox-groups">
            {about.skills.map((group, i) => (
              <Reveal key={group.label} className={`toolbox-group tone-${tones[i % 3]}`}>
                <h3>{group.label}</h3>
                <Chips value={group.value} />
              </Reveal>
            ))}
          </div>
        </section>

        {certificates.length > 0 && (
          <section className="section certificates-section" aria-labelledby="certificates-title">
            <p className="section-label">Certificates</p>
            <SplitText as="h2" className="section-title" id="certificates-title" text="A little structured" accent="learning, too." />
            <div className="certificates">
              {certificates.map((item) => (
                <CertificateLink key={item.id} certificate={item} name={profile.name}>
                  <span className="certificate-media">
                    <Img value={item.image} alt="" width={640} height={425} loading="lazy" />
                  </span>
                  <span className="certificate-text">
                    <strong>{item.title}</strong>
                    <small>
                      {item.organization} · {item.period}
                    </small>
                  </span>
                </CertificateLink>
              ))}
            </div>
          </section>
        )}

        <section className="section contact" id="contact" aria-labelledby="contact-title">
          <Reveal className="contact-box">
            <p className="section-label">Contact</p>
            <p className="contact-intro">
              <Lines text={sections.contactIntro} />
            </p>
            <h2 className="contact-title" id="contact-title">
              <SplitText as="a" href={`mailto:${profile.email}`} text={sections.contactHeading} accent={sections.contactAccent} />
            </h2>
            <div className="contact-links">
              <a className="btn btn-primary" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
              {profile.github && <ExternalLink className="btn" href={profile.github}>GitHub</ExternalLink>}
              {profile.linkedin && <ExternalLink className="btn" href={profile.linkedin}>LinkedIn</ExternalLink>}
              {profile.instagram && <ExternalLink className="btn" href={profile.instagram}>Instagram</ExternalLink>}
              {profile.cv && <ExternalLink className="btn" href={profile.cv}>CV</ExternalLink>}
            </div>
          </Reveal>
        </section>
      </main>
      <footer className="footer">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>{profile.footer}</span>
        <a className="text-link" href="#top">
          Back to top <Icon name="up" />
        </a>
      </footer>
    </DialogProvider>
  );
}
