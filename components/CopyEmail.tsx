"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

// Copies the address, for visitors whose mail links open the wrong app.
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      className="btn"
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(email).then(
          () => setCopied(true),
          () => {},
        );
      }}
    >
      <Icon name={copied ? "check" : "copy"} />
      <span aria-live="polite">{copied ? "Copied" : "Copy email"}</span>
    </button>
  );
}
