import Link from "next/link";
import type { Content, Project } from "@/lib/content";
import { Img, Lines, asset, imageSrc, pad, projectPath, tones, videoType } from "@/lib/media";
import { ExternalLink } from "./Dialog";
import { Footer } from "./Footer";
import { Icon } from "./Icon";
import { Nav } from "./Nav";
import { Reveal } from "./Reveal";
import { SplitText } from "./SplitText";
import { Chips } from "./Work";

// One project at full size: the video with sound (or every screenshot), the story,
// the stack, and a way on to the neighbouring projects.
export function ProjectPage({ content, project }: { content: Content; project: Project }) {
  const { profile, projects } = content;
  const index = projects.findIndex((item) => item.id === project.id);
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const tone = tones[index % 3];

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav name={profile.name} email={profile.email} place={profile.location.split(",")[0]} timezone={profile.timezone} home={false} />
      <main id="main" tabIndex={-1} className="project-page">
        <Link className="btn back-link" href="/#work">
          <Icon name="left" />
          All projects
        </Link>
        <header className="project-head">
          <p className={`project-meta tone-${tone}`}>
            <span>
              {pad(index + 1)} / {pad(projects.length)}
            </span>
            <span>{project.category}</span>
          </p>
          <SplitText as="h1" className="project-name" text={project.name} />
          <p className="project-tagline">{project.title}</p>
        </header>

        <Reveal className="project-stage">
          {project.video ? (
            <video controls preload="metadata" playsInline poster={asset(imageSrc(project.images[0]))} aria-label={`Introduction to ${project.name}`}>
              <source src={asset(project.video)} type={videoType(project.video)} />
              Your browser cannot play this video.
            </video>
          ) : (
            <div className="project-gallery">
              {project.images.map((image, i) => (
                <Img key={i} value={image} alt={`${project.name}, screenshot ${i + 1}`} loading={i ? "lazy" : undefined} />
              ))}
            </div>
          )}
        </Reveal>

        <div className="project-body">
          <p className="project-description">
            <Lines text={project.description} />
          </p>
          <Reveal as="aside" className={`project-facts tone-${tone}`}>
            <h2>Built with</h2>
            <Chips value={project.stack} />
            {project.url && (
              <ExternalLink className="btn btn-primary" href={project.url}>
                {project.linkLabel || "View project"}
              </ExternalLink>
            )}
          </Reveal>
        </div>

        {projects.length > 1 && (
          <nav className="project-pager" aria-label="More projects">
            {[
              { label: "Previous", item: previous },
              { label: "Next", item: next },
            ].map(({ label, item }) => (
              <Link key={label} className={`pager-card pager-${label.toLowerCase()}`} href={projectPath(item)}>
                <span className="pager-thumb">
                  <Img value={item.images[0]} alt="" width={160} height={160} loading="lazy" />
                </span>
                <span className="pager-text">
                  <small>{label}</small>
                  <strong>{item.name}</strong>
                </span>
              </Link>
            ))}
          </nav>
        )}
      </main>
      <Footer name={profile.name} note={profile.footer} home={false} />
    </>
  );
}
