import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { adaptCodexJsonl } from "../src/adapter/codex-jsonl-v0_1.ts";
import { PUBLIC_BUNDLE_FILES, renderPublicBundle } from "../src/bundle.ts";
import { createRunReceiptStory } from "../src/core/story.ts";
import { inspectShareCardBitmapCoverage } from "../src/render/png.ts";
import {
  ADAPTER_VERSION,
  PACKAGE_VERSION,
  PNG_RENDERER_VERSION,
  RENDERER_VERSION,
  SCHEMA_VERSION,
} from "../src/version.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = join(root, "expert-review");
const archiveName = `codex-workprint-${PACKAGE_VERSION}-macos-minimal-validation.zip`;
const archivePath = join(outputDirectory, archiveName);
const crcTable = makeCrcTable();
const entries = new Map();

const fixedPaths = [
  "AGENTS.md",
  "LICENSE",
  "package.json",
  "bin/codex-workprint.js",
  "assets/fonts/unifont-17.0.05.hex.gz",
  "assets/fonts/OFL-1.1.txt",
  "assets/fonts/README.md",
  "schema/workprint-ir-v0.1.schema.json",
  "schema/workprint-ir-v0.2.schema.json",
  "schema/workprint-profile-v0.1.schema.json",
  "schema/workprint-profile-ir-v0.1.schema.json",
  "tests/fixtures/codex-0.145.0-failure-followup.jsonl",
];
for (const path of fixedPaths) entries.set(path, await readFile(toAbsolute(path)));
for (const path of await walk(join(root, "src"))) entries.set(path, await readFile(toAbsolute(path)));

entries.set("README.md", await readFile(join(root, "docs", "macos-validation-kit", "README.md")));
entries.set("VERIFY_PACKAGE.mjs", await readFile(join(root, "docs", "macos-validation-kit", "VERIFY_PACKAGE.mjs")));
entries.set("RUN_MACOS_VALIDATION.mjs", await readFile(join(root, "docs", "macos-validation-kit", "RUN_MACOS_VALIDATION.mjs")));
entries.set("SERVE_LOCAL.mjs", await readFile(join(root, "docs", "macos-validation-kit", "SERVE_LOCAL.mjs")));
entries.set("MACOS_VALIDATION_REPORT.md", await readFile(join(root, "docs", "macos-validation-kit", "MACOS_VALIDATION_REPORT.md")));

const fixturePath = "tests/fixtures/codex-0.145.0-failure-followup.jsonl";
const fixtureBytes = entries.get(fixturePath);
const buildOptions = {
  title: "修复登录失败并验证发布",
  project: "Workprint 示例",
  release: PACKAGE_VERSION,
  language: "zh-Hans",
};
const { workprint } = adaptCodexJsonl(fixtureBytes.toString("utf8"), buildOptions);
const story = createRunReceiptStory(workprint);
const coverage = inspectShareCardBitmapCoverage(workprint);
if (!coverage.supported) throw new Error(`Pinned Unicode example has missing glyphs: ${JSON.stringify(coverage.missingByField)}`);

const rendered = renderPublicBundle(workprint);
if (rendered.size !== PUBLIC_BUNDLE_FILES.length) throw new Error("Unexpected Run bundle file count.");
const artifacts = Object.fromEntries(
  [...rendered]
    .sort(([left], [right]) => codePointCompare(left, right))
    .map(([path, bytes]) => [path, sha256(bytes)]),
);

const criticalPaths = [
  "schema/workprint-ir-v0.1.schema.json",
  "schema/workprint-ir-v0.2.schema.json",
  "assets/fonts/unifont-17.0.05.hex.gz",
  "src/version.ts",
];
const criticalFiles = Object.fromEntries(
  criticalPaths.map((path) => {
    const bytes = entries.get(path);
    return [path, { bytes: bytes.length, sha256: sha256(bytes) }];
  }),
);
if (
  criticalFiles["schema/workprint-ir-v0.1.schema.json"].bytes !== 4931 ||
  criticalFiles["schema/workprint-ir-v0.1.schema.json"].sha256 !== "fceb913482d1046701dd0fb02960978a3e0066d5f705e16562d4335eba4c0299"
) {
  throw new Error("Historical Run IR 0.1 schema identity drifted.");
}

const expected = {
  schemaVersion: "codex-workprint-macos-minimal-validation-expected/0.1",
  candidate: {
    package: PACKAGE_VERSION,
    node: ">=22.18.0",
    adapter: ADAPTER_VERSION,
    runIr: SCHEMA_VERSION,
    renderer: RENDERER_VERSION,
    pngRenderer: PNG_RENDERER_VERSION,
  },
  fixture: {
    path: fixturePath,
    bytes: fixtureBytes.length,
    sha256: sha256(fixtureBytes),
    classification: "synthetic sanitized test fixture",
  },
  criticalFiles,
  build: {
    ...buildOptions,
    headline: story.headline,
    shapeSha256: workprint.source.shapeSha256,
    publicIrSha256: workprint.source.publicIrSha256,
    files: PUBLIC_BUNDLE_FILES.length,
    artifacts,
    glyphCoverage: { publicFieldsChecked: 5, supported: coverage.supported, missingByField: coverage.missingByField },
  },
  requiredHost: {
    platform: "darwin",
    physicalDevice: true,
    pathContainsSpace: true,
  },
  manualBrowserGate: {
    viewports: ["desktop", "390x844"],
    screenshots: 2,
    consoleErrorsOrWarnings: 0,
    remoteNetworkRequests: 0,
  },
  claimCeiling: "Implementation semantics, pinned artifact bytes, and separately recorded local-browser behavior on the exact physical Darwin candidate only.",
};
entries.set("EXPECTED.json", Buffer.from(`${JSON.stringify(expected, null, 2)}\n`, "utf8"));

const manifest = [...entries]
  .sort(([left], [right]) => codePointCompare(left, right))
  .map(([path, bytes]) => `${sha256(bytes)}  ${path}\n`)
  .join("");
entries.set("PACKAGE_MANIFEST.sha256", Buffer.from(manifest, "utf8"));

const orderedEntries = [...entries]
  .sort(([left], [right]) => codePointCompare(left, right))
  .map(([path, bytes]) => ({ path, bytes, mode: path === "bin/codex-workprint.js" ? 0o100755 : 0o100644 }));
const archive = createStoredZip(orderedEntries);
await mkdir(outputDirectory, { recursive: true });
await writeFile(archivePath, archive);
const archiveSha256 = sha256(archive);
await writeFile(`${archivePath}.sha256`, `${archiveSha256}  ${archiveName}\n`, "utf8");

process.stdout.write(`MACOS_MINIMAL_VALIDATION_PACKAGE ${relative(root, archivePath).replaceAll("\\", "/")}\n`);
process.stdout.write(`FILES ${orderedEntries.length}\n`);
process.stdout.write(`BYTES ${archive.length}\n`);
process.stdout.write(`SHA256 ${archiveSha256}\n`);
process.stdout.write(`EXPECTED_SHAPE ${workprint.source.shapeSha256}\n`);
process.stdout.write(`EXPECTED_PUBLIC_IR ${workprint.source.publicIrSha256}\n`);

async function walk(directory) {
  const paths = [];
  const visit = async (current) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const absolute = join(current, entry.name);
      const path = relative(root, absolute).replaceAll("\\", "/");
      if (entry.isDirectory()) await visit(absolute);
      else {
        const info = await lstat(absolute);
        if (info.isSymbolicLink() || !info.isFile()) throw new Error(`Refusing unsupported source entry: ${path}`);
        paths.push(path);
      }
    }
  };
  await visit(directory);
  return paths.sort(codePointCompare);
}

function toAbsolute(path) {
  return join(root, ...path.split("/"));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function codePointCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function createStoredZip(files) {
  if (files.length > 0xffff) throw new Error("ZIP64 is not supported.");
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.path, "utf8");
    const size = file.bytes.length;
    if (size > 0xffffffff || offset > 0xffffffff) throw new Error("ZIP64 is not supported.");
    const checksum = crc32(file.bytes);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(33, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(size, 18);
    local.writeUInt32LE(size, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, file.bytes);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(33, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(size, 20);
    central.writeUInt32LE(size, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE((file.mode << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += local.length + name.length + size;
  }

  const centralOffset = offset;
  const centralSize = centrals.reduce((total, chunk) => total + chunk.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, ...centrals, end]);
}

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    table[index] = value >>> 0;
  }
  return table;
}

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
