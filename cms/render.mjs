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
    ? `<a class="${cls}" href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(text)} ${icon("arrow")}</a>`
    : "";
// Images are a path, or { src, fit, x, y, zoom, ratio } set with the CMS position
// controls. The values travel as CSS variables; the stylesheet decides which images
// honour them (the badge photo, project thumbnails, and certificate cards).
const imageData = (value) =>
  typeof value === "string" ? { src: value, ratio: "auto", zoom: 100 } : value;
const imageSrc = (value) => imageData(value).src;
const image = (value, alt, extra = "") => {
  const data = imageData(value);
  const style =
    typeof value === "string"
      ? ""
      : ` style="--image-fit:${e(data.fit)};--image-x:${data.x}%;--image-y:${data.y}%;--image-zoom:${data.zoom / 100}"`;
  return `<img src="${e(data.src)}" alt="${e(alt)}"${style} ${extra}>`;
};
const iconPaths = {
  arrow: "M7 17 17 7M8 7h9v9",
  left: "M20 12H4m7-7-7 7 7 7",
  right: "M4 12h16m-7-7 7 7-7 7",
  up: "M12 20V4M5 11l7-7 7 7",
  plus: "M12 5v14M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  play: "M8 5.5v13l10.5-6.5z",
  images: "M4 6h16v12H4zM4 15l4.5-4.5 4 4 2.5-2.5L20 17",
  menu: "M4 8h16M4 16h16",
};
const icon = (name) =>
  `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${iconPaths[name]}"/></svg>`;
// Stack and skill fields are written as "A · B · C" in the CMS.
const parts = (value) =>
  value
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
const chips = (value) =>
  `<ul class="chips">${parts(value)
    .map((part) => `<li>${e(part)}</li>`)
    .join("")}</ul>`;
const videoType = (src) =>
  src.toLowerCase().split(/[?#]/)[0].endsWith(".webm") ? "webm" : "mp4";
const pad = (n) => String(n).padStart(2, "0");
// Project cards and toolbox boxes take turns through the three colours.
const tones = ["yellow", "blue", "pink"];

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
  const total = pad(projects.length);
  const [firstName, ...restName] = p.name.split(" ");
  const lastNames = restName.join(" ");
  const current = experience[0];
  const strapText = `${p.name} · ${current ? current.role : h.specialty} · `.toUpperCase();
  // The two marquee bands carry the first two skill groups.
  const bands = a.skills.slice(0, 2).map((group) => parts(group.value));

  const badge = `<div class="lanyard" aria-hidden="true">
      <svg class="strap" width="100%" height="100%"><defs><path id="strap-path" d=""/></defs><use class="strap-edge" href="#strap-path"/><use class="strap-band" href="#strap-path"/><text class="strap-text" dy="4"><textPath href="#strap-path">${e(strapText.repeat(8))}</textPath></text></svg>
    </div>
    <div class="badge" data-badge>
      <span class="badge-clip"></span>
      <div class="badge-card">
        <div class="badge-photo">${image(a.portrait, "", 'width="892" height="1223" draggable="false" fetchpriority="high"')}</div>
        <div class="badge-text">
          <p class="badge-name">${e(p.name)}</p>
          ${current ? `<p class="badge-role">${e(current.role)}</p><p class="badge-company">${e(current.company)}</p>` : `<p class="badge-role">${e(h.specialty)}</p>`}
        </div>
        <p class="badge-foot"><span>${e(p.location)}</span><span class="badge-mark">${e(p.name.split(" ").map((w) => w[0]).join(""))}</span></p>
      </div>
    </div>`;

  const index = projects
    .map(
      (project, i) =>
        `<li><a href="#project-${e(project.id)}" data-thumb="${i}"><span class="index-num">${pad(i + 1)}</span><span class="index-name">${e(project.name)}</span><span class="index-category">${e(project.category)}</span></a></li>`,
    )
    .join("");
  const thumbs = projects
    .map((project) => `<span class="thumb">${image(project.images[0], "", 'width="160" height="160" loading="lazy"')}</span>`)
    .join("");

  const work = projects
    .map(
      (project, i) => `<article class="work rise tone-${tones[i % 3]}" id="project-${e(project.id)}">
      <p class="work-bar"><span>${pad(i + 1)} / ${total}</span><span>${e(project.category)}</span></p>
      <div class="work-body">
        <div class="work-frame">${
          project.video
            ? `<video class="work-video" muted loop playsinline preload="none" poster="${e(imageSrc(project.images[0]))}"><source src="${e(project.video)}" type="video/${videoType(project.video)}"></video>`
            : image(project.images[0], "", 'class="work-video" loading="lazy"')
        }</div>
        <div class="work-text">
          <h3 class="work-name">${e(project.name)}</h3>
          <p class="work-title">${e(project.title)}</p>
          <p class="work-description">${lines(project.description)}</p>
          ${chips(project.stack)}
          <div class="actions"><button class="btn btn-primary" type="button" data-detail="project-${e(project.id)}">${project.video ? `${icon("play")}Watch video` : `${icon("images")}View screenshots`}</button>${external(project.url, project.linkLabel || "View project", "btn")}</div>
        </div>
      </div>
    </article>`,
    )
    .join("\n");

  const experienceRows = experience
    .map(
      (item, i) => `<details class="experience-row rise" name="experience"${i === 0 ? " open" : ""}>
      <summary><span class="experience-date">${e(item.period)}</span><span class="experience-role">${e(item.role)}<span>${e(item.company)}</span></span>${image(item.logo, "", 'class="experience-logo" width="48" height="48" loading="lazy"')}<span class="expand-icon" aria-hidden="true">${icon("plus")}</span></summary>
      <ul class="experience-points">${item.bullets.map((b) => `<li>${e(b)}</li>`).join("")}</ul>
    </details>`,
    )
    .join("\n");

  const certificateCards = certificates
    .map(
      (item) =>
        `<a class="certificate rise" href="${e(imageSrc(item.image))}" data-detail="certificate-${e(item.id)}"><span class="certificate-media">${image(item.image, "", 'width="640" height="425" loading="lazy"')}</span><span class="certificate-text"><strong>${e(item.title)}</strong><small>${e(item.organization)} · ${e(item.period)}</small></span></a>`,
    )
    .join("");

  const templates =
    projects
      .map(
        (item) =>
          `<template id="detail-project-${e(item.id)}"><p class="eyebrow">${e(item.category)}</p><h2>${e(item.name)}</h2><p class="detail-description">${lines(item.description)}</p><p class="detail-stack">${e(item.stack)}</p>${item.video ? `<div class="project-video"><video controls preload="none" playsinline poster="${e(imageSrc(item.images[0]))}" aria-label="Introduction to ${e(item.name)}"><source src="${e(item.video)}" type="video/${videoType(item.video)}">Your browser cannot play this video.</video></div>` : `<div class="gallery-images">${item.images.map((src, i) => image(src, `${item.name}, screenshot ${i + 1}`, 'width="1446" height="788"')).join("")}</div>`}${external(item.url, item.linkLabel || "View project")}</template>`,
      )
      .join("\n") +
    certificates
      .map(
        (item) =>
          `<template id="detail-certificate-${e(item.id)}"><p class="eyebrow">Certificate / ${e(item.period)}</p><h2>${e(item.title)}</h2><p class="detail-description">${lines(item.description)}</p><div class="gallery-images certificate-gallery">${image(item.image, `${p.name}, ${item.title}`, 'width="1280" height="850"')}</div>${external(item.url, "Open certificate")}</template>`,
      )
      .join("\n");

  const navLinks = `<a href="#work">Work</a><a href="#about">About</a><a href="#experience">Experience</a><a href="#contact">Contact</a>`;
  const band = (items, cls) =>
    items.length
      ? `<div class="band ${cls}"><div class="band-track">${[0, 1]
          .map(() => `<p class="band-set">${items.map((item) => `<span>${e(item)}</span>`).join("")}</p>`)
          .join("")}</div></div>`
      : "";

  return `<!doctype html>
<!-- Generated from content/portfolio.json. Edit content with npm run cms. -->
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#fff4de">
  <meta name="description" content="${e(p.description)}"><title>${e(p.pageTitle)}</title>
  <link rel="icon" type="image/png" href="assets/images/favicon-32.png"><link rel="apple-touch-icon" href="assets/images/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&amp;family=Bricolage+Grotesque:opsz,wght@12..96,500..800&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/main.css"><script src="assets/js/main.js" defer></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="nav">
  <a class="nav-logo" href="#top" aria-label="${e(p.name)}, back to top"><span class="nav-mark" aria-hidden="true">${e(p.name.split(" ").map((w) => w[0]).join(""))}</span><span class="nav-name">${e(firstName)}</span></a>
  <nav class="nav-links" aria-label="Sections">${navLinks}</nav>
  <p class="clock"><span class="clock-place">${e(p.location.split(",")[0])}</span><span class="local-time" data-timezone="${e(p.timezone)}"></span></p>
  <a class="btn btn-primary nav-cta" href="mailto:${e(p.email)}">Email me</a>
  <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu"><span class="menu-icon">${icon("menu")}</span><span class="menu-label">Menu</span></button>
  <div class="menu" id="menu" hidden>
    <nav aria-label="Sections">${navLinks}</nav>
    <a class="btn btn-primary" href="mailto:${e(p.email)}">Email me</a>
  </div>
</header>
<main id="main" tabindex="-1">
  <section class="hero" id="top" aria-labelledby="hero-name">
    ${badge}
    <div class="hero-text">
      <p class="hero-specialty">${e(h.specialty)}</p>
      <h1 class="hero-name" id="hero-name"><span class="hero-line" data-split="chars">${e(firstName)}</span> <span class="hero-line hero-line-mark" data-split="chars">${e(lastNames)}</span></h1>
      <p class="hero-tagline" data-split="words">${e(h.line1)} ${e(h.line2)} <em>${e(h.accent)}</em></p>
      <p class="hero-lede">${e(h.intro)}</p>
      <div class="actions"><a class="btn btn-primary" href="mailto:${e(p.email)}">Email ${e(firstName)}</a>${external(p.cv, "View my CV", "btn")}</div>
    </div>
    <p class="sticker sticker-status"><span class="status-dot" aria-hidden="true"></span>${e(h.status)}</p>
    <p class="drag-hint" aria-hidden="true">Psst, pull the badge</p>
  </section>

  <div class="bands" aria-hidden="true">${band(bands[0] || [], "band-ink")}${band(bands[1] || [], "band-yellow")}</div>

  <section class="section work-section" id="work" aria-labelledby="work-title">
    <header class="section-head">
      <p class="section-label">Selected work <span class="count">${total}</span></p>
      <h2 class="section-title" id="work-title" data-split="words">Things I have <em>built.</em></h2>
    </header>
    ${
      projects.length
        ? `<div class="work-index"><ol>${index}</ol><div class="thumbs" aria-hidden="true">${thumbs}</div></div>
    <div class="work-list">${work}</div>
    ${p.github ? `<p class="work-more">${external(p.github, "More on GitHub", "btn btn-big")}</p>` : ""}`
        : `<div class="empty-state"><p>No projects to show yet.</p>${external(p.github, "See my work on GitHub")}</div>`
    }
  </section>

  <section class="section about" id="about" aria-labelledby="about-title">
    <p class="section-label">About</p>
    <h2 class="about-statement" id="about-title">${e(a.heading)} ${e(a.line2)} <em>${e(a.accent)}</em> ${e(a.paragraphs[0] || "")}</h2>
    <div class="about-body">
      <div class="prose">${a.paragraphs.slice(1).map((t) => `<p>${e(t)}</p>`).join("")}</div>
      <dl class="facts">${a.facts.map((f, i) => `<div class="fact rise tone-${tones[i % 3]}"><dt>${e(f.label)}</dt><dd>${e(f.value)}</dd></div>`).join("")}</dl>
    </div>
  </section>

  <section class="section experience" id="experience" aria-labelledby="experience-title">
    <header class="section-head section-head-split">
      <div><p class="section-label">Experience</p><h2 class="section-title" id="experience-title" data-split="words">${e(s.experienceHeading)} <em>${e(s.experienceAccent)}</em></h2></div>
      <p class="section-intro">${lines(s.experienceIntro)}</p>
    </header>
    <div class="experience-list">${experienceRows}</div>
  </section>

  <section class="section toolbox" aria-labelledby="toolbox-title">
    <p class="section-label">Toolbox</p>
    <h2 class="section-title" id="toolbox-title" data-split="words">The tools I <em>work with.</em></h2>
    <div class="toolbox-groups">${a.skills.map((f, i) => `<div class="toolbox-group rise tone-${tones[i % 3]}"><h3>${e(f.label)}</h3>${chips(f.value)}</div>`).join("")}</div>
  </section>

  ${certificates.length ? `<section class="section certificates-section" aria-labelledby="certificates-title"><p class="section-label">Certificates</p><h2 class="section-title" id="certificates-title" data-split="words">A little structured <em>learning, too.</em></h2><div class="certificates">${certificateCards}</div></section>` : ""}

  <section class="section contact" id="contact" aria-labelledby="contact-title">
    <div class="contact-box rise">
      <p class="section-label">Contact</p>
      <p class="contact-intro">${lines(s.contactIntro)}</p>
      <h2 class="contact-title" id="contact-title"><a href="mailto:${e(p.email)}" data-split="words">${e(s.contactHeading)} <em>${e(s.contactAccent)}</em></a></h2>
      <div class="contact-links"><a class="btn btn-primary" href="mailto:${e(p.email)}">${e(p.email)}</a>${external(p.github, "GitHub", "btn")}${external(p.linkedin, "LinkedIn", "btn")}${external(p.instagram, "Instagram", "btn")}${external(p.cv, "CV", "btn")}</div>
    </div>
  </section>
</main>
<footer class="footer"><span>© <span data-year>${new Date().getFullYear()}</span> ${e(p.name)}</span><span>${e(p.footer)}</span><a class="text-link" href="#top">Back to top ${icon("up")}</a></footer>
<dialog class="project-dialog" aria-labelledby="dialog-title"><div class="dialog-toolbar"><span class="eyebrow">A closer look</span><button class="dialog-close" type="button" aria-label="Close details">Close ${icon("close")}</button></div><div class="dialog-content"></div><div class="gallery-controls"><button class="gallery-prev" type="button" aria-label="Previous image">${icon("left")}</button><p class="gallery-count" aria-live="polite"></p><button class="gallery-next" type="button" aria-label="Next image">${icon("right")}</button></div></dialog>
${templates}
</body>
</html>\n`;
}
