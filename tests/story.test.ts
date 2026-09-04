import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { adaptCodexJsonl } from "../src/adapter/codex-jsonl-v0_1.ts";
import { createRunReceiptStory } from "../src/core/story.ts";
import { inspectShareCardBitmapCoverage, renderShareCardPng } from "../src/render/png.ts";

const fixture = (name: string) => readFile(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

test("Run Receipt story separates open items from status-absent observations", async () => {
  const success = adaptCodexJsonl(await fixture("codex-0.145.0-success.jsonl"), { title: "Success boundary" }).workprint;
  const successStory = createRunReceiptStory(success);
  assert.equal(successStory.openItemCount, 0);
  assert.equal(successStory.statusAbsentObservationCount, 1);
  assert.match(successStory.detail, /0 items left open · 1 status-absent observation/);

  const openInput = [
    { type: "thread.started", thread_id: "private" },
    { type: "turn.started" },
    { type: "item.started", item: { id: "private-open", type: "command_execution", status: "in_progress", command: "private" } },
  ].map((entry) => JSON.stringify(entry)).join("\n");
  const open = adaptCodexJsonl(openInput, { title: "Open boundary" }).workprint;
  const openStory = createRunReceiptStory(open);
  assert.equal(openStory.openItemCount, 1);
  assert.equal(openStory.statusAbsentObservationCount, 0);
  assert.match(openStory.detail, /1 item left open · 0 status-absent observations/);
});

test("all four bounded headline branches render with covered glyphs", async () => {
  const failureLater = adaptCodexJsonl(await fixture("codex-0.145.0-failure-followup.jsonl"), { title: "Failure then completion" }).workprint;
  const success = adaptCodexJsonl(await fixture("codex-0.145.0-success.jsonl"), { title: "Completion observed" }).workprint;
  const unknown = adaptCodexJsonl(await fixture("unknown-events.jsonl"), { title: "Outcome absent" }).workprint;
  const failedOnlyInput = [
    { type: "thread.started", thread_id: "private" },
    { type: "item.completed", item: { id: "private-failed", type: "command_execution", status: "failed", exit_code: 1, command: "private" } },
  ].map((entry) => JSON.stringify(entry)).join("\n");
  const failedOnly = adaptCodexJsonl(failedOnlyInput, { title: "Failure observed" }).workprint;
  const cases = [
    [failureLater, "1 failed item → 1 later completion"],
    [failedOnly, "1 failed item observed"],
    [success, "1 completed item / no failed item observed"],
    [unknown, "6 public observations / outcome not observed"],
  ] as const;

  for (const [workprint, headline] of cases) {
    const story = createRunReceiptStory(workprint);
    assert.equal(story.headline, headline);
    assert.deepEqual(inspectShareCardBitmapCoverage(workprint), { supported: true, missingByField: [] });
    const png = renderShareCardPng(workprint);
    assert.deepEqual(Array.from(png.subarray(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
  }
});

test("caption is concise and native-share text leaves the URL to the URL field", async () => {
  const workprint = adaptCodexJsonl(await fixture("codex-0.145.0-success.jsonl"), {
    title: "Public receipt",
    publicUrl: "https://example.test/workprint/",
  }).workprint;
  const story = createRunReceiptStory(workprint);
  assert.equal(story.shareText.includes("https://"), false);
  assert.equal(story.caption.match(/https:\/\//g)?.length, 1);
  assert.ok(story.caption.length < 220, `caption was ${story.caption.length} characters`);
});
