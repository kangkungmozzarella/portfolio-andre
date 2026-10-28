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
  `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${iconPaths[name]}"/></svg>`;
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
  const current = experience[0];
  const strapText = `${p.name} · ${current ? current.role : h.specialty} · `.toUpperCase();

  const badge = `<div class="lanyard" aria-hidden="true">
      <svg class="strap" width="100%" height="100%"><defs><path id="strap-path" d=""/></defs><use class="strap-band" href="#strap-path"/><text class="strap-text" dy="3.5"><textPath href="#strap-path">${e(strapText.repeat(8))}</textPath></text></svg>
    </div>
    <div class="badge" data-badge>
      <span class="badge-clip"></span>
      <div class="badge-card">
        <div class="badge-photo">${image(a.portrait, "", 'width="892" height="1223" draggable="false" fetchpriority="high"')}</div>
        <div class="badge-text">
          <p class="badge-name">${e(firstName)} <span>${e(restName.join(" "))}</span></p>
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
      (project, i) => `<article class="work" id="project-${e(project.id)}">
      <div class="work-media">
        <div class="work-frame">${
          project.video
            ? `<video class="work-video" muted loop playsinline preload="none" poster="${e(imageSrc(project.images[0]))}"><source src="${e(project.video)}" type="video/${videoType(project.video)}"></video>`
            : image(project.images[0], "", 'class="work-video" loading="lazy"')
        }</div>
      </div>
      <div class="work-text">
        <p class="work-meta"><span>${pad(i + 1)} / ${total}</span><span>${e(project.category)}</span></p>
        <h3 class="work-name mask"><span>${e(project.name)}</span></h3>
        <p class="work-title">${e(project.title)}</p>
        <p class="work-description">${lines(project.description)}</p>
        ${chips(project.stack)}
        <div class="actions"><button class="btn btn-primary" type="button" data-detail="project-${e(project.id)}">${project.video ? `${icon("play")}Watch video` : `${icon("images")}View screenshots`}</button>${external(project.url, project.linkLabel || "View project", "btn btn-ghost")}</div>
      </div>
    </article>`,
    )
    .join("\n");

  const experienceRows = experience
    .map(
      (item, i) => `<details class="experience-row" name="experience"${i === 0 ? " open" : ""}>
      <summary><span class="experience-date">${e(item.period)}</span><span class="experience-role">${e(item.role)}<span>${e(item.company)}</span></span>${image(item.logo, "", 'class="experience-logo" width="44" height="44" loading="lazy"')}<span class="expand-icon" aria-hidden="true">${icon("plus")}</span></summary>
      <ul class="experience-points">${item.bullets.map((b) => `<li>${e(b)}</li>`).join("")}</ul>
    </details>`,
    )
    .join("\n");

  const certificateCards = certificates
    .map(
      (item) =>
        `<a class="certificate" href="${e(imageSrc(item.image))}" data-detail="certificate-${e(item.id)}"><span class="certificate-media">${image(item.image, "", 'width="640" height="425" loading="lazy"')}</span><span class="certificate-text"><strong>${e(item.title)}</strong><small>${e(item.organization)} · ${e(item.period)}</small></span></a>`,
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

  return `<!doctype html>
<!-- Generated from content/portfolio.json. Edit content with npm run cms. -->
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#0e0c0a">
  <meta name="description" content="${e(p.description)}"><title>${e(p.pageTitle)}</title>
  <link rel="icon" type="image/png" href="assets/images/favicon-32.png"><link rel="apple-touch-icon" href="assets/images/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&amp;family=Manrope:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/main.css"><script src="assets/js/main.js" defer></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="nav">
  <a class="nav-logo" href="#top" aria-label="${e(p.name)}, back to top">${e(firstName)}<em>${e(restName.join(" "))}</em></a>
  <nav class="nav-links" aria-label="Sections">${navLinks}</nav>
  <p class="clock"><span class="clock-place">${e(p.location.split(",")[0])}</span><span class="local-time" data-timezone="${e(p.timezone)}"></span></p>
  <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu">${icon("menu")}<span>Menu</span></button>
</header>
<div class="menu" id="menu" hidden>
  <nav aria-label="Sections">${navLinks}</nav>
  <p class="menu-foot"><a class="text-link" href="mailto:${e(p.email)}">${e(p.email)}</a></p>
</div>
<main id="main" tabindex="-1">
  <section class="hero" id="top" aria-labelledby="hero-name">
    ${badge}
    <div class="hero-text">
      <p class="hero-specialty mask"><span>${e(h.specialty)}</span></p>
      <h1 class="hero-name" id="hero-name"><span class="mask"><span>${e(firstName)}</span></span> <span class="mask"><span><em>${e(restName.join(" "))}</em></span></span></h1>
      <p class="hero-tagline mask"><span>${e(h.line1)} ${e(h.line2)} <em>${e(h.accent)}</em></span></p>
      <div class="hero-foot">
        <p class="hero-lede">${e(h.intro)}</p>
        <p class="hero-status"><span class="status-dot" aria-hidden="true"></span>${e(h.status)}</p>
        <div class="actions"><a class="btn btn-primary" href="mailto:${e(p.email)}">Email ${e(firstName)}</a>${external(p.cv, "View my CV", "btn btn-ghost")}</div>
      </div>
    </div>
    <p class="drag-hint" aria-hidden="true">Drag the badge</p>
  </section>

  <section class="section work-section" id="work" aria-labelledby="work-title">
    <header class="section-head">
      <p class="section-label"><span>Selected work</span><span>${total}</span></p>
      <h2 class="section-title mask" id="work-title"><span>Things I have <em>built.</em></span></h2>
    </header>
    ${
      projects.length
        ? `<div class="work-index"><ol>${index}</ol><div class="thumbs" aria-hidden="true">${thumbs}</div></div>
    <div class="work-list">${work}</div>
    ${p.github ? `<p class="work-more">${external(p.github, "More on GitHub", "btn btn-ghost")}</p>` : ""}`
        : `<div class="empty-state"><p>No projects to show yet.</p>${external(p.github, "See my work on GitHub")}</div>`
    }
  </section>

  <section class="section about" id="about" aria-labelledby="about-title">
    <p class="section-label"><span>About</span></p>
    <h2 class="about-statement" id="about-title">${e(a.heading)} ${e(a.line2)} <em>${e(a.accent)}</em> ${e(a.paragraphs[0] || "")}</h2>
    <div class="about-body">
      <div class="prose">${a.paragraphs.slice(1).map((t) => `<p>${e(t)}</p>`).join("")}</div>
      <dl class="facts">${a.facts.map((f) => `<div><dt>${e(f.label)}</dt><dd>${e(f.value)}</dd></div>`).join("")}</dl>
    </div>
  </section>

  <section class="section experience" id="experience" aria-labelledby="experience-title">
    <header class="section-head section-head-split">
      <div><p class="section-label"><span>Experience</span></p><h2 class="section-title mask" id="experience-title"><span>${e(s.experienceHeading)} <em>${e(s.experienceAccent)}</em></span></h2></div>
      <p class="section-intro">${lines(s.experienceIntro)}</p>
    </header>
    <div class="experience-list">${experienceRows}</div>
  </section>

  <section class="section toolbox" aria-labelledby="toolbox-title">
    <p class="section-label"><span>Toolbox</span></p>
    <h2 class="section-title mask" id="toolbox-title"><span>The tools I <em>work with.</em></span></h2>
    <div class="toolbox-groups">${a.skills.map((f) => `<div class="toolbox-group"><h3>${e(f.label)}</h3>${chips(f.value)}</div>`).join("")}</div>
  </section>

  ${certificates.length ? `<section class="section certificates-section" aria-labelledby="certificates-title"><p class="section-label"><span>Certificates</span></p><h2 class="section-title mask" id="certificates-title"><span>A little structured <em>learning, too.</em></span></h2><div class="certificates">${certificateCards}</div></section>` : ""}

  <section class="section contact" id="contact" aria-labelledby="contact-title">
    <p class="section-label"><span>Contact</span></p>
    <p class="contact-intro">${lines(s.contactIntro)}</p>
    <h2 class="contact-title" id="contact-title"><a href="mailto:${e(p.email)}"><span class="mask"><span>${e(s.contactHeading)}</span></span> <span class="mask"><span><em>${e(s.contactAccent)}</em></span></span></a></h2>
    <div class="contact-links"><a class="text-link" href="mailto:${e(p.email)}">${e(p.email)}</a>${external(p.github, "GitHub")}${external(p.linkedin, "LinkedIn")}${external(p.instagram, "Instagram")}${external(p.cv, "CV")}</div>
  </section>
</main>
<footer class="footer"><span>© <span data-year>${new Date().getFullYear()}</span> ${e(p.name)}</span><span>${e(p.footer)}</span><a class="text-link" href="#top">Back to top ${icon("up")}</a></footer>
<dialog class="project-dialog" aria-labelledby="dialog-title"><div class="dialog-toolbar"><span class="eyebrow">A closer look</span><button class="dialog-close" type="button" aria-label="Close details">Close ${icon("close")}</button></div><div class="dialog-content"></div><div class="gallery-controls"><button class="gallery-prev" type="button" aria-label="Previous image">${icon("left")}</button><p class="gallery-count" aria-live="polite"></p><button class="gallery-next" type="button" aria-label="Next image">${icon("right")}</button></div></dialog>
${templates}
</body>
</html>\n`;
}
