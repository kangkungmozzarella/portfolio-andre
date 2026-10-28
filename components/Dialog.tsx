"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { Certificate } from "@/lib/content";
import { Img, Lines, asset, imageSrc } from "@/lib/media";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

type Detail = { item: Certificate; name: string };

const DialogContext = createContext<{ open: (detail: Detail) => void }>({ open: () => {} });
const useDialog = () => useContext(DialogContext);

// Certificates open in one native <dialog>, which provides focus trapping, Escape,
// and focus restoration. Projects have pages of their own.
export function DialogProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback((next: Detail) => {
    setDetail(next);
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
    document.body.classList.remove("dialog-open");
    setIsOpen(false);
  };

  // Close on a click that both starts and ends on the backdrop.
  const startedOnBackdrop = useRef(false);
  const outside = (event: MouseEvent) => {
    const box = dialog.current!.getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  };

  return (
    <DialogContext.Provider value={{ open }}>
      {children}
      <dialog
        ref={dialog}
        className="project-dialog"
        aria-labelledby="dialog-title"
        data-lenis-prevent
        onClose={onClose}
        onPointerDown={(event) => (startedOnBackdrop.current = outside(event))}
        onClick={(event) => {
          if (event.target === dialog.current && startedOnBackdrop.current && outside(event)) dialog.current?.close();
          startedOnBackdrop.current = false;
        }}
      >
        <div className="dialog-toolbar">
          <span className="eyebrow">A closer look</span>
          <button className="dialog-close" type="button" aria-label="Close details" onClick={() => dialog.current?.close()}>
            Close <Icon name="close" />
          </button>
        </div>
        <div className="dialog-content">
          {detail && (
            <>
              <p className="eyebrow">Certificate / {detail.item.period}</p>
              <h2 id="dialog-title">{detail.item.title}</h2>
              <p className="detail-description">
                <Lines text={detail.item.description} />
              </p>
              <div className="gallery-images certificate-gallery">
                <Img value={detail.item.image} alt={`${detail.name}, ${detail.item.title}`} width={1280} height={850} />
              </div>
              {detail.item.url && <ExternalLink href={detail.item.url}>Open certificate</ExternalLink>}
            </>
          )}
        </div>
      </dialog>
    </DialogContext.Provider>
  );
}

export function ExternalLink({ href, children, className = "text-link" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children} <Icon name="arrow" />
    </a>
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
        open({ item: certificate, name });
      }}
    >
      {children}
    </Reveal>
  );
}
