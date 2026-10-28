import type { NextConfig } from "next";

// A static export: `next build` writes plain HTML, CSS and JS to out/, which GitHub
// Pages serves as is. No server runs in production.
const config: NextConfig = {
  output: "export",
  // Pages export as folder/index.html (projects/kantor-ai/index.html), which every
  // static host serves at /projects/kantor-ai/ without extra rewrite rules.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default config;
