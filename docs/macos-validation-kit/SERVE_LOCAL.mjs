import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const bundleRoot = join(packageRoot, "results", "browser-bundle");
const port = process.argv[2] === undefined ? 4173 : Number(process.argv[2]);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  process.stderr.write("LOCAL_SERVER=FAIL: port must be an integer from 1024 to 65535\n");
  process.exit(2);
}

const publicFiles = new Set([
  "MANIFEST.sha256",
  "embed.md",
  "privacy-receipt.json",
  "share-card.png",
  "workprint.html",
  "workprint.json",
  "workprint.svg",
]);
const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".png", "image/png"],
  [".sha256", "text/plain; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
]);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
    const name = url.pathname === "/" ? "workprint.html" : decodeURIComponent(url.pathname.slice(1));
    if (!publicFiles.has(name) || (request.method !== "GET" && request.method !== "HEAD")) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found\n");
      return;
    }
    const bytes = await readFile(join(bundleRoot, name));
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Length": bytes.length,
      "Content-Type": contentTypes.get(extname(name)) || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : bytes);
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Local validation server error\n");
  }
});

server.on("error", (error) => {
  process.stderr.write(`LOCAL_SERVER=FAIL: ${error.message}\n`);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`LOCAL_SERVER=READY http://127.0.0.1:${port}/\n`);
  process.stdout.write("Press Ctrl+C after browser validation.\n");
});
process.on("SIGINT", () => server.close(() => process.exit(0)));
