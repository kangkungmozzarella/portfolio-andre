import type { Metadata, Viewport } from "next";
import { Archivo, Bricolage_Grotesque } from "next/font/google";
import type { ReactNode } from "react";
import { SmoothScroll } from "@/components/SmoothScroll";
import { content } from "@/lib/content";
import "lenis/dist/lenis.css";
import "./globals.css";

// Fonts are downloaded at build time and served from the site itself.
const display = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz"], variable: "--font-display", display: "swap" });
const body = Archivo({ subsets: ["latin"], variable: "--font-body", display: "swap" });

const { profile } = content;

export const metadata: Metadata = {
  title: profile.pageTitle,
  description: profile.description,
  icons: { icon: "/assets/images/favicon-32.png", apple: "/assets/images/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#fff4de" };

// Sets html.motion before the first paint, so content waiting for its entrance is
// hidden from the start rather than flashing in and out. Without JavaScript, or with
// reduced motion, the class never appears and everything simply shows.
const motionScript = `document.documentElement.classList.toggle("motion", !matchMedia("(prefers-reduced-motion: reduce)").matches)`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
      </head>
      <body>
        {children}
        <SmoothScroll />
      </body>
    </html>
  );
}
