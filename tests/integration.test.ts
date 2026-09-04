import assert from "node:assert/strict";
import { appendFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { adaptCodexJsonl } from "../src/adapter/codex-jsonl-v0_1.ts";
import { PUBLIC_BUNDLE_FILES, verifyPublicBundle, writePublicBundle } from "../src/bundle.ts";

test("build is byte-deterministic and verify detects drift and unexpected files", async () => {
  const root = await mkdtemp(join(tmpdir(), "codex-workprint-integration-"));
  try {
    const input = await readFile(new URL("./fixtures/codex-0.145.0-failure-followup.jsonl", import.meta.url), "utf8");
    const { workprint } = adaptCodexJsonl(input, { title: "Deterministic release shape" });
    const first = join(root, "first");
    const second = join(root, "second");
    await mkdir(first);
    await writePublicBundle(first, workprint);
    await writePublicBundle(second, workprint);

    assert.deepEqual((await readdir(first)).sort(), [...PUBLIC_BUNDLE_FILES].sort());
    for (const name of PUBLIC_BUNDLE_FILES) {
      assert.deepEqual(await readFile(join(first, name)), await readFile(join(second, name)), `${name} drifted`);
    }
    assert.equal((await verifyPublicBundle(first)).ok, true);

    await appendFile(join(first, "workprint.svg"), "<!-- drift -->", "utf8");
    const drift = await verifyPublicBundle(first);
    assert.equal(drift.ok, false);
    assert.ok(drift.errors.includes("workprint.svg has drifted."));

    await writeFile(join(second, "unexpected.txt"), "unexpected", "utf8");
    const unexpected = await verifyPublicBundle(second);
    assert.equal(unexpected.ok, false);
    assert.ok(unexpected.errors.some((error) => error.startsWith("Unexpected files:")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
