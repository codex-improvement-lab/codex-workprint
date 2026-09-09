import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { adaptWorkprintProfileJson } from "../src/profile/input.ts";
import { renderProfileBundle } from "../src/profile/bundle.ts";

test("the Intake to Proofline CLI projection preserves producer semantics without copying private bindings", async () => {
  for (const fixture of ["proofline-intake-mainline.json", "proofline-intake-simplified.json"]) {
  // Frozen original and simplified synthetic producer loops on Windows.
  const input = JSON.parse(await readFile(new URL(`./fixtures/${fixture}`, import.meta.url), "utf8"));
  const baseline = adaptWorkprintProfileJson(JSON.stringify(input));
  assert.deepEqual(baseline.profile.findings.map(item => item.verdict), ["changed", "unchanged"]);
  assert.equal(baseline.profile.summary.counts.usableEvidence, 2);
  assert.equal(baseline.profile.summary.counts.newlyStaleEvidence, 0);
  assert.deepEqual(baseline.profile.findings[0].affectedEvidenceIds, ["AC-COVERAGE/tests"]);
  const extended = structuredClone(input);
  extended.intake = { pointer: "PRIVATE_INTAKE_POINTER_8B", text: "PRIVATE_REQUIREMENT_BODY_8B" };
  extended.evidence = [{ command: "PRIVATE_COMMAND_8B", goalBinding: "PRIVATE_BINDING_8B" }];
  extended.findings[0].sourceSignal = "PRIVATE_SOURCE_SIGNAL_8B";
  const adapted = adaptWorkprintProfileJson(JSON.stringify(extended));
  assert.deepEqual(adapted.profile, baseline.profile);
  assert.equal(adapted.inspection.ignoredExtensionFields, baseline.inspection.ignoredExtensionFields + 3);
  const originalBundle = renderProfileBundle(baseline.profile);
  const extendedBundle = renderProfileBundle(adapted.profile);
  for (const [name, bytes] of originalBundle) {
    assert.deepEqual(extendedBundle.get(name), bytes, `${name} changed due to private extensions`);
    assert.doesNotMatch(Buffer.from(bytes).toString("utf8"), /PRIVATE_.*_8B/);
  }
  }
});
