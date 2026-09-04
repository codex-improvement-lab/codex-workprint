import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PROFILE_BUNDLE_FILES, renderProfileBundle, verifyProfileBundle } from "../src/profile/bundle.ts";
import { adaptWorkprintProfileJson } from "../src/profile/input.ts";
import { renderProfileTriptychPng } from "../src/profile/render/png.ts";
import { codePointCompare } from "../src/core/canonical.ts";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const refresh = process.argv.includes("--refresh");
const examples = [
  "continuity-archive-migration",
  "goal-delta-offline-release",
  "context-receipt-observation-gap",
].map((name) => ({
  name,
  source: join(projectRoot, "examples", "profile", name, "profile.json"),
  target: join(projectRoot, "examples", "profile", name, "workprint"),
}));

const profiles = [];
for (const example of examples) {
  const input = await readFile(example.source, "utf8");
  const { profile } = adaptWorkprintProfileJson(input);
  profiles.push(profile);
  if (refresh) await refreshKnownBundle(example.target, renderProfileBundle(profile));
  const report = await verifyProfileBundle(example.target);
  if (!report.ok) throw new Error(`${relative(example.target)} is not a valid profile bundle: ${report.errors.join(" ")}`);
  process.stdout.write(`VERIFIED ${relative(example.target)} · ${report.checkedFiles.length} files · ${report.profile}\n`);
}

const triptychPath = join(projectRoot, "docs", "assets", "workprint-profile-triptych.png");
const expectedTriptych = Buffer.from(renderProfileTriptychPng(profiles));
if (refresh) {
  await mkdir(dirname(triptychPath), { recursive: true });
  await writeFile(triptychPath, expectedTriptych);
}
const actualTriptych = await readFile(triptychPath).catch(() => null);
if (!actualTriptych?.equals(expectedTriptych)) {
  throw new Error(`${relative(triptychPath)} is missing or has drifted; run with --refresh.`);
}
process.stdout.write(`VERIFIED ${relative(triptychPath)} · 1200x630 deterministic triptych\n`);

async function refreshKnownBundle(target, files) {
  await mkdir(target, { recursive: true });
  const existing = (await readdir(target)).sort(codePointCompare);
  const expected = [...PROFILE_BUNDLE_FILES].sort(codePointCompare);
  const unexpected = existing.filter((name) => !expected.includes(name));
  if (unexpected.length) throw new Error(`Refusing to refresh ${relative(target)} with unexpected entries: ${unexpected.join(", ")}.`);
  for (const [name, bytes] of files) await writeFile(join(target, name), bytes);
}

function relative(path) {
  return path.slice(projectRoot.length + 1).replaceAll("\\", "/");
}

