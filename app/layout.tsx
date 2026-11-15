import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { SmoothScroll } from "@/components/SmoothScroll";
import { content } from "@/lib/content";
import { themeColors, themeScript } from "@/lib/theme";
import "lenis/dist/lenis.css";
import "./globals.css";

// One typeface for everything, downloaded at build time and served from the site
// itself. It is a variable font: any weight from 200 to 800 is available, which the
// headings that react to the pointer rely on.
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

const { profile } = content;

export const metadata: Metadata = {
  title: profile.pageTitle,
  description: profile.description,
  icons: { icon: "/assets/images/favicon-32.png", apple: "/assets/images/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: themeColors.light },
    { media: "(prefers-color-scheme: dark)", color: themeColors.dark },
  ],
};

// Runs before the first paint. It picks the theme (the saved choice, or the system
// setting), so the page never flashes the wrong one, and sets html.motion, so content
// waiting for its entrance is hidden from the start rather than flashing in and out.
// Without JavaScript, or with reduced motion, that class never appears and everything
// simply shows. <html> takes no className from React, so a re-render cannot wipe it.
const startScript = `${themeScript};document.documentElement.classList.toggle("motion", !matchMedia("(prefers-reduced-motion: reduce)").matches)`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: startScript }} />
      </head>
      <body className={sans.variable}>
        {children}
        <SmoothScroll />
      </body>
    </html>
  );
}
