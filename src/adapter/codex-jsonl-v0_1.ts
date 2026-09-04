import { canonicalJsonCompact } from "../core/canonical.ts";
import { sha256 } from "../core/hash.ts";
import { computeShapeSha256 } from "../core/shape.ts";
import type {
  AdapterOptions,
  InspectionReport,
  ObservationKind,
  ObservationStatus,
  PrivacyProjection,
  PublicAnnotation,
  PublicObservation,
  WorkprintIR,
  WorkprintSummary,
} from "../core/types.ts";
import { ADAPTER_VERSION, PNG_RENDERER_VERSION, RENDERER_VERSION, SCHEMA_VERSION } from "../version.ts";

export const PNG_RENDERER_DECLARATION = PNG_RENDERER_VERSION;

const EXCLUDED_CATEGORIES = [
  "prompts and instructions",
  "assistant message text and reasoning",
  "command text",
  "stdout, stderr, aggregated output, and tool responses",
  "absolute paths, file content, environment, and host metadata",
  "thread id, usage, token counts, model, account, organization, and implicit identity",
  "all unlisted nested fields",
  "raw JSONL digest",
] as const;

const RETAINED_CATEGORIES = [
  "recognized root event type",
  "pseudonymized item id for sequence association",
  "recognized item type",
  "explicit item status and integer exit code",
  "started and completed observations in source order",
  "explicit public title, labels, identity metadata, URL, language, and phase annotations",
  "visible unknown observations without source values",
] as const;

const EXCLUDED_KEY_CATEGORIES: Record<string, string> = {
  prompt: "prompt",
  input: "prompt",
  input_text: "prompt",
  instructions: "prompt",
  text: "assistantOrReasoningText",
  message: "assistantOrReasoningText",
  reasoning: "assistantOrReasoningText",
  summary: "assistantOrReasoningText",
  command: "commandText",
  cmd: "commandText",
  shell_command: "commandText",
  aggregated_output: "outputText",
  stdout: "outputText",
  stderr: "outputText",
  output: "outputText",
  tool_response: "outputText",
  response: "outputText",
  path: "pathEnvironmentOrContent",
  cwd: "pathEnvironmentOrContent",
  workdir: "pathEnvironmentOrContent",
  file_path: "pathEnvironmentOrContent",
  content: "pathEnvironmentOrContent",
  changes: "pathEnvironmentOrContent",
  env: "pathEnvironmentOrContent",
  environment: "pathEnvironmentOrContent",
  environment_variables: "pathEnvironmentOrContent",
  hostname: "pathEnvironmentOrContent",
  host: "pathEnvironmentOrContent",
  model: "identityOrUsage",
  account: "identityOrUsage",
  organization: "identityOrUsage",
  user: "identityOrUsage",
  username: "identityOrUsage",
  thread_id: "identityOrUsage",
  turn_id: "identityOrUsage",
  usage: "identityOrUsage",
  input_tokens: "identityOrUsage",
  output_tokens: "identityOrUsage",
  cached_input_tokens: "identityOrUsage",
  cache_write_input_tokens: "identityOrUsage",
  reasoning_output_tokens: "identityOrUsage",
  timestamp: "unlistedNestedOrTiming",
  created_at: "unlistedNestedOrTiming",
};

const KNOWN_ITEM_TYPES = new Set<ObservationKind>(["command_execution", "file_change", "agent_message"]);
const KNOWN_PHASES = new Set(["inspect", "edit", "verify", "recover", "deliver"]);

interface ParsedRecord {
  value: Record<string, unknown> | null;
  malformed: boolean;
}

export interface AdaptedWorkprint {
  workprint: WorkprintIR;
  inspection: InspectionReport;
}

export class WorkprintInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkprintInputError";
  }
}

export function adaptCodexJsonl(input: string, options: AdapterOptions = {}): AdaptedWorkprint {
  const records = parseJsonl(input);
  const excludedFieldOccurrences: Record<string, number> = {
    assistantOrReasoningText: 0,
    commandText: 0,
    identityOrUsage: 0,
    outputText: 0,
    pathEnvironmentOrContent: 0,
    prompt: 0,
    unlistedNestedOrTiming: 0,
  };
  const itemAliases = new Map<string, string>();
  const observations: PublicObservation[] = [];
  let recognizedEvents = 0;
  let unknownEvents = 0;
  let malformedRecords = 0;
  let turnCompletion: "observed" | "not-observed" = "not-observed";
  let observedFailureOpen = false;

  const emit = (observation: Omit<PublicObservation, "sequence" | "publicPhase" | "publicLabel">): void => {
    observations.push({
      sequence: observations.length + 1,
      ...observation,
      publicPhase: null,
      publicLabel: null,
    });
  };

  const emitUnknown = (): void => {
    unknownEvents += 1;
    emit({
      eventType: "unknown",
      itemId: null,
      itemType: "unknown",
      status: "not-observed",
      exitCode: null,
      afterObservedFailure: false,
    });
  };

  for (const record of records) {
    if (record.malformed || !record.value) {
      malformedRecords += 1;
      emitUnknown();
      continue;
    }

    countExcludedFields(record.value, excludedFieldOccurrences);
    const type = record.value.type;
    if (type === "thread.started") {
      recognizedEvents += 1;
      emit({
        eventType: "thread.started",
        itemId: null,
        itemType: "run",
        status: "observed",
        exitCode: null,
        afterObservedFailure: false,
      });
      continue;
    }

    if (type === "turn.started") {
      recognizedEvents += 1;
      emit({
        eventType: "turn.started",
        itemId: null,
        itemType: "turn",
        status: "observed",
        exitCode: null,
        afterObservedFailure: false,
      });
      continue;
    }

    if (type === "turn.completed") {
      recognizedEvents += 1;
      turnCompletion = "observed";
      emit({
        eventType: "turn.completed",
        itemId: null,
        itemType: "turn",
        status: "observed",
        exitCode: null,
        afterObservedFailure: false,
      });
      continue;
    }

    if (type === "item.started" || type === "item.completed") {
      const item = isPlainObject(record.value.item) ? record.value.item : null;
      const rawItemId = item && typeof item.id === "string" && item.id.length > 0 ? item.id : null;
      const rawItemType = item && typeof item.type === "string" ? item.type : null;
      if (!rawItemId || !rawItemType || !KNOWN_ITEM_TYPES.has(rawItemType as ObservationKind)) {
        emitUnknown();
        continue;
      }

      recognizedEvents += 1;
      const itemId = getItemAlias(rawItemId, itemAliases);
      const status = explicitStatus(item?.status);
      const exitCode = explicitExitCode(item?.exit_code);
      const failed = status === "failed" || (exitCode !== null && exitCode !== 0);
      const completed =
        type === "item.completed" &&
        !failed &&
        (status === "completed" || exitCode === 0);
      const afterObservedFailure = observedFailureOpen && completed;

      emit({
        eventType: type,
        itemId,
        itemType: rawItemType as ObservationKind,
        status,
        exitCode,
        afterObservedFailure,
      });

      if (failed) observedFailureOpen = true;
      else if (afterObservedFailure) observedFailureOpen = false;
      continue;
    }

    emitUnknown();
  }

  applyPublicAnnotations(observations, options.annotations ?? []);
  const title = normalizePublicText(options.title, "Untitled Codex run", 120);
  const labels = (options.labels ?? [])
    .map((label) => normalizePublicText(label, "", 48))
    .filter(Boolean)
    .slice(0, 8);
  const publicIdentity = {
    project: optionalPublicText(options.project, 64),
    by: optionalPublicText(options.by, 48),
    release: optionalPublicText(options.release, 48),
    publicUrl: normalizePublicUrl(options.publicUrl),
    language: normalizePublicLanguage(options.language),
  };
  const explicitPublicFields = [
    ...(options.title !== undefined ? ["run.publicTitle"] : []),
    ...labels.map((_, index) => `run.publicLabels[${index}]`),
    ...(publicIdentity.project !== null ? ["run.publicIdentity.project"] : []),
    ...(publicIdentity.by !== null ? ["run.publicIdentity.by"] : []),
    ...(publicIdentity.release !== null ? ["run.publicIdentity.release"] : []),
    ...(publicIdentity.publicUrl !== null ? ["run.publicIdentity.publicUrl"] : []),
    ...(options.language !== undefined ? ["run.publicIdentity.language"] : []),
    ...observations.flatMap((observation) => [
      ...(observation.publicPhase ? [`observations[${observation.sequence - 1}].publicPhase`] : []),
      ...(observation.publicLabel ? [`observations[${observation.sequence - 1}].publicLabel`] : []),
    ]),
  ];
  const summary = deriveSummary(observations);
  const shapeSha256 = computeShapeSha256(observations);
  const privacy: PrivacyProjection = {
    policyVersion: "0.1",
    mode: "default-deny-public-projection",
    excludedCategories: [...EXCLUDED_CATEGORIES],
    excludedFieldOccurrences,
    explicitPublicFields,
    itemIds: "pseudonymized-for-sequence-association",
    rawValuesRetained: false,
    rawInputHashPublished: false,
    assurance: "receipt-not-guarantee",
  };

  const withoutDigest = {
    schemaVersion: SCHEMA_VERSION,
    source: {
      kind: "codex-exec-jsonl" as const,
      adapterVersion: ADAPTER_VERSION,
      shapeSha256,
      parsedRecords: records.length - malformedRecords,
      malformedRecords,
      recognizedEvents,
      unknownEvents,
      timing: "not-observed" as const,
    },
    run: {
      publicTitle: title,
      publicLabels: labels,
      publicIdentity,
      turnCompletion,
      durationMs: null,
    },
    observations,
    summary,
    privacy,
    render: {
      rendererVersion: RENDERER_VERSION,
      pngRenderer: PNG_RENDERER_DECLARATION,
      palette: "the-run-has-a-shape-v1" as const,
    },
  };
  const publicIrSha256 = sha256(canonicalJsonCompact(withoutDigest));
  const workprint: WorkprintIR = {
    ...withoutDigest,
    schemaVersion: SCHEMA_VERSION,
    source: { ...withoutDigest.source, publicIrSha256 },
  };

  const inspection: InspectionReport = {
    shapeSha256,
    publicIrSha256,
    parsedRecords: workprint.source.parsedRecords,
    malformedRecords,
    recognizedEvents,
    unknownEvents,
    observationCount: observations.length,
    retainedCategories: [...RETAINED_CATEGORIES],
    excludedCategories: [...EXCLUDED_CATEGORIES],
    excludedFieldOccurrences,
    explicitPublicFields,
    summary,
    timing: "not-observed",
  };

  return { workprint, inspection };
}

export function deriveSummary(observations: PublicObservation[]): WorkprintSummary {
  const summary: WorkprintSummary = {
    runObservations: 0,
    turnObservations: 0,
    itemStarted: 0,
    itemCompleted: 0,
    itemFailed: 0,
    itemStatusNotObserved: 0,
    commandStarted: 0,
    commandCompleted: 0,
    commandFailed: 0,
    commandOutcomeNotObserved: 0,
    fileChangeObservations: 0,
    agentMessageObservations: 0,
    unknown: 0,
    completionAfterObservedFailure: 0,
    publicInspect: 0,
    publicEdit: 0,
    publicVerify: 0,
    publicRecover: 0,
    publicDeliver: 0,
  };

  for (const observation of observations) {
    if (observation.itemType === "run") summary.runObservations += 1;
    if (observation.itemType === "turn") summary.turnObservations += 1;
    if (observation.itemType === "file_change") summary.fileChangeObservations += 1;
    if (observation.itemType === "agent_message") summary.agentMessageObservations += 1;
    const itemFailed = observation.status === "failed" || (observation.exitCode !== null && observation.exitCode !== 0);
    const itemCompleted = observation.status === "completed" || observation.exitCode === 0;
    if (observation.eventType === "item.started") summary.itemStarted += 1;
    if (observation.eventType === "item.completed" && itemCompleted && !itemFailed) summary.itemCompleted += 1;
    if (itemFailed) {
      summary.itemFailed += 1;
    }
    if (
      observation.eventType.startsWith("item.") &&
      observation.status === "not-observed" &&
      observation.exitCode === null &&
      observation.itemType !== "unknown"
    ) {
      summary.itemStatusNotObserved += 1;
    }

    if (observation.itemType === "command_execution") {
      if (observation.eventType === "item.started") summary.commandStarted += 1;
      else if (observation.status === "failed" || (observation.exitCode !== null && observation.exitCode !== 0)) {
        summary.commandFailed += 1;
      } else if (observation.status === "completed" || observation.exitCode === 0) {
        summary.commandCompleted += 1;
      } else {
        summary.commandOutcomeNotObserved += 1;
      }
    }

    if (observation.itemType === "unknown" || observation.eventType === "unknown") summary.unknown += 1;
    if (observation.afterObservedFailure) summary.completionAfterObservedFailure += 1;
    if (observation.publicPhase) {
      const phaseKey = `public${observation.publicPhase[0].toUpperCase()}${observation.publicPhase.slice(1)}` as
        | "publicInspect"
        | "publicEdit"
        | "publicVerify"
        | "publicRecover"
        | "publicDeliver";
      summary[phaseKey] += 1;
    }
  }

  return summary;
}

function parseJsonl(input: string): ParsedRecord[] {
  const normalized = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  return normalized
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      try {
        const parsed = JSON.parse(line) as unknown;
        return isPlainObject(parsed)
          ? { value: parsed, malformed: false }
          : { value: null, malformed: true };
      } catch {
        return { value: null, malformed: true };
      }
    });
}

function countExcludedFields(value: unknown, counts: Record<string, number>): void {
  if (Array.isArray(value)) {
    for (const entry of value) countExcludedFields(entry, counts);
    return;
  }
  if (!isPlainObject(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    const category = EXCLUDED_KEY_CATEGORIES[key.toLowerCase()];
    if (category) counts[category] = (counts[category] ?? 0) + 1;
    countExcludedFields(entry, counts);
  }
}

function getItemAlias(rawItemId: string, aliases: Map<string, string>): string {
  const existing = aliases.get(rawItemId);
  if (existing) return existing;
  const alias = `item-${aliases.size + 1}`;
  aliases.set(rawItemId, alias);
  return alias;
}

function explicitStatus(value: unknown): ObservationStatus {
  if (value === "in_progress" || value === "completed" || value === "failed") return value;
  return "not-observed";
}

function explicitExitCode(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}

function applyPublicAnnotations(
  observations: PublicObservation[],
  annotations: PublicAnnotation[],
): void {
  const seen = new Set<number>();
  for (const annotation of annotations) {
    if (!Number.isSafeInteger(annotation.sequence) || annotation.sequence < 1 || annotation.sequence > observations.length) {
      throw new WorkprintInputError(`Annotation sequence ${annotation.sequence} is outside 1..${observations.length}.`);
    }
    if (!KNOWN_PHASES.has(annotation.phase)) {
      throw new WorkprintInputError(`Unsupported public phase: ${annotation.phase}.`);
    }
    if (seen.has(annotation.sequence)) {
      throw new WorkprintInputError(`Observation ${annotation.sequence} has more than one public annotation.`);
    }
    seen.add(annotation.sequence);
    const observation = observations[annotation.sequence - 1];
    observation.publicPhase = annotation.phase;
    observation.publicLabel = annotation.label
      ? normalizePublicText(annotation.label, "", 64)
      : null;
  }
}

function normalizePublicText(value: string | undefined, fallback: string, maxLength: number): string {
  if (value === undefined) return fallback;
  const normalized = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  return [...normalized].slice(0, maxLength).join("");
}

function optionalPublicText(value: string | undefined, maxLength: number): string | null {
  if (value === undefined) return null;
  return normalizePublicText(value, "", maxLength) || null;
}

function normalizePublicUrl(value: string | undefined): string | null {
  if (value === undefined) return null;
  if (value.length > 2048) throw new WorkprintInputError("Public URL exceeds 2048 characters.");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new WorkprintInputError("Public URL must be an absolute HTTPS URL.");
  }
  if (url.protocol !== "https:" || url.username || url.password || url.hash || url.search || value.includes("?")) {
    throw new WorkprintInputError("Public URL must use HTTPS without credentials, a query string, or a fragment.");
  }
  return url.href;
}

function normalizePublicLanguage(value: string | undefined): string {
  if (value === undefined) return "en";
  const normalized = value.trim();
  if (!/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(normalized)) {
    throw new WorkprintInputError("Public language must be a simple BCP 47 language tag.");
  }
  return normalized;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
