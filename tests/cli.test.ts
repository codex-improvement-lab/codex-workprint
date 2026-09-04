import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import test from "node:test";
import { runCli } from "../src/cli.ts";

class Capture {
  value = "";
  write(chunk: string): void { this.value += chunk; }
}

const fixturePath = fileURLToPath(new URL("./fixtures/codex-0.145.0-failure-followup.jsonl", import.meta.url));

test("inspect, build, and verify form the narrow CLI loop", async () => {
  const root = await mkdtemp(join(tmpdir(), "codex-workprint-cli-"));
  try {
    const inspectOut = new Capture();
    const inspectErr = new Capture();
    const inspectCode = await runCli(["inspect", fixturePath], { stdout: inspectOut, stderr: inspectErr });
    assert.equal(inspectCode, 0);
    assert.match(inspectOut.value, /ORDERED PUBLIC PREVIEW/);
    assert.match(inspectOut.value, /not a recovery claim/i);
    assert.equal(inspectOut.value.includes("Invoke-PrivateFailure"), false);
    assert.equal(inspectErr.value, "");

    const output = join(root, "public-bundle");
    const buildOut = new Capture();
    const buildCode = await runCli([
      "build", fixturePath,
      "--title", "CLI release candidate",
      "--annotate", "4:verify:Explicit public check",
      "--out", output,
    ], { stdout: buildOut, stderr: new Capture() });
    assert.equal(buildCode, 0);
    assert.match(buildOut.value, /WORKPRINT READY/);
    assert.match(buildOut.value, /private categories excluded/);
    assert.match(buildOut.value, /Receipt, not attestation/);

    const verifyOut = new Capture();
    const verifyCode = await runCli(["verify", output], { stdout: verifyOut, stderr: new Capture() });
    assert.equal(verifyCode, 0);
    assert.match(verifyOut.value, /VERIFIED 7 public bundle files/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("stdin, open, and opt-in public identity form the 90-second first-run path", async () => {
  const root = await mkdtemp(join(tmpdir(), "codex-workprint-stdin-"));
  try {
    const input = await readFile(fixturePath, "utf8");
    const output = join(root, "workprint");
    const opened: string[] = [];
    const stdout = new Capture();
    const code = await runCli([
      "build", "-", "--title", "修复登录失败并验证发布", "--out", output, "--open",
      "--project", "公开项目", "--by", "@public", "--release", "v0.3",
      "--public-url", "https://example.test/workprint/", "--lang", "zh-Hans",
    ], {
      stdout,
      stderr: new Capture(),
      stdin: Readable.from([input]),
      openPath: (path) => { opened.push(path); },
    });
    assert.equal(code, 0);
    assert.equal(opened.length, 1);
    assert.match(opened[0], /workprint\.html$/);
    assert.match(stdout.value, /Story open requested/);
    const ir = JSON.parse(await readFile(join(output, "workprint.json"), "utf8"));
    assert.deepEqual(ir.run.publicIdentity, {
      project: "公开项目",
      by: "@public",
      release: "v0.3",
      publicUrl: "https://example.test/workprint/",
      language: "zh-Hans",
    });
    assert.ok(ir.privacy.explicitPublicFields.includes("run.publicIdentity.publicUrl"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("build requires an explicit public title", async () => {
  const stderr = new Capture();
  const code = await runCli(["build", fixturePath, "--out", "unused"], { stdout: new Capture(), stderr });
  assert.equal(code, 2);
  assert.match(stderr.value, /requires --title/);
});

test("public URL fails closed unless it is query-free, credential-free HTTPS", async () => {
  for (const value of ["http://example.test/", "https://user:secret@example.test/", "https://example.test/#fragment", "https://example.test/workprint?token=SECRET_SIGNED_VALUE", "https://example.test/workprint?"]) {
    const stderr = new Capture();
    const code = await runCli(["inspect", fixturePath, "--public-url", value], { stdout: new Capture(), stderr });
    assert.equal(code, 1);
    assert.match(stderr.value, /Public URL/);
  }
});
