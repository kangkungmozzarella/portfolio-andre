"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Project } from "@/lib/content";
import { useOnScreen } from "@/lib/hooks";
import { Img, Lines, asset, imageSrc, pad, parts, projectPath, tones, videoType } from "@/lib/media";
import Link from "next/link";
import { ExternalLink } from "./Dialog";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

export function Chips({ value }: { value: string }) {
  return (
    <ul className="chips">
      {parts(value).map((part) => (
        <li key={part}>{part}</li>
      ))}
    </ul>
  );
}

// An index to scan before the cards. On a mouse, a small cover follows the pointer.
export function WorkIndex({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [follow, setFollow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const update = () => setFollow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <div
      className="work-index"
      onPointerMove={(event) => {
        if (!follow) return;
        setPoint({ x: event.clientX + 28, y: event.clientY - 90 });
        const link = (event.target as HTMLElement).closest<HTMLElement>("[data-thumb]");
        setActive(link ? Number(link.dataset.thumb) : null);
      }}
      onPointerLeave={() => setActive(null)}
    >
      <ol>
        {projects.map((project, i) => (
          <li key={project.id}>
            <a href={`#project-${project.id}`} data-thumb={i}>
              <span className="index-num">{pad(i + 1)}</span>
              <span className="index-name">{project.name}</span>
              <span className="index-category">{project.category}</span>
            </a>
          </li>
        ))}
      </ol>
      <div
        className={`thumbs${follow && active !== null ? " is-on" : ""}`}
        style={{ "--x": `${point.x}px`, "--y": `${point.y}px` } as CSSProperties}
        aria-hidden="true"
      >
        {projects.map((project, i) => (
          <span key={project.id} className={`thumb${active === i ? " is-on" : ""}`}>
            <Img value={project.images[0]} alt="" width={160} height={160} loading="lazy" />
          </span>
        ))}
      </div>
    </div>
  );
}

// The main action on a card: the project's own page, where the video plays with sound.
export function ProjectLink({ project }: { project: Project }) {
  return (
    <Link className="btn btn-primary" href={projectPath(project)}>
      <Icon name={project.video ? "play" : "images"} />
      {project.video ? "Watch video" : "View screenshots"}
    </Link>
  );
}

// A project card. Its video plays muted while on screen, unless the visitor asked
// for less motion or less data.
export function ProjectCard({ project, index, total }: { project: Project; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const onScreen = useOnScreen(ref, 0.25);
  const [ratio, setRatio] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const cover = imageSrc(project.images[0]);

  // Each frame takes the ratio of its poster, so portrait videos stay portrait.
  useEffect(() => {
    const probe = new Image();
    probe.onload = () => setRatio(probe.naturalWidth / probe.naturalHeight);
    probe.src = asset(cover);
  }, [cover]);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (onScreen && !failed && !saveData && !reduced) {
      el.preload = "auto";
      el.play().catch(() => {});
    } else el.pause();
  }, [onScreen, failed]);

  const portrait = ratio !== null && ratio < 1;
  return (
    <Reveal
      as="article"
      id={`project-${project.id}`}
      className={`work tone-${tones[index % 3]}${portrait ? " is-portrait" : ""}`}
    >
      <p className="work-bar">
        <span>
          {pad(index + 1)} / {pad(total)}
        </span>
        <span>{project.category}</span>
      </p>
      <div ref={ref} className="work-body">
        <div className="work-frame">
          {project.video ? (
            <video
              ref={video}
              className="work-video"
              muted
              loop
              playsInline
              preload="none"
              poster={asset(cover)}
              style={ratio ? { aspectRatio: String(ratio) } : undefined}
            >
              <source src={asset(project.video)} type={videoType(project.video)} onError={() => setFailed(true)} />
            </video>
          ) : (
            <Img value={project.images[0]} alt="" className="work-video" loading="lazy" style={ratio ? { aspectRatio: String(ratio) } : undefined} />
          )}
        </div>
        <div className="work-text">
          <h3 className="work-name">
            <Link href={projectPath(project)}>{project.name}</Link>
          </h3>
          <p className="work-title">{project.title}</p>
          <p className="work-description">
            <Lines text={project.description} />
          </p>
          <Chips value={project.stack} />
          <div className="actions">
            <ProjectLink project={project} />
            {project.url && (
              <ExternalLink className="btn" href={project.url}>
                {project.linkLabel || "View project"}
              </ExternalLink>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
