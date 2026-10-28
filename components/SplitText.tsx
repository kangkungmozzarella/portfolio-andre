"use client";

import { useRef, type CSSProperties, type ElementType } from "react";
import { useInView } from "@/lib/hooks";

type Props = {
  as?: ElementType;
  text: string;
  // Rendered last, inside <em>, with the yellow marker.
  accent?: string;
  // "chars" pops letter by letter (the hero name); "words" word by word.
  mode?: "words" | "chars";
  // Starting index, so two pieces of one heading continue one stagger.
  offset?: number;
  // Set by a parent that decides when to play (the hero); otherwise it plays on scroll.
  active?: boolean;
  className?: string;
  id?: string;
  href?: string;
  "aria-hidden"?: boolean;
};

// Deterministic tilt per piece, so the server and the browser render the same markup.
const tilt = (i: number) => `${((i * 37) % 25) - 12}deg`;

export function SplitText({ as: Tag = "span", text, accent, mode = "words", offset = 0, active, className, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref);
  const on = active ?? seen;
  let i = offset;
  const piece = (value: string, cls: string) => (
    <span key={i} className={cls} style={{ "--i": i, "--r": tilt(i++) } as CSSProperties}>
      {value}
    </span>
  );
  const render = (value: string) =>
    value
      .split(/(\s+)/)
      .filter(Boolean)
      .map((part, k) => {
        if (/^\s+$/.test(part)) return " ";
        if (mode === "words") return piece(part, "w");
        // Letters of one word stay together so the word never breaks across lines.
        return (
          <span key={`word-${k}`} style={{ whiteSpace: "nowrap" }}>
            {[...part].map((char) => piece(char, "ch"))}
          </span>
        );
      });

  return (
    <Tag ref={ref} data-split={mode} className={[className, on && "is-in"].filter(Boolean).join(" ") || undefined} {...rest}>
      {render(text)}
      {accent && (
        <>
          {" "}
          <em>{render(accent)}</em>
        </>
      )}
    </Tag>
  );
}
