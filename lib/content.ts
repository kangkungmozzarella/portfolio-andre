import raw from "@/content/portfolio.json";
import { validateContent } from "@/cms/schema.mjs";

// Images are a path, or an object set with the CMS position controls.
export type ImageValue =
  | string
  | { src: string; fit: "cover" | "contain"; ratio: string; x: number; y: number; zoom: number };

export interface Project {
  id: string;
  title: string;
  name: string;
  category: string;
  stack: string;
  description: string;
  images: ImageValue[];
  video: string;
  url: string;
  linkLabel: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  logo: ImageValue;
  bullets: string[];
}

export interface Certificate {
  id: string;
  title: string;
  organization: string;
  period: string;
  description: string;
  image: ImageValue;
  url: string;
}

export interface Pair {
  label: string;
  value: string;
}

export interface Content {
  profile: {
    name: string;
    pageTitle: string;
    description: string;
    location: string;
    timezone: string;
    email: string;
    github: string;
    linkedin: string;
    instagram: string;
    cv: string;
    footer: string;
  };
  hero: { line1: string; line2: string; accent: string; intro: string; status: string; specialty: string };
  about: {
    heading: string;
    line2: string;
    accent: string;
    portrait: ImageValue;
    paragraphs: string[];
    facts: Pair[];
    skills: Pair[];
  };
  projects: Project[];
  experience: Experience[];
  certificates: Certificate[];
  sections: {
    experienceHeading: string;
    experienceAccent: string;
    experienceIntro: string;
    contactIntro: string;
    contactHeading: string;
    contactAccent: string;
  };
}

// The same validation the CMS runs on save, so a hand-edited JSON file fails the
// build instead of shipping a broken page.
export const content = validateContent(raw) as Content;
