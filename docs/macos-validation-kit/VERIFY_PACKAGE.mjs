import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)));
const manifestName = "PACKAGE_MANIFEST.sha256";

try {
  const manifest = await readFile(join(root, manifestName), "utf8");
  const expected = new Map();
  for (const line of manifest.trimEnd().split("\n")) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    if (
      !match ||
      expected.has(match[2]) ||
      match[2].includes("\\") ||
      match[2].startsWith("/") ||
      match[2].split("/").includes("..")
    ) {
      throw new Error("invalid manifest");
    }
    expected.set(match[2], match[1]);
  }

  const actualFiles = await walk(root);
  const comparable = actualFiles.filter((path) => path !== manifestName);
  if (comparable.length !== expected.size || comparable.some((path) => !expected.has(path))) {
    throw new Error("file-set mismatch");
  }

  for (const path of comparable) {
    const absolute = join(root, ...path.split("/"));
    const info = await lstat(absolute);
    if (info.isSymbolicLink() || !info.isFile()) throw new Error("unsupported entry");
    const digest = createHash("sha256").update(await readFile(absolute)).digest("hex");
    if (digest !== expected.get(path)) throw new Error("digest mismatch");
  }

  process.stdout.write("PACKAGE_IDENTITY_VERIFIED\n");
} catch {
  process.stderr.write("IDENTITY_MISMATCH\n");
  process.exitCode = 1;
}

async function walk(directory) {
  const output = [];
  const visit = async (current) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const absolute = join(current, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else output.push(relative(root, absolute).replaceAll("\\", "/"));
    }
  };
  await visit(directory);
  return output.sort(codePointCompare);
}

function codePointCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
