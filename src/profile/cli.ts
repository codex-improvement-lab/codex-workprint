import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import { canonicalJson } from "../core/canonical.ts";
import { PACKAGE_VERSION } from "../version.ts";
import { verifyProfileBundle, writeProfileBundle } from "./bundle.ts";
import { adaptWorkprintProfileJson, ProfileInputError } from "./input.ts";

interface Writable {
  write(chunk: string): unknown;
}

interface CliIo {
  stdout: Writable;
  stderr: Writable;
}

interface ParsedProfileCli {
  action: "inspect" | "build" | "verify";
  input: string;
  output?: string;
  json: boolean;
}

const MAX_PROFILE_INPUT_BYTES = 16 * 1024 * 1024;

export async function runProfileCli(args: string[], io: CliIo): Promise<number> {
  if (args.length === 0 || args[0] === "help" || args.includes("--help") || args.includes("-h")) {
    io.stdout.write(profileHelpText());
    return 0;
  }
  let parsed: ParsedProfileCli;
  try {
    parsed = parseProfileCli(args);
  } catch (error) {
    io.stderr.write(`Usage error: ${messageOf(error)}\n\n${profileHelpText()}`);
    return 2;
  }
  try {
    if (parsed.action === "verify") {
      const report = await verifyProfileBundle(parsed.input);
      if (parsed.json) io.stdout.write(canonicalJson(report));
      else if (report.ok) io.stdout.write(`VERIFIED ${report.checkedFiles.length} profile bundle files · ${report.profile}.\n`);
      else {
        io.stderr.write("PROFILE DRIFT DETECTED\n");
        report.errors.forEach((error) => io.stderr.write(`- ${error}\n`));
      }
      return report.ok ? 0 : 1;
    }
    const input = await readProfileJson(parsed.input);
    const adapted = adaptWorkprintProfileJson(input);
    if (parsed.action === "inspect") {
      if (parsed.json) io.stdout.write(canonicalJson(adapted.inspection));
      else io.stdout.write(renderProfileInspection(basename(parsed.input), adapted));
      return 0;
    }
    await writeProfileBundle(parsed.output as string, adapted.profile);
    io.stdout.write(
      `BUILT 7-file ${adapted.profile.profile} Profile Workprint bundle at ${parsed.output}\n` +
      `Profile IR ${adapted.profile.source.profileIrSha256}\n` +
      `Unknown extension fields were not published.\n`,
    );
    return 0;
  } catch (error) {
    const prefix = error instanceof ProfileInputError ? "Profile input rejected" : "Profile Workprint failed";
    io.stderr.write(`${prefix}: ${sanitizeError(messageOf(error))}\n`);
    return 1;
  }
}

function parseProfileCli(args: string[]): ParsedProfileCli {
  const action = args[0];
  if (action !== "inspect" && action !== "build" && action !== "verify") {
    throw new Error(`Unknown profile action: ${action}.`);
  }
  const positional: string[] = [];
  let output: string | undefined;
  let json = false;
  for (let index = 1; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--json") {
      json = true;
      continue;
    }
    if (value === "--out") {
      const next = args[index + 1];
      if (next === undefined) throw new Error("--out requires a value.");
      output = next;
      index += 1;
      continue;
    }
    if (value.startsWith("-")) throw new Error(`Unknown option: ${value}.`);
    positional.push(value);
  }
  if (positional.length !== 1) throw new Error(`${action} requires exactly one input path.`);
  if (action === "build" && !output) throw new Error("profile build requires --out <directory>.");
  if (action !== "build" && output) throw new Error("--out is only valid with profile build.");
  if (action === "build" && json) throw new Error("--json is only valid with profile inspect or profile verify.");
  return { action, input: positional[0], ...(output ? { output } : {}), json };
}

async function readProfileJson(path: string): Promise<string> {
  let details;
  try {
    details = await stat(path);
  } catch {
    throw new Error(`Profile input file ${basename(path)} is not readable.`);
  }
  if (!details.isFile()) throw new Error(`Profile input ${basename(path)} is not a regular file.`);
  if (details.size > MAX_PROFILE_INPUT_BYTES) throw new Error("Profile input exceeds the 16 MiB limit.");
  return readFile(path, "utf8");
}

function renderProfileInspection(inputName: string, adapted: ReturnType<typeof adaptWorkprintProfileJson>): string {
  const { inspection, profile } = adapted;
  const lines = [
    `CODEX WORKPRINT PROFILE INSPECT · ${inputName}`,
    `${inspection.profile} · ${inspection.question}`,
    `Title: ${inspection.title}`,
    `Source revision: ${inspection.sourceRevision}`,
    `Sources: ${inspection.sourceCount} · Findings: ${inspection.findingCount} · Traced findings: ${inspection.tracedFindingCount}`,
    `Profile IR: ${inspection.profileIrSha256}`,
    `Ignored extension fields: ${inspection.ignoredExtensionFields}; ignored fields do not affect bundle bytes`,
    "",
    "VERDICTS",
    ...Object.entries(inspection.verdictCounts).map(([verdict, count]) => `- ${verdict}: ${count}`),
    "",
    "FINDINGS → SOURCES",
    ...profile.findings.map((finding) => `- ${finding.verdict} · ${finding.subject} → ${finding.sourceRefs.join(", ") || "no source ref supplied"}`),
    "",
    "RETAINED PUBLIC FIELDS",
    ...inspection.retainedFields.map((field) => `+ ${field}`),
    "",
    "CLAIM CEILING",
    ...inspection.claimCeiling.map((claim) => `- ${claim}`),
    "",
  ];
  return lines.join("\n");
}

export function profileHelpText(): string {
  return `Codex Workprint ${PACKAGE_VERSION} · Unified Profiles\n\n` +
    "Three questions. One Workprint. The work has a state.\n\n" +
    "Usage:\n" +
    "  codex-workprint profile inspect <profile.json> [--json]\n" +
    "  codex-workprint profile build <profile.json> --out <directory>\n" +
    "  codex-workprint profile verify <directory> [--json]\n\n" +
    "Profiles: continuity, goal-delta, context-receipt.\n" +
    "profile build writes: workprint-profile.html, workprint-profile.svg, share-card.png, embed.md, workprint-profile.json, profile-receipt.json, MANIFEST.sha256\n";
}

function sanitizeError(value: string): string {
  return value.replace(/[\r\n]+/g, " ").slice(0, 500);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

