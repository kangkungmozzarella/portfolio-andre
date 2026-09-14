import {
  readFile,
  writeFile,
  rename,
  mkdir,
  realpath,
  stat,
  readdir,
  unlink,
} from "node:fs/promises";
import { resolve, dirname, sep, extname } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { renderPortfolio } from "./render.mjs";
import { validateContent } from "./schema.mjs";

export function createStorage(root) {
  const dataPath = resolve(root, "content/portfolio.json");
  const htmlPath = resolve(root, "index.html");
  let saving = false;
  const version = (raw) => createHash("sha256").update(raw).digest("hex");
  async function read() {
    const raw = await readFile(dataPath, "utf8");
    return { content: JSON.parse(raw), version: version(raw) };
  }
  async function assertImage(path) {
    const imageRoot = await realpath(resolve(root, "assets/images"));
    let actual;
    try {
      actual = await realpath(resolve(root, path));
    } catch {
      throw new Error(
        `Gambar tidak ditemukan: ${path}. Pilih ulang dari pustaka media.`,
      );
    }
    if (!actual.startsWith(imageRoot + sep) || !(await stat(actual)).isFile())
      throw new Error("Lokasi gambar tidak valid.");
  }
  async function prepare(input) {
    const content = validateContent(input);
    const paths = new Set([
      content.about.portrait,
      ...content.experience.map((x) => x.logo),
      ...content.certificates.map((x) => x.image),
      ...content.projects.flatMap((x) => x.images),
    ]);
    await Promise.all([...paths].map(assertImage));
    return { content, html: renderPortfolio(content) };
  }
  async function save(input, expectedVersion) {
    if (saving)
      throw Object.assign(
        new Error("Penyimpanan sedang berlangsung. Coba lagi sebentar."),
        { status: 409 },
      );
    saving = true;
    const suffix = `.tmp-${randomUUID()}`;
    const dataTemp = dataPath + suffix;
    const htmlTemp = htmlPath + suffix;
    try {
      const current = await read();
      if (current.version !== expectedVersion)
        throw Object.assign(
          new Error(
            "Konten berubah dari tab atau editor lain. Muat ulang konten sebelum menyimpan agar perubahan tersebut tidak tertimpa.",
          ),
          { status: 409 },
        );
      const { content, html } = await prepare(input);
      const raw = JSON.stringify(content, null, 2) + "\n";
      await mkdir(dirname(dataPath), { recursive: true });
      await writeFile(dataTemp, raw, { flag: "wx" });
      await writeFile(htmlTemp, html, { flag: "wx" });
      // Keep the previous HTML available for rollback if the second rename fails.
      const previousHTML = await readFile(htmlPath);
      await rename(htmlTemp, htmlPath);
      try {
        await rename(dataTemp, dataPath);
      } catch (error) {
        await writeFile(htmlPath, previousHTML);
        throw error;
      }
      return { content, version: version(raw) };
    } finally {
      saving = false;
      await Promise.all(
        [dataTemp, htmlTemp].map((path) => unlink(path).catch(() => {})),
      );
    }
  }
  async function media() {
    const result = [];
    async function walk(directory) {
      for (const entry of await readdir(resolve(root, directory), {
        withFileTypes: true,
      })) {
        const path = `${directory}/${entry.name}`;
        if (entry.isDirectory()) await walk(path);
        else if (
          entry.isFile() &&
          /\.(png|jpe?g|webp|gif|svg)$/i.test(entry.name)
        ) {
          const info = await stat(resolve(root, path));
          result.push({
            path,
            name: entry.name,
            bytes: info.size,
            modified: info.mtimeMs,
          });
        }
      }
    }
    await walk("assets/images");
    return result.sort((a, b) => b.modified - a.modified);
  }
  async function upload(bytes, name) {
    let extension;
    if (
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      extension = ".png";
    else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
      extension = ".jpg";
    else if (
      bytes.subarray(0, 4).toString() === "RIFF" &&
      bytes.subarray(8, 12).toString() === "WEBP"
    )
      extension = ".webp";
    else if (["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString()))
      extension = ".gif";
    else throw new Error("Gunakan gambar PNG, JPG, WebP, atau GIF yang valid.");
    const stem =
      name
        .replace(extname(name), "")
        .replace(/[^a-zA-Z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50) || "image";
    const path = `assets/images/uploads/${stem}-${randomUUID().slice(0, 8)}${extension}`;
    await mkdir(resolve(root, "assets/images/uploads"), { recursive: true });
    await writeFile(resolve(root, path), bytes, { flag: "wx" });
    return { path };
  }
  return { read, save, prepare, media, upload };
}
