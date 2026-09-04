import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = join(root, "expert-review");
const packageVersion = "0.3.0-rc.3";
const archiveName = `codex-workprint-${packageVersion}-expert-review.zip`;
const archivePath = join(outputDirectory, archiveName);
const excludedSegments = new Set([".git", ".workprint-private", "._audit", "node_modules", "expert-review", "release", "dist"]);
const crcTable = makeCrcTable();

const sourcePaths = await walk(root);
const entries = new Map();
let sourceBytes = 0;
for (const path of sourcePaths) {
  const bytes = await readFile(toAbsolute(path));
  sourceBytes += bytes.length;
  entries.set(path, bytes);
}

entries.set("EXPERT_REVIEW_START_HERE.md", await readFile(join(root, "docs", "review", "EXPERT_REVIEW_START_HERE.md")));
entries.set("EXPERT_REVIEW_REPORT_TEMPLATE.md", await readFile(join(root, "docs", "review", "EXPERT_REVIEW_REPORT_TEMPLATE.md")));

const profileExamples = await Promise.all([
  ["continuity-archive-migration", "continuity"],
  ["goal-delta-offline-release", "goal-delta"],
  ["context-receipt-observation-gap", "context-receipt"],
].map(async ([name, profile]) => {
  const base = `examples/profile/${name}`;
  const receiptPath = `${base}/workprint/profile-receipt.json`;
  const receipt = JSON.parse((await readFile(toAbsolute(receiptPath), "utf8")));
  return {
    name,
    profile,
    input: `${base}/profile.json`,
    output: `${base}/workprint`,
    bundleFiles: 7,
    profileIrSha256: receipt.profileIrSha256,
  };
}));

const triptychPath = "docs/assets/workprint-profile-triptych.png";
const triptych = await readFile(toAbsolute(triptychPath));
assertPng(triptych, 1200, 630);
const runPreviewPath = "docs/assets/github-social-preview.png";
const runPreview = await readFile(toAbsolute(runPreviewPath));
assertPng(runPreview, 1200, 630);
const browserReceiptPath = "docs/evidence/browser/run-receipt-qa-receipt-2026-09-05-0.3.0-rc.3.json";
const browserReceiptBytes = await readFile(toAbsolute(browserReceiptPath));
const browserReceipt = JSON.parse(browserReceiptBytes.toString("utf8"));
const sourceFileCount = sourcePaths.length;
const inventory = {
  schemaVersion: "codex-workprint-expert-review/0.1",
  package: {
    name: "codex-workprint",
    version: packageVersion,
    node: ">=22.18.0",
    runtimeDependencies: 0,
  },
  sourceIdentity: {
    kind: "filesystem-snapshot",
    gitCommit: null,
    note: "The repository had no commit identity at packaging time. Verify the external ZIP SHA-256 and this package's internal manifest.",
  },
  archive: {
    format: "ZIP stored entries",
    deterministicTimestamp: "1980-01-01T00:00:00Z",
    sourceFileCount,
    sourceBytes,
    archiveFileCount: sourceFileCount + 4,
    manifestEntryCount: sourceFileCount + 3,
    exclusions: [".git", ".workprint-private", "._audit", "node_modules", "expert-review", "release", "dist"],
  },
  reviewEntryPoints: {
    startHere: "EXPERT_REVIEW_START_HERE.md",
    reportTemplate: "EXPERT_REVIEW_REPORT_TEMPLATE.md",
    productReviewResponseZh: "docs/review/PRODUCT_REVIEW_RESPONSE_RC2_ZH.md",
    identityVerifier: "scripts/verify-expert-review.mjs",
    productReadme: "README.md",
    runContract: "docs/WORKPRINT_IR.md",
    profileContract: "docs/PROFILE_IR.md",
  },
  expectedAutomatedGates: {
    tests: { command: "node --test", passed: 46, failed: 0 },
    runBundles: { command: "node ./scripts/build-demo.mjs", bundles: 2, filesPerBundle: 7 },
    unicodeRunBundle: { command: "node ./scripts/build-unicode-example.mjs", bundles: 1, filesPerBundle: 7, titleGlyphsSupported: 11, titleGlyphsMissing: 0 },
    profileBundles: { command: "node ./scripts/build-profile-examples.mjs", bundles: 3, filesPerBundle: 7 },
    releaseCheck: { command: "node ./scripts/release-check.mjs", passed: 439, failed: 0 },
    authorizedIncubatorProjectionCompatibility: {
      observedInPackagingWorkspace: "7/7 parsed",
      packageDependencyOnSiblingRepositories: false,
    },
  },
  profileExamples,
  socialPreview: {
    path: runPreviewPath,
    width: runPreview.readUInt32BE(16),
    height: runPreview.readUInt32BE(20),
    bytes: runPreview.length,
    pngMagicHex: runPreview.subarray(0, 8).toString("hex"),
    sha256: sha256(runPreview),
    underOneMillionBytes: runPreview.length < 1_000_000,
    byteIdenticalToPrimaryBundleCard: runPreview.equals(await readFile(toAbsolute("demo/share-card.png"))),
  },
  profileTriptych: {
    path: triptychPath,
    width: triptych.readUInt32BE(16),
    height: triptych.readUInt32BE(20),
    bytes: triptych.length,
    pngMagicHex: triptych.subarray(0, 8).toString("hex"),
    sha256: sha256(triptych),
    underOneMillionBytes: triptych.length < 1_000_000,
  },
  browserEvidence: {
    receipt: browserReceiptPath,
    receiptSha256: sha256(browserReceiptBytes),
    receiptType: browserReceipt.receiptType,
    aggregate: browserReceipt.aggregate,
    claimCeiling: browserReceipt.claimCeiling,
  },
  claimCeiling: [
    "This package supports review of a deterministic local compiler and presentation contract.",
    "It does not establish source authenticity, finding correctness, model influence, real-world causality, production readiness, physical-device support, human comprehension, adoption, or market demand.",
    "The three included Profile inputs are synthetic-scenario public projections generated by three Lab incubators and copied here for self-contained review.",
  ],
};
entries.set("REVIEW_INVENTORY.json", Buffer.from(`${JSON.stringify(inventory, null, 2)}\n`, "utf8"));

const manifest = [...entries]
  .sort(([left], [right]) => codePointCompare(left, right))
  .map(([path, bytes]) => `${sha256(bytes)}  ${path}\n`)
  .join("");
entries.set("REVIEW_MANIFEST.sha256", Buffer.from(manifest, "utf8"));

const orderedEntries = [...entries]
  .sort(([left], [right]) => codePointCompare(left, right))
  .map(([path, bytes]) => ({ path, bytes, mode: path === "bin/codex-workprint.js" ? 0o100755 : 0o100644 }));
const archive = createStoredZip(orderedEntries);
await mkdir(outputDirectory, { recursive: true });
await writeFile(archivePath, archive);
const archiveSha256 = sha256(archive);
await writeFile(`${archivePath}.sha256`, `${archiveSha256}  ${archiveName}\n`, "utf8");

process.stdout.write(`EXPERT_REVIEW_PACKAGE ${relative(root, archivePath).replaceAll("\\", "/")}\n`);
process.stdout.write(`FILES ${orderedEntries.length}\n`);
process.stdout.write(`BYTES ${archive.length}\n`);
process.stdout.write(`SHA256 ${archiveSha256}\n`);

async function walk(directory) {
  const paths = [];
  const visit = async (current) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (excludedSegments.has(entry.name)) continue;
      const absolute = join(current, entry.name);
      const path = relative(root, absolute).replaceAll("\\", "/");
      if (entry.isDirectory()) {
        await visit(absolute);
      } else {
        const info = await lstat(absolute);
        if (info.isSymbolicLink()) throw new Error(`Refusing to package symbolic link: ${path}`);
        if (!info.isFile()) throw new Error(`Refusing to package non-file: ${path}`);
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

function assertPng(bytes, width, height) {
  const magic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!bytes.subarray(0, 8).equals(magic) || bytes.readUInt32BE(16) !== width || bytes.readUInt32BE(20) !== height || bytes.length >= 1_000_000) {
    throw new Error("Triptych must be a 1200x630 PNG under 1,000,000 bytes.");
  }
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
