import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { adaptCodexJsonl } from "../src/adapter/codex-jsonl-v0_1.ts";
import { renderPublicBundle } from "../src/bundle.ts";
import { renderProfileBundle } from "../src/profile/bundle.ts";
import { adaptWorkprintProfileJson } from "../src/profile/input.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
test("distributed JavaScript works below node_modules and matches source artifacts", async () => {
  const built = spawnSync(process.execPath, ["scripts/build-dist.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(built.status, 0, built.stderr);
  const temporary = await mkdtemp(join(tmpdir(), "workprint installed-layout "));
  try {
    const packageRoot = join(temporary, "node_modules", "codex-workprint");
    await mkdir(join(packageRoot, "src"), { recursive: true });
    for (const path of ["bin", "dist", "assets"]) await cp(join(root, path), join(packageRoot, path), { recursive: true });
    await cp(join(root, "src/runtime-check.js"), join(packageRoot, "src/runtime-check.js"));
    await writeFile(join(packageRoot, "package.json"), '{"type":"module"}\n');
    const input = await readFile(join(root, "examples/first-run/input.jsonl"), "utf8");
    const inputFile = join(temporary, "input.jsonl");
    const output = join(temporary, "result");
    await writeFile(inputFile, input);
    const cli = join(packageRoot, "bin/codex-workprint.js");
    const result = spawnSync(process.execPath, [cli, "build", inputFile, "--title", "Synthetic first run", "--out", output], { cwd: temporary, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const verified = spawnSync(process.execPath, [cli, "verify", output, "--json"], { cwd: temporary, encoding: "utf8" });
    assert.equal(verified.status, 0, verified.stderr);
    assert.equal(JSON.parse(verified.stdout).ok, true);
    const expected = renderPublicBundle(adaptCodexJsonl(input, { title: "Synthetic first run" }).workprint);
    for (const [name, bytes] of expected) assert.deepEqual(await readFile(join(output, name)), Buffer.from(bytes), name);
    for (const profileName of ["continuity-archive-migration", "goal-delta-offline-release", "context-receipt-observation-gap"]) {
      const profileInput = await readFile(join(root, "examples/profile", profileName, "profile.json"), "utf8");
      const profileFile = join(temporary, `${profileName}.json`);
      const profileOutput = join(temporary, profileName);
      await writeFile(profileFile, profileInput);
      const builtProfile = spawnSync(process.execPath, [cli, "profile", "build", profileFile, "--out", profileOutput], { cwd: temporary, encoding: "utf8" });
      assert.equal(builtProfile.status, 0, builtProfile.stderr);
      const expectedProfile = renderProfileBundle(adaptWorkprintProfileJson(profileInput).profile);
      for (const [name, bytes] of expectedProfile) assert.deepEqual(await readFile(join(profileOutput, name)), Buffer.from(bytes), `${profileName}/${name}`);
    }
  } finally {
    const resolved = await realpath(temporary);
    assert.equal(dirname(resolved).toLowerCase(), (await realpath(tmpdir())).toLowerCase());
    assert.ok(resolved.includes("workprint installed-layout "));
    await rm(resolved, { recursive: true, force: true });
  }
});
