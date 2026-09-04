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
import { canonicalJson, codePointCompare } from "./core/canonical.ts";
import { sha256 } from "./core/hash.ts";
import { assertValidWorkprintIR } from "./core/ir.ts";
import type { WorkprintIR } from "./core/types.ts";
import { renderWorkprintHtml } from "./render/html.ts";
import { PNG_RENDERER_ID, renderShareCardPng } from "./render/png.ts";
import { renderWorkprintSvg } from "./render/svg.ts";
import { createPrivacyReceipt, renderEmbedMarkdown } from "./render/text.ts";

export const PUBLIC_BUNDLE_FILES = [
  "MANIFEST.sha256",
  "embed.md",
  "privacy-receipt.json",
  "share-card.png",
  "workprint.html",
  "workprint.json",
  "workprint.svg",
] as const;

type BundleFileName = (typeof PUBLIC_BUNDLE_FILES)[number];
type FileBytes = string | Uint8Array;

export interface VerificationReport {
  ok: boolean;
  checkedFiles: string[];
  errors: string[];
}

export function renderPublicBundle(workprint: WorkprintIR): Map<BundleFileName, FileBytes> {
  assertValidWorkprintIR(workprint);
  if (workprint.render.pngRenderer !== PNG_RENDERER_ID) {
    throw new Error(`PNG renderer mismatch: IR requests ${workprint.render.pngRenderer}.`);
  }

  const files = new Map<BundleFileName, FileBytes>();
  files.set("embed.md", renderEmbedMarkdown(workprint));
  files.set("privacy-receipt.json", canonicalJson(createPrivacyReceipt(workprint)));
  files.set("share-card.png", renderShareCardPng(workprint));
  files.set("workprint.html", renderWorkprintHtml(workprint));
  files.set("workprint.json", canonicalJson(workprint));
  files.set("workprint.svg", renderWorkprintSvg(workprint));
  files.set("MANIFEST.sha256", renderManifest(files));
  return new Map([...files.entries()].sort(([left], [right]) => codePointCompare(left, right)));
}

export async function writePublicBundle(outputDirectory: string, workprint: WorkprintIR): Promise<void> {
  const target = resolve(outputDirectory);
  const parent = dirname(target);
  const targetName = basename(target);
  if (!targetName || targetName === "." || targetName === "..") {
    throw new Error("Output directory must name a dedicated Workprint folder.");
  }
  await mkdir(parent, { recursive: true });
  await assertTargetAvailable(target);

  const temporary = join(parent, `.${targetName}.workprint-tmp-${process.pid}-${Date.now()}`);
  if (dirname(temporary) !== parent || !basename(temporary).startsWith(`.${targetName}.workprint-tmp-`)) {
    throw new Error("Could not establish a safe temporary output path.");
  }

  const files = renderPublicBundle(workprint);
  await mkdir(temporary, { recursive: false });
  try {
    for (const [name, bytes] of files) {
      await writeFile(join(temporary, name), bytes, { flag: "wx" });
    }
    if (await pathExists(target)) {
      await rmdir(target);
    }
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
}

export async function verifyPublicBundle(directory: string): Promise<VerificationReport> {
  const target = resolve(directory);
  const errors: string[] = [];
  const checkedFiles: string[] = [];

  let names: string[];
  try {
    names = (await readdir(target)).sort(codePointCompare);
  } catch {
    return { ok: false, checkedFiles, errors: ["Bundle directory is not readable."] };
  }

  const expectedNames = [...PUBLIC_BUNDLE_FILES].sort(codePointCompare);
  const unexpected = names.filter((name) => !expectedNames.includes(name as BundleFileName));
  const missing = expectedNames.filter((name) => !names.includes(name));
  if (unexpected.length) errors.push(`Unexpected files: ${unexpected.join(", ")}.`);
  if (missing.length) errors.push(`Missing files: ${missing.join(", ")}.`);
  if (missing.includes("workprint.json")) return { ok: false, checkedFiles, errors };

  let workprint: WorkprintIR;
  try {
    const workprintPath = join(target, "workprint.json");
    if ((await lstat(workprintPath)).isSymbolicLink()) throw new Error("symbolic link");
    const parsed = JSON.parse(await readFile(workprintPath, "utf8")) as unknown;
    assertValidWorkprintIR(parsed);
    workprint = parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown integrity error";
    errors.push(`workprint.json is invalid: ${message}`);
    return { ok: false, checkedFiles, errors };
  }

  let regenerated: Map<BundleFileName, FileBytes>;
  try {
    regenerated = renderPublicBundle(workprint);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown renderer error";
    errors.push(`Bundle cannot be deterministically regenerated: ${message}`);
    return { ok: false, checkedFiles, errors };
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
      const expected = regenerated.get(name as BundleFileName);
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

  return { ok: errors.length === 0, checkedFiles, errors };
}

function renderManifest(files: Map<BundleFileName, FileBytes>): string {
  return [...files.entries()]
    .filter(([name]) => name !== "MANIFEST.sha256")
    .sort(([left], [right]) => codePointCompare(left, right))
    .map(([name, bytes]) => {
      const value = typeof bytes === "string" ? Buffer.from(bytes, "utf8") : bytes;
      return `${sha256(value)}  ${name}`;
    })
    .join("\n") + "\n";
}

async function assertTargetAvailable(target: string): Promise<void> {
  try {
    const stats = await lstat(target);
    if (stats.isSymbolicLink() || !stats.isDirectory()) {
      throw new Error("Output path already exists and is not an empty directory.");
    }
    const entries = await readdir(target);
    if (entries.length > 0) {
      throw new Error("Output directory already exists and is not empty; choose a new directory.");
    }
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
