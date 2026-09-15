import { heroArt } from "./hero-art.mjs";
import { validateContent } from "./schema.mjs";
export const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const e = escapeHTML;
const lines = (value) => e(value).replace(/\n/g, "<br>");
const external = (url, text, cls = "text-link") =>
  url
    ? `<a class="${cls}" href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(text)} ↗</a>`
    : "";
const image = (path, alt, extra = "") =>
  `<img src="${e(path)}" alt="${e(alt)}" ${extra}>`;
const arrow = '<span aria-hidden="true">↗</span>';

export function renderPortfolio(input) {
  const {
    profile: p,
    hero: h,
    about: a,
    projects,
    experience,
    certificates,
    sections: s,
  } = validateContent(input);
  const count = String(projects.length).padStart(2, "0");
  const projectCards = projects
    .map((project, i) => {
      const n = String(i + 1).padStart(2, "0");
      return `<article class="project ${i === 0 ? "project-featured" : ""}" data-category="${e(project.category)}">
      <button class="project-open reveal" data-detail="project-${e(project.id)}" aria-label="Explore ${e(project.name)}">
        <span class="project-image ${e(project.color)}"><span class="image-index">PROJECT / ${n}</span>${image(project.images[0], `${project.name} interface`, 'loading="lazy" width="1446" height="788"')}<span class="project-open-label">Explore project ${arrow}</span></span>
        <span class="project-caption"><span><span class="eyebrow">${e(project.category)} / ${n}</span><span class="project-title">${e(project.title)}</span></span><span class="round-arrow" aria-hidden="true">↗</span></span>
      </button><p class="project-subtitle reveal">${e(project.name)} <span>— ${e(project.stack)}</span></p>
    </article>`;
    })
    .join("\n");
  const experienceRows = experience
    .map(
      (
        item,
        i,
      ) => `<details class="experience-row reveal" ${i === 0 ? "open" : ""}>
    <summary><span class="experience-date">${e(item.period)}</span><span class="experience-heading"><span class="experience-logo">${image(item.logo, "", 'width="48" height="48" loading="lazy"')}</span><span class="experience-role">${e(item.role)}<span>${e(item.company)}</span></span></span><span class="expand-icon" aria-hidden="true">+</span></summary>
    <div class="experience-content"><ul>${item.bullets.map((b) => `<li>${e(b)}</li>`).join("")}</ul></div>
  </details>`,
    )
    .join("\n");
  const certificateCards = certificates
    .map(
      (item) =>
        `<a href="${e(item.image)}" data-detail="certificate-${e(item.id)}"><span class="certificate-year">${e(item.period)}</span><span><strong>${e(item.title)}</strong><small>${e(item.organization)}</small></span>${arrow}</a>`,
    )
    .join("");
  const templates =
    projects
      .map(
        (item) =>
          `<template id="detail-project-${e(item.id)}"><p class="eyebrow">${e(item.category)}</p><h2>${e(item.name)}</h2><p class="detail-description">${lines(item.description)}</p><p class="detail-stack">${e(item.stack)}</p><div class="gallery-images">${item.images.map((src, i) => image(src, `${item.name}, screenshot ${i + 1}`, 'width="1446" height="788"')).join("")}</div>${external(item.url, item.linkLabel || "View project")}</template>`,
      )
      .join("\n") +
    certificates
      .map(
        (item) =>
          `<template id="detail-certificate-${e(item.id)}"><p class="eyebrow">Certificate / ${e(item.period)}</p><h2>${e(item.title)}</h2><p class="detail-description">${lines(item.description)}</p><div class="gallery-images certificate-gallery">${image(item.image, `${p.name} — ${item.title}`, 'width="1280" height="850"')}</div>${external(item.url, "Open certificate")}</template>`,
      )
      .join("\n");
  return `<!doctype html>
<!-- Generated from content/portfolio.json. Edit content with npm run cms. -->
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#eeece5">
  <meta name="description" content="${e(p.description)}"><title>${e(p.pageTitle)}</title>
  <link rel="icon" type="image/png" href="assets/images/favicon-32.png"><link rel="apple-touch-icon" href="assets/images/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700&amp;family=Manrope:wght@400;500;600;650;700;750;800&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/main.css"><script src="assets/js/main.js" defer></script><script src="assets/js/hero-motion.js" defer></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <a class="wordmark" href="#home" aria-label="${e(p.name)}, back to home">${e(p.brand)}<span aria-hidden="true">✳</span></a>
  <nav aria-label="Main navigation"><a href="#work">Work<span>${count}</span></a><a href="#about">About</a><a href="#experience">Experience</a></nav>
  <a class="header-contact" href="#contact">Let’s talk ${arrow}</a>
</header>
<main id="main">
  <section class="hero-scroll" id="home" aria-labelledby="hero-title"><div class="hero wrap">
    ${heroArt}
    <div class="hero-meta"><p class="eyebrow">${e(h.eyebrow)}</p><p class="eyebrow hero-location">${e(p.location)} <span class="local-time" data-timezone="${e(p.timezone)}" aria-label="Local time in ${e(p.location)}"></span></p></div>
    <h1 id="hero-title"><span class="title-line"><span>${e(h.line1)}</span></span><span class="title-line"><span>${e(h.line2)} <em>${e(h.accent)}</em></span></span></h1>
    <div class="hero-bottom">
      <div class="hero-intro"><span class="intro-line" aria-hidden="true"></span><p>${e(h.intro)}</p><a class="text-link" href="#about">A little about me ${arrow}</a></div>
      <a class="scroll-link" href="#work"><span class="scroll-circle" aria-hidden="true">↓</span><span>Scroll to explore<br><small>A selection of my work</small></span></a>
      <div class="hero-stamp" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="M50 5v90M5 50h90M18 18l64 64M18 82l64-64M33 8l34 84M8 33l84 34M8 67l84-34M33 92l34-84"/></svg><span>${lines(h.stamp)}</span></div>
    </div>
    <div class="hero-footer"><span><span class="status-dot"></span>${e(h.status)}</span><span>${e(h.specialty)}</span><span>Portfolio / <span data-year>${new Date().getFullYear()}</span></span></div>
  </div></section>
  <section class="work-section wrap section-space" id="work" aria-labelledby="work-title">
    <div class="section-heading reveal"><div><p class="eyebrow section-index">01 / SELECTED WORK</p><h2 id="work-title">${e(s.workHeading)} <em>${e(s.workAccent)}</em></h2></div><p>${lines(s.workIntro)}</p></div>
    <div class="work-toolbar"><span class="eyebrow">A collection of ${projects.length} ${projects.length === 1 ? "project" : "projects"}</span>${external(p.github, "More on GitHub")}</div>
    <div class="project-grid">${projectCards}</div>
  </section>
  <section class="about-section" id="about" aria-labelledby="about-title"><div class="wrap about-layout section-space">
    <div class="about-photo reveal"><div class="portrait-frame">${image(a.portrait, p.name, 'width="502" height="900" loading="lazy"')}<span class="portrait-mark" aria-hidden="true">${e(a.mark)}</span></div><p><span>${e(p.name)}</span><span>${e(a.caption)}</span></p></div>
    <div class="about-copy"><p class="eyebrow section-index reveal">02 / THE PERSON BEHIND THE WORK</p><h2 id="about-title" class="reveal">${e(a.heading)}<br>${e(a.line2)} <em>${e(a.accent)}</em></h2><div class="about-prose reveal">${a.paragraphs.map((t) => `<p>${e(t)}</p>`).join("")}</div>
    ${external(p.cv, "Take a look at my CV", "text-link reveal")}<dl class="about-facts reveal">${a.facts.map((f) => `<div><dt>${e(f.label)}</dt><dd>${e(f.value)}</dd></div>`).join("")}</dl></div>
    <div class="toolbox reveal"><p class="eyebrow">THE TOOLS I WORK WITH</p>${a.skills.map((f) => `<div><h3>${e(f.label)}</h3><p>${e(f.value)}</p></div>`).join("")}</div>
  </div></section>
  <section class="wrap section-space experience-section" id="experience" aria-labelledby="experience-title">
    <div class="section-heading reveal"><div><p class="eyebrow section-index">03 / THE JOURNEY</p><h2 id="experience-title">${e(s.experienceHeading)} <em>${e(s.experienceAccent)}</em></h2></div><p>${lines(s.experienceIntro)}</p></div>
    <div class="experience-list">${experienceRows}</div>
    ${certificates.length ? `<div class="certificates reveal"><p class="eyebrow">A LITTLE STRUCTURED LEARNING, TOO</p>${certificateCards}</div>` : ""}
  </section>
  <section class="contact-section" id="contact" aria-labelledby="contact-title"><div class="wrap">
    <div class="contact-top reveal"><p class="eyebrow">04 / NEXT CHAPTER</p><p>${lines(s.contactIntro)}</p></div>
    <h2 id="contact-title" class="reveal"><a href="mailto:${e(p.email)}">${e(s.contactHeading)}<br><em>${e(s.contactAccent)}</em><span class="contact-arrow" aria-hidden="true">↗</span></a></h2>
    <div class="contact-bottom reveal"><a class="email-link" href="mailto:${e(p.email)}">${e(p.email)} ↗</a><div class="social-links">${external(p.github, "GitHub", "")}${external(p.linkedin, "LinkedIn", "")}${external(p.instagram, "Instagram", "")}</div></div>
    <footer><span>© <span data-year>${new Date().getFullYear()}</span> ${e(p.name)}</span><span>${e(p.footer)}</span><a href="#home">Back to top ↑</a></footer>
  </div></section>
</main>
<dialog class="project-dialog" aria-labelledby="dialog-title"><div class="dialog-toolbar"><span class="eyebrow">A CLOSER LOOK</span><button class="dialog-close" aria-label="Close project details">Close <span aria-hidden="true">×</span></button></div><div class="dialog-content"></div><div class="gallery-controls"><button class="gallery-prev" aria-label="Previous image">←</button><p class="gallery-count" aria-live="polite"></p><button class="gallery-next" aria-label="Next image">→</button></div></dialog>
${templates}
<noscript><p class="noscript-note">Enable JavaScript to open project galleries. Profile, experience, and contact links are available above.</p></noscript>
</body>
</html>\n`;
}
