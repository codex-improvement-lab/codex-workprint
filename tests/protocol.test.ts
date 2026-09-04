import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { sha256 } from "../src/core/hash.ts";
import { assertValidWorkprintIR, WorkprintIntegrityError } from "../src/core/ir.ts";
import { adaptCodexJsonl } from "../src/adapter/codex-jsonl-v0_1.ts";

test("historical Run IR 0.1 schema is byte-immutable and Run IR 0.2 has a new identity", async () => {
  const historical = await readFile(new URL("../schema/workprint-ir-v0.1.schema.json", import.meta.url));
  const current = JSON.parse(await readFile(new URL("../schema/workprint-ir-v0.2.schema.json", import.meta.url), "utf8"));
  assert.equal(historical.length, 4931);
  assert.equal(sha256(historical), "fceb913482d1046701dd0fb02960978a3e0066d5f705e16562d4335eba4c0299");
  assert.equal(current.$id, "urn:codex-workprint:schema:0.2");
  assert.equal(current.properties.schemaVersion.const, "0.2");
  assert.ok(current.properties.run.required.includes("publicIdentity"));
});

test("current verifier accepts Run IR 0.2 and explicitly rejects legacy Run IR 0.1", () => {
  const input = [
    { type: "thread.started", thread_id: "private" },
    { type: "turn.started" },
    { type: "turn.completed", usage: { input_tokens: 1 } },
  ].map((entry) => JSON.stringify(entry)).join("\n");
  const workprint = adaptCodexJsonl(input, { title: "Protocol boundary" }).workprint;
  assert.equal(workprint.schemaVersion, "0.2");
  assert.doesNotThrow(() => assertValidWorkprintIR(workprint));
  const legacy = { ...workprint, schemaVersion: "0.1" };
  assert.throws(
    () => assertValidWorkprintIR(legacy),
    (error: unknown) => error instanceof WorkprintIntegrityError && /Legacy Workprint IR 0\.1.*Current Run IR is 0\.2/.test(error.message),
  );
});
