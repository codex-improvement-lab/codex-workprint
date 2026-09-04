import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { adaptCodexJsonl } from "../src/adapter/codex-jsonl-v0_1.ts";
import { renderWorkprintHtml } from "../src/render/html.ts";
import { renderWorkprintSvg } from "../src/render/svg.ts";

test("HTML and SVG are self-contained, escaped, and observation-bounded", async () => {
  const input = await readFile(new URL("./fixtures/codex-0.145.0-failure-followup.jsonl", import.meta.url), "utf8");
  const { workprint } = adaptCodexJsonl(input, { title: `Ship <script>alert('x')</script>` });
  const html = renderWorkprintHtml(workprint);
  const svg = renderWorkprintSvg(workprint);

  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /completion observed after a failed item/i);
  assert.match(html, /not proof of correctness/i);
  assert.match(html, /codex exec --json/);
  assert.match(html, /codex-workprint build -/);
  assert.match(html, /Replay story/);
  assert.match(html, /Shift\+click opens the visible local copy fallback/);
  assert.match(html, /Share the work trace\. Keep the work private/);
  assert.match(html, /id="shareTop"/);
  assert.match(html, /id="downloadCard"/);
  assert.match(html, /id="copyCaption"/);
  assert.match(html, /id="verifyTop"/);
  assert.match(html, />Copy verify command<\/button>/);
  assert.match(html, /id="copyFallback"[\s\S]*Press Ctrl\/Cmd\+C to copy/);
  assert.match(html, /navigator\.share/);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /station-by-station replay started/i);
  assert.match(html, /data\.observations\.forEach/);
  assert.match(html, /event\.key !== 'Enter' && event\.key !== ' '/);
  assert.match(html, /data\.observations\.find\(\(observation\) => observation\.status === 'failed'/);
  assert.match(html, /Every agent run leaves a Workprint/);
  assert.match(html, /private categories excluded by default/);
  assert.match(html, /Mobile Workprint sequence/);
  assert.match(html, /The run is more than one curve/);
  assert.match(html, new RegExp(`SHAPE ${workprint.source.shapeSha256.slice(0, 12).toUpperCase()}`));
  assert.match(svg, new RegExp(`SHAPE ${workprint.source.shapeSha256.slice(0, 12).toUpperCase()}`));
  assert.match(svg, /01 · OBSERVED WORKLINE/);
  assert.match(svg, /02 · TURNING POINTS/);
  assert.match(svg, /03 · RUN RHYTHM \/ SEQUENCE, NOT TIME/);
  assert.match(svg, /TURN 01 · OBSERVED RANGE/);
  assert.equal(html.includes("<script>alert('x')</script>"), false);
  assert.equal(svg.includes("<script>alert('x')</script>"), false);
  assert.equal((html.match(/https?:\/\//g) ?? []).length, 1, "inline SVG namespace is the only URL-like token");
  assert.equal(/https?:\/\//.test(svg), true, "SVG namespace is the only URL-like token");
  assert.equal((svg.match(/https?:\/\//g) ?? []).length, 1);
  assert.match(svg, new RegExp(`>${workprint.summary.itemCompleted}<\\/text><text y="54" class="metric-label">COMPLETED<\\/text>`));
  assert.equal(svg.split(/\r?\n/).some((line) => /[ \t]+$/.test(line)), false);
  const executableScript = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
  assert.ok(executableScript, "interactive script is present");
  assert.doesNotThrow(() => new Function(executableScript), "interactive script parses as JavaScript");
});

test("Build yours is artifact-independent and cannot carry a public-title shell payload", async () => {
  const input = await readFile(new URL("./fixtures/codex-0.145.0-success.jsonl", import.meta.url), "utf8");
  const payloads = [
    "$(printf WORKPRINT_SHELL_INJECTION)",
    "`printf WORKPRINT_BACKTICK`",
    "\"; printf WORKPRINT_DOUBLE_QUOTE",
    "'; printf WORKPRINT_SINGLE_QUOTE",
    "\\; printf WORKPRINT_BACKSLASH",
    "; printf WORKPRINT_SEMICOLON",
    "& printf WORKPRINT_AMPERSAND",
    "| printf WORKPRINT_PIPE",
    "$env:WORKPRINT_POWERSHELL",
    "$(Write-Output WORKPRINT_POWERSHELL_SUBEXPRESSION)",
  ];
  for (const payload of payloads) {
    const workprint = adaptCodexJsonl(input, { title: payload }).workprint;
    const html = renderWorkprintHtml(workprint);
    const command = html.match(/<code class="command" id="command">([\s\S]*?)<\/code>/)?.[1];
    assert.equal(command, "codex exec --json &quot;&lt;your task&gt;&quot; | codex-workprint build - --title &quot;&lt;public title&gt;&quot; --out ./workprint --open");
    assert.equal(command?.includes("WORKPRINT_"), false);
  }
});

test("explicit public URL and language add share metadata without a page network client", async () => {
  const input = await readFile(new URL("./fixtures/codex-0.145.0-success.jsonl", import.meta.url), "utf8");
  const { workprint } = adaptCodexJsonl(input, {
    title: "公开工作凭证",
    publicUrl: "https://example.test/receipt/workprint.html",
    language: "zh-Hans",
    project: "公开项目",
  });
  const html = renderWorkprintHtml(workprint);
  assert.match(html, /<html lang="zh-Hans"/);
  assert.match(html, /rel="canonical" href="https:\/\/example\.test\/receipt\/workprint\.html"/);
  assert.match(html, /og:image" content="https:\/\/example\.test\/receipt\/share-card\.png"/);
  assert.match(html, /text: nativeShareText, url: publicUrl/);
  assert.equal(/navigator\.share\(\{[^}]*text: caption/.test(html), false);
  assert.equal(/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon/.test(html), false);
});
