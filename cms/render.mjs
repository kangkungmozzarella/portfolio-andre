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
const image = (path, alt, extra = "") =>
  `<img src="${e(path)}" alt="${e(alt)}" ${extra}>`;
const iconPaths = {
  arrow: "M7 17 17 7M8 7h9v9",
  left: "M20 12H4m7-7-7 7 7 7",
  right: "M4 12h16m-7-7 7 7-7 7",
  up: "M12 20V4M5 11l7-7 7 7",
  plus: "M12 5v14M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  play: "M8 5.5v13l10.5-6.5z",
  images: "M4 6h16v12H4zM4 15l4.5-4.5 4 4 2.5-2.5L20 17",
  sound: "M4 9.5v5h3.5L12 18V6L7.5 9.5zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11",
  muted: "M4 9.5v5h3.5L12 18V6L7.5 9.5zM16 9.5l5 5m0-5-5 5",
};
const icon = (name) =>
  `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${iconPaths[name]}"/></svg>`;
// Stack and skill fields are written as "A · B · C" in the CMS.
const chips = (value) =>
  `<ul class="chips">${value
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<li>${e(part)}</li>`)
    .join("")}</ul>`;
const videoType = (src) =>
  src.toLowerCase().split(/[?#]/)[0].endsWith(".webm") ? "webm" : "mp4";

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
  const total = String(projects.length).padStart(2, "0");
  const firstName = p.name.split(" ")[0];

  const stageSlides = projects
    .map(
      (project, i) =>
        `<div class="stage-slide${i === 0 ? " is-active" : ""}">${image(project.images[0], "", 'class="stage-backdrop" decoding="async"')}${
          project.video
            ? `<video class="stage-media" muted loop playsinline preload="none" poster="${e(project.images[0])}"><source src="${e(project.video)}" type="video/${videoType(project.video)}"></video>`
            : image(project.images[0], "", 'class="stage-media" decoding="async"')
        }</div>`,
    )
    .join("");

  const tiles = projects
    .map(
      (project, i) =>
        `<div class="tile-wrap"><button class="tile" type="button" data-index="${i}" aria-pressed="${i === 0}" aria-controls="project-${e(project.id)}">${image(project.images[0], "", 'width="128" height="128" draggable="false"')}<span class="sr-only">${e(project.name)}</span></button></div>`,
    )
    .join("");

  const projectInfo = projects
    .map((project, i) => {
      const next = projects[(i + 1) % projects.length];
      return `<article class="project-info" id="project-${e(project.id)}" data-index="${i}"${i === 0 ? "" : " hidden"}>
      <div class="info-main">
        <p class="info-label"><span class="info-category">${e(project.category)}</span><span class="info-index">${String(i + 1).padStart(2, "0")} / ${total}</span></p>
        <h3 class="info-title">${e(project.name)}</h3>
        <p class="info-tagline">${e(project.title)}</p>
        <p class="info-description">${lines(project.description)}</p>
        <div class="actions"><button class="btn btn-primary" type="button" data-detail="project-${e(project.id)}">${project.video ? `${icon("play")}Watch video` : `${icon("images")}View screenshots`}</button>${external(project.url, project.linkLabel || "View project", "btn btn-ghost")}</div>
      </div>
      <div class="info-cards">
        <div class="card"><p class="card-label">Built with</p>${chips(project.stack)}</div>
        ${projects.length > 1 ? `<button class="card card-next" type="button" data-select="${(i + 1) % projects.length}">${image(next.images[0], "", 'width="56" height="56" loading="lazy"')}<span><span class="card-label">Next up</span><span class="card-next-name">${e(next.name)}</span></span></button>` : ""}
      </div>
    </article>`;
    })
    .join("\n");

  const experienceRows = experience
    .map(
      (item, i) => `<details class="experience-row" name="experience"${i === 0 ? " open" : ""}>
      <summary>${image(item.logo, "", 'class="experience-logo" width="44" height="44" loading="lazy"')}<span class="experience-role">${e(item.role)}<span>${e(item.company)}</span></span><span class="experience-date">${e(item.period)}</span><span class="expand-icon" aria-hidden="true">${icon("plus")}</span></summary>
      <ul class="experience-points">${item.bullets.map((b) => `<li>${e(b)}</li>`).join("")}</ul>
    </details>`,
    )
    .join("\n");

  const certificateCards = certificates
    .map(
      (item) =>
        `<a class="certificate" href="${e(item.image)}" data-detail="certificate-${e(item.id)}">${image(item.image, "", 'width="640" height="425" loading="lazy"')}<span class="certificate-text"><strong>${e(item.title)}</strong><small>${e(item.organization)} · ${e(item.period)}</small></span></a>`,
    )
    .join("");

  const templates =
    projects
      .map(
        (item) =>
          `<template id="detail-project-${e(item.id)}"><p class="eyebrow">${e(item.category)}</p><h2>${e(item.name)}</h2><p class="detail-description">${lines(item.description)}</p><p class="detail-stack">${e(item.stack)}</p>${item.video ? `<div class="project-video"><video controls preload="none" playsinline poster="${e(item.images[0])}" aria-label="Introduction to ${e(item.name)}"><source src="${e(item.video)}" type="video/${videoType(item.video)}">Your browser cannot play this video.</video></div>` : `<div class="gallery-images">${item.images.map((src, i) => image(src, `${item.name}, screenshot ${i + 1}`, 'width="1446" height="788"')).join("")}</div>`}${external(item.url, item.linkLabel || "View project")}</template>`,
      )
      .join("\n") +
    certificates
      .map(
        (item) =>
          `<template id="detail-certificate-${e(item.id)}"><p class="eyebrow">Certificate / ${e(item.period)}</p><h2>${e(item.title)}</h2><p class="detail-description">${lines(item.description)}</p><div class="gallery-images certificate-gallery">${image(item.image, `${p.name}, ${item.title}`, 'width="1280" height="850"')}</div>${external(item.url, "Open certificate")}</template>`,
      )
      .join("\n");

  return `<!doctype html>
<!-- Generated from content/portfolio.json. Edit content with npm run cms. -->
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#070a12">
  <meta name="description" content="${e(p.description)}"><title>${e(p.pageTitle)}</title>
  <link rel="icon" type="image/png" href="assets/images/favicon-32.png"><link rel="apple-touch-icon" href="assets/images/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&amp;family=Manrope:wght@500;600;700;800&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/main.css"><script src="assets/js/main.js" defer></script>
  <noscript><style>.panel[hidden], .project-info[hidden] { display: block !important; }</style></noscript>
</head>
<body data-tab="projects">
<a class="skip-link" href="#main">Skip to content</a>
<div class="stage" aria-hidden="true">${stageSlides}</div>
<header class="topbar">
  <nav class="tabs" role="tablist" aria-label="Portfolio sections">
    <a class="tab" role="tab" id="tab-projects" href="#projects" aria-controls="projects" aria-selected="true">Projects</a>
    <a class="tab" role="tab" id="tab-profile" href="#profile" aria-controls="profile" aria-selected="false" tabindex="-1">Profile</a>
  </nav>
  <div class="topbar-status">
    <p class="clock"><span class="local-time" data-timezone="${e(p.timezone)}"></span><span class="clock-place">${e(p.location.split(",")[0])}</span></p>
    <a class="profile-chip" href="#profile"><span class="avatar">${image(a.portrait, "", 'width="40" height="40"')}</span><span class="profile-chip-text">${e(p.name)}<small><span class="status-dot" aria-hidden="true"></span>${e(h.status)}</small></span><span class="sr-only">, open profile</span></a>
  </div>
</header>
<main id="main" tabindex="-1">
  <h1 class="sr-only">${e(p.name)}, ${e(h.specialty)}</h1>
  <section class="panel panel-projects" id="projects" role="tabpanel" aria-labelledby="tab-projects">
    <h2 class="sr-only">${e(s.workHeading)} ${e(s.workAccent)}</h2>
    ${
      projects.length
        ? `<div class="tiles" aria-label="Choose a project">${tiles}${p.github ? `<div class="tile-wrap"><a class="tile tile-more" href="${e(p.github)}" target="_blank" rel="noopener noreferrer"><span>More on GitHub</span>${icon("arrow")}</a></div>` : ""}</div>
    <div class="project-stack">${projectInfo}</div>
    <div class="console-bar">
      <ul class="hints" aria-label="Keyboard shortcuts"><li><kbd>←</kbd><kbd>→</kbd>Choose project</li><li><kbd>Enter</kbd>Open</li><li><kbd>M</kbd>Sound</li><li><kbd>P</kbd>Projects / Profile</li></ul>
      <button class="sound-toggle" type="button" aria-pressed="false" aria-label="Unmute preview" hidden><span class="sound-off">${icon("muted")}</span><span class="sound-on">${icon("sound")}</span></button>
    </div>`
        : `<div class="empty-state"><p class="info-tagline">No projects to show yet.</p>${external(p.github, "See my work on GitHub")}</div>`
    }
  </section>
  <section class="panel panel-profile" id="profile" role="tabpanel" aria-labelledby="tab-profile" hidden>
    <div class="profile-hero">
      <div class="profile-intro">
        <p class="eyebrow">${e(h.specialty)}</p>
        <h2 class="profile-name">${e(p.name)}</h2>
        <p class="profile-status"><span class="status-dot" aria-hidden="true"></span>${e(h.status)}</p>
        <p class="profile-tagline">${e(h.line1)} ${e(h.line2)} <em>${e(h.accent)}</em></p>
        <p class="profile-lede">${e(h.intro)}</p>
        <div class="actions"><a class="btn btn-primary" href="mailto:${e(p.email)}">Email ${e(firstName)}</a>${external(p.cv, "View my CV", "btn btn-ghost")}</div>
        <dl class="facts">${a.facts.map((f) => `<div><dt>${e(f.label)}</dt><dd>${e(f.value)}</dd></div>`).join("")}</dl>
      </div>
      ${image(a.portrait, p.name, 'class="profile-figure" width="502" height="900"')}
    </div>
    <div class="profile-body">
      <section class="block block-about" id="about" aria-labelledby="about-title">
        <div><p class="block-label">About</p><h3 id="about-title">${e(a.heading)} ${e(a.line2)} <em>${e(a.accent)}</em></h3></div>
        <div class="prose">${a.paragraphs.map((t) => `<p>${e(t)}</p>`).join("")}</div>
      </section>
      <section class="block block-experience" id="experience" aria-labelledby="experience-title">
        <div class="block-heading"><div><p class="block-label">Experience</p><h3 id="experience-title">${e(s.experienceHeading)} <em>${e(s.experienceAccent)}</em></h3></div><p>${lines(s.experienceIntro)}</p></div>
        <div class="experience-list">${experienceRows}</div>
      </section>
      <section class="block block-toolbox" aria-labelledby="toolbox-title">
        <p class="block-label">Toolbox</p><h3 id="toolbox-title">The tools I work with</h3>
        <div class="toolbox">${a.skills.map((f) => `<div><h4>${e(f.label)}</h4>${chips(f.value)}</div>`).join("")}</div>
      </section>
      ${certificates.length ? `<section class="block block-certificates" aria-labelledby="certificates-title"><p class="block-label">Certificates</p><h3 id="certificates-title">A little structured learning, too</h3><div class="certificates">${certificateCards}</div></section>` : ""}
      <section class="block block-contact" id="contact" aria-labelledby="contact-title">
        <p class="block-label">Contact</p><p class="contact-intro">${lines(s.contactIntro)}</p>
        <h3 id="contact-title"><a href="mailto:${e(p.email)}">${e(s.contactHeading)} <em>${e(s.contactAccent)}</em></a></h3>
        <div class="contact-links"><a class="text-link" href="mailto:${e(p.email)}">${e(p.email)}</a>${external(p.github, "GitHub")}${external(p.linkedin, "LinkedIn")}${external(p.instagram, "Instagram")}</div>
      </section>
    </div>
    <footer class="footer"><span>© <span data-year>${new Date().getFullYear()}</span> ${e(p.name)}</span><span>${e(p.footer)}</span><a class="text-link" href="#profile">Back to top ${icon("up")}</a></footer>
  </section>
</main>
<dialog class="project-dialog" aria-labelledby="dialog-title"><div class="dialog-toolbar"><span class="eyebrow">A closer look</span><button class="dialog-close" type="button" aria-label="Close details">Close ${icon("close")}</button></div><div class="dialog-content"></div><div class="gallery-controls"><button class="gallery-prev" type="button" aria-label="Previous image">${icon("left")}</button><p class="gallery-count" aria-live="polite"></p><button class="gallery-next" type="button" aria-label="Next image">${icon("right")}</button></div></dialog>
${templates}
</body>
</html>\n`;
}
