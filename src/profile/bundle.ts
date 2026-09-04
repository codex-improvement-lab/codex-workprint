import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  rmdir,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { canonicalJson, codePointCompare } from "../core/canonical.ts";
import { sha256 } from "../core/hash.ts";
import { assertValidProfileIR } from "./ir.ts";
import type { WorkprintProfileIR } from "./types.ts";
import { renderProfileHtml } from "./render/html.ts";
import { renderProfileShareCardPng } from "./render/png.ts";
import { renderProfileSvg } from "./render/svg.ts";
import { createProfileReceipt, renderProfileEmbedMarkdown } from "./render/text.ts";

export const PROFILE_BUNDLE_FILES = [
  "MANIFEST.sha256",
  "embed.md",
  "profile-receipt.json",
  "share-card.png",
  "workprint-profile.html",
  "workprint-profile.json",
  "workprint-profile.svg",
] as const;

type ProfileBundleFileName = (typeof PROFILE_BUNDLE_FILES)[number];
type FileBytes = string | Uint8Array;

export interface ProfileVerificationReport {
  ok: boolean;
  bundleType: "profile";
  profile: WorkprintProfileIR["profile"] | null;
  checkedFiles: string[];
  errors: string[];
}

export function renderProfileBundle(profile: WorkprintProfileIR): Map<ProfileBundleFileName, FileBytes> {
  assertValidProfileIR(profile);
  const files = new Map<ProfileBundleFileName, FileBytes>();
  files.set("embed.md", renderProfileEmbedMarkdown(profile));
  files.set("profile-receipt.json", canonicalJson(createProfileReceipt(profile)));
  files.set("share-card.png", renderProfileShareCardPng(profile));
  files.set("workprint-profile.html", renderProfileHtml(profile));
  files.set("workprint-profile.json", canonicalJson(profile));
  files.set("workprint-profile.svg", renderProfileSvg(profile));
  files.set("MANIFEST.sha256", renderManifest(files));
  return new Map([...files.entries()].sort(([left], [right]) => codePointCompare(left, right)));
}

export async function writeProfileBundle(outputDirectory: string, profile: WorkprintProfileIR): Promise<void> {
  const target = resolve(outputDirectory);
  const parent = dirname(target);
  const targetName = basename(target);
  if (!targetName || targetName === "." || targetName === "..") {
    throw new Error("Output directory must name a dedicated Profile Workprint folder.");
  }
  await mkdir(parent, { recursive: true });
  await assertTargetAvailable(target);
  const temporary = join(parent, `.${targetName}.profile-workprint-tmp-${process.pid}-${Date.now()}`);
  if (dirname(temporary) !== parent || !basename(temporary).startsWith(`.${targetName}.profile-workprint-tmp-`)) {
    throw new Error("Could not establish a safe Profile Workprint temporary path.");
  }
  const files = renderProfileBundle(profile);
  await mkdir(temporary, { recursive: false });
  try {
    for (const [name, bytes] of files) await writeFile(join(temporary, name), bytes, { flag: "wx" });
    if (await pathExists(target)) await rmdir(target);
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
}

export async function verifyProfileBundle(directory: string): Promise<ProfileVerificationReport> {
  const target = resolve(directory);
  const errors: string[] = [];
  const checkedFiles: string[] = [];
  let names: string[];
  try {
    names = (await readdir(target)).sort(codePointCompare);
  } catch {
    return { ok: false, bundleType: "profile", profile: null, checkedFiles, errors: ["Profile bundle directory is not readable."] };
  }
  const expectedNames = [...PROFILE_BUNDLE_FILES].sort(codePointCompare);
  const unexpected = names.filter((name) => !expectedNames.includes(name as ProfileBundleFileName));
  const missing = expectedNames.filter((name) => !names.includes(name));
  if (unexpected.length) errors.push(`Unexpected files for a profile bundle: ${unexpected.join(", ")}.`);
  if (missing.length) errors.push(`Missing profile bundle files: ${missing.join(", ")}.`);
  if (missing.includes("workprint-profile.json")) {
    return { ok: false, bundleType: "profile", profile: null, checkedFiles, errors };
  }

  let profile: WorkprintProfileIR;
  try {
    const profilePath = join(target, "workprint-profile.json");
    if ((await lstat(profilePath)).isSymbolicLink()) throw new Error("symbolic link");
    const parsed = JSON.parse(await readFile(profilePath, "utf8")) as unknown;
    assertValidProfileIR(parsed);
    profile = parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown integrity error";
    errors.push(`workprint-profile.json is invalid: ${message}`);
    return { ok: false, bundleType: "profile", profile: null, checkedFiles, errors };
  }

  let regenerated: Map<ProfileBundleFileName, FileBytes>;
  try {
    regenerated = renderProfileBundle(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown renderer error";
    errors.push(`Profile bundle cannot be deterministically regenerated: ${message}`);
    return { ok: false, bundleType: "profile", profile: profile.profile, checkedFiles, errors };
  }
  for (const name of expectedNames) {
    if (!names.includes(name)) continue;
    try {
      const path = join(target, name);
      if ((await lstat(path)).isSymbolicLink()) {
        errors.push(`${name} is a symbolic link.`);
        continue;
      }
      const actual = await readFile(path);
      const expected = regenerated.get(name as ProfileBundleFileName);
      if (expected === undefined) {
        errors.push(`${name} is not reproducible.`);
        continue;
      }
      const expectedBytes = typeof expected === "string" ? Buffer.from(expected, "utf8") : Buffer.from(expected);
      if (!actual.equals(expectedBytes)) errors.push(`${name} has drifted.`);
      checkedFiles.push(name);
    } catch {
      errors.push(`${name} could not be checked.`);
    }
  }
  return { ok: errors.length === 0, bundleType: "profile", profile: profile.profile, checkedFiles, errors };
}

function renderManifest(files: Map<ProfileBundleFileName, FileBytes>): string {
  return [...files.entries()]
    .filter(([name]) => name !== "MANIFEST.sha256")
    .sort(([left], [right]) => codePointCompare(left, right))
    .map(([name, bytes]) => `${sha256(typeof bytes === "string" ? Buffer.from(bytes, "utf8") : bytes)}  ${name}`)
    .join("\n") + "\n";
}

async function assertTargetAvailable(target: string): Promise<void> {
  try {
    const stats = await lstat(target);
    if (stats.isSymbolicLink() || !stats.isDirectory()) throw new Error("Output path already exists and is not an empty directory.");
    if ((await readdir(target)).length > 0) throw new Error("Output directory already exists and is not empty; choose a new directory.");
  } catch (error) {
    if (isMissing(error)) return;
    throw error;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }
}

function isMissing(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT");
}

