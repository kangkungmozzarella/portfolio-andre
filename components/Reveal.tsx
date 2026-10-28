"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { useInView } from "@/lib/hooks";

type Props = {
  as?: ElementType;
  className?: string;
  children?: ReactNode;
  [attribute: string]: unknown;
};

// Wraps anything that tips in from below and settles once scrolled into view (the
// `.rise` styles). Without JavaScript or with reduced motion it simply sits in place.
export function Reveal({ as: Tag = "div", className, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref);
  return (
    <Tag ref={ref} className={["rise", className, seen && "is-in"].filter(Boolean).join(" ")} {...rest}>
      {children}
    </Tag>
  );
}
