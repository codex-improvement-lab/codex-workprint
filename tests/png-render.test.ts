import assert from "node:assert/strict";
import test from "node:test";
import { inspectBitmapCoverage, inspectShareCardBitmapCoverage, PNG_RENDERER_ID, renderShareCardPng } from "../src/render/png.ts";
import type { WorkprintIR } from "../src/core/types.ts";

function fixture(title: string, publicIrSha256: string): WorkprintIR {
  return {
    schemaVersion: "0.2",
    source: {
      kind: "codex-exec-jsonl",
      adapterVersion: "0.1.0",
      shapeSha256: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      publicIrSha256,
      parsedRecords: 5,
      malformedRecords: 0,
      recognizedEvents: 5,
      unknownEvents: 0,
      timing: "not-observed",
    },
    run: {
      publicTitle: title,
      publicLabels: ["demo"],
      publicIdentity: { project: null, by: null, release: null, publicUrl: null, language: "en" },
      turnCompletion: "observed",
      durationMs: null,
    },
    observations: [
      {
        sequence: 1,
        eventType: "thread.started",
        itemId: "i1",
        itemType: "run",
        status: "observed",
        exitCode: null,
        publicPhase: "inspect",
        publicLabel: null,
        afterObservedFailure: false,
      },
      {
        sequence: 2,
        eventType: "item.started",
        itemId: "i2",
        itemType: "command_execution",
        status: "in_progress",
        exitCode: null,
        publicPhase: "edit",
        publicLabel: null,
        afterObservedFailure: false,
      },
      {
        sequence: 3,
        eventType: "item.completed",
        itemId: "i3",
        itemType: "command_execution",
        status: "completed",
        exitCode: 0,
        publicPhase: "verify",
        publicLabel: null,
        afterObservedFailure: false,
      },
      {
        sequence: 4,
        eventType: "item.completed",
        itemId: "i4",
        itemType: "command_execution",
        status: "failed",
        exitCode: 1,
        publicPhase: "verify",
        publicLabel: null,
        afterObservedFailure: false,
      },
      {
        sequence: 5,
        eventType: "item.completed",
        itemId: "i5",
        itemType: "command_execution",
        status: "completed",
        exitCode: 0,
        publicPhase: "verify",
        publicLabel: null,
        afterObservedFailure: true,
      },
    ],
    summary: {
      runObservations: 1,
      turnObservations: 0,
      itemStarted: 1,
      itemCompleted: 2,
      itemFailed: 1,
      itemStatusNotObserved: 0,
      commandStarted: 1,
      commandCompleted: 2,
      commandFailed: 1,
      commandOutcomeNotObserved: 0,
      fileChangeObservations: 0,
      agentMessageObservations: 0,
      unknown: 0,
      completionAfterObservedFailure: 1,
      publicInspect: 1,
      publicEdit: 1,
      publicVerify: 3,
      publicRecover: 0,
      publicDeliver: 0,
    },
    privacy: {
      policyVersion: "0.1",
      mode: "default-deny-public-projection",
      excludedCategories: ["prompt", "reply", "reasoning", "command", "stdout", "stderr", "absolute-path"],
      excludedFieldOccurrences: {},
      explicitPublicFields: ["run.publicTitle"],
      itemIds: "pseudonymized-for-sequence-association",
      rawValuesRetained: false,
      rawInputHashPublished: false,
      assurance: "receipt-not-guarantee",
    },
    render: {
      rendererVersion: "workline-0.1.0",
      pngRenderer: PNG_RENDERER_ID,
      palette: "the-run-has-a-shape-v1",
    },
  };
}

function readUint32BigEndian(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 0x1000000 +
    bytes[offset + 1] * 0x10000 +
    bytes[offset + 2] * 0x100 +
    bytes[offset + 3]
  );
}

test("exports a versioned renderer id", () => {
  assert.equal(PNG_RENDERER_ID, "workprint-png-v5/indexed-stored-deflate/unifont-17.0.05");
});

test("renders a PNG with the required signature and 1200x630 IHDR", () => {
  const png = renderShareCardPng(fixture("Ship the release candidate", "0123456789abcdef0123456789abcdef"));
  assert.deepEqual(Array.from(png.subarray(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(String.fromCharCode(...png.subarray(12, 16)), "IHDR");
  assert.equal(readUint32BigEndian(png, 16), 1200);
  assert.equal(readUint32BigEndian(png, 20), 630);
  assert.equal(png[24], 8);
  assert.equal(png[25], 3);
  assert.ok(png.length < 1_000_000);
  assert.equal(String.fromCharCode(...png.subarray(37, 41)), "PLTE");
});

test("renders identical bytes for identical IR", () => {
  const ir = fixture("A deterministic run", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  assert.deepEqual(renderShareCardPng(ir), renderShareCardPng(ir));
});

test("changes bytes when the IR changes", () => {
  const first = renderShareCardPng(fixture("Inspect then verify", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
  const second = renderShareCardPng(fixture("Recover and deliver", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"));
  assert.notDeepEqual(first, second);
});

test("renders real CJK glyphs rather than question-mark substitution", () => {
  const title = "修复登录失败并验证发布";
  assert.deepEqual(inspectBitmapCoverage(title), { characters: 11, supported: 11, missingCodePoints: [] });
  const cjk = renderShareCardPng(fixture(title, "cccccccccccccccccccccccccccccccc"));
  const questionMarks = renderShareCardPng(fixture("???????????", "cccccccccccccccccccccccccccccccc"));
  assert.notDeepEqual(cjk, questionMarks);
});

test("covers every public share-card field and fails closed on a missing glyph", () => {
  const supported = fixture("修复登录失败并验证发布", "dddddddddddddddddddddddddddddddd");
  supported.run.publicIdentity = {
    project: "公开项目",
    by: "@reviewer",
    release: "0.3.0-rc.2",
    publicUrl: "https://example.test/workprint/",
    language: "zh-Hans",
  };
  assert.deepEqual(inspectShareCardBitmapCoverage(supported), { supported: true, missingByField: [] });

  const unsupported = fixture("Unsupported 🧪 glyph", "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
  const coverage = inspectShareCardBitmapCoverage(unsupported);
  assert.equal(coverage.supported, false);
  assert.deepEqual(coverage.missingByField, [{ field: "run.publicTitle", missingCodePoints: ["U+1F9EA"] }]);
  assert.throws(() => renderShareCardPng(unsupported), /glyph coverage failed.*U\+1F9EA/i);
});
