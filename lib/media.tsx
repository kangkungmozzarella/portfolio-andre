import { Fragment, type CSSProperties, type ImgHTMLAttributes } from "react";
import type { ImageValue } from "./content";

export const imageSrc = (value: ImageValue) => (typeof value === "string" ? value : value.src);

// Content stores site paths without a leading slash (assets/images/...); remote
// video URLs pass through untouched.
export const asset = (path: string) => (/^https?:\/\//.test(path) ? path : `/${path.replace(/^\/+/, "")}`);

// Position adjustments travel as CSS variables; the stylesheet decides which images
// honour them (the badge photo, project thumbnails, and certificate cards).
export function imageStyle(value: ImageValue): CSSProperties | undefined {
  if (typeof value === "string") return undefined;
  return {
    "--image-fit": value.fit,
    "--image-x": `${value.x}%`,
    "--image-y": `${value.y}%`,
    "--image-zoom": value.zoom / 100,
  } as CSSProperties;
}

type ImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { value: ImageValue; alt: string };

export function Img({ value, alt, style, ...rest }: ImgProps) {
  // Plain <img>: the site is a static export, so there is no image optimiser to route through.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={asset(imageSrc(value))} alt={alt} style={{ ...imageStyle(value), ...style }} {...rest} />;
}

// CMS text areas keep their line breaks.
export function Lines({ text }: { text: string }) {
  return text.split("\n").map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));
}

export const videoType = (src: string) =>
  src.toLowerCase().split(/[?#]/)[0].endsWith(".webm") ? "video/webm" : "video/mp4";

// Stack and skill fields are written as "A · B · C" in the CMS.
export const parts = (value: string) =>
  value
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);

export const pad = (n: number) => String(n).padStart(2, "0");
