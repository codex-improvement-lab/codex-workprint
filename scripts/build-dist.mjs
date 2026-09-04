import { stripTypeScriptTypes } from "node:module";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isSupportedNodeVersion } from "../src/runtime-check.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "src");
const targetRoot = join(root, "dist");
if (!isSupportedNodeVersion(process.versions.node)) throw new Error("Build requires Node 22.18.0 or newer");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const sourceFiles = [];
async function walk(directory, output) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error("Build refuses linked source/output paths");
    if (entry.isDirectory()) await walk(path, output);
    else output.push(path);
  }
}
await walk(sourceRoot, sourceFiles);
const modules = new Map();
for (const file of sourceFiles.sort()) {
  if (!/\.(?:ts|js)$/.test(file)) continue;
  const name = relative(sourceRoot, file).replaceAll("\\", "/").replace(/\.ts$/, ".js");
  const source = (await readFile(file, "utf8")).replace(/\r\n?/g, "\n");
  let javascript = file.endsWith(".ts") ? stripTypeScriptTypes(source, { mode: "strip" }) : source;
  // Every relative .ts specifier in this source tree is a module import. Type
  // imports are already erased; preserve the module layout while rewriting it.
  javascript = javascript.replace(/(["'])(\.{1,2}\/[^"'\r\n]+)\.ts\1/g, "$1$2.js$1");
  modules.set(name, { source, javascript: javascript.endsWith("\n") ? javascript : javascript + "\n" });
}
await mkdir(targetRoot, { recursive: true });
const existing = [];
await walk(targetRoot, existing);
for (const file of existing) {
  const name = relative(targetRoot, file).replaceAll("\\", "/");
  if (name !== "BUILD.json" && !modules.has(name)) throw new Error(`Unexpected distribution file: ${name}`);
}
const manifest = { compiler: `node-strip-types/${process.versions.node}/relative-imports-v1`, modules: [] };
for (const [name, value] of modules) {
  const path = join(targetRoot, name);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, value.javascript);
  manifest.modules.push({ path: name, sourceSha256: hash(value.source), javascriptSha256: hash(value.javascript) });
}
await writeFile(join(targetRoot, "BUILD.json"), JSON.stringify(manifest, null, 2) + "\n");
process.stdout.write(`BUILT ${modules.size} JavaScript modules for installed packages\n`);
