import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { request } from "node:http";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { validateContent } from "./schema.mjs";
import { createStorage } from "./storage.mjs";
import { createCmsServer } from "./server.mjs";
import { Portfolio } from "../components/Portfolio.tsx";
import { ProjectPage } from "../components/ProjectPage.tsx";

// The page as Next.js prerenders it, minus the layout. Validation first, as the build does.
const renderPortfolio = (data) =>
  renderToStaticMarkup(createElement(Portfolio, { content: validateContent(data) }));
const original = JSON.parse(
  await readFile(new URL("../content/portfolio.json", import.meta.url), "utf8"),
);
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5XcAAAAASUVORK5CYII=",
  "base64",
);
const clone = () => structuredClone(original);
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), "portfolio-cms-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, "content"), { recursive: true });
  await mkdir(join(directory, "public/assets/images"), { recursive: true });
  const data = clone();
  data.about.portrait = "assets/images/test.png";
  data.projects.forEach((x) => {
    x.images = ["assets/images/test.png"];
    x.video = "";
  });
  data.experience.forEach((x) => (x.logo = "assets/images/test.png"));
  data.certificates.forEach((x) => (x.image = "assets/images/test.png"));
  await writeFile(join(directory, "public/assets/images/test.png"), png);
  await writeFile(
    join(directory, "content/portfolio.json"),
    JSON.stringify(data, null, 2) + "\n",
  );
  return { directory, data, storage: createStorage(directory) };
}
test("renders original content and computes project count after add/remove", () => {
  const data = clone();
  data.projects.splice(1);
  const html = renderPortfolio(data);
  assert.equal((html.match(/<article class="rise work /g) || []).length, 1);
  assert.match(html, /01 \/ 01/);
  assert.equal(
    (html.match(/class="experience-logo"/g) || []).length,
    data.experience.length,
  );
  data.projects = [];
  const empty = renderPortfolio(data);
  assert.match(empty, /No projects to show yet\./);
  assert.doesNotMatch(empty, /<article class="rise work /);
});
test("project cards autoplay a muted video, or offer screenshots when there is none", () => {
  const data = clone();
  const project = (id, name, folder) => ({
    id, name, title: name, category: "Test", stack: "Test", description: "Test",
    images: [1, 2].map((n) => `assets/images/gallery/${folder}/${n}.png`), url: "", linkLabel: "", video: "",
  });
  data.projects = [
    { ...project("travel", "Travel information system", "travel"), video: "https://example.com/travel-demo.mp4" },
    project("maut", "Accommodation decision support", "spk-maut"),
  ];
  const html = renderPortfolio(data);
  const card = (id) => html.slice(html.indexOf(`id="project-${id}"`), html.indexOf("</article>", html.indexOf(`id="project-${id}"`)));
  // Outside Next.js, <Link> drops the trailing slash that the real build keeps.
  assert.match(card("travel"), /href="\/projects\/travel\/?"><svg[^]*?Watch video<\/a>/);
  assert.match(card("maut"), /href="\/projects\/maut\/?"><svg[^]*?View screenshots<\/a>/);
  assert.match(card("travel"), /<video class="work-video" muted="" loop="" playsinline="" preload="none" poster="\/assets\/images\/gallery\/travel\/1\.png">/i);
  assert.match(card("travel"), /<source src="https:\/\/example\.com\/travel-demo\.mp4" type="video\/mp4"\/>/);
  assert.match(card("maut"), /<img src="\/assets\/images\/gallery\/spk-maut\/1\.png"/);
  assert.doesNotMatch(card("maut"), /<video/);
});
test("project pages play the video with sound, or show every screenshot, and link onward", () => {
  const data = validateContent(clone());
  const page = (project) => renderToStaticMarkup(createElement(ProjectPage, { content: data, project }));
  const first = page(data.projects[0]);
  assert.match(first, /<h1 data-split="words" class="project-name">/);
  assert.match(first, /<video controls="" preload="metadata" playsinline=""/i);
  assert.match(first, new RegExp(`href="/projects/${data.projects[1].id}/?"`));
  assert.match(first, new RegExp(`href="/projects/${data.projects.at(-1).id}/?"`));
  assert.match(first, /href="\/#work"/);

  const gallery = structuredClone(data.projects[1]);
  gallery.video = "";
  gallery.images = ["assets/images/a.png", "assets/images/b.png"];
  const html = page(gallery);
  assert.doesNotMatch(html, /<video/);
  assert.match(html, /screenshot 2/);
});
test("image adjustments are validated and rendered per image", () => {
  const data = clone();
  data.about.portrait = {
    src: data.about.portrait,
    fit: "contain",
    ratio: "4/5",
    x: 35,
    y: 20,
    zoom: 125,
  };
  data.projects[0].images[0] = {
    src: data.projects[0].images[0],
    fit: "cover",
    ratio: "16/9",
    x: 70,
    y: 45,
    zoom: 110,
  };
  const html = renderPortfolio(data);
  assert.match(html, /--image-fit:contain;--image-x:35%;--image-y:20%;--image-zoom:1\.25/);
  assert.match(html, /<span class="thumb"><img src="\/assets\/images\/gallery\/kantor-ai\/cover\.jpg" alt="" style="--image-fit:cover;--image-x:70%;--image-y:45%;--image-zoom:1\.1"/);
  assert.match(html, /poster="\/assets\/images\/gallery\/kantor-ai\/cover\.jpg"/);
  assert.doesNotMatch(html, /\[object Object\]/);

  const bad = clone();
  bad.about.portrait = { src: bad.about.portrait, fit: "stretch", ratio: "auto", x: 50, y: 50, zoom: 100 };
  assert.throws(() => validateContent(bad), /mode tampilan tidak valid/);
});
test("escapes text and rejects unsafe URLs, IDs, timezone, and media paths", () => {
  const data = clone();
  data.hero.intro = "<img src=x onerror=alert(1)>";
  const html = renderPortfolio(data);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  for (const mutate of [
    (x) => (x.profile.github = "javascript:alert(1)"),
    (x) => (x.projects[0].id = '" onclick="bad'),
    (x) => (x.about.portrait = "assets/images/../../secret.png"),
    (x) => (x.profile.timezone = "Nowhere/Invalid"),
    (x) => (x.projects[1].id = x.projects[0].id),
    (x) => (x.projects[0].video = "javascript:alert(1)"),
    (x) => (x.projects[0].video = "assets/videos/../secret.mp4"),
  ]) {
    const bad = clone();
    mutate(bad);
    assert.throws(() => validateContent(bad));
  }
});
test("save persists to JSON, preserving all other fields", async (t) => {
  const { directory, storage } = await fixture(t);
  const before = await storage.read();
  before.content.hero.intro = "A new introduction from the CMS.";
  const saved = await storage.save(before.content, before.version);
  assert.notEqual(saved.version, before.version);
  assert.deepEqual(saved.content, before.content);
  assert.match(
    await readFile(join(directory, "content/portfolio.json"), "utf8"),
    /A new introduction from the CMS\./,
  );
  assert.deepEqual(
    (await createStorage(directory).read()).content,
    saved.content,
  );
});
test("stale saves cannot overwrite newer edits", async (t) => {
  const { storage } = await fixture(t);
  const initial = await storage.read();
  const first = structuredClone(initial.content);
  first.hero.line1 = "Newest version.";
  await storage.save(first, initial.version);
  await assert.rejects(
    storage.save(initial.content, initial.version),
    (error) => error.status === 409,
  );
  assert.equal((await storage.read()).content.hero.line1, "Newest version.");
});
test("invalid content and missing images leave the content file unchanged", async (t) => {
  const { directory, storage } = await fixture(t);
  const before = await storage.read();
  const json = await readFile(join(directory, "content/portfolio.json"), "utf8");
  const bad = structuredClone(before.content);
  bad.projects[0].images = ["assets/images/missing.png"];
  await assert.rejects(
    storage.save(bad, before.version),
    /Gambar tidak ditemukan/,
  );
  assert.equal((await storage.read()).version, before.version);
  assert.equal(await readFile(join(directory, "content/portfolio.json"), "utf8"), json);
});
test("upload validates image signature and uses a safe unique filename", async (t) => {
  const { storage } = await fixture(t);
  await assert.rejects(
    storage.upload(Buffer.from('<svg onload="alert(1)"></svg>'), "bad.png"),
    /PNG/,
  );
  const uploaded = await storage.upload(png, "../../evil<script>.jpg");
  assert.match(uploaded.path, /^assets\/images\/uploads\/[a-zA-Z0-9-]+\.png$/);
  assert((await storage.media()).some((x) => x.path === uploaded.path));
});
test("HTTP API enforces local origin/token and exposes only public routes", async (t) => {
  const { directory, data } = await fixture(t);
  const server = createCmsServer({ directory, previewUrl: "http://localhost:3999/" });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  );
  const base = `http://127.0.0.1:${server.address().port}`;
  const read = await fetch(base + "/api/content");
  const session = await read.json();
  assert.equal(read.status, 200);
  assert.equal(
    (
      await fetch(base + "/api/content", {
        headers: { Origin: "https://example.com" },
      })
    ).status,
    403,
  );
  assert.equal(
    await new Promise((resolve, reject) => {
      const req = request(
        base + "/api/content",
        { headers: { Host: "attacker.example" } },
        (response) => {
          response.resume();
          resolve(response.statusCode);
        },
      );
      req.on("error", reject);
      req.end();
    }),
    403,
  );
  assert.equal(
    (
      await fetch(base + "/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    ).status,
    403,
  );
  for (const path of [
    "/.git/config",
    "/content/portfolio.json",
    "/cms/server.mjs",
    "/assets/%2e%2e%2fcontent/portfolio.json",
  ])
    assert([403, 404].includes((await fetch(base + path)).status));
  const update = structuredClone(data);
  update.projects.reverse();
  const response = await fetch(base + "/api/content", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-CMS-Token": session.token,
      Origin: base,
    },
    body: JSON.stringify({ content: update, version: session.version }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).content.projects, update.projects);
  assert.deepEqual(
    JSON.parse(await readFile(join(directory, "content/portfolio.json"), "utf8")).projects,
    update.projects,
  );
  const home = await fetch(base + "/", { redirect: "manual" });
  assert.equal(home.status, 302);
  assert.equal(home.headers.get("location"), "http://localhost:3999/");
  assert.equal((await fetch(base + "/assets/images/test.png")).status, 200);
  const upload = await fetch(base + "/api/upload?name=picture.png", {
    method: "POST",
    headers: { "X-CMS-Token": session.token, "Content-Type": "image/png" },
    body: png,
  });
  assert.equal(upload.status, 201);
});
