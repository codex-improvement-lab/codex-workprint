import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { basename, resolve } from "node:path";
import {
  adaptCodexJsonl,
  WorkprintInputError,
} from "./adapter/codex-jsonl-v0_1.ts";
import { writePublicBundle, verifyPublicBundle } from "./bundle.ts";
import { canonicalJson } from "./core/canonical.ts";
import type { AdapterOptions, PublicAnnotation, PublicPhase } from "./core/types.ts";
import { PACKAGE_VERSION } from "./version.ts";
import { runProfileCli } from "./profile/cli.ts";

interface Writable {
  write(chunk: string): unknown;
}

interface ReadableInput extends AsyncIterable<string | Uint8Array> {}

export interface CliIo {
  stdout: Writable;
  stderr: Writable;
  stdin?: ReadableInput;
  openPath?: (path: string) => void | Promise<void>;
}

interface ParsedCli {
  action: "inspect" | "build" | "verify";
  input: string;
  output?: string;
  title?: string;
  labels: string[];
  annotations: PublicAnnotation[];
  project?: string;
  by?: string;
  release?: string;
  publicUrl?: string;
  language?: string;
  open: boolean;
  json: boolean;
}

const MAX_INPUT_BYTES = 64 * 1024 * 1024;
const PUBLIC_PHASES = new Set<PublicPhase>(["inspect", "edit", "verify", "recover", "deliver"]);

export async function runCli(args: string[], io: CliIo): Promise<number> {
  if (args.length === 0 || args.includes("--help") || args.includes("-h") || args[0] === "help") {
    io.stdout.write(helpText());
    return 0;
  }
  if (args.includes("--version") || args.includes("-v")) {
    io.stdout.write(`${PACKAGE_VERSION}\n`);
    return 0;
  }

  if (args[0] === "profile") return runProfileCli(args.slice(1), io);

  let parsed: ParsedCli;
  try {
    parsed = parseCli(args);
  } catch (error) {
    io.stderr.write(`Usage error: ${messageOf(error)}\n\n${helpText()}`);
    return 2;
  }

  try {
    if (parsed.action === "verify") {
      const report = await verifyPublicBundle(parsed.input);
      if (parsed.json) io.stdout.write(canonicalJson(report));
      else if (report.ok) io.stdout.write(`VERIFIED ${report.checkedFiles.length} public bundle files; no drift observed.\n`);
      else {
        io.stderr.write("DRIFT DETECTED\n");
        for (const error of report.errors) io.stderr.write(`- ${error}\n`);
      }
      return report.ok ? 0 : 1;
    }

    const input = await readJsonl(parsed.input, io.stdin);
    const options: AdapterOptions = {
      ...(parsed.title !== undefined ? { title: parsed.title } : {}),
      ...(parsed.labels.length ? { labels: parsed.labels } : {}),
      ...(parsed.annotations.length ? { annotations: parsed.annotations } : {}),
      ...(parsed.project !== undefined ? { project: parsed.project } : {}),
      ...(parsed.by !== undefined ? { by: parsed.by } : {}),
      ...(parsed.release !== undefined ? { release: parsed.release } : {}),
      ...(parsed.publicUrl !== undefined ? { publicUrl: parsed.publicUrl } : {}),
      ...(parsed.language !== undefined ? { language: parsed.language } : {}),
    };
    const adapted = adaptCodexJsonl(input, options);

    if (parsed.action === "inspect") {
      if (parsed.json) io.stdout.write(canonicalJson(adapted.inspection));
      else io.stdout.write(renderInspection(basename(parsed.input), adapted));
      return 0;
    }

    await writePublicBundle(parsed.output as string, adapted.workprint);
    const storyPath = resolve(parsed.output as string, "workprint.html");
    const cardPath = resolve(parsed.output as string, "share-card.png");
    if (parsed.open) {
      if (io.openPath) await io.openPath(storyPath);
      else openDefault(storyPath);
    }
    io.stdout.write(
      `WORKPRINT READY\n` +
      `${adapted.workprint.observations.length} public observations\n` +
      `${adapted.workprint.privacy.excludedCategories.length} private categories excluded\n` +
      `Story ${storyPath}\n` +
      `Card ${cardPath}\n` +
      `Verify codex-workprint verify "${resolve(parsed.output as string)}"\n` +
      `${parsed.open ? "Story open requested.\n" : ""}` +
      `Receipt, not attestation; raw JSONL values and raw input digest were not published.\n`,
    );
    return 0;
  } catch (error) {
    const prefix = error instanceof WorkprintInputError ? "Input rejected" : "Workprint failed";
    io.stderr.write(`${prefix}: ${sanitizeError(messageOf(error))}\n`);
    return 1;
  }
}

function parseCli(args: string[]): ParsedCli {
  const action = args[0];
  if (action !== "inspect" && action !== "build" && action !== "verify") {
    throw new Error(`Unknown action: ${action}.`);
  }
  const positional: string[] = [];
  const labels: string[] = [];
  const annotations: PublicAnnotation[] = [];
  let output: string | undefined;
  let title: string | undefined;
  let project: string | undefined;
  let by: string | undefined;
  let release: string | undefined;
  let publicUrl: string | undefined;
  let language: string | undefined;
  let open = false;
  let json = false;

  for (let index = 1; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--json") {
      json = true;
      continue;
    }
    if (value === "--open") {
      open = true;
      continue;
    }
    if (["--out", "--title", "--label", "--annotate", "--project", "--by", "--release", "--public-url", "--lang"].includes(value)) {
      const next = args[index + 1];
      if (next === undefined) throw new Error(`${value} requires a value.`);
      index += 1;
      if (value === "--out") output = next;
      else if (value === "--title") title = next;
      else if (value === "--label") labels.push(next);
      else if (value === "--annotate") annotations.push(parseAnnotation(next));
      else if (value === "--project") project = next;
      else if (value === "--by") by = next;
      else if (value === "--release") release = next;
      else if (value === "--public-url") publicUrl = next;
      else language = next;
      continue;
    }
    if (value !== "-" && value.startsWith("-")) throw new Error(`Unknown option: ${value}.`);
    positional.push(value);
  }

  if (positional.length !== 1) throw new Error(`${action} requires exactly one input path.`);
  if (action === "build" && !output) throw new Error("build requires --out <directory>.");
  if (action === "build" && title === undefined) throw new Error("build requires --title <public title>.");
  if (action !== "build" && output) throw new Error("--out is only valid with build.");
  if (action !== "build" && open) throw new Error("--open is only valid with build.");
  if (action === "verify" && (title !== undefined || labels.length || annotations.length || project !== undefined || by !== undefined || release !== undefined || publicUrl !== undefined || language !== undefined)) {
    throw new Error("verify accepts only a bundle directory and optional --json.");
  }

  return {
    action,
    input: positional[0],
    ...(output ? { output } : {}),
    ...(title !== undefined ? { title } : {}),
    labels,
    annotations,
    ...(project !== undefined ? { project } : {}),
    ...(by !== undefined ? { by } : {}),
    ...(release !== undefined ? { release } : {}),
    ...(publicUrl !== undefined ? { publicUrl } : {}),
    ...(language !== undefined ? { language } : {}),
    open,
    json,
  };
}

function parseAnnotation(value: string): PublicAnnotation {
  const [sequenceText, phaseText, ...labelParts] = value.split(":");
  const sequence = Number(sequenceText);
  const phase = phaseText as PublicPhase;
  if (!Number.isSafeInteger(sequence) || sequence < 1 || !PUBLIC_PHASES.has(phase)) {
    throw new Error("--annotate must be SEQUENCE:PHASE[:PUBLIC LABEL].");
  }
  const label = labelParts.join(":").trim();
  return { sequence, phase, ...(label ? { label } : {}) };
}

async function readJsonl(path: string, stdin?: ReadableInput): Promise<string> {
  if (path === "-") return readStdin(stdin);
  let details;
  try {
    details = await stat(path);
  } catch {
    throw new Error(`Input file ${basename(path)} is not readable.`);
  }
  if (!details.isFile()) throw new Error(`Input ${basename(path)} is not a regular file.`);
  if (details.size > MAX_INPUT_BYTES) throw new Error("Input exceeds the 64 MiB first-release limit.");
  return readFile(path, "utf8");
}

async function readStdin(stdin?: ReadableInput): Promise<string> {
  if (!stdin) throw new Error("Input '-' requires JSONL on stdin.");
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of stdin) {
    const buffer = typeof chunk === "string" ? Buffer.from(chunk, "utf8") : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_INPUT_BYTES) throw new Error("Input exceeds the 64 MiB first-release limit.");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function openDefault(path: string): void {
  const command = process.platform === "win32" ? "explorer.exe" : process.platform === "darwin" ? "open" : "xdg-open";
  const child = spawn(command, [path], { detached: true, stdio: "ignore", windowsHide: true });
  child.on("error", () => {});
  child.unref();
}

function renderInspection(
  inputName: string,
  adapted: ReturnType<typeof adaptCodexJsonl>,
): string {
  const { inspection, workprint } = adapted;
  const lines = [
    `CODEX WORKPRINT INSPECT · ${inputName}`,
    `Public observations: ${inspection.observationCount} (${inspection.recognizedEvents} recognized events, ${inspection.unknownEvents} visible unknown, ${inspection.malformedRecords} malformed)`,
    `Timing: ${inspection.timing}; no duration or offsets emitted`,
    `Shape: ${inspection.shapeSha256}`,
    `Public IR: ${inspection.publicIrSha256}`,
    "",
    "RETAINED",
    ...inspection.retainedCategories.map((entry) => `+ ${entry}`),
    "",
    "EXCLUDED",
    ...inspection.excludedCategories.map((entry) => `- ${entry}`),
    "",
    "EXCLUDED FIELD OCCURRENCES (COUNTS ONLY)",
    ...Object.entries(inspection.excludedFieldOccurrences).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "ORDERED PUBLIC PREVIEW",
    ...workprint.observations.map((observation) => {
      const exit = observation.exitCode === null ? "not-observed" : String(observation.exitCode);
      const phase = observation.publicPhase ?? "not-annotated";
      return `#${observation.sequence} ${observation.eventType} ${observation.itemType ?? "not-observed"} status=${observation.status} exit=${exit} phase=${phase}`;
    }),
    "",
    "CLAIM CEILING",
    "Command text and output are not used to infer inspect/edit/verify/recover/deliver.",
    "A completed turn is an observed event, not proof of correctness. A post-failure completion is not a recovery claim.",
    "Run build with only the title, labels, and annotations you intend to publish.",
    "",
  ];
  return lines.join("\n");
}

function helpText(): string {
  return `Codex Workprint ${PACKAGE_VERSION}\n\n` +
    "Turn one Codex run into a privacy-safe, verifiable visual receipt.\n" +
    "No prompts. No code. No uploads.\n\n" +
    "Usage:\n" +
    "  codex-workprint inspect <run.jsonl> [--title <public title>] [--label <public label>] [--annotate <sequence:phase[:public label]>] [--json]\n" +
    "  codex-workprint build <run.jsonl|-> --title <public title> --out <directory> [--open] [--label <public label>] [--annotate <sequence:phase[:public label]>]\n" +
    "      [--project <public project>] [--by <public handle>] [--release <public release>] [--public-url <https URL>] [--lang <BCP47>]\n" +
    "  codex-workprint verify <workprint-directory> [--json]\n\n" +
    "Unified Profiles:\n" +
    "  codex-workprint profile inspect <profile.json> [--json]\n" +
    "  codex-workprint profile build <profile.json> --out <directory>\n" +
    "  codex-workprint profile verify <directory> [--json]\n\n" +
    "Public phases: inspect, edit, verify, recover, deliver. They are never inferred from command text.\n" +
    "Pipe directly: codex exec --json \"<task>\" | codex-workprint build - --title \"<title>\" --out ./workprint --open\n" +
    "build writes: workprint.html, workprint.svg, share-card.png, embed.md, workprint.json, privacy-receipt.json, MANIFEST.sha256\n";
}

function sanitizeError(value: string): string {
  return value.replace(/[\r\n]+/g, " ").slice(0, 500);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
