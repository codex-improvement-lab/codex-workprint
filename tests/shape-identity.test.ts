import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { adaptCodexJsonl } from "../src/adapter/codex-jsonl-v0_1.ts";
import { assertValidWorkprintIR } from "../src/core/ir.ts";
import { createShapeProjection } from "../src/core/shape.ts";
import type { WorkprintIR } from "../src/core/types.ts";
import { createWorklineLayout } from "../src/render/workline.ts";

const fixture = (name: string) => readFile(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

function geometry(workprint: WorkprintIR): unknown {
  const layout = createWorklineLayout(workprint);
  return {
    width: layout.width,
    height: layout.height,
    points: layout.points.map(({ x, y, color }) => ({ x, y, color })),
    segments: layout.segments.map(({ from, to, c1x, c1y, c2x, c2y, color, dashed }) => ({
      from: { x: from.x, y: from.y },
      to: { x: to.x, y: to.y },
      c1x,
      c1y,
      c2x,
      c2y,
      color,
      dashed,
    })),
    returnArcs: layout.returnArcs.map(({ from, to }) => ({
      from: { x: from.x, y: from.y },
      to: { x: to.x, y: to.y },
    })),
    itemStitches: layout.itemStitches.map(({ itemId, from, to, terminalObserved }) => ({
      itemId,
      from: { x: from.x, y: from.y },
      to: to ? { x: to.x, y: to.y } : null,
      terminalObserved,
    })),
    turnSpans: layout.turnSpans.map(({ index, from, to, terminalObserved }) => ({
      index,
      from: { x: from.x, y: from.y },
      to: to ? { x: to.x, y: to.y } : null,
      terminalObserved,
    })),
    rows: layout.rows,
    maxPerRow: layout.maxPerRow,
  };
}

test("public copy and annotations change public IR but never shape identity or geometry", async () => {
  const input = await fixture("codex-0.145.0-failure-followup.jsonl");
  const plain = adaptCodexJsonl(input, {
    title: "First public title",
    labels: ["First label"],
  }).workprint;
  const annotated = adaptCodexJsonl(input, {
    title: "Completely different public title",
    labels: ["Second label", "Another label"],
    annotations: [{ sequence: 5, phase: "verify", label: "Reviewed public check" }],
  }).workprint;

  assert.equal(plain.source.shapeSha256, annotated.source.shapeSha256);
  assert.notEqual(plain.source.publicIrSha256, annotated.source.publicIrSha256);
  assert.deepEqual(geometry(plain), geometry(annotated));
  assert.deepEqual(
    Object.keys(createShapeProjection(plain.observations)[0]).sort(),
    ["eventType", "itemId", "itemType", "status", "exitCode", "afterObservedFailure"].sort(),
  );
});

test("different observed event streams have different shape identities", async () => {
  const failure = adaptCodexJsonl(await fixture("codex-0.145.0-failure-followup.jsonl"), { title: "Run" }).workprint;
  const success = adaptCodexJsonl(await fixture("codex-0.145.0-success.jsonl"), { title: "Run" }).workprint;

  assert.notEqual(failure.source.shapeSha256, success.source.shapeSha256);
  assert.notDeepEqual(geometry(failure), geometry(success));
});

test("IR integrity rejects a shape digest that is not bound to observations", async () => {
  const workprint = adaptCodexJsonl(await fixture("codex-0.145.0-success.jsonl"), { title: "Run" }).workprint;
  const tampered = structuredClone(workprint);
  tampered.source.shapeSha256 = "0".repeat(64);

  assert.throws(() => assertValidWorkprintIR(tampered), /Shape digest does not match/);
});
