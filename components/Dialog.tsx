"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { Certificate, Project } from "@/lib/content";
import { Img, Lines, asset, imageSrc, videoType } from "@/lib/media";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

type Detail = { kind: "project"; item: Project } | { kind: "certificate"; item: Certificate; name: string };

const DialogContext = createContext<{ open: (detail: Detail) => void; isOpen: boolean }>({
  open: () => {},
  isOpen: false,
});
export const useDialog = () => useContext(DialogContext);

// One native <dialog> provides focus trapping, Escape, and focus restoration.
export function DialogProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [image, setImage] = useState(0);

  const open = useCallback((next: Detail) => {
    setDetail(next);
    setImage(0);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const el = dialog.current;
    if (!el || !isOpen || el.open) return;
    el.showModal();
    el.scrollTop = 0;
    el.querySelector<HTMLButtonElement>(".dialog-close")?.focus({ preventScroll: true });
    document.body.classList.add("dialog-open");
  }, [isOpen, detail]);

  const onClose = () => {
    dialog.current?.querySelector("video")?.pause();
    document.body.classList.remove("dialog-open");
    setIsOpen(false);
  };

  // Close on a click that both starts and ends on the backdrop.
  const startedOnBackdrop = useRef(false);
  const outside = (event: MouseEvent) => {
    const box = dialog.current!.getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  };

  const images = detail?.kind === "project" && !detail.item.video ? detail.item.images : [];
  const show = (index: number) => setImage((index + images.length) % images.length);

  return (
    <DialogContext.Provider value={{ open, isOpen }}>
      {children}
      <dialog
        ref={dialog}
        className="project-dialog"
        aria-labelledby="dialog-title"
        onClose={onClose}
        onPointerDown={(event) => (startedOnBackdrop.current = outside(event))}
        onClick={(event) => {
          if (event.target === dialog.current && startedOnBackdrop.current && outside(event)) dialog.current?.close();
          startedOnBackdrop.current = false;
        }}
        onKeyDown={(event) => {
          if (images.length > 1 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
            event.preventDefault();
            show(image + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
      >
        <div className="dialog-toolbar">
          <span className="eyebrow">A closer look</span>
          <button className="dialog-close" type="button" aria-label="Close details" onClick={() => dialog.current?.close()}>
            Close <Icon name="close" />
          </button>
        </div>
        <div className="dialog-content">{detail && <DetailBody detail={detail} image={image} />}</div>
        {images.length > 1 && (
          <div className="gallery-controls">
            <button type="button" aria-label="Previous image" onClick={() => show(image - 1)}>
              <Icon name="left" />
            </button>
            <p className="gallery-count" aria-live="polite">
              {image + 1} / {images.length}
            </p>
            <button type="button" aria-label="Next image" onClick={() => show(image + 1)}>
              <Icon name="right" />
            </button>
          </div>
        )}
      </dialog>
    </DialogContext.Provider>
  );
}

function DetailBody({ detail, image }: { detail: Detail; image: number }) {
  if (detail.kind === "certificate") {
    const { item, name } = detail;
    return (
      <>
        <p className="eyebrow">Certificate / {item.period}</p>
        <h2 id="dialog-title">{item.title}</h2>
        <p className="detail-description">
          <Lines text={item.description} />
        </p>
        <div className="gallery-images certificate-gallery">
          <Img value={item.image} alt={`${name}, ${item.title}`} width={1280} height={850} />
        </div>
        {item.url && <ExternalLink href={item.url}>Open certificate</ExternalLink>}
      </>
    );
  }
  const { item } = detail;
  return (
    <>
      <p className="eyebrow">{item.category}</p>
      <h2 id="dialog-title">{item.name}</h2>
      <p className="detail-description">
        <Lines text={item.description} />
      </p>
      <p className="detail-stack">{item.stack}</p>
      {item.video ? (
        <div className="project-video">
          <video key={item.id} controls preload="none" playsInline poster={asset(imageSrc(item.images[0]))} aria-label={`Introduction to ${item.name}`}>
            <source src={asset(item.video)} type={videoType(item.video)} />
            Your browser cannot play this video.
          </video>
        </div>
      ) : (
        <div className="gallery-images">
          {item.images.map((src, i) => (
            <Img key={i} value={src} alt={`${item.name}, screenshot ${i + 1}`} width={1446} height={788} hidden={i !== image} />
          ))}
        </div>
      )}
      {item.url && <ExternalLink href={item.url}>{item.linkLabel || "View project"}</ExternalLink>}
    </>
  );
}

export function ExternalLink({ href, children, className = "text-link" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children} <Icon name="arrow" />
    </a>
  );
}

// Opens a project in the dialog.
export function ProjectButton({ project }: { project: Project }) {
  const { open } = useDialog();
  return (
    <button className="btn btn-primary" type="button" onClick={() => open({ kind: "project", item: project })}>
      <Icon name={project.video ? "play" : "images"} />
      {project.video ? "Watch video" : "View screenshots"}
    </button>
  );
}

// A certificate card is a real link to the image, upgraded to open the dialog.
export function CertificateLink({ certificate, name, children }: { certificate: Certificate; name: string; children: ReactNode }) {
  const { open } = useDialog();
  return (
    <Reveal
      as="a"
      className="certificate"
      href={asset(imageSrc(certificate.image))}
      onClick={(event: MouseEvent) => {
        event.preventDefault();
        open({ kind: "certificate", item: certificate, name });
      }}
    >
      {children}
    </Reveal>
  );
}
