import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PACKAGE_VERSION } from "../src/version.ts";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const demoRoot = join(projectRoot, "demo");
const unicodeRoot = join(projectRoot, "examples", "unicode-run-receipt", "workprint");
const requestedPort = Number(process.argv[2] ?? 4319);
if (!Number.isSafeInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) {
  throw new Error("Port must be an integer from 0 to 65535.");
}

const routes = new Map([
  ["/", [demoRoot, "workprint.html"]],
  ["/workprint.html", [demoRoot, "workprint.html"]],
  ["/workprint.svg", [demoRoot, "workprint.svg"]],
  ["/share-card.png", [demoRoot, "share-card.png"]],
  ["/workprint.json", [demoRoot, "workprint.json"]],
  ["/privacy-receipt.json", [demoRoot, "privacy-receipt.json"]],
  ["/embed.md", [demoRoot, "embed.md"]],
  ["/MANIFEST.sha256", [demoRoot, "MANIFEST.sha256"]],
  ["/unicode/", [unicodeRoot, "workprint.html"]],
  ["/unicode/workprint.html", [unicodeRoot, "workprint.html"]],
  ["/unicode/workprint.svg", [unicodeRoot, "workprint.svg"]],
  ["/unicode/share-card.png", [unicodeRoot, "share-card.png"]],
  ["/unicode/workprint.json", [unicodeRoot, "workprint.json"]],
  ["/unicode/privacy-receipt.json", [unicodeRoot, "privacy-receipt.json"]],
  ["/unicode/embed.md", [unicodeRoot, "embed.md"]],
  ["/unicode/MANIFEST.sha256", [unicodeRoot, "MANIFEST.sha256"]],
]);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".sha256": "text/plain; charset=utf-8",
};

const server = createServer(async (request, response) => {
  response.setHeader("X-Codex-Workprint-QA", PACKAGE_VERSION);
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }
  const path = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  if (path === "/favicon.ico") {
    response.writeHead(204);
    response.end();
    return;
  }
  const target = routes.get(path);
  if (!target) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
    return;
  }
  const [artifactRoot, file] = target;
  try {
    const bytes = await readFile(join(artifactRoot, file));
    response.writeHead(200, { "Content-Type": contentTypes[extname(file)] ?? "application/octet-stream" });
    if (request.method === "HEAD") response.end();
    else response.end(bytes);
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("QA artifact unavailable\n");
  }
});

server.listen(requestedPort, "127.0.0.1", () => {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not resolve loopback QA address.");
  process.stdout.write(`CODEX_WORKPRINT_QA_URL=http://127.0.0.1:${address.port}/\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
