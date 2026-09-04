import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { runCli } from "../src/cli.ts";

class Capture {
  value = "";
  write(chunk: string): void { this.value += chunk; }
}

const input = fileURLToPath(new URL("../examples/profile/context-receipt-observation-gap/profile.json", import.meta.url));

test("profile inspect, build, and verify form an explicit isolated CLI loop", async () => {
  const root = await mkdtemp(join(tmpdir(), "codex-workprint-profile-cli-"));
  try {
    const inspectOut = new Capture();
    const inspectCode = await runCli(["profile", "inspect", input], { stdout: inspectOut, stderr: new Capture() });
    assert.equal(inspectCode, 0);
    assert.match(inspectOut.value, /FINDINGS → SOURCES/);
    assert.match(inspectOut.value, /not a new fact source/i);
    const output = join(root, "profile bundle");
    const buildOut = new Capture();
    const buildCode = await runCli(["profile", "build", input, "--out", output], { stdout: buildOut, stderr: new Capture() });
    assert.equal(buildCode, 0);
    assert.match(buildOut.value, /BUILT 7-file context-receipt/);
    const verifyOut = new Capture();
    const verifyCode = await runCli(["profile", "verify", output], { stdout: verifyOut, stderr: new Capture() });
    assert.equal(verifyCode, 0);
    assert.match(verifyOut.value, /VERIFIED 7 profile bundle files/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

