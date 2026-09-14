import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { request } from "node:http";
import { validateContent } from "./schema.mjs";
import { renderPortfolio } from "./render.mjs";
import { createStorage } from "./storage.mjs";
import { createCmsServer } from "./server.mjs";
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
  await mkdir(join(directory, "assets/images"), { recursive: true });
  const data = clone();
  data.about.portrait = "assets/images/test.png";
  data.projects.forEach((x) => (x.images = ["assets/images/test.png"]));
  data.experience.forEach((x) => (x.logo = "assets/images/test.png"));
  data.certificates.forEach((x) => (x.image = "assets/images/test.png"));
  await writeFile(join(directory, "assets/images/test.png"), png);
  await writeFile(
    join(directory, "content/portfolio.json"),
    JSON.stringify(data, null, 2) + "\n",
  );
  await writeFile(join(directory, "index.html"), renderPortfolio(data));
  return { directory, data, storage: createStorage(directory) };
}
test("renders original content and computes project count after add/remove", () => {
  const data = clone();
  data.projects.splice(1);
  const html = renderPortfolio(data);
  assert.match(html, /Work<span>01<\/span>/);
  assert.match(html, /A collection of 1 project/);
  assert.equal(
    (html.match(/class="experience-logo"/g) || []).length,
    data.experience.length,
  );
  data.projects = [];
  assert.match(renderPortfolio(data), /Work<span>00<\/span>/);
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
  ]) {
    const bad = clone();
    mutate(bad);
    assert.throws(() => validateContent(bad));
  }
});
test("save persists to JSON and generated HTML, preserving all other fields", async (t) => {
  const { directory, storage } = await fixture(t);
  const before = await storage.read();
  before.content.hero.intro = "A new introduction from the CMS.";
  const saved = await storage.save(before.content, before.version);
  assert.notEqual(saved.version, before.version);
  assert.deepEqual(saved.content, before.content);
  assert.match(
    await readFile(join(directory, "index.html"), "utf8"),
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
test("invalid content and missing images leave both files unchanged", async (t) => {
  const { directory, storage } = await fixture(t);
  const before = await storage.read();
  const html = await readFile(join(directory, "index.html"), "utf8");
  const bad = structuredClone(before.content);
  bad.projects[0].images = ["assets/images/missing.png"];
  await assert.rejects(
    storage.save(bad, before.version),
    /Gambar tidak ditemukan/,
  );
  assert.equal((await storage.read()).version, before.version);
  assert.equal(await readFile(join(directory, "index.html"), "utf8"), html);
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
  const server = createCmsServer({ directory });
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
  assert.match(
    await (await fetch(base + "/")).text(),
    new RegExp(update.projects[0].title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
  const upload = await fetch(base + "/api/upload?name=picture.png", {
    method: "POST",
    headers: { "X-CMS-Token": session.token, "Content-Type": "image/png" },
    body: png,
  });
  assert.equal(upload.status, 201);
});
