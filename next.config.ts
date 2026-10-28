import type { NextConfig } from "next";

// A static export: `next build` writes plain HTML, CSS and JS to out/, which GitHub
// Pages serves as is. No server runs in production.
const config: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default config;
