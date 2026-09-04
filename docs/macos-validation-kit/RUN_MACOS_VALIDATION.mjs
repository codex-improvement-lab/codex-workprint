import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { arch, release } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)));
const expected = JSON.parse(await readFile(join(root, "EXPECTED.json"), "utf8"));
const resultDirectory = join(root, "results");
let candidateVersions = null;

let temporary = null;
try {
  requireMacPreconditions();
  runNodeFile("VERIFY_PACKAGE.mjs");
  candidateVersions = await import("./src/version.ts");
  verifyCandidateVersions(candidateVersions);
  await verifyCriticalIdentities();

  await mkdir(resultDirectory);
  temporary = await mkdtemp(join(resultDirectory, "temporary macOS validation "));

  const fixtureBytes = await readFile(join(root, expected.fixture.path));
  if (sha256(fixtureBytes) !== expected.fixture.sha256) fail("fixture identity mismatch");
  const normalized = fixtureBytes.toString("utf8").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  const inputs = {
    lfOne: join(temporary, "LF one.jsonl"),
    lfTwo: join(temporary, "LF two.jsonl"),
    crlf: join(temporary, "CRLF.jsonl"),
    bom: join(temporary, "BOM.jsonl"),
  };
  await writeFile(inputs.lfOne, normalized, "utf8");
  await writeFile(inputs.lfTwo, normalized, "utf8");
  await writeFile(inputs.crlf, normalized.replace(/\n/g, "\r\n"), "utf8");
  await writeFile(inputs.bom, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(normalized, "utf8")]));

  const outputs = {};
  for (const [name, input] of Object.entries(inputs)) {
    const inspection = runCli(["inspect", input, "--json"]);
    JSON.parse(inspection.stdout);
    const output = join(temporary, `${name} output`);
    runCli([
      "build",
      input,
      "--title",
      expected.build.title,
      "--project",
      expected.build.project,
      "--release",
      expected.build.release,
      "--lang",
      expected.build.language,
      "--out",
      output,
    ]);
    runCli(["verify", output, "--json"]);
    outputs[name] = output;
  }

  const artifactNames = Object.keys(expected.build.artifacts).sort(codePointCompare);
  for (const name of artifactNames) {
    const reference = await readFile(join(outputs.lfOne, name));
    if (sha256(reference) !== expected.build.artifacts[name]) fail(`${name} differs from pinned candidate bytes`);
    for (const output of Object.values(outputs)) {
      const candidate = await readFile(join(output, name));
      if (!candidate.equals(reference)) fail(`${name} differs across LF/CRLF/BOM or repeated build`);
    }
  }

  const originalSvg = await readFile(join(outputs.lfOne, "workprint.svg"));
  await appendFile(join(outputs.lfOne, "workprint.svg"), "x", "utf8");
  const tamper = runCli(["verify", outputs.lfOne, "--json"], { allowFailure: true });
  if (tamper.status === 0) fail("tampered bundle was accepted");
  await writeFile(join(outputs.lfOne, "workprint.svg"), originalSvg);
  runCli(["verify", outputs.lfOne, "--json"]);

  const png = await readFile(join(outputs.lfOne, "share-card.png"));
  if (!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) fail("PNG signature mismatch");
  if (png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 630) fail("PNG dimensions mismatch");
  if (png.length >= 1_000_000) fail("PNG exceeds the 1,000,000-byte social-preview ceiling");

  const html = await readFile(join(outputs.lfOne, "workprint.html"), "utf8");
  if (!html.includes(expected.build.title) || !html.includes(expected.build.headline) || html.includes("\uFFFD")) {
    fail("visible Unicode title/headline contract mismatch");
  }

  const browserBundle = join(resultDirectory, "browser-bundle");
  await mkdir(browserBundle);
  for (const name of artifactNames) {
    await writeFile(join(browserBundle, name), await readFile(join(outputs.lfOne, name)));
  }

  const packageManifestSha256 = sha256(await readFile(join(root, "PACKAGE_MANIFEST.sha256")));
  const macOSVersion = runHostCommand("/usr/bin/sw_vers", ["-productVersion"]);

  const receipt = {
    schemaVersion: "codex-workprint-macos-minimal-validation/0.1",
    result: "AUTOMATED_IMPLEMENTATION_PASS",
    observedAt: new Date().toISOString(),
    host: {
      platform: process.platform,
      macOSVersion,
      darwinRelease: release(),
      architecture: arch(),
      node: process.versions.node,
      shell: basename(process.env.SHELL || "not-observed"),
      packageDirectoryBasename: basename(root),
      pathContainsSpace: root.includes(" "),
    },
    packageIdentity: {
      internalManifestSha256: packageManifestSha256,
      externalArchiveSha256: "record the adjacent ZIP sidecar in MACOS_VALIDATION_REPORT.md",
    },
    candidate: expected.candidate,
    checks: {
      packageManifest: "VERIFIED",
      criticalIdentities: "VERIFIED",
      cliInspect: "PASS",
      lfCrlfBom: "BYTE_IDENTICAL",
      repeatedBuild: "BYTE_IDENTICAL",
      windowsPinnedArtifacts: "BYTE_IDENTICAL",
      untouchedVerify: "PASS",
      tamperVerify: "REJECTED",
      png: `PNG_1200x630_${png.length}_BYTES`,
      unicodeTitleAndHeadline: "PRESENT",
    },
    publicOutput: {
      directory: "results/browser-bundle",
      shapeSha256: expected.build.shapeSha256,
      publicIrSha256: expected.build.publicIrSha256,
      artifactSha256: expected.build.artifacts,
    },
    browser: {
      status: "PENDING_MANUAL",
      instructions: "Complete MACOS_VALIDATION_REPORT.md using Safari or Chrome at desktop and 390x844.",
    },
    claimCeiling: "This automated result establishes implementation semantics and pinned public bytes on the named physical Darwin host. It is not a complete macOS validation until the browser checklist is recorded, and it does not establish source authenticity, task correctness, human comprehension, production behavior, user success, adoption, or market demand.",
  };
  await writeFile(join(resultDirectory, "AUTOMATED_RECEIPT.json"), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");

  process.stdout.write("MACOS_AUTOMATED_RESULT=PASS\n");
  process.stdout.write(`CANDIDATE=${candidateVersions.PACKAGE_VERSION}\n`);
  process.stdout.write("LF_CRLF_BOM=BYTE_IDENTICAL\n");
  process.stdout.write("DOUBLE_BUILD=BYTE_IDENTICAL\n");
  process.stdout.write("PINNED_CROSS_PLATFORM_ARTIFACTS=BYTE_IDENTICAL\n");
  process.stdout.write("TAMPER=REJECTED\n");
  process.stdout.write(`PNG=1200x630_${png.length}_BYTES\n`);
  process.stdout.write("BROWSER_RESULT=PENDING_MANUAL\n");
  process.stdout.write("NEXT=open results/browser-bundle/workprint.html\n");
} catch (error) {
  process.stderr.write(`MACOS_AUTOMATED_RESULT=FAIL: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = error instanceof Error && Number.isInteger(error.exitCode) ? error.exitCode : 1;
} finally {
  if (temporary !== null) await rm(temporary, { recursive: true, force: true });
}

function requireMacPreconditions() {
  if (process.platform !== "darwin") fail("physical Darwin host required; no macOS result recorded", 2);
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 18)) fail("Node 22.18.0 or newer required", 2);
  if (!root.includes(" ")) fail("extract the package into a path containing a space", 2);
}

function verifyCandidateVersions(versions) {
  if (
    versions.PACKAGE_VERSION !== expected.candidate.package ||
    versions.SCHEMA_VERSION !== expected.candidate.runIr ||
    versions.ADAPTER_VERSION !== expected.candidate.adapter ||
    versions.RENDERER_VERSION !== expected.candidate.renderer ||
    versions.PNG_RENDERER_VERSION !== expected.candidate.pngRenderer
  ) {
    fail("candidate version identity mismatch", 2);
  }
}

async function verifyCriticalIdentities() {
  for (const [path, identity] of Object.entries(expected.criticalFiles)) {
    const bytes = await readFile(join(root, ...path.split("/")));
    if (bytes.length !== identity.bytes || sha256(bytes) !== identity.sha256) fail(`critical identity mismatch: ${path}`, 2);
  }
}

function runNodeFile(path) {
  const result = spawnSync(process.execPath, [join(root, path)], { cwd: root, encoding: "utf8" });
  if (result.status !== 0 || !result.stdout.includes("PACKAGE_IDENTITY_VERIFIED")) fail("package manifest verification failed", 2);
}

function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, [join(root, "bin", "codex-workprint.js"), ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  if (!options.allowFailure && result.status !== 0) {
    const detail = (result.stderr || result.stdout || "CLI failed").trim().split("\n")[0];
    fail(detail);
  }
  return result;
}

function runHostCommand(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) fail(`host command failed: ${basename(command)}`);
  return result.stdout.trim();
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fail(message, code = 1) {
  const error = new Error(message);
  error.exitCode = code;
  throw error;
}

function codePointCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
