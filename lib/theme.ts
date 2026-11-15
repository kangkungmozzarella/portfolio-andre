import { inkReveal } from "./ink";

// Light and dark themes. The inline script in the layout sets html[data-theme]
// before the first paint (the visitor's saved choice, or the system setting), so
// this store only reads and changes that attribute.

export type Theme = "light" | "dark";

const KEY = "theme";
// The page background of each theme (--bg in globals.css), for the browser's own chrome.
export const themeColors: Record<Theme, string> = { light: "#f6f6f4", dark: "#0b0b0c" };

// Runs before the first paint; kept as a string for the inline script.
export const themeScript = `(function(){var t;try{t=localStorage.getItem("${KEY}")}catch(e){}if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t})()`;

const listeners = new Set<() => void>();
const current = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => (meta.content = themeColors[theme]));
  listeners.forEach((listener) => listener());
}

const saved = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    // Storage can be blocked (private windows); the theme then follows the system.
    return null;
  }
};

export const themeStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    // Until the visitor picks a theme, follow the system when it changes.
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => saved() || apply(system.matches ? "dark" : "light");
    system.addEventListener("change", onSystem);
    return () => {
      listeners.delete(listener);
      system.removeEventListener("change", onSystem);
    };
  },
  get: current,
  getServer: (): Theme => "light",
  // Switches theme; the new one spreads out from `origin` (the switch).
  toggle(origin: { x: number; y: number }) {
    const next: Theme = current() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    inkReveal(origin, () => apply(next));
  },
};
