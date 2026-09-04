import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { adaptCodexJsonl } from "../src/adapter/codex-jsonl-v0_1.ts";
import { renderPublicBundle } from "../src/bundle.ts";

const forbidden = [
  "LEAK_PROMPT_6ca8",
  "LEAK_INSTRUCTION_6ca8",
  "PRIVATE_MODEL_6ca8",
  "sk-proj-FAKE-ATTACK-6ca8",
  "C:\\Users\\alice",
  "FAKE_TOKEN_6ca8",
  "STDOUT_SECRET_6ca8",
  "STDERR_SECRET_6ca8",
  "ASSISTANT_SECRET_6ca8",
  "FAKE_UNKNOWN_SECRET_6ca8",
  "PRIVATE_ORG_6ca8",
  "01999999-3333-7444-8555-cccccccccccc",
];

test("privacy attack values do not enter any public bundle artifact", async () => {
  const input = await readFile(new URL("./fixtures/privacy-attack.jsonl", import.meta.url), "utf8");
  const { workprint } = adaptCodexJsonl(input, { title: "Reviewed public title" });
  const files = renderPublicBundle(workprint);

  for (const [name, bytes] of files) {
    const text = Buffer.from(bytes).toString("utf8");
    for (const secret of forbidden) {
      assert.equal(text.includes(secret), false, `${name} leaked ${secret}`);
    }
  }

  const publicJson = Buffer.from(files.get("workprint.json") as string).toString("utf8");
  for (const field of ["thread_id", "usage", "input_tokens", "command", "aggregated_output", "inputSha256"]) {
    assert.equal(new RegExp(`"${field}"\\s*:`).test(publicJson), false, `workprint.json retained ${field}`);
  }
  assert.equal(workprint.source.timing, "not-observed");
  assert.equal(workprint.run.durationMs, null);
  assert.equal(workprint.source.unknownEvents, 1);
  assert.equal(workprint.summary.unknown, 1);
  assert.ok(workprint.privacy.excludedFieldOccurrences.commandText >= 2);
  assert.ok(workprint.privacy.excludedFieldOccurrences.outputText >= 2);
  assert.ok(workprint.privacy.excludedFieldOccurrences.identityOrUsage >= 1);
});
