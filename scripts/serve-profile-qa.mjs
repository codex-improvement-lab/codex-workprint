import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PACKAGE_VERSION } from "../src/version.ts";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requestedPort = Number(process.argv[2] ?? 4320);
if (!Number.isSafeInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) {
  throw new Error("Port must be an integer from 0 to 65535.");
}

const profiles = new Map([
  ["continuity", "continuity-archive-migration"],
  ["goal-delta", "goal-delta-offline-release"],
  ["context-receipt", "context-receipt-observation-gap"],
]);
const files = new Set([
  "workprint-profile.html",
  "workprint-profile.svg",
  "share-card.png",
  "workprint-profile.json",
  "profile-receipt.json",
  "embed.md",
  "MANIFEST.sha256",
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
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  if (pathname === "/favicon.ico") {
    response.writeHead(204);
    response.end();
    return;
  }
  const parts = pathname.split("/").filter(Boolean);
  const profileName = parts[0];
  const example = profiles.get(profileName);
  const requestedFile = parts[1] || "workprint-profile.html";
  if (!example || parts.length > 2 || !files.has(requestedFile)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
    return;
  }
  try {
    const path = join(projectRoot, "examples", "profile", example, "workprint", requestedFile);
    const bytes = await readFile(path);
    response.writeHead(200, { "Content-Type": contentTypes[extname(requestedFile)] ?? "application/octet-stream" });
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
  process.stdout.write(`CODEX_WORKPRINT_PROFILE_QA_URL=http://127.0.0.1:${address.port}/\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
