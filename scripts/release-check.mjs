import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { adaptCodexJsonl } from "../src/adapter/codex-jsonl-v0_1.ts";
import { PUBLIC_BUNDLE_FILES, renderPublicBundle, verifyPublicBundle, writePublicBundle } from "../src/bundle.ts";
import { codePointCompare } from "../src/core/canonical.ts";
import { sha256 } from "../src/core/hash.ts";
import { assertValidWorkprintIR, WorkprintIntegrityError } from "../src/core/ir.ts";
import { createRunReceiptStory } from "../src/core/story.ts";
import { deriveRunSheetStructure } from "../src/render/run-sheet.ts";
import { createWorklineLayout } from "../src/render/workline.ts";
import { inspectBitmapCoverage, inspectShareCardBitmapCoverage, PNG_RENDERER_ID, renderShareCardPng } from "../src/render/png.ts";
import { isSupportedNodeVersion } from "../src/runtime-check.js";
import { PROFILE_BUNDLE_FILES, renderProfileBundle, verifyProfileBundle, writeProfileBundle } from "../src/profile/bundle.ts";
import { PROFILE_INPUT_SCHEMA_VERSION, PROFILE_IR_SCHEMA_VERSION, PROFILE_PNG_RENDERER_VERSION, PROFILE_VERDICTS } from "../src/profile/contract.ts";
import { adaptWorkprintProfileJson } from "../src/profile/input.ts";
import { normalizeProfileBitmapText, renderProfileTriptychPng } from "../src/profile/render/png.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nodeVersion = process.versions.node;
const checks = [];
const expectedPackageFiles = [
  "bin/codex-workprint.js",
  "dist",
  "src/runtime-check.js",
  "assets/fonts/unifont-17.0.05.hex.gz",
  "assets/fonts/OFL-1.1.txt",
  "assets/fonts/README.md",
  "schema/workprint-ir-v0.1.schema.json",
  "schema/workprint-ir-v0.2.schema.json",
  "schema/workprint-profile-v0.1.schema.json",
  "schema/workprint-profile-ir-v0.1.schema.json",
  "demo/workprint.svg",
  "examples/alternate-workprint/workprint.svg",
  "examples/unicode-run-receipt/README.md",
  "examples/first-run/input.jsonl",
  "examples/first-run/README.md",
  "examples/unicode-run-receipt/workprint/share-card.png",
  "examples/profile/README.md",
  "examples/profile/continuity-archive-migration/profile.json",
  "examples/profile/continuity-archive-migration/workprint/workprint-profile.svg",
  "examples/profile/goal-delta-offline-release/profile.json",
  "examples/profile/goal-delta-offline-release/workprint/workprint-profile.svg",
  "examples/profile/context-receipt-observation-gap/profile.json",
  "examples/profile/context-receipt-observation-gap/workprint/workprint-profile.svg",
  "docs/assets/workprint-profile-triptych.png",
  "docs/WORKPRINT_IR.md",
  "docs/PROFILE_IR.md",
  "docs/PLATFORM_SUPPORT.md",
  "README.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "SUPPORT.md",
  "RELEASE_NOTES.md",
  "LICENSE",
  "PRIVACY.md",
  "SECURITY.md",
].sort(codePointCompare);

const check = (name, condition, detail = "") => {
  if (!condition) throw new Error(`${name}${detail ? `: ${detail}` : ""}`);
  checks.push(name);
};

const readText = (path) => readFile(join(root, path), "utf8");
const readJson = async (path) => JSON.parse(await readText(path));

try {
  check("Node runtime baseline", isSupportedNodeVersion(nodeVersion), nodeVersion);

  const packageJson = await readJson("package.json");
  const agents = await readText("AGENTS.md");
  const readme = await readText("README.md");
  const changelog = await readText("CHANGELOG.md");
  const releaseNotes = await readText("RELEASE_NOTES.md");
  const releaseChecklist = await readText("RELEASE_CHECKLIST.md");
  const githubRelease = await readText("GITHUB_RELEASE.md");
  const validation = await readText("docs/VALIDATION.md");
  const macosHandoff = await readText("docs/MACOS_HANDOFF.md");
  const ci = await readText(".github/workflows/ci.yml");
  const historicalReleaseCheckLog = await readText("docs/evidence/windows/release-check-2026-08-30-rc3.txt");
  const historicalReleaseCheckCountMatch = historicalReleaseCheckLog.match(/RELEASE_CHECK PASS · (\d+) checks/);
  check("Package release-candidate version", packageJson.version === "0.3.0-rc.3");
  check("Publish is not hard-disabled", packageJson.private !== true);
  check("Package Node engine", packageJson.engines?.node === ">=22.18.0");
  check("AGENTS Node consistency", agents.includes("Node.js 22.18.0 or newer"));
  check("README Node consistency", readme.includes("Node.js 22.18.0 or newer"));
  check("Changelog release line", changelog.includes("[0.3.0-rc.3] — release candidate"));
  check("Changelog preserves 0.2 release history", changelog.includes("[0.2.0-rc.1] — release candidate"));
  check("Changelog preserves rc.3 history", changelog.includes("[0.1.0-rc.3] — release candidate"));
  check("README Run Receipt promise", readme.includes("Every agent run leaves a Workprint.") && readme.includes("No prompts. No code. No uploads.") && readme.includes("Run Receipt — the first product"));
  check("README Unified Profiles narrative", readme.includes("Three questions. One Workprint.") && readme.includes("The work has a state."));
  check("README uses three generated Profile SVGs",
    readme.includes("examples/profile/continuity-archive-migration/workprint/workprint-profile.svg") &&
    readme.includes("examples/profile/goal-delta-offline-release/workprint/workprint-profile.svg") &&
    readme.includes("examples/profile/context-receipt-observation-gap/workprint/workprint-profile.svg"));
  check("README uses deterministic profile triptych", readme.includes("docs/assets/workprint-profile-triptych.png"));
  check("README hero is real demo", readme.includes('src="demo/workprint.svg"'));
  check("README compares two real SVG shapes", readme.includes('src="examples/alternate-workprint/workprint.svg"') && readme.includes("Two real runs. Two different shapes."));
  check("README documents copy-independent shape identity", readme.includes("Shape identity is separate from public copy"));
  check("README explains Run Sheet layers", readme.includes("A Run Sheet, not a widget") && readme.includes("serpentine Workline") && readme.includes("native vertical route"));
  check("Release notes candidate consistency", releaseNotes.includes("0.3.0-rc.3 release candidate") && releaseNotes.includes("439/439 release checks"));
  check("GitHub runbook candidate consistency", githubRelease.includes("v0.3.0-rc.3") && githubRelease.includes("Codex Workprint 0.3.0-rc.3") && githubRelease.includes("756798 bytes"));
  check("Validation test count consistency", validation.includes("46/46") && validation.includes("439/439 checks"));
  check("Release checklist candidate consistency", releaseChecklist.includes("0.3.0-rc.3") && releaseChecklist.includes("46/46 current Run and Profile tests") && releaseChecklist.includes("439/439 checks"));
  check("Historical rc.3 release-check receipt remains PASS", historicalReleaseCheckCountMatch !== null && historicalReleaseCheckLog.includes("RECORDED_EXIT_CODE=0"));
  const recordedReleaseChecks = Number(historicalReleaseCheckCountMatch?.[1] ?? -1);
  check("macOS handoff preserves historical rc.3 identities", macosHandoff.includes("0.1.0-rc.3") && macosHandoff.includes("workline-0.3.0") && macosHandoff.includes("workprint-png-v3/stored-deflate/bitmap-5x7"));
  check("macOS handoff names current unobserved candidate", macosHandoff.includes("0.3.0-rc.3") && macosHandoff.includes("workline-0.4.2") && macosHandoff.includes(PNG_RENDERER_ID));
  check("macOS rc.2 result stays historical", macosHandoff.includes("Historical rc.2 result — not rc.3 PASS"));
  check("Local packing is separate from publication", validation.includes("pnpm pack") && validation.includes("publication"));
  check("CI Windows matrix", ci.includes("windows-latest"));
  check("CI macOS matrix", ci.includes("macos-latest"));
  check("CI Node 22 matrix", ci.includes("'22.x'"));
  check("CI Node 24 matrix", ci.includes("'24.x'"));
  check("CI has no dependency install side effect", !/npm\s+(install|ci)\b/.test(ci));
  check("CI package check does not publish", ci.includes("npm pack --dry-run --ignore-scripts"));

  for (const required of [
    ".gitattributes", "AGENTS.md", "README.md", "LICENSE", "CHANGELOG.md", "PRIVACY.md", "SECURITY.md", "SUPPORT.md", "GITHUB_RELEASE.md",
    "RELEASE_CHECKLIST.md", "RELEASE_NOTES.md", "schema/workprint-ir-v0.1.schema.json", "schema/workprint-ir-v0.2.schema.json",
    "assets/fonts/unifont-17.0.05.hex.gz", "assets/fonts/OFL-1.1.txt", "assets/fonts/README.md",
    "schema/workprint-profile-v0.1.schema.json", "schema/workprint-profile-ir-v0.1.schema.json",
    ".github/dependabot.yml", ".github/PULL_REQUEST_TEMPLATE.md", ".github/ISSUE_TEMPLATE/config.yml",
    ".github/ISSUE_TEMPLATE/bug_report.yml", ".github/ISSUE_TEMPLATE/feature_request.yml",
    "docs/releases/0.1.0-rc.1.md",
    "docs/MACOS_HANDOFF.md", "docs/PLATFORM_SUPPORT.md", "docs/VALIDATION.md", "docs/PROFILE_IR.md",
    "docs/evidence/real-runs-2026-08-29.json", "docs/evidence/browser/qa-receipt-2026-08-29.json",
    "docs/evidence/browser/README.md", "docs/evidence/windows/validation-receipt-2026-08-29.json",
    "docs/evidence/browser/workprint-desktop-viewport-1440x900.jpg",
    "docs/evidence/browser/workprint-narrow-viewport-390x844.jpg",
    "docs/evidence/real-runs-2026-08-30.json", "docs/evidence/browser/qa-receipt-2026-08-30.json",
    "docs/evidence/windows/validation-receipt-2026-08-30.json",
    "docs/evidence/browser/workprint-desktop-viewport-1440x900-2026-08-30.jpg",
    "docs/evidence/browser/workprint-narrow-viewport-390x844-2026-08-30.jpg",
    "docs/evidence/real-runs-2026-08-30-rc3.json", "docs/evidence/browser/qa-receipt-2026-08-30-rc3.json",
    "docs/evidence/windows/validation-receipt-2026-08-30-rc3.json",
    "docs/evidence/windows/node-test-2026-08-30-rc3.txt",
    "docs/evidence/windows/demo-verify-2026-08-30-rc3.txt",
    "docs/evidence/windows/release-check-2026-08-30-rc3.txt",
    "docs/evidence/windows/macos-gate-refusal-2026-08-30-rc3.txt",
    "docs/evidence/browser/workprint-desktop-viewport-1440x900-2026-08-30-rc3.jpg",
    "docs/evidence/browser/workprint-narrow-viewport-390x844-2026-08-30-rc3.jpg",
    "docs/evidence/browser/profile-qa-receipt-2026-08-30-0.2.0-rc.1.json",
    "docs/evidence/browser/profile-continuity-desktop-1440x900-2026-08-30.jpg",
    "docs/evidence/browser/profile-continuity-narrow-390x844-2026-08-30.jpg",
    "docs/evidence/browser/profile-goal-delta-desktop-1440x900-2026-08-30.jpg",
    "docs/evidence/browser/profile-goal-delta-narrow-390x844-2026-08-30.jpg",
    "docs/evidence/browser/profile-context-receipt-desktop-1440x900-2026-08-30.jpg",
    "docs/evidence/browser/profile-context-receipt-narrow-390x844-2026-08-30.jpg",
    "docs/evidence/real-runs-2026-08-30-0.3.0-rc.1.json",
    "docs/evidence/browser/run-receipt-qa-receipt-2026-08-30-0.3.0-rc.1.json",
    "docs/evidence/browser/run-receipt-desktop-1440x900-2026-08-30-0.3.0-rc.1.jpg",
    "docs/evidence/browser/run-receipt-narrow-390x844-2026-08-30-0.3.0-rc.1.jpg",
    "docs/evidence/browser/unicode-run-receipt-desktop-1440x900-2026-08-30-0.3.0-rc.1.jpg",
    "docs/evidence/browser/unicode-run-receipt-narrow-390x844-2026-08-30-0.3.0-rc.1.jpg",
    "docs/evidence/real-runs-2026-09-05-0.3.0-rc.3.json",
    "docs/evidence/browser/run-receipt-qa-receipt-2026-09-05-0.3.0-rc.3.json",
    "docs/evidence/browser/run-receipt-desktop-1440x900-2026-09-05-0.3.0-rc.3.jpg",
    "docs/evidence/browser/run-receipt-narrow-390x844-2026-09-05-0.3.0-rc.3.jpg",
    "docs/evidence/browser/unicode-run-receipt-desktop-1440x900-2026-09-05-0.3.0-rc.3.jpg",
    "docs/evidence/browser/unicode-run-receipt-narrow-390x844-2026-09-05-0.3.0-rc.3.jpg",
    "docs/evidence/browser/copy-fallback-desktop-1440x900-2026-09-05-0.3.0-rc.3.jpg",
    "docs/evidence/browser/copy-fallback-narrow-390x844-2026-09-05-0.3.0-rc.3.jpg",
    "docs/assets/github-social-preview.png",
    "docs/assets/workprint-profile-triptych.png",
    "examples/unicode-run-receipt/README.md",
    "examples/unicode-run-receipt/workprint/MANIFEST.sha256",
    "examples/unicode-run-receipt/workprint/embed.md",
    "examples/unicode-run-receipt/workprint/privacy-receipt.json",
    "examples/unicode-run-receipt/workprint/share-card.png",
    "examples/unicode-run-receipt/workprint/workprint.html",
    "examples/unicode-run-receipt/workprint/workprint.json",
    "examples/unicode-run-receipt/workprint/workprint.svg",
    "examples/profile/README.md",
    "examples/profile/continuity-archive-migration/profile.json",
    "examples/profile/continuity-archive-migration/workprint/MANIFEST.sha256",
    "examples/profile/continuity-archive-migration/workprint/embed.md",
    "examples/profile/continuity-archive-migration/workprint/profile-receipt.json",
    "examples/profile/continuity-archive-migration/workprint/share-card.png",
    "examples/profile/continuity-archive-migration/workprint/workprint-profile.html",
    "examples/profile/continuity-archive-migration/workprint/workprint-profile.json",
    "examples/profile/continuity-archive-migration/workprint/workprint-profile.svg",
    "examples/profile/goal-delta-offline-release/profile.json",
    "examples/profile/goal-delta-offline-release/workprint/MANIFEST.sha256",
    "examples/profile/goal-delta-offline-release/workprint/embed.md",
    "examples/profile/goal-delta-offline-release/workprint/profile-receipt.json",
    "examples/profile/goal-delta-offline-release/workprint/share-card.png",
    "examples/profile/goal-delta-offline-release/workprint/workprint-profile.html",
    "examples/profile/goal-delta-offline-release/workprint/workprint-profile.json",
    "examples/profile/goal-delta-offline-release/workprint/workprint-profile.svg",
    "examples/profile/context-receipt-observation-gap/profile.json",
    "examples/profile/context-receipt-observation-gap/workprint/MANIFEST.sha256",
    "examples/profile/context-receipt-observation-gap/workprint/embed.md",
    "examples/profile/context-receipt-observation-gap/workprint/profile-receipt.json",
    "examples/profile/context-receipt-observation-gap/workprint/share-card.png",
    "examples/profile/context-receipt-observation-gap/workprint/workprint-profile.html",
    "examples/profile/context-receipt-observation-gap/workprint/workprint-profile.json",
    "examples/profile/context-receipt-observation-gap/workprint/workprint-profile.svg",
    "bin/codex-workprint.js", "src/cli.ts", "src/runtime-check.js", "src/core/story.ts", "tests/runtime-preflight.test.js",
  ]) {
    check(`Required file ${required}`, (await stat(join(root, required))).isFile());
  }
  const historicalSchemaBytes = await readFile(join(root, "schema", "workprint-ir-v0.1.schema.json"));
  const historicalSchema = JSON.parse(historicalSchemaBytes.toString("utf8"));
  const schema = await readJson("schema/workprint-ir-v0.2.schema.json");
  check("Historical Run IR 0.1 schema byte identity", historicalSchemaBytes.length === 4931 && sha256(historicalSchemaBytes) === "fceb913482d1046701dd0fb02960978a3e0066d5f705e16562d4335eba4c0299");
  check("Historical Run IR 0.1 has no public identity mutation", historicalSchema.$id === "urn:codex-workprint:schema:0.1" && historicalSchema.properties.run.properties.publicIdentity === undefined);
  check("Current Run IR schema identity", schema.$id === "urn:codex-workprint:schema:0.2" && schema.properties.schemaVersion.const === "0.2");
  check("Current Run IR schema requires shape digest", schema.properties.source.required.includes("shapeSha256"));
  check("Current Run IR schema requires strict public identity", schema.properties.run.required.includes("publicIdentity") && schema.properties.run.properties.publicIdentity.additionalProperties === false && JSON.stringify(Object.keys(schema.properties.run.properties.publicIdentity.properties).sort(codePointCompare)) === JSON.stringify(["by", "language", "project", "publicUrl", "release"].sort(codePointCompare)));
  const profileInputSchema = await readJson("schema/workprint-profile-v0.1.schema.json");
  const profileIrSchema = await readJson("schema/workprint-profile-ir-v0.1.schema.json");
  check("Profile input schema identity", profileInputSchema.$id === "urn:codex-workprint:profile-input:0.1" && profileInputSchema.properties.schemaVersion.const === PROFILE_INPUT_SCHEMA_VERSION);
  check("Profile input schema has exactly three profiles", JSON.stringify(profileInputSchema.properties.profile.enum) === JSON.stringify(["continuity", "goal-delta", "context-receipt"]));
  check("Profile IR schema identity", profileIrSchema.$id === "urn:codex-workprint:profile-ir:0.1" && profileIrSchema.properties.schemaVersion.const === PROFILE_IR_SCHEMA_VERSION);
  check("Profile IR schema has distinct artifact type", profileIrSchema.properties.artifact.const === "codex-workprint-profile");
  check("Profile IR schema fixes renderer", profileIrSchema.properties.render.properties.pngRenderer.const === PROFILE_PNG_RENDERER_VERSION);
  check("Package allowlist is explicit and minimal", JSON.stringify([...packageJson.files].sort(codePointCompare)) === JSON.stringify(expectedPackageFiles));
  check("Package contains JavaScript runtime and both Run schemas", packageJson.files.includes("bin/codex-workprint.js") && packageJson.files.includes("dist") && packageJson.files.includes("src/runtime-check.js") && packageJson.files.includes("schema/workprint-ir-v0.1.schema.json") && packageJson.files.includes("schema/workprint-ir-v0.2.schema.json"));
  check("Package contains deterministic Unicode renderer assets", packageJson.files.includes("assets/fonts/unifont-17.0.05.hex.gz") && packageJson.files.includes("assets/fonts/OFL-1.1.txt") && packageJson.files.includes("assets/fonts/README.md"));
  check("Package contains Unicode Run Receipt proof", packageJson.files.includes("examples/unicode-run-receipt/README.md") && packageJson.files.includes("examples/unicode-run-receipt/workprint/share-card.png"));
  check("Package contains Profile schemas and docs", packageJson.files.includes("schema/workprint-profile-v0.1.schema.json") && packageJson.files.includes("schema/workprint-profile-ir-v0.1.schema.json") && packageJson.files.includes("docs/PROFILE_IR.md"));
  check("Package contains self-contained Profile inputs", ["continuity-archive-migration", "goal-delta-offline-release", "context-receipt-observation-gap"].every((name) => packageJson.files.includes(`examples/profile/${name}/profile.json`)));
  check("Package contains README Profile visuals", ["continuity-archive-migration", "goal-delta-offline-release", "context-receipt-observation-gap"].every((name) => packageJson.files.includes(`examples/profile/${name}/workprint/workprint-profile.svg`)) && packageJson.files.includes("docs/assets/workprint-profile-triptych.png"));
  check("Package allowlist excludes evidence", packageJson.files.every((entry) => entry !== "docs" && !entry.startsWith("docs/evidence") && !entry.includes("evidence/")));
  check("Package allowlist has no broad glob", packageJson.files.every((entry) => !entry.includes("*") && !entry.endsWith("/")));
  for (const keyword of ["coding-agent", "developer-tools", "workflow-visualization", "svg", "cli"]) {
    check(`Package keyword ${keyword}`, packageJson.keywords.includes(keyword));
  }
  const ignore = await readText(".gitignore");
  check("Private real runs ignored", ignore.includes(".workprint-private/"));
  check("Local audit ignored", ignore.includes("._audit/"));

  const demoReport = await verifyPublicBundle(join(root, "demo"));
  check("Hero demo deterministic bundle", demoReport.ok, demoReport.errors.join(" "));
  const alternateReport = await verifyPublicBundle(join(root, "examples", "alternate-workprint"));
  check("Alternate demo deterministic bundle", alternateReport.ok, alternateReport.errors.join(" "));
  const unicodeReport = await verifyPublicBundle(join(root, "examples", "unicode-run-receipt", "workprint"));
  check("Unicode Run Receipt deterministic bundle", unicodeReport.ok && unicodeReport.checkedFiles.length === PUBLIC_BUNDLE_FILES.length, unicodeReport.errors.join(" "));
  const profileExamples = [
    { name: "continuity-archive-migration", profile: "continuity", form: "seam" },
    { name: "goal-delta-offline-release", profile: "goal-delta", form: "fault" },
    { name: "context-receipt-observation-gap", profile: "context-receipt", form: "slice" },
  ];
  const compiledProfiles = [];
  for (const example of profileExamples) {
    const input = await readText(`examples/profile/${example.name}/profile.json`);
    const adapted = adaptWorkprintProfileJson(input);
    compiledProfiles.push(adapted.profile);
    check(`Profile ${example.profile} input identity`, adapted.profile.profile === example.profile && adapted.profile.visualForm === example.form);
    check(`Profile ${example.profile} finite verdicts`, adapted.profile.findings.every((finding) => PROFILE_VERDICTS[adapted.profile.profile].includes(finding.verdict)));
    check(`Profile ${example.profile} source references resolve`, adapted.profile.findings.every((finding) => finding.sourceRefs.every((reference) => adapted.profile.sources.some((source) => source.id === reference))));
    const report = await verifyProfileBundle(join(root, "examples", "profile", example.name, "workprint"));
    check(`Profile ${example.profile} deterministic 7-file bundle`, report.ok && report.checkedFiles.length === PROFILE_BUNDLE_FILES.length, report.errors.join(" "));
    const profileHtml = await readText(`examples/profile/${example.name}/workprint/workprint-profile.html`);
    const profileSvg = await readText(`examples/profile/${example.name}/workprint/workprint-profile.svg`);
    const profilePng = await readFile(join(root, "examples", "profile", example.name, "workprint", "share-card.png"));
    check(`Profile ${example.profile} HTML is offline`, profileHtml.includes("connect-src 'none'") && !/(?:src|href)=["']https?:\/\//i.test(profileHtml) && !/\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/.test(profileHtml));
    check(`Profile ${example.profile} finding-source interaction`, profileHtml.includes("data-finding-id") && profileHtml.includes("data-source-id") && profileHtml.includes("traceSourceCount") && profileHtml.includes("traceFindingCount"));
    check(`Profile ${example.profile} visual signature`, profileSvg.includes(example.form.toUpperCase()) && profileSvg.includes("SOURCE EVIDENCE RAIL"));
    check(`Profile ${example.profile} PNG signature`, profilePng.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
    check(`Profile ${example.profile} PNG 1200x630`, profilePng.readUInt32BE(16) === 1200 && profilePng.readUInt32BE(20) === 630);
    const expected = renderProfileBundle(adapted.profile);
    for (const file of PROFILE_BUNDLE_FILES) {
      check(`Profile ${example.profile} generated ${file}`, (await readFile(join(root, "examples", "profile", example.name, "workprint", file))).equals(Buffer.from(expected.get(file))));
    }
  }
  check("Three Profile IR digests differ", new Set(compiledProfiles.map((profile) => profile.source.profileIrSha256)).size === 3);
  check("Run verifier rejects Profile bundle", !(await verifyPublicBundle(join(root, "examples", "profile", profileExamples[0].name, "workprint"))).ok);
  check("Profile verifier rejects Run bundle", !(await verifyProfileBundle(join(root, "demo"))).ok);
  const whitelistInput = JSON.parse(await readText("examples/profile/continuity-archive-migration/profile.json"));
  const whitelistBaseline = adaptWorkprintProfileJson(JSON.stringify(whitelistInput));
  whitelistInput.futureRoot = "PROFILE_EXTENSION_MUST_NOT_PUBLISH_7D";
  whitelistInput.sources[0].futureSource = "PROFILE_SOURCE_EXTENSION_7D";
  whitelistInput.findings[0].futureFinding = "PROFILE_FINDING_EXTENSION_7D";
  whitelistInput.summary.futureSummary = "PROFILE_SUMMARY_EXTENSION_7D";
  whitelistInput.summary.counts.futureCount = 700;
  const whitelistExtended = adaptWorkprintProfileJson(JSON.stringify(whitelistInput));
  check("Unknown Profile extensions are observed by inspect", whitelistExtended.inspection.ignoredExtensionFields >= whitelistBaseline.inspection.ignoredExtensionFields + 5);
  check("Unknown Profile extensions leave Profile IR unchanged", JSON.stringify(whitelistExtended.profile) === JSON.stringify(whitelistBaseline.profile));
  const whitelistBundle = renderProfileBundle(whitelistExtended.profile);
  check("Unknown Profile extension values absent from bundle", [...whitelistBundle.values()].every((bytes) => !Buffer.from(bytes).includes(Buffer.from("PROFILE_EXTENSION"))));
  const heroIr = await readJson("demo/workprint.json");
  const alternateIr = await readJson("examples/alternate-workprint/workprint.json");
  check("Real demo public IRs differ", heroIr.source.publicIrSha256 !== alternateIr.source.publicIrSha256);
  check("Real demo shape identities differ", heroIr.source.shapeSha256 !== alternateIr.source.shapeSha256);
  check("Hero shape identity format", /^[a-f0-9]{64}$/.test(heroIr.source.shapeSha256));
  check("Alternate shape identity format", /^[a-f0-9]{64}$/.test(alternateIr.source.shapeSha256));
  check("Real demo observation shapes differ", JSON.stringify(heroIr.observations) !== JSON.stringify(alternateIr.observations));
  check("Hero preserves observed failed item", heroIr.summary.itemFailed >= 1);
  check("Hero claim stays relational", heroIr.summary.completionAfterObservedFailure >= 1 && heroIr.summary.publicRecover === 0);
  check("Raw input hash absent from hero", !("inputSha256" in heroIr.source) && heroIr.privacy.rawInputHashPublished === false);
  check("Hero Run IR and renderer v5", heroIr.schemaVersion === "0.2" && heroIr.render.rendererVersion === "workline-0.4.2" && heroIr.render.pngRenderer === PNG_RENDERER_ID && PNG_RENDERER_ID === "workprint-png-v5/indexed-stored-deflate/unifont-17.0.05");
  check("Current verifier accepts Run IR 0.2", (() => { try { assertValidWorkprintIR(heroIr); return true; } catch { return false; } })());
  check("Current verifier explicitly rejects legacy Run IR 0.1", (() => { try { assertValidWorkprintIR({ ...heroIr, schemaVersion: "0.1" }); return false; } catch (error) { return error instanceof WorkprintIntegrityError && error.message.includes("Legacy Workprint IR 0.1"); } })());
  check("Hero has explicit opt-in release identity", heroIr.run.publicIdentity?.project === "Codex Workprint" && heroIr.run.publicIdentity?.release === packageJson.version && heroIr.run.publicIdentity?.language === "en" && heroIr.run.publicIdentity?.by === null && heroIr.run.publicIdentity?.publicUrl === null);
  const heroStructure = deriveRunSheetStructure(heroIr);
  check("Hero item histories are paired without raw IDs", heroStructure.pairedItemCount === 3 && heroStructure.openItemCount === 0 && heroStructure.itemThreads.every((thread) => /^item-\d+$/.test(thread.itemId)));
  check("Hero turn range is observed", heroStructure.turnRanges.length === 1 && heroStructure.turnRanges[0].completedSequence !== null);
  check("Hero turning points are bounded", heroStructure.moments.length <= 3 && heroStructure.moments.some((moment) => moment.kind === "failure") && heroStructure.moments.some((moment) => moment.kind === "later-completion"));
  const copyFixture = await readText("tests/fixtures/codex-0.145.0-failure-followup.jsonl");
  const copyA = adaptCodexJsonl(copyFixture, { title: "First public title", labels: ["A"] }).workprint;
  const copyB = adaptCodexJsonl(copyFixture, {
    title: "Different public title",
    labels: ["B"],
    annotations: [{ sequence: 5, phase: "verify", label: "Reviewed label" }],
    project: "Public project",
    by: "Public author",
    release: "review-candidate",
    publicUrl: "https://example.com/workprint",
    language: "en-GB",
  }).workprint;
  check("Public copy leaves shape identity stable", copyA.source.shapeSha256 === copyB.source.shapeSha256);
  check("Public copy changes full public IR", copyA.source.publicIrSha256 !== copyB.source.publicIrSha256);
  check("Public copy leaves Workline geometry stable", geometrySignature(copyA) === geometrySignature(copyB));
  check("Opt-in public identity is shape-inert", copyA.source.shapeSha256 === copyB.source.shapeSha256 && copyB.run.publicIdentity?.project === "Public project" && copyB.run.publicIdentity?.by === "Public author");
  check("Public URL query strings fail closed", (() => { try { adaptCodexJsonl(copyFixture, { title: "Query attack", publicUrl: "https://example.com/workprint?token=SECRET" }); return false; } catch (error) { return error instanceof Error && /query string/i.test(error.message); } })());
  const longWorkprint = adaptCodexJsonl(makeLongRunInput(20), { title: "Long release gate" }).workprint;
  const longLayout = createWorklineLayout(longWorkprint, 1040, 480, 12);
  check("Long Run Sheet keeps every observation", longLayout.points.length === 43 && longLayout.segments.length === 42);
  check("Long Run Sheet folds deterministically", longLayout.rows === 4 && longLayout.segments.filter((segment) => segment.folded).length === 3);
  check("Long Run Sheet keeps item and turn structure", longLayout.itemStitches.length === 20 && longLayout.itemStitches.every((stitch) => stitch.terminalObserved) && longLayout.turnSpans.length === 1 && longLayout.turnSpans[0].terminalObserved);
  const historicalRealRunReceipt = await readJson("docs/evidence/real-runs-2026-08-30-rc3.json");
  check("Historical rc.3 real-run receipt candidate", historicalRealRunReceipt.candidate === "0.1.0-rc.3");
  check("Historical rc.3 real-run receipt remains bounded", historicalRealRunReceipt.sourceBoundary.rawJsonlDigestPublished === false && historicalRealRunReceipt.runs.every((run) => /^[a-f0-9]{64}$/.test(run.publicIrSha256)));
  const realRunReceipt = await readJson("docs/evidence/real-runs-2026-09-05-0.3.0-rc.3.json");
  check("Current real-run receipt candidate", realRunReceipt.candidate === packageJson.version && realRunReceipt.compiler.runIrSchema === "0.2" && realRunReceipt.compiler.runRenderer === "workline-0.4.2" && realRunReceipt.compiler.pngRenderer === PNG_RENDERER_ID);
  check("Current real-run receipt publishes no raw digest", realRunReceipt.sourceBoundary.rawJsonlDigestPublished === false);
  check("Real-run receipt binds hero public IR", realRunReceipt.runs.some((run) => run.publicIrSha256 === heroIr.source.publicIrSha256));
  check("Real-run receipt binds alternate public IR", realRunReceipt.runs.some((run) => run.publicIrSha256 === alternateIr.source.publicIrSha256));
  check("Real-run receipt binds hero shape", realRunReceipt.runs.some((run) => run.shapeSha256 === heroIr.source.shapeSha256));
  check("Real-run receipt binds alternate shape", realRunReceipt.runs.some((run) => run.shapeSha256 === alternateIr.source.shapeSha256));
  const heroRunReceipt = realRunReceipt.runs.find((run) => run.publicBundle === "demo");
  const alternateRunReceipt = realRunReceipt.runs.find((run) => run.publicBundle === "examples/alternate-workprint");
  check("Real-run receipt artifact hashes current",
    heroRunReceipt?.manifestSha256 === sha256(await readFile(join(root, "demo", "MANIFEST.sha256"))) &&
    heroRunReceipt?.svgSha256 === sha256(await readFile(join(root, "demo", "workprint.svg"))) &&
    heroRunReceipt?.shareCardSha256 === sha256(await readFile(join(root, "demo", "share-card.png"))) &&
    alternateRunReceipt?.manifestSha256 === sha256(await readFile(join(root, "examples", "alternate-workprint", "MANIFEST.sha256"))) &&
    alternateRunReceipt?.svgSha256 === sha256(await readFile(join(root, "examples", "alternate-workprint", "workprint.svg"))) &&
    alternateRunReceipt?.shareCardSha256 === sha256(await readFile(join(root, "examples", "alternate-workprint", "share-card.png")))
  );

  const png = await readFile(join(root, "demo", "share-card.png"));
  check("PNG signature", png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
  check("PNG 1200x630", png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630);
  check("Run share card uses fixed indexed palette", png[25] === 3);
  check("Run share card strictly below 1000000 bytes", png.length < 1_000_000, String(png.length));
  check("Run share card deterministic bytes", png.equals(Buffer.from(renderShareCardPng(heroIr))));
  const socialPreview = await readFile(join(root, "docs", "assets", "github-social-preview.png"));
  check("GitHub social preview PNG signature", socialPreview.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
  check("GitHub social preview 1200x630", socialPreview.readUInt32BE(16) === 1200 && socialPreview.readUInt32BE(20) === 630);
  check("GitHub social preview strictly below 1000000 bytes", socialPreview.length < 1_000_000, String(socialPreview.length));
  check("GitHub social preview uses fixed indexed palette", socialPreview[25] === 3);
  check("GitHub social preview is the product share card", socialPreview.equals(png));
  const unicodeIr = await readJson("examples/unicode-run-receipt/workprint/workprint.json");
  const unicodePng = await readFile(join(root, "examples", "unicode-run-receipt", "workprint", "share-card.png"));
  check("Unicode Run Receipt title identity", unicodeIr.run.publicTitle === "修复登录失败并验证发布" && unicodeIr.run.publicIdentity?.language === "zh-Hans");
  check("Unicode share card PNG contract", unicodePng.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && unicodePng.readUInt32BE(16) === 1200 && unicodePng.readUInt32BE(20) === 630 && unicodePng[25] === 3 && unicodePng.length < 1_000_000);
  check("Unicode share card deterministic bytes", unicodePng.equals(Buffer.from(renderShareCardPng(unicodeIr))));
  const unicodeCoverage = inspectBitmapCoverage(unicodeIr.run.publicTitle);
  check("Unicode public title has complete fixed-font coverage", unicodeCoverage.characters === 11 && unicodeCoverage.supported === 11 && unicodeCoverage.missingCodePoints.length === 0);
  const unifontBytes = await readFile(join(root, "assets", "fonts", "unifont-17.0.05.hex.gz"));
  const oflBytes = await readFile(join(root, "assets", "fonts", "OFL-1.1.txt"));
  check("Fixed Unifont asset identity", unifontBytes.length === 936609 && sha256(unifontBytes) === "2ae5311c8e123e9e85f5331cd012aa99757071df23243f1487fdbf8f3acd86be");
  check("Bundled OFL identity", oflBytes.length === 4340 && sha256(oflBytes) === "869692af094c57fb7258c57fe26820c759319603321d0ffeb278de3651763ded");
  const story = createRunReceiptStory(heroIr);
  check("Run Receipt story is bounded and deterministic", story.headline === "1 failed item → 1 later completion" && story.detail === "12 public observations · 0 items left open · 3 status-absent observations · 8 private categories excluded" && story.shapeName === "CORAL TRACE · 21FC" && story.openItemCount === 0 && story.statusAbsentObservationCount === 3 && story.excludedCategoryCount === 8);
  check("Run Receipt caption remains a receipt claim", /receipt, not attestation/i.test(story.caption) && !/authentic|correct|recovered/i.test(story.caption));
  check("Native-share text excludes URL duplication", !story.shareText.includes("https://") && story.caption === story.shareText);
  check("Run share-card public glyph coverage", inspectShareCardBitmapCoverage(heroIr).supported && inspectShareCardBitmapCoverage(unicodeIr).supported);
  const profileTriptych = await readFile(join(root, "docs", "assets", "workprint-profile-triptych.png"));
  check("Profile triptych PNG signature", profileTriptych.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
  check("Profile triptych 1200x630", profileTriptych.readUInt32BE(16) === 1200 && profileTriptych.readUInt32BE(20) === 630);
  check("Profile triptych strictly below 1000000 bytes", profileTriptych.length < 1_000_000, String(profileTriptych.length));
  check("Profile triptych uses fixed indexed palette", profileTriptych[25] === 3);
  check("Profile triptych deterministic bytes", profileTriptych.equals(Buffer.from(renderProfileTriptychPng(compiledProfiles))));
  check("Profile bitmap punctuation normalization", normalizeProfileBitmapText("Handoff Receipt · Archive — r2") === "HANDOFF RECEIPT / ARCHIVE - R2");
  const historicalBrowserReceipt = await readJson("docs/evidence/browser/qa-receipt-2026-08-30-rc3.json");
  check("Historical rc.3 browser receipt remains historical", historicalBrowserReceipt.candidate === "0.1.0-rc.3" && historicalBrowserReceipt.artifact.rendererVersion === "workline-0.3.0");
  const browserReceipt = await readJson("docs/evidence/browser/run-receipt-qa-receipt-2026-09-05-0.3.0-rc.3.json");
  check("Current Run Receipt browser candidate", browserReceipt.schemaVersion === "workprint-run-receipt-browser-qa/0.2" && browserReceipt.candidate === packageJson.version);
  check("Current Run Receipt browser aggregate", browserReceipt.aggregate.artifactsChecked === 2 && browserReceipt.aggregate.viewportChecks === 5 && browserReceipt.aggregate.screenshots === 7);
  check("Current Run Receipt browser aggregate clean", browserReceipt.aggregate.horizontalOverflowFailures === 0 && browserReceipt.aggregate.visibleOutOfViewportElements === 0 && browserReceipt.aggregate.consoleErrorsAndWarnings === 0 && browserReceipt.aggregate.remoteAssetUrls === 0 && browserReceipt.aggregate.replacementCharactersInUnicodeTitle === 0 && browserReceipt.aggregate.shareCardMissingGlyphFields === 0 && browserReceipt.aggregate.visibleFallbackViewportFailures === 0 && browserReceipt.aggregate.buttonTextOverflow === 0);
  const intermediate = browserReceipt.extraViewports.find((view) => view.observedPageViewport.width === 1280);
  check("1280px action-label regression bound", intermediate?.buttonTextOverflow.length === 0 && intermediate.horizontalOverflow === false && intermediate.screenshot.sha256 === sha256(await readFile(join(root, intermediate.screenshot.path))));
  const runBrowserArtifact = browserReceipt.artifacts.find((artifact) => artifact.id === "run-receipt");
  const unicodeBrowserArtifact = browserReceipt.artifacts.find((artifact) => artifact.id === "unicode-run-receipt");
  check("Run browser artifact exists", Boolean(runBrowserArtifact));
  check("Unicode browser artifact exists", Boolean(unicodeBrowserArtifact));
  check("Run browser receipt binds current artifact", runBrowserArtifact?.publicIrSha256 === heroIr.source.publicIrSha256 && runBrowserArtifact?.shapeSha256 === heroIr.source.shapeSha256 && runBrowserArtifact?.htmlSha256 === sha256(await readFile(join(root, "demo", "workprint.html"))) && runBrowserArtifact?.svgSha256 === sha256(await readFile(join(root, "demo", "workprint.svg"))) && runBrowserArtifact?.manifestSha256 === sha256(await readFile(join(root, "demo", "MANIFEST.sha256"))));
  check("Unicode browser receipt binds current artifact", unicodeBrowserArtifact?.publicIrSha256 === unicodeIr.source.publicIrSha256 && unicodeBrowserArtifact?.shapeSha256 === unicodeIr.source.shapeSha256 && unicodeBrowserArtifact?.htmlSha256 === sha256(await readFile(join(root, "examples", "unicode-run-receipt", "workprint", "workprint.html"))) && unicodeBrowserArtifact?.svgSha256 === sha256(await readFile(join(root, "examples", "unicode-run-receipt", "workprint", "workprint.svg"))) && unicodeBrowserArtifact?.manifestSha256 === sha256(await readFile(join(root, "examples", "unicode-run-receipt", "workprint", "MANIFEST.sha256"))));
  for (const observed of [runBrowserArtifact, unicodeBrowserArtifact]) {
    for (const viewportName of ["desktop", "narrow"]) {
      const screenshot = observed[viewportName].screenshot;
      const bytes = await readFile(join(root, screenshot.path));
      const dimensions = readJpegDimensions(bytes);
      check(`Run browser ${observed.id} ${viewportName} screenshot JPEG`, bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) && screenshot.actualFormat === "JPEG/JFIF");
      check(`Run browser ${observed.id} ${viewportName} screenshot digest`, bytes.length === screenshot.bytes && sha256(bytes) === screenshot.sha256);
      check(`Run browser ${observed.id} ${viewportName} screenshot dimensions`, dimensions.width === observed[viewportName].capturedPixelViewport.width && dimensions.height === observed[viewportName].capturedPixelViewport.height);
      check(`Run browser ${observed.id} ${viewportName} layout clean`, observed[viewportName].horizontalOverflow === false && observed[viewportName].visibleOutOfViewportElements === 0 && observed[viewportName].consoleErrorsAndWarnings === 0);
    }
  }
  for (const screenshot of runBrowserArtifact.interactions.copyCaptionFallback.screenshots) {
    const bytes = await readFile(join(root, screenshot.path));
    const dimensions = readJpegDimensions(bytes);
    check(`Copy fallback ${basename(screenshot.path)} screenshot JPEG`, bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) && screenshot.actualFormat === "JPEG/JFIF");
    check(`Copy fallback ${basename(screenshot.path)} screenshot digest`, bytes.length === screenshot.bytes && sha256(bytes) === screenshot.sha256);
    check(`Copy fallback ${basename(screenshot.path)} screenshot dimensions`, dimensions.width === screenshot.capturedPixelViewport.width && dimensions.height === screenshot.capturedPixelViewport.height);
  }
  check("Run browser first-screen story and privacy mark", runBrowserArtifact.desktop.storyObserved === story.headline && runBrowserArtifact.narrow.storyObserved === story.headline && runBrowserArtifact.desktop.privacyMarkObserved.includes("8 private categories") && runBrowserArtifact.narrow.hero.bottom < runBrowserArtifact.narrow.observedPageViewport.height);
  check("Run browser interactions observed", runBrowserArtifact.interactions.share.externalTransmission === false && runBrowserArtifact.interactions.share.captionLength === 185 && runBrowserArtifact.interactions.share.urlOccurrences === 0 && runBrowserArtifact.interactions.copyCaptionFallback.result === "visible-fallback" && runBrowserArtifact.interactions.copyCaptionFallback.desktopFitsViewport === true && runBrowserArtifact.interactions.copyCaptionFallback.narrowFitsViewport === true && runBrowserArtifact.interactions.verify.label === "Copy verify command" && runBrowserArtifact.interactions.verify.independentClipboardReadback === "codex-workprint verify ./workprint" && runBrowserArtifact.interactions.downloadCard.browserDownloadEventObserved === true && runBrowserArtifact.interactions.theme.paperModeObserved === true && runBrowserArtifact.interactions.theme.carbonModeRestored === true && runBrowserArtifact.interactions.replay.completed === true && runBrowserArtifact.interactions.trace.relation === "completion observed after a failed item");
  check("Run browser native narrow route", runBrowserArtifact.narrow.nativeVerticalRoute.visible === true && runBrowserArtifact.narrow.nativeVerticalRoute.desktopSvgHidden === true && runBrowserArtifact.narrow.nativeVerticalRoute.stations === heroIr.observations.length);
  check("Run bitmap headline arrow rendered without fallback", runBrowserArtifact.bitmapShareCard.headlineObserved === story.headline && runBrowserArtifact.bitmapShareCard.allVisiblePublicTextGlyphCoverage.missing === 0 && runBrowserArtifact.bitmapShareCard.replacementQuestionMarkObservedInVisualReview === false);
  check("Unicode browser exact title without replacement", unicodeBrowserArtifact.desktop.titleObservedExactly === true && unicodeBrowserArtifact.narrow.titleObservedExactly === true && unicodeBrowserArtifact.desktop.replacementCharacterObserved === false && unicodeBrowserArtifact.narrow.replacementCharacterObserved === false && unicodeBrowserArtifact.bitmapShareCard.publicTitleGlyphCoverage.missing === 0 && unicodeBrowserArtifact.bitmapShareCard.allVisiblePublicTextGlyphCoverage.missing === 0);
  check("Run browser references and CSP are local-only", browserReceipt.assetInventory.remoteAssetUrls.length === 0 && browserReceipt.assetInventory.scope === "dom-referenced-assets" && (await readText("demo/workprint.html")).includes("connect-src 'none'"));
  const profileBrowserReceipt = await readJson("docs/evidence/browser/profile-qa-receipt-2026-08-30-0.2.0-rc.1.json");
  check("Historical 0.2 Profile browser receipt candidate", profileBrowserReceipt.schemaVersion === "workprint-profile-browser-qa/0.1" && profileBrowserReceipt.candidate === "0.2.0-rc.1");
  check("Profile browser receipt aggregate", profileBrowserReceipt.aggregate.profilesChecked === 3 && profileBrowserReceipt.aggregate.viewportChecks === 6 && profileBrowserReceipt.aggregate.screenshots === 6);
  check("Profile browser receipt clean aggregate", profileBrowserReceipt.aggregate.horizontalOverflowFailures === 0 && profileBrowserReceipt.aggregate.outOfViewportElements === 0 && profileBrowserReceipt.aggregate.consoleAndPageErrors === 0 && profileBrowserReceipt.aggregate.remoteAssetUrls === 0);
  check("Profile browser receipt interaction aggregate", profileBrowserReceipt.aggregate.findingTraceInteractions === 6 && profileBrowserReceipt.aggregate.sourceTraceInteractions === 6 && profileBrowserReceipt.aggregate.themeRoundTrips === 6);
  for (const compiled of compiledProfiles) {
    const observed = profileBrowserReceipt.profiles.find((entry) => entry.profile === compiled.profile);
    check(`Profile browser ${compiled.profile} entry exists`, Boolean(observed));
    if (!observed) continue;
    const exampleName = profileExamples.find((entry) => entry.profile === compiled.profile).name;
    const profileRoot = join(root, "examples", "profile", exampleName, "workprint");
    check(`Profile browser ${compiled.profile} binds Profile IR`, observed.artifact.profileIrSha256 === compiled.source.profileIrSha256);
    check(`Profile browser ${compiled.profile} binds HTML`, observed.artifact.htmlSha256 === sha256(await readFile(join(profileRoot, "workprint-profile.html"))));
    check(`Profile browser ${compiled.profile} binds SVG`, observed.artifact.svgSha256 === sha256(await readFile(join(profileRoot, "workprint-profile.svg"))));
    check(`Profile browser ${compiled.profile} binds manifest`, observed.artifact.manifestSha256 === sha256(await readFile(join(profileRoot, "MANIFEST.sha256"))));
    check(`Profile browser ${compiled.profile} desktop viewport`, observed.desktop.initial.viewport.width === 1440 && observed.desktop.initial.viewport.height === 900 && observed.desktop.initial.scrollY === 0);
    check(`Profile browser ${compiled.profile} narrow viewport`, observed.narrow.initial.viewport.width === 390 && observed.narrow.initial.viewport.height === 844 && observed.narrow.initial.scrollY === 0);
    check(`Profile browser ${compiled.profile} responsive surfaces`, observed.desktop.initial.artifactVisible === true && observed.desktop.initial.mobileHeroVisible === false && observed.narrow.initial.artifactVisible === false && observed.narrow.initial.mobileHeroVisible === true);
    check(`Profile browser ${compiled.profile} no overflow or outliers`, observed.desktop.initial.horizontalOverflow === false && observed.narrow.initial.horizontalOverflow === false && observed.desktop.initial.outliers.length === 0 && observed.narrow.initial.outliers.length === 0);
    check(`Profile browser ${compiled.profile} console and page clean`, observed.desktop.consoleAndPageErrors === 0 && observed.narrow.consoleAndPageErrors === 0);
    check(`Profile browser ${compiled.profile} finding-source traces`, observed.desktop.findingTrace.type === "finding" && observed.desktop.sourceTrace.type === "source" && observed.narrow.findingTrace.type === "finding" && observed.narrow.sourceTrace.type === "source");
    check(`Profile browser ${compiled.profile} offline assets`, observed.assets.inlineSvgCount === 1 && observed.assets.remoteUrls.length === 0 && observed.assets.summary.totalCount === 0);
    for (const viewportName of ["desktop", "narrow"]) {
      const screenshot = observed[viewportName].screenshot;
      const bytes = await readFile(join(root, screenshot.path));
      check(`Profile browser ${compiled.profile} ${viewportName} screenshot JPEG`, bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) && screenshot.format === "jpeg");
      check(`Profile browser ${compiled.profile} ${viewportName} screenshot digest`, sha256(bytes) === screenshot.sha256 && bytes.length === screenshot.bytes);
      const dimensions = readJpegDimensions(bytes);
      check(`Profile browser ${compiled.profile} ${viewportName} screenshot dimensions`, dimensions.width === screenshot.capturedPixelWidth && dimensions.height === screenshot.capturedPixelHeight);
    }
  }
  const windowsReceipt = await readJson("docs/evidence/windows/validation-receipt-2026-08-30-rc3.json");
  check("Historical rc.3 Windows receipt candidate version", windowsReceipt.candidate.packageVersion === "0.1.0-rc.3");
  check("Windows receipt finalized", windowsReceipt.finalized === true);
  const testObservation = windowsReceipt.observations.find((entry) => entry.gate === "core unit and integration suite");
  check("Windows receipt test result", testObservation?.tests?.pass === 21 && testObservation?.tests?.fail === 0 && testObservation?.exitCode === 0);
  const nodeTestLogBytes = await readFile(join(root, "docs", "evidence", "windows", "node-test-2026-08-30-rc3.txt"));
  check("Windows receipt test log binding", testObservation?.log?.bytes === nodeTestLogBytes.length && testObservation?.log?.sha256 === sha256(nodeTestLogBytes));
  const releaseObservation = windowsReceipt.observations.find((entry) => entry.gate === "release package and evidence contract");
  check("Windows receipt release-check result", releaseObservation?.checks?.pass === recordedReleaseChecks && releaseObservation?.checks?.fail === 0 && releaseObservation?.exitCode === 0);
  const releaseCheckLogBytes = await readFile(join(root, "docs", "evidence", "windows", "release-check-2026-08-30-rc3.txt"));
  check("Windows receipt release-check log binding", releaseObservation?.log?.bytes === releaseCheckLogBytes.length && releaseObservation?.log?.sha256 === sha256(releaseCheckLogBytes));
  const demoObservation = windowsReceipt.observations.find((entry) => entry.gate === "two strict real-input public bundles");
  const demoVerifyLogBytes = await readFile(join(root, "docs", "evidence", "windows", "demo-verify-2026-08-30-rc3.txt"));
  check("Windows receipt demo log binding", demoObservation?.exitCodes?.every((code) => code === 0) && demoObservation?.log?.bytes === demoVerifyLogBytes.length && demoObservation?.log?.sha256 === sha256(demoVerifyLogBytes));
  check("Windows receipt keeps external CI unobserved", windowsReceipt.notRun.externalGitHubActions === "configured / not observed");
  check("Windows receipt keeps physical macOS pending", windowsReceipt.notRun.physicalMacos === "pending rc.3 exact Darwin handoff; rc.2 receipt is historical only");
  const html = await readText("demo/workprint.html");
  const svg = await readFile(join(root, "demo", "workprint.svg"));
  check("Browser receipt HTML digest current", sha256(Buffer.from(html, "utf8")) === runBrowserArtifact.htmlSha256);
  check("Browser receipt SVG digest current", sha256(svg) === runBrowserArtifact.svgSha256);
  check("HTML CSP blocks connections", html.includes("connect-src 'none'"));
  check("HTML has no remote asset URL", !/(?:src|href)=["']https?:\/\//i.test(html));
  check("HTML has no network API", !/\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/.test(html));
  check("HTML exposes accurately named Run Receipt actions", html.includes('id="shareTop"') && html.includes('id="downloadCard"') && html.includes('id="verifyTop"') && html.includes("Copy verify command") && html.includes('id="copyCaption"') && html.includes('id="replay"') && html.includes("Replay story"));
  check("HTML exposes visual Privacy Receipt", html.includes('id="privacyReceipt"') && html.includes("Share the work trace. Keep the work private.") && html.includes("prompts and instructions") && html.includes("raw JSONL digest"));
  check("HTML share requires explicit public URL", html.includes("data.run.publicIdentity?.publicUrl") && html.includes("if (publicUrl && typeof navigator.share === 'function')") && html.includes("Nothing was uploaded"));
  check("HTML native share keeps URL out of text", html.includes("text: nativeShareText, url: publicUrl") && !html.includes("text: caption, url: publicUrl"));
  check("HTML visible copy fallback is actionable", html.includes('id="copyFallback"') && html.includes('id="copyFallbackText"') && html.includes("Press Ctrl/Cmd+C to copy") && html.includes("long-press the text area") && html.includes("visible-fallback"));
  check("HTML Build yours command is artifact-independent", html.includes('codex exec --json &quot;&lt;your task&gt;&quot; | codex-workprint build - --title &quot;&lt;public title&gt;&quot; --out ./workprint --open') && !html.includes('build - --title &quot;Create a marker after an expected failed check&quot;'));
  check("HTML download is local deterministic card", html.includes('href="share-card.png" download') && html.includes("Downloading the deterministic local share card"));
  check("HTML honors reduced motion", html.includes("prefers-reduced-motion:reduce") && html.includes("reduced-motion"));
  check("HTML replays station by station", /station-by-station replay started/i.test(html) && html.includes("replayStep"));
  check("HTML has native narrow route", html.includes('id="mobileRunSheet"') && html.includes("Mobile Workprint sequence") && html.includes(".artifact-shell,.storyline{display:none}") && html.includes(".mobile-run-sheet{display:block"));
  check("HTML defaults to informative observation", html.includes("observation.status === 'failed'") && html.includes("observation.eventType === 'item.completed'"));
  check("HTML first screen carries fixed story", html.includes(story.headline) && html.includes(story.detail) && html.includes(story.shapeName) && html.includes("Receipt, not attestation"));
  check("HTML prints short Shape ID", html.includes(`Shape ${heroIr.source.shapeSha256.slice(0, 12).toUpperCase()}`));
  check("SVG exposes Run Sheet layers", svg.includes(Buffer.from("OBSERVED WORKLINE")) && svg.includes(Buffer.from("TURNING POINTS")) && svg.includes(Buffer.from("RUN RHYTHM / SEQUENCE, NOT TIME")) && svg.includes(Buffer.from("TURN 01 · OBSERVED RANGE")));
  const pngSource = await readText("src/render/png.ts");
  check("PNG renderer uses fail-closed fixed Unifont asset", pngSource.includes("unifont-17.0.05.hex.gz") && pngSource.includes("inspectBitmapCoverage") && pngSource.includes("inspectShareCardBitmapCoverage") && pngSource.includes("glyph coverage failed") && pngSource.includes("gunzipSync"));
  check("PNG renderer carries receipt boundary", pngSource.includes("RECEIPT / NOT ATTESTATION") && pngSource.includes("NO PROMPTS / NO CODE / NO UPLOADS"));

  check("Packaged first-run input is explicitly synthetic", packageJson.files.includes("examples/first-run/input.jsonl") && (await readText("examples/first-run/README.md")).includes("hand-authored synthetic"));
  const publicFiles = await walkPublicTree(root);
  const publicJsonl = publicFiles.filter((path) => path.endsWith(".jsonl") && !path.startsWith("tests/fixtures/") && path !== "examples/first-run/input.jsonl");
  check("No public real-run JSONL", publicJsonl.length === 0, publicJsonl.join(", "));
  const textExtensions = new Set([".js", ".mjs", ".ts", ".json", ".jsonl", ".md", ".yml", ".svg", ".sha256", ".txt", ""]);
  const whitespaceDrift = [];
  for (const path of publicFiles) {
    if (path === "assets/fonts/OFL-1.1.txt") continue;
    const extension = path.includes(".") ? path.slice(path.lastIndexOf(".")) : "";
    if (!textExtensions.has(extension)) continue;
    const text = await readText(path);
    if (text.split(/\r?\n/).some((line) => /[ \t]+$/.test(line))) whitespaceDrift.push(path);
  }
  check("Public text has no trailing whitespace", whitespaceDrift.length === 0, whitespaceDrift.join(", "));

  const fixture = await readText("tests/fixtures/codex-0.145.0-failure-followup.jsonl");
  const workprint = adaptCodexJsonl(fixture, { title: "Release-check deterministic fixture" }).workprint;
  const temporary = await mkdtemp(join(tmpdir(), "codex workprint release check "));
  check("Temporary path contains spaces", temporary.includes(" "));
  try {
    const first = join(temporary, "first build");
    const second = join(temporary, "second build");
    await writePublicBundle(first, workprint);
    await writePublicBundle(second, workprint);
    for (const name of PUBLIC_BUNDLE_FILES) {
      check(`Deterministic ${name}`, (await readFile(join(first, name))).equals(await readFile(join(second, name))));
    }
    check("Fresh bundle verifies", (await verifyPublicBundle(first)).ok);
    const originalSvg = await readFile(join(first, "workprint.svg"));
    const tamperedSvg = Buffer.from(originalSvg);
    tamperedSvg[tamperedSvg.length - 2] ^= 0x01;
    await writeFile(join(first, "workprint.svg"), tamperedSvg);
    const tampered = await verifyPublicBundle(first);
    check("Verify rejects one-byte artifact drift", !tampered.ok && tampered.errors.includes("workprint.svg has drifted."));
    await writeFile(join(first, "workprint.svg"), originalSvg);
    check("Restored bundle verifies", (await verifyPublicBundle(first)).ok);

    const profileFirst = join(temporary, "first profile build");
    const profileSecond = join(temporary, "second profile build");
    await writeProfileBundle(profileFirst, compiledProfiles[1]);
    await writeProfileBundle(profileSecond, compiledProfiles[1]);
    for (const name of PROFILE_BUNDLE_FILES) {
      check(`Profile deterministic ${name}`, (await readFile(join(profileFirst, name))).equals(await readFile(join(profileSecond, name))));
    }
    check("Fresh Profile bundle verifies", (await verifyProfileBundle(profileFirst)).ok);
    const originalProfileSvg = await readFile(join(profileFirst, "workprint-profile.svg"));
    const tamperedProfileSvg = Buffer.from(originalProfileSvg);
    tamperedProfileSvg[tamperedProfileSvg.length - 2] ^= 0x01;
    await writeFile(join(profileFirst, "workprint-profile.svg"), tamperedProfileSvg);
    const tamperedProfile = await verifyProfileBundle(profileFirst);
    check("Profile verify rejects one-byte artifact drift", !tamperedProfile.ok && tamperedProfile.errors.includes("workprint-profile.svg has drifted."));
    await writeFile(join(profileFirst, "workprint-profile.svg"), originalProfileSvg);
    check("Restored Profile bundle verifies", (await verifyProfileBundle(profileFirst)).ok);
  } finally {
    check("Safe temporary cleanup target", basename(temporary).startsWith("codex workprint release check "));
    await rm(temporary, { recursive: true, force: true });
  }

  const attack = await readText("tests/fixtures/privacy-attack.jsonl");
  const attackBundle = renderPublicBundle(adaptCodexJsonl(attack, { title: "Reviewed public title" }).workprint);
  const forbidden = [
    "LEAK_PROMPT_6ca8", "LEAK_INSTRUCTION_6ca8", "PRIVATE_MODEL_6ca8",
    "sk-proj-FAKE-ATTACK-6ca8", "C:\\Users\\alice", "FAKE_TOKEN_6ca8",
    "STDOUT_SECRET_6ca8", "STDERR_SECRET_6ca8", "ASSISTANT_SECRET_6ca8",
    "FAKE_UNKNOWN_SECRET_6ca8", "PRIVATE_ORG_6ca8",
  ];
  for (const [name, bytes] of attackBundle) {
    const text = Buffer.from(bytes).toString("utf8");
    check(`Privacy fixture ${name}`, forbidden.every((value) => !text.includes(value)));
  }

  process.stdout.write(`Codex Workprint release check · Node ${nodeVersion}\n`);
  for (const name of checks) process.stdout.write(`PASS ${name}\n`);
  process.stdout.write(`RELEASE_CHECK PASS · ${checks.length} checks\n`);
} catch (error) {
  process.stderr.write(`RELEASE_CHECK FAIL · ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}

async function walkPublicTree(directory) {
  const output = [];
  const visit = async (current) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if ([".git", ".workprint-private", "._audit", "node_modules", "expert-review", "dist", "release"].includes(entry.name)) continue;
      const absolute = join(current, entry.name);
      const projectRelative = relative(root, absolute).replaceAll("\\", "/");
      if (entry.isDirectory()) await visit(absolute);
      else output.push(projectRelative);
    }
  };
  await visit(directory);
  return output.sort(codePointCompare);
}

function geometrySignature(workprint) {
  const layout = createWorklineLayout(workprint);
  return JSON.stringify({
    points: layout.points.map(({ x, y, color }) => ({ x, y, color })),
    segments: layout.segments.map(({ from, to, c1x, c1y, c2x, c2y, color, dashed }) => ({
      from: [from.x, from.y],
      to: [to.x, to.y],
      c1x,
      c1y,
      c2x,
      c2y,
      color,
      dashed,
    })),
    returnArcs: layout.returnArcs.map(({ from, to }) => ({ from: [from.x, from.y], to: [to.x, to.y] })),
    itemStitches: layout.itemStitches.map(({ itemId, from, to, terminalObserved }) => ({ itemId, from: [from.x, from.y], to: to ? [to.x, to.y] : null, terminalObserved })),
    turnSpans: layout.turnSpans.map(({ index, from, to, terminalObserved }) => ({ index, from: [from.x, from.y], to: to ? [to.x, to.y] : null, terminalObserved })),
    rows: layout.rows,
    maxPerRow: layout.maxPerRow,
  });
}

function makeLongRunInput(itemCount) {
  const lines = [{ type: "thread.started", thread_id: "private-release-thread" }, { type: "turn.started" }];
  for (let index = 0; index < itemCount; index += 1) {
    const id = `private-release-item-${index}`;
    lines.push({ type: "item.started", item: { id, type: "command_execution", command: `private-${index}`, aggregated_output: "", exit_code: null, status: "in_progress" } });
    lines.push({ type: "item.completed", item: { id, type: "command_execution", command: `private-${index}`, aggregated_output: "secret", exit_code: 0, status: "completed" } });
  }
  lines.push({ type: "turn.completed", usage: { input_tokens: 999 } });
  return lines.map((line) => JSON.stringify(line)).join("\n");
}

function readJpegDimensions(bytes) {
  if (!bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) throw new Error("Not a JPEG file.");
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xd8 || marker === 0x01) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) break;
    const length = bytes.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > bytes.length) break;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error("JPEG dimensions not found.");
}
