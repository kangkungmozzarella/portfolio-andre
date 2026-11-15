"use client";

import { useSyncExternalStore } from "react";
import { themeStore } from "@/lib/theme";

// The light/dark switch. The knob's position and icon follow html[data-theme] in
// CSS, so they are right from the first paint; the new theme spreads out from the knob.
export function ThemeToggle() {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.get, themeStore.getServer);
  const dark = theme === "dark";

  return (
    <button
      className="theme-toggle"
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={(event) => {
        const knob = event.currentTarget.querySelector(".theme-knob")!.getBoundingClientRect();
        themeStore.toggle({ x: knob.left + knob.width / 2, y: knob.top + knob.height / 2 });
      }}
    >
      <span className="theme-knob">
        <svg className="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
        </svg>
        <svg className="theme-moon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
        </svg>
      </span>
    </button>
  );
}
