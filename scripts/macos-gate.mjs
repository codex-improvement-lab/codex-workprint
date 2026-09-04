import { appendFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { adaptCodexJsonl } from "../src/adapter/codex-jsonl-v0_1.ts";
import { PUBLIC_BUNDLE_FILES, verifyPublicBundle, writePublicBundle } from "../src/bundle.ts";
import { canonicalJson } from "../src/core/canonical.ts";

if (process.platform !== "darwin") {
  process.stderr.write("MACOS_IMPLEMENTATION_GATE=FAIL: Darwin required; no macOS result recorded.\n");
  process.exit(2);
}

const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 18)) {
  process.stderr.write("MACOS_IMPLEMENTATION_GATE=FAIL: Node 22.18.0 or newer required.\n");
  process.exit(2);
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = join(projectRoot, "tests", "fixtures", "codex-0.145.0-failure-followup.jsonl");
const lf = (await readFile(fixturePath, "utf8")).replace(/\r\n?/g, "\n");
const crlf = lf.replace(/\r?\n/g, "\r\n");
const options = { title: "macOS semantic gate" };
const lfIr = adaptCodexJsonl(lf, options).workprint;
const crlfIr = adaptCodexJsonl(crlf, options).workprint;

if (canonicalJson(lfIr) !== canonicalJson(crlfIr)) {
  process.stderr.write("MACOS_IMPLEMENTATION_GATE=FAIL: LF/CRLF public IR semantic drift.\n");
  process.exit(1);
}

const temporary = await mkdtemp(join(tmpdir(), "codex workprint macOS gate "));
if (!temporary.includes(" ") || !basename(temporary).startsWith("codex workprint macOS gate ")) {
  process.stderr.write("MACOS_IMPLEMENTATION_GATE=FAIL: safe path-with-spaces fixture unavailable.\n");
  process.exit(1);
}

try {
  const first = join(temporary, "first build");
  const second = join(temporary, "second build");
  const crlfOutput = join(temporary, "CRLF build");
  await writePublicBundle(first, lfIr);
  await writePublicBundle(second, lfIr);
  await writePublicBundle(crlfOutput, crlfIr);

  for (const name of PUBLIC_BUNDLE_FILES) {
    const one = await readFile(join(first, name));
    const two = await readFile(join(second, name));
    const lineEndingVariant = await readFile(join(crlfOutput, name));
    if (!one.equals(two) || !one.equals(lineEndingVariant)) {
      throw new Error(`${name} changed across deterministic or LF/CRLF builds.`);
    }
  }
  if (!(await verifyPublicBundle(first)).ok) throw new Error("Untouched bundle did not verify.");

  const png = await readFile(join(first, "share-card.png"));
  if (!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error("PNG signature mismatch.");
  }
  if (png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 630) {
    throw new Error("PNG dimensions are not 1200x630.");
  }

  await appendFile(join(first, "workprint.svg"), "x", "utf8");
  if ((await verifyPublicBundle(first)).ok) throw new Error("Tampered bundle was accepted.");

  process.stdout.write(`MACOS_IMPLEMENTATION_GATE=PASS\n`);
  process.stdout.write(`NODE_VERSION=${process.versions.node}\n`);
  process.stdout.write("LF_CRLF_PUBLIC_IR=BYTE_IDENTICAL\n");
  process.stdout.write("DOUBLE_BUILD=BYTE_IDENTICAL\n");
  process.stdout.write("PNG=SIGNATURE_OK_1200x630\n");
  process.stdout.write("TAMPER=REJECTED\n");
  process.stdout.write("CLAIM_CEILING=Implementation semantics on this Darwin host only; browser, real Codex input, authenticity, correctness, user, and market gates remain separate.\n");
} catch (error) {
  process.stderr.write(`MACOS_IMPLEMENTATION_GATE=FAIL: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  await rm(temporary, { recursive: true, force: true });
}
