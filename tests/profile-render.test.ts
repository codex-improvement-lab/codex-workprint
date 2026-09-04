import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { adaptWorkprintProfileJson } from "../src/profile/input.ts";
import { renderProfileHtml } from "../src/profile/render/html.ts";
import { normalizeProfileBitmapText, renderProfileShareCardPng, renderProfileTriptychPng } from "../src/profile/render/png.ts";
import { renderProfileSvg } from "../src/profile/render/svg.ts";

const names = ["continuity-archive-migration", "goal-delta-offline-release", "context-receipt-observation-gap"];

test("three profile renderers share a family while keeping seam, fault, and slice signatures", async () => {
  const profiles = [];
  for (const name of names) {
    const input = await readFile(new URL(`../examples/profile/${name}/profile.json`, import.meta.url), "utf8");
    const profile = adaptWorkprintProfileJson(input).profile;
    profiles.push(profile);
    const html = renderProfileHtml(profile);
    const svg = renderProfileSvg(profile);
    const png = renderProfileShareCardPng(profile);
    assert.match(html, /connect-src 'none'/);
    assert.match(html, /data-finding-id/);
    assert.match(html, /data-source-id/);
    assert.match(html, /Source evidence rail/);
    assert.match(html, /supplied public projection, not attestation/i);
    assert.equal(/\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/.test(html), false);
    assert.equal((html.match(/https?:\/\//g) ?? []).length, 1);
    assert.equal((svg.match(/https?:\/\//g) ?? []).length, 1);
    assert.match(svg, new RegExp(profile.visualForm.toUpperCase()));
    assert.deepEqual(Array.from(png.subarray(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(readU32(png, 16), 1200);
    assert.equal(readU32(png, 20), 630);
    const executableScript = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
    assert.ok(executableScript);
    assert.doesNotThrow(() => new Function(executableScript));
  }
  const triptych = renderProfileTriptychPng(profiles);
  assert.equal(readU32(triptych, 16), 1200);
  assert.equal(readU32(triptych, 20), 630);
  assert.deepEqual(triptych, renderProfileTriptychPng(profiles));
});

test("profile bitmap text deterministically normalizes supported public punctuation without accidental question marks", () => {
  assert.equal(normalizeProfileBitmapText("Handoff Receipt · Research — archive"), "HANDOFF RECEIPT / RESEARCH - ARCHIVE");
  assert.equal(normalizeProfileBitmapText("Goal Delta · Offline release"), "GOAL DELTA / OFFLINE RELEASE");
  assert.equal(normalizeProfileBitmapText("carried / invented"), "CARRIED / INVENTED");
});

function readU32(bytes: Uint8Array, offset: number): number {
  return bytes[offset] * 0x1000000 + bytes[offset + 1] * 0x10000 + bytes[offset + 2] * 0x100 + bytes[offset + 3];
}
