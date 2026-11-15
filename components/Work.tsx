"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Project } from "@/lib/content";
import { asset, Img, imageSrc, imageStyle, pad, parts, projectPath, videoType } from "@/lib/media";
import { Icon } from "./Icon";
import { PinnedRow } from "./PinnedRow";

export function Chips({ value }: { value: string }) {
  return (
    <ul className="chips">
      {parts(value).map((part) => (
        <li key={part}>{part}</li>
      ))}
    </ul>
  );
}

// Every project as a card in a pinned row that slides sideways as the page scrolls
// (see PinnedRow). Categories above the row narrow it down. `head` is the title row.
export function Projects({ projects, head }: { projects: Project[]; head: ReactNode }) {
  const categories = [...new Set(projects.map((project) => project.category))];
  const [filter, setFilter] = useState("");
  const shown = filter ? projects.filter((project) => project.category === filter) : projects;

  return (
    <PinnedRow
      label="Projects"
      resetKey={filter}
      head={
        <>
          {head}
          {categories.length > 1 && (
            <div className="filters" role="group" aria-label="Filter projects by type">
              {["", ...categories].map((category) => (
                <button key={category} type="button" aria-pressed={filter === category} onClick={() => setFilter(category)}>
                  {category || "All"}
                  <span className="count">{category ? projects.filter((project) => project.category === category).length : projects.length}</span>
                </button>
              ))}
            </div>
          )}
        </>
      }
    >
      {shown.map((project) => (
        <ProjectCard key={project.id} project={project} index={projects.indexOf(project)} />
      ))}
    </PinnedRow>
  );
}

// One project. The whole card leads to the project's page. On a mouse, its video
// plays muted while the pointer rests on it.
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const play = (on: boolean) => {
    const el = video.current;
    if (!el || failed) return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (on && !saveData && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.preload = "auto";
      el.play().catch(() => {});
    } else el.pause();
  };

  return (
    <article id={`project-${project.id}`} className="card">
      <Link
        className="card-link"
        href={projectPath(project)}
        onPointerEnter={(event) => event.pointerType === "mouse" && play(true)}
        onPointerLeave={() => play(false)}
      >
        <span className="card-media">
          {project.video ? (
            <video ref={video} className="work-video" muted loop playsInline preload="none" poster={asset(imageSrc(project.images[0]))} style={imageStyle(project.images[0])}>
              <source src={asset(project.video)} type={videoType(project.video)} onError={() => setFailed(true)} />
            </video>
          ) : (
            <Img value={project.images[0]} alt="" className="work-video" loading="lazy" />
          )}
          <span className="card-cta">
            <Icon name={project.video ? "play" : "images"} />
            {project.video ? "Watch video" : "View screenshots"}
          </span>
        </span>
        <span className="card-meta">
          <span>{pad(index + 1)}</span>
          <span>{project.category}</span>
        </span>
        <span className="card-name">{project.name}</span>
        <span className="card-title">{project.title}</span>
        <span className="card-stack">{parts(project.stack).join(" · ")}</span>
      </Link>
    </article>
  );
}
