import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (!process.argv[2]) throw new Error("Usage: node scripts/package-smoke.mjs <installed-package-root>");
const root = fileURLToPath(new URL("../", import.meta.url));
const installed = path.resolve(process.argv[2]);
const bin = path.join(installed, "bin", "codex-workprint.js");
const parent = path.join(root, ".workprint-tmp");
await mkdir(parent, { recursive: true });
const output = await mkdtemp(path.join(parent, "package-smoke-"));
const steps = [];
function run(args) {
  const result = spawnSync(process.execPath, [bin, ...args], { cwd: output, encoding: "utf8" });
  steps.push({ command: args[0] + (args[0] === "profile" ? ` ${args[1]}` : ""), exitCode: result.status });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}
run(["build", path.join(installed, "examples/first-run/input.jsonl"), "--title", "Synthetic packaged first run", "--out", "run"]);
assert.equal(JSON.parse(run(["verify", "run", "--json"])).ok, true);
for (const name of ["continuity-archive-migration", "goal-delta-offline-release", "context-receipt-observation-gap"]) {
  run(["profile", "build", path.join(installed, "examples/profile", name, "profile.json"), "--out", name]);
  assert.equal(JSON.parse(run(["profile", "verify", name, "--json"])).ok, true);
}
run(["profile", "build", path.join(root, "tests/fixtures/proofline-intake-mainline.json"), "--out", "mainline"]);
assert.equal(JSON.parse(run(["profile", "verify", "mainline", "--json"])).ok, true);
await readFile(path.join(installed, "docs/PROOFLINE_MAINLINE.md"));
await writeFile(path.join(output, "result.json"), JSON.stringify({ platform: process.platform, node: process.version, steps }, null, 2) + "\n");
process.stdout.write(`Installed tarball smoke passed: Run, three existing Profiles, mainline Profile, packaged guide. Evidence: ${path.relative(root, output)}\n`);
