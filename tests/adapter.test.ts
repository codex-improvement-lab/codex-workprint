import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { adaptCodexJsonl, WorkprintInputError } from "../src/adapter/codex-jsonl-v0_1.ts";

const fixture = (name: string) => readFile(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

test("adapts the observed Codex CLI 0.145.0 shape without publishing private fields", async () => {
  const input = await fixture("codex-0.145.0-success.jsonl");
  const { workprint } = adaptCodexJsonl(input, { title: "Public run" });

  assert.equal(workprint.source.recognizedEvents, 6);
  assert.equal(workprint.source.unknownEvents, 0);
  assert.equal(workprint.source.timing, "not-observed");
  assert.equal(workprint.run.durationMs, null);
  assert.equal(workprint.run.turnCompletion, "observed");
  assert.equal(workprint.observations.length, 6);
  assert.deepEqual(
    workprint.observations.map(({ eventType, itemType, status, exitCode }) => ({ eventType, itemType, status, exitCode })),
    [
      { eventType: "thread.started", itemType: "run", status: "observed", exitCode: null },
      { eventType: "turn.started", itemType: "turn", status: "observed", exitCode: null },
      { eventType: "item.started", itemType: "command_execution", status: "in_progress", exitCode: null },
      { eventType: "item.completed", itemType: "command_execution", status: "completed", exitCode: 0 },
      { eventType: "item.completed", itemType: "agent_message", status: "not-observed", exitCode: null },
      { eventType: "turn.completed", itemType: "turn", status: "observed", exitCode: null },
    ],
  );
  assert.equal(workprint.observations[2].itemId, "item-1");
  assert.equal(workprint.observations[3].itemId, "item-1");
  assert.equal(workprint.observations[4].itemId, "item-2");
  assert.ok(workprint.observations.every((observation) => observation.publicPhase === null));
  assert.equal(workprint.summary.commandStarted, 1);
  assert.equal(workprint.summary.commandCompleted, 1);
  assert.equal(workprint.summary.commandFailed, 0);
  assert.equal("inputSha256" in workprint.source, false);
  assert.equal(workprint.privacy.rawInputHashPublished, false);
});

test("retains failure and a later completion as observations without claiming recovery", async () => {
  const input = await fixture("codex-0.145.0-failure-followup.jsonl");
  const { workprint } = adaptCodexJsonl(input, { title: "Failure boundary" });
  const failed = workprint.observations.find((observation) => observation.status === "failed");
  const later = workprint.observations.find((observation) => observation.afterObservedFailure);

  assert.equal(failed?.exitCode, 1);
  assert.equal(later?.status, "completed");
  assert.equal(later?.exitCode, 0);
  assert.equal(workprint.summary.completionAfterObservedFailure, 1);
  assert.equal(workprint.summary.publicRecover, 0);
  assert.ok(workprint.observations.every((observation) => observation.publicPhase === null));
});

test("only explicit public annotations add semantic phases", async () => {
  const input = await fixture("codex-0.145.0-success.jsonl");
  const { workprint } = adaptCodexJsonl(input, {
    title: "Annotated run",
    annotations: [{ sequence: 4, phase: "verify", label: "Public check" }],
  });
  assert.equal(workprint.observations[3].publicPhase, "verify");
  assert.equal(workprint.observations[3].publicLabel, "Public check");
  assert.equal(workprint.summary.publicVerify, 1);
  assert.ok(workprint.privacy.explicitPublicFields.includes("observations[3].publicPhase"));
  assert.throws(
    () => adaptCodexJsonl(input, { annotations: [{ sequence: 99, phase: "verify" }] }),
    WorkprintInputError,
  );
});

test("identity, release, language, and URL are explicit public fields and never shape inputs", async () => {
  const input = await fixture("codex-0.145.0-success.jsonl");
  const baseline = adaptCodexJsonl(input, { title: "Public run" }).workprint;
  const identified = adaptCodexJsonl(input, {
    title: "Public run",
    project: "Open project",
    by: "@public",
    release: "v1.4",
    publicUrl: "https://example.test/workprint/",
    language: "zh-Hans",
  }).workprint;
  assert.equal(identified.source.shapeSha256, baseline.source.shapeSha256);
  assert.notEqual(identified.source.publicIrSha256, baseline.source.publicIrSha256);
  assert.deepEqual(identified.run.publicIdentity, {
    project: "Open project",
    by: "@public",
    release: "v1.4",
    publicUrl: "https://example.test/workprint/",
    language: "zh-Hans",
  });
  assert.ok(identified.privacy.explicitPublicFields.includes("run.publicIdentity.by"));
  assert.ok(identified.privacy.explicitPublicFields.includes("run.publicIdentity.language"));
  assert.equal(baseline.run.publicIdentity?.project, null);
  assert.equal(baseline.run.publicIdentity?.language, "en");
});

test("UTF-8 BOM, LF, and CRLF inputs produce identical public IR semantics", async () => {
  const lf = await fixture("codex-0.145.0-success.jsonl");
  const crlf = lf.replaceAll("\n", "\r\n");
  const bom = `\uFEFF${lf}`;
  const left = adaptCodexJsonl(lf, { title: "Line ending check" }).workprint;
  const right = adaptCodexJsonl(crlf, { title: "Line ending check" }).workprint;
  const withBom = adaptCodexJsonl(bom, { title: "Line ending check" }).workprint;
  assert.deepEqual(left, right);
  assert.deepEqual(left, withBom);
});

test("recognizes the currently observed file_change item type but never infers edit", async () => {
  const input = await fixture("codex-0.145.0-file-change.jsonl");
  const { workprint } = adaptCodexJsonl(input, { title: "File observation" });
  const fileObservations = workprint.observations.filter((observation) => observation.itemType === "file_change");
  assert.equal(fileObservations.length, 2);
  assert.deepEqual(fileObservations.map((observation) => observation.status), ["in_progress", "completed"]);
  assert.ok(fileObservations.every((observation) => observation.publicPhase === null));
  assert.equal(workprint.summary.fileChangeObservations, 2);
  assert.equal(workprint.summary.publicEdit, 0);
  assert.ok(workprint.privacy.excludedFieldOccurrences.pathEnvironmentOrContent >= 2);
  assert.equal(JSON.stringify(workprint).includes("secret-file.txt"), false);
});

test("malformed, non-object, missing, and unknown events remain visible without raw values", async () => {
  const input = await fixture("unknown-events.jsonl");
  const { workprint } = adaptCodexJsonl(input, { title: "Unknowns" });
  assert.equal(workprint.source.malformedRecords, 2);
  assert.equal(workprint.source.unknownEvents, 6);
  assert.equal(workprint.summary.unknown, 6);
  assert.equal(workprint.observations.length, 6);
  assert.ok(workprint.observations.every((observation) => observation.eventType === "unknown"));
  assert.ok(workprint.observations.every((observation) => observation.itemId === null));
});
