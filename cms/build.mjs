import { readFile, writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createStorage } from "./storage.mjs";
const root = fileURLToPath(new URL("..", import.meta.url));
const content = JSON.parse(
  await readFile(resolve(root, "content/portfolio.json"), "utf8"),
);
const { html } = await createStorage(root).prepare(content);
const temporary = resolve(root, "index.html.build-tmp");
await writeFile(temporary, html);
await rename(temporary, resolve(root, "index.html"));
console.log("index.html diperbarui dari content/portfolio.json.");
