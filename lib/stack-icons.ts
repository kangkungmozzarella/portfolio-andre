import {
  siExpo,
  siFigma,
  siGit,
  siGithub,
  siGooglecolab,
  siHtml5,
  siHuggingface,
  siJavascript,
  siJupyter,
  siLaravel,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siPandas,
  siPhp,
  siPython,
  siPytorch,
  siR,
  siReact,
  siReactquery,
  siScikitlearn,
  siTailwindcss,
  siTypescript,
  type SimpleIcon,
} from "simple-icons";

// Brand marks for the tools in the CMS skill lists, matched by name (case and
// spacing do not matter). Only the icons imported here end up in the site. A tool
// without a mark here (Tableau, VS Code, SQL) gets a monogram instead of a wrong logo.
const marks: Record<string, SimpleIcon> = {
  typescript: siTypescript,
  javascript: siJavascript,
  react: siReact,
  nextjs: siNextdotjs,
  reactnative: siReact,
  expo: siExpo,
  reactquery: siReactquery,
  tanstackquery: siReactquery,
  tailwindcss: siTailwindcss,
  tailwind: siTailwindcss,
  htmlcss: siHtml5,
  html: siHtml5,
  nodejs: siNodedotjs,
  php: siPhp,
  laravel: siLaravel,
  python: siPython,
  r: siR,
  pandas: siPandas,
  scikitlearn: siScikitlearn,
  pytorch: siPytorch,
  huggingface: siHuggingface,
  git: siGit,
  github: siGithub,
  figma: siFigma,
  mysql: siMysql,
  jupyter: siJupyter,
  googlecolab: siGooglecolab,
};

const key = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

export function stackMark(name: string) {
  const mark = marks[key(name)];
  if (!mark) return null;
  // Near-black marks (Next.js, GitHub, Expo) keep the text colour on hover, so they
  // stay visible in the dark theme.
  const hex = mark.hex;
  const light = parseInt(hex.slice(0, 2), 16) * 0.3 + parseInt(hex.slice(2, 4), 16) * 0.59 + parseInt(hex.slice(4, 6), 16) * 0.11;
  return { path: mark.path, title: mark.title, color: light < 60 ? null : `#${hex}` };
}

// One or two letters for a tool without a mark: "VS Code" → "VS", "Tableau" → "T".
export const monogram = (name: string) => {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return words[0]?.[0]?.toUpperCase() ?? "?";
};
