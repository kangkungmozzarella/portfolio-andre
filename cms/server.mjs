import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { createStorage } from "./storage.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
export function createCmsServer({ directory = root } = {}) {
  const storage = createStorage(directory);
  const token = randomBytes(32).toString("hex");
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };
  const json = (res, status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify(data));
  };
  async function body(req, limit) {
    const chunks = [];
    let length = 0;
    if (Number(req.headers["content-length"]) > limit)
      throw Object.assign(new Error("File atau konten terlalu besar."), {
        status: 413,
      });
    for await (const chunk of req) {
      length += chunk.length;
      if (length > limit)
        throw Object.assign(new Error("File atau konten terlalu besar."), {
          status: 413,
        });
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  const server = createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    const port = server.address()?.port;
    const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
    if (!hosts.includes(req.headers.host))
      return json(res, 403, { error: "Alamat host tidak diizinkan." });
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname.startsWith("/api/")) {
        if (
          req.headers["sec-fetch-site"] === "cross-site" ||
          (req.headers.origin &&
            !hosts.some((host) => req.headers.origin === `http://${host}`))
        )
          return json(res, 403, {
            error: "Permintaan harus berasal dari CMS lokal.",
          });
        if (req.method !== "GET" && req.headers["x-cms-token"] !== token)
          return json(res, 403, {
            error: "Sesi tidak valid. Muat ulang halaman CMS.",
          });
        if (url.pathname === "/api/content" && req.method === "GET")
          return json(res, 200, { ...(await storage.read()), token });
        if (url.pathname === "/api/content" && req.method === "PUT") {
          if (!req.headers["content-type"]?.startsWith("application/json"))
            return json(res, 415, { error: "Format konten harus JSON." });
          const data = JSON.parse(
            (await body(req, 2 * 1024 * 1024)).toString(),
          );
          return json(res, 200, await storage.save(data.content, data.version));
        }
        if (url.pathname === "/api/media" && req.method === "GET")
          return json(res, 200, { images: await storage.media() });
        if (url.pathname === "/api/upload" && req.method === "POST")
          return json(
            res,
            201,
            await storage.upload(
              await body(req, 10 * 1024 * 1024),
              url.searchParams.get("name") || "image",
            ),
          );
        return json(res, 404, { error: "Halaman API tidak ditemukan." });
      }
      if (!["GET", "HEAD"].includes(req.method))
        return json(res, 405, { error: "Metode tidak diizinkan." });
      const path = decodeURIComponent(url.pathname);
      if (path.includes("\0") || path.includes("\\"))
        return json(res, 400, { error: "Alamat tidak valid." });
      const routes = {
        "/": "index.html",
        "/index.html": "index.html",
        "/admin": "admin/index.html",
        "/admin/": "admin/index.html",
        "/cms/schema.mjs": "cms/schema.mjs",
      };
      let relative = routes[path];
      if (
        !relative &&
        (/^\/admin\/(admin\.css|admin\.js)$/.test(path) ||
          path.startsWith("/assets/"))
      )
        relative = path.slice(1);
      if (!relative)
        return json(res, 404, { error: "Halaman tidak ditemukan." });
      const absolute = await realpath(resolve(directory, relative));
      const allowedRoot = await realpath(directory);
      if (
        !absolute.startsWith(allowedRoot + sep) ||
        !types[extname(absolute).toLowerCase()]
      )
        return json(res, 403, { error: "File tidak diizinkan." });
      // Assets cannot escape their public folder through a symlink or traversal.
      if (
        relative.startsWith("assets/") &&
        !absolute.startsWith(
          (await realpath(resolve(directory, "assets"))) + sep,
        )
      )
        return json(res, 403, { error: "File tidak diizinkan." });
      if (!(await stat(absolute)).isFile())
        return json(res, 404, { error: "File tidak ditemukan." });
      res.writeHead(200, {
        "Content-Type": types[extname(absolute).toLowerCase()],
      });
      res.end(req.method === "HEAD" ? undefined : await readFile(absolute));
    } catch (error) {
      if (res.headersSent) return res.end();
      if (error.code === "ENOENT")
        return json(res, 404, { error: "File tidak ditemukan." });
      if (error.code) {
        console.error(error);
        return json(res, 500, {
          error:
            "File belum bisa disimpan atau dibaca. Periksa izin folder dan coba lagi.",
        });
      }
      json(res, error.status || 400, {
        error:
          error instanceof SyntaxError
            ? "Format konten tidak valid."
            : error.message,
      });
    }
  });
  return server;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.CMS_PORT || 4174);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("CMS_PORT harus berupa angka 1024–65535.");
  const server = createCmsServer();
  server.on("error", (error) => {
    console.error(
      error.code === "EADDRINUSE"
        ? `Port ${port} sedang dipakai. Jalankan dengan CMS_PORT=4175 npm run cms.`
        : error.message,
    );
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `CMS: http://127.0.0.1:${port}/admin/\nPortfolio: http://127.0.0.1:${port}/\nSimpan di CMS, lalu commit dan push perubahan untuk publish.`,
    ),
  );
}
