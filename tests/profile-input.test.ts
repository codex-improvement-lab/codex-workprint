import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PROFILE_VERDICTS } from "../src/profile/contract.ts";
import { adaptWorkprintProfileJson, ProfileInputError } from "../src/profile/input.ts";

const example = (name: string) => readFile(new URL(`../examples/profile/${name}/profile.json`, import.meta.url), "utf8");

test("the three incubator projections compile directly into distinct Profile IR shapes", async () => {
  const cases = [
    ["continuity-archive-migration", "continuity", "seam", "What still holds after handoff?"],
    ["goal-delta-offline-release", "goal-delta", "fault", "What evidence stops carrying when the goal changes?"],
    ["context-receipt-observation-gap", "context-receipt", "slice", "What context was prepared, observed, or absent?"],
  ] as const;
  const digests = new Set<string>();
  for (const [name, kind, form, question] of cases) {
    const adapted = adaptWorkprintProfileJson(await example(name));
    assert.equal(adapted.profile.profile, kind);
    assert.equal(adapted.profile.visualForm, form);
    assert.equal(adapted.profile.question, question);
    assert.match(adapted.profile.source.profileIrSha256, /^[a-f0-9]{64}$/);
    assert.equal(adapted.profile.findings.every((finding) => finding.sourceRefs.every((ref) => adapted.profile.sources.some((source) => source.id === ref))), true);
    digests.add(adapted.profile.source.profileIrSha256);
  }
  assert.equal(digests.size, 3);
});

test("each profile enforces its own finite verdict set", async () => {
  assert.deepEqual(PROFILE_VERDICTS.continuity, ["carried", "lost", "stale", "invented"]);
  assert.deepEqual(PROFILE_VERDICTS["goal-delta"], ["added", "removed", "changed", "unchanged"]);
  assert.deepEqual(PROFILE_VERDICTS["context-receipt"], ["prepared", "observed", "excluded", "not_observed", "stale", "conflict"]);
  const input = JSON.parse(await example("continuity-archive-migration"));
  input.findings[0].verdict = "observed";
  assert.throws(() => adaptWorkprintProfileJson(JSON.stringify(input)), ProfileInputError);
});

test("unknown profiles and unresolved or duplicate source references fail closed", async () => {
  const unknown = JSON.parse(await example("goal-delta-offline-release"));
  unknown.profile = "future-dashboard";
  assert.throws(() => adaptWorkprintProfileJson(JSON.stringify(unknown)), /Unknown Workprint profile/);

  const unresolved = JSON.parse(await example("goal-delta-offline-release"));
  unresolved.findings[0].sourceRefs = ["missing-source"];
  assert.throws(() => adaptWorkprintProfileJson(JSON.stringify(unresolved)), /references unknown source/);

  const duplicate = JSON.parse(await example("goal-delta-offline-release"));
  duplicate.findings[0].sourceRefs = ["contract-after", "contract-after"];
  assert.throws(() => adaptWorkprintProfileJson(JSON.stringify(duplicate)), /contains a duplicate/);
});

test("summary verdict counts are bound to findings", async () => {
  const input = JSON.parse(await example("context-receipt-observation-gap"));
  input.summary.counts.observed = 99;
  assert.throws(() => adaptWorkprintProfileJson(JSON.stringify(input)), /does not match findings/);
});

test("unknown extension fields are counted by inspect but never promoted or allowed to change bundle semantics", async () => {
  const original = JSON.parse(await example("continuity-archive-migration"));
  const baseline = adaptWorkprintProfileJson(JSON.stringify(original));
  const extended = structuredClone(original);
  extended.secretExtension = "LEAK_EXTENSION_ROOT_91B";
  extended.sources[0].privateLocator = "LEAK_EXTENSION_SOURCE_91B";
  extended.findings[0].modelImpact = "LEAK_EXTENSION_FINDING_91B";
  extended.summary.futureScore = "LEAK_EXTENSION_SUMMARY_91B";
  extended.summary.counts.futureMetric = 999;
  const adapted = adaptWorkprintProfileJson(JSON.stringify(extended));
  assert.deepEqual(adapted.profile, baseline.profile);
  assert.ok(adapted.inspection.ignoredExtensionFields >= baseline.inspection.ignoredExtensionFields + 5);
  const publicIr = JSON.stringify(adapted.profile);
  for (const value of ["LEAK_EXTENSION_ROOT_91B", "LEAK_EXTENSION_SOURCE_91B", "LEAK_EXTENSION_FINDING_91B", "LEAK_EXTENSION_SUMMARY_91B", "futureMetric", "modelImpact"]) {
    assert.equal(publicIr.includes(value), false);
  }
});

test("profile schemas publish stable input and IR identities", async () => {
  const inputSchema = JSON.parse(await readFile(new URL("../schema/workprint-profile-v0.1.schema.json", import.meta.url), "utf8"));
  const irSchema = JSON.parse(await readFile(new URL("../schema/workprint-profile-ir-v0.1.schema.json", import.meta.url), "utf8"));
  assert.equal(inputSchema.$id, "urn:codex-workprint:profile-input:0.1");
  assert.deepEqual(inputSchema.properties.profile.enum, ["continuity", "goal-delta", "context-receipt"]);
  assert.equal(irSchema.$id, "urn:codex-workprint:profile-ir:0.1");
  assert.equal(irSchema.properties.artifact.const, "codex-workprint-profile");
});

