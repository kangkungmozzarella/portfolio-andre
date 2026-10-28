// `npm run cms`: the content editor plus a live preview. The editor saves
// content/portfolio.json, and `next dev` reloads the page as soon as it changes.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createCmsServer } from "./server.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const port = Number(process.env.CMS_PORT || 4174);
// Next to the CMS port rather than 3000, which other local Next.js apps tend to hold.
const previewPort = Number(process.env.PREVIEW_PORT || 4175);
for (const [name, value] of [["CMS_PORT", port], ["PREVIEW_PORT", previewPort]])
  if (!Number.isInteger(value) || value < 1024 || value > 65535)
    throw new Error(`${name} harus berupa angka 1024–65535.`);

const previewUrl = `http://127.0.0.1:${previewPort}/`;
const preview = spawn("npx", ["next", "dev", "--port", String(previewPort), "--hostname", "127.0.0.1"], {
  cwd: root,
  stdio: ["ignore", "inherit", "inherit"],
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
});
const server = createCmsServer({ previewUrl });
const stop = () => {
  preview.kill();
  server.close();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
preview.on("exit", (code) => {
  if (code) console.error(`Preview berhenti (kode ${code}). Jika port ${previewPort} terpakai, coba PREVIEW_PORT=4176 npm run cms.`);
  server.close();
});
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `Port ${port} sedang dipakai. Jalankan dengan CMS_PORT=4175 npm run cms.`
      : error.message,
  );
  stop();
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    `CMS: http://127.0.0.1:${port}/admin/\nPortfolio: ${previewUrl}\nSimpan di CMS, lalu commit dan push perubahan untuk publish.`,
  ),
);
