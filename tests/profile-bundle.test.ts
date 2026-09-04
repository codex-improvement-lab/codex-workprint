import assert from "node:assert/strict";
import { appendFile, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { adaptCodexJsonl } from "../src/adapter/codex-jsonl-v0_1.ts";
import { verifyPublicBundle, writePublicBundle } from "../src/bundle.ts";
import { PROFILE_BUNDLE_FILES, renderProfileBundle, verifyProfileBundle, writeProfileBundle } from "../src/profile/bundle.ts";
import { adaptWorkprintProfileJson } from "../src/profile/input.ts";

const example = (name: string) => readFile(new URL(`../examples/profile/${name}/profile.json`, import.meta.url), "utf8");

test("profile build is byte-deterministic and verify rejects artifact tamper", async () => {
  const root = await mkdtemp(join(tmpdir(), "codex-workprint-profile-"));
  try {
    const profile = adaptWorkprintProfileJson(await example("goal-delta-offline-release")).profile;
    const first = join(root, "first");
    const second = join(root, "second");
    await writeProfileBundle(first, profile);
    await writeProfileBundle(second, profile);
    assert.deepEqual((await readdir(first)).sort(), [...PROFILE_BUNDLE_FILES].sort());
    for (const name of PROFILE_BUNDLE_FILES) assert.deepEqual(await readFile(join(first, name)), await readFile(join(second, name)), `${name} drifted`);
    assert.equal((await verifyProfileBundle(first)).ok, true);
    await appendFile(join(first, "workprint-profile.svg"), "<!-- drift -->", "utf8");
    const tampered = await verifyProfileBundle(first);
    assert.equal(tampered.ok, false);
    assert.ok(tampered.errors.includes("workprint-profile.svg has drifted."));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Run and Profile bundle verifiers reject the other bundle type", async () => {
  const root = await mkdtemp(join(tmpdir(), "codex-workprint-bundle-type-"));
  try {
    const profile = adaptWorkprintProfileJson(await example("continuity-archive-migration")).profile;
    const runInput = await readFile(new URL("./fixtures/codex-0.145.0-success.jsonl", import.meta.url), "utf8");
    const run = adaptCodexJsonl(runInput, { title: "Run bundle type" }).workprint;
    const profileDirectory = join(root, "profile");
    const runDirectory = join(root, "run");
    await writeProfileBundle(profileDirectory, profile);
    await writePublicBundle(runDirectory, run);
    const runAgainstProfile = await verifyPublicBundle(profileDirectory);
    const profileAgainstRun = await verifyProfileBundle(runDirectory);
    assert.equal(runAgainstProfile.ok, false);
    assert.ok(runAgainstProfile.errors.some((error) => /workprint\.json|Unexpected files/.test(error)));
    assert.equal(profileAgainstRun.ok, false);
    assert.ok(profileAgainstRun.errors.some((error) => /workprint-profile\.json|profile bundle/.test(error)));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("unknown extensions do not enter any profile bundle artifact", async () => {
  const raw = JSON.parse(await example("context-receipt-observation-gap"));
  raw.secret = "LEAK_PROFILE_BUNDLE_42A";
  raw.findings[0].hiddenCausalClaim = "LEAK_CAUSAL_42A";
  const profile = adaptWorkprintProfileJson(JSON.stringify(raw)).profile;
  for (const [name, bytes] of renderProfileBundle(profile)) {
    const text = Buffer.from(bytes).toString("utf8");
    assert.equal(text.includes("LEAK_PROFILE_BUNDLE_42A"), false, `${name} leaked root extension`);
    assert.equal(text.includes("LEAK_CAUSAL_42A"), false, `${name} leaked finding extension`);
  }
});

