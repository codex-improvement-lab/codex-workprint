import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { adaptCodexJsonl } from "../src/adapter/codex-jsonl-v0_1.ts";
import { deriveRunSheetStructure } from "../src/render/run-sheet.ts";
import { createWorklineLayout } from "../src/render/workline.ts";

test("Run Sheet derives item threads, turn ranges, and bounded turning points from public IR", async () => {
  const input = await readFile(new URL("./fixtures/codex-0.145.0-failure-followup.jsonl", import.meta.url), "utf8");
  const workprint = adaptCodexJsonl(input, { title: "Run Sheet structure" }).workprint;
  const structure = deriveRunSheetStructure(workprint);

  assert.equal(structure.turnRanges.length, 1);
  assert.equal(structure.turnRanges[0]?.startedSequence, 2);
  assert.equal(structure.turnRanges[0]?.completedSequence, 8);
  assert.equal(structure.pairedItemCount, 2);
  assert.equal(structure.openItemCount, 0);
  assert.deepEqual(
    structure.moments.map((moment) => moment.kind),
    ["failure", "later-completion", "turn-completion"],
  );
  assert.equal(structure.moments.some((moment) => /recovery is not claimed/i.test(moment.detail)), true);
});

test("long runs fold into a deterministic serpentine route without dropping observations", () => {
  const lines: object[] = [{ type: "thread.started", thread_id: "private-thread" }, { type: "turn.started" }];
  for (let index = 0; index < 20; index += 1) {
    const id = `private-item-${index}`;
    lines.push({
      type: "item.started",
      item: { id, type: "command_execution", command: `private-${index}`, aggregated_output: "", exit_code: null, status: "in_progress" },
    });
    lines.push({
      type: "item.completed",
      item: { id, type: "command_execution", command: `private-${index}`, aggregated_output: "secret", exit_code: 0, status: "completed" },
    });
  }
  lines.push({ type: "turn.completed", usage: { input_tokens: 999 } });
  const input = lines.map((line) => JSON.stringify(line)).join("\n");
  const workprint = adaptCodexJsonl(input, { title: "Long run" }).workprint;
  const layout = createWorklineLayout(workprint, 1040, 480, 12);

  assert.equal(layout.points.length, 43);
  assert.equal(layout.rows, 4);
  assert.equal(layout.segments.filter((segment) => segment.folded).length, 3);
  assert.deepEqual(layout.points.filter((point) => point.indexInRow === 0).map((point) => point.direction), [1, -1, 1, -1]);
  assert.equal(layout.itemStitches.length, 20);
  assert.equal(layout.itemStitches.every((stitch) => stitch.terminalObserved), true);
  assert.equal(layout.turnSpans.length, 1);
  assert.equal(layout.turnSpans[0]?.terminalObserved, true);
  assert.equal(layout.points.every((point) => point.x >= 0 && point.x <= layout.width && point.y >= 0 && point.y <= layout.height), true);
});
