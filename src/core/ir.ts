import { deriveSummary } from "../adapter/codex-jsonl-v0_1.ts";
import { canonicalJsonCompact } from "./canonical.ts";
import { sha256 } from "./hash.ts";
import { computeShapeSha256 } from "./shape.ts";
import type { PublicObservation, WorkprintIR } from "./types.ts";
import { SCHEMA_VERSION } from "../version.ts";

export class WorkprintIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkprintIntegrityError";
  }
}

export function computePublicIrSha256(workprint: WorkprintIR): string {
  const { publicIrSha256: _digest, ...sourceWithoutDigest } = workprint.source;
  return sha256(canonicalJsonCompact({ ...workprint, source: sourceWithoutDigest }));
}

export function assertValidWorkprintIR(value: unknown): asserts value is WorkprintIR {
  if (!isObject(value)) throw new WorkprintIntegrityError("workprint.json must contain an object.");
  if (value.schemaVersion === "0.1") {
    throw new WorkprintIntegrityError("Legacy Workprint IR 0.1 is not accepted by this verifier; use its matching historical CLI. Current Run IR is 0.2.");
  }
  if (value.schemaVersion !== SCHEMA_VERSION) {
    throw new WorkprintIntegrityError(`Unsupported Workprint schema version; this CLI requires ${SCHEMA_VERSION}.`);
  }
  if (!isObject(value.source) || value.source.kind !== "codex-exec-jsonl") {
    throw new WorkprintIntegrityError("Unsupported Workprint source.");
  }
  if (typeof value.source.publicIrSha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.source.publicIrSha256)) {
    throw new WorkprintIntegrityError("Invalid public IR digest.");
  }
  if (typeof value.source.shapeSha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.source.shapeSha256)) {
    throw new WorkprintIntegrityError("Invalid shape digest.");
  }
  if (value.source.timing !== "not-observed") {
    throw new WorkprintIntegrityError("Adapter 0.1 does not support public timing fields.");
  }
  for (const key of ["parsedRecords", "malformedRecords", "recognizedEvents", "unknownEvents"] as const) {
    if (!isNonNegativeInteger(value.source[key])) throw new WorkprintIntegrityError(`Invalid source count: ${key}.`);
  }
  if (!isObject(value.run) || typeof value.run.publicTitle !== "string" || !Array.isArray(value.run.publicLabels)) {
    throw new WorkprintIntegrityError("Invalid public run metadata.");
  }
  if (value.run.durationMs !== null || !["observed", "not-observed"].includes(String(value.run.turnCompletion))) {
    throw new WorkprintIntegrityError("Invalid observed run boundary.");
  }
  assertPublicIdentity(value.run.publicIdentity);
  if (!Array.isArray(value.observations)) throw new WorkprintIntegrityError("Observations must be an array.");
  value.observations.forEach((observation, index) => assertObservation(observation, index));
  if (!isObject(value.summary)) throw new WorkprintIntegrityError("Missing Workprint summary.");
  if (!isObject(value.privacy) || value.privacy.rawValuesRetained !== false || value.privacy.rawInputHashPublished !== false) {
    throw new WorkprintIntegrityError("Invalid privacy projection boundary.");
  }
  if (!isObject(value.render) || typeof value.render.pngRenderer !== "string") {
    throw new WorkprintIntegrityError("Missing renderer identity.");
  }

  const workprint = value as unknown as WorkprintIR;
  if (canonicalJsonCompact(deriveSummary(workprint.observations)) !== canonicalJsonCompact(workprint.summary)) {
    throw new WorkprintIntegrityError("Derived summary does not match ordered observations.");
  }
  if (computeShapeSha256(workprint.observations) !== workprint.source.shapeSha256) {
    throw new WorkprintIntegrityError("Shape digest does not match ordered observation structure.");
  }
  const computed = computePublicIrSha256(workprint);
  if (computed !== workprint.source.publicIrSha256) {
    throw new WorkprintIntegrityError("Public IR digest does not match workprint content.");
  }
}

function assertPublicIdentity(value: unknown): void {
  if (!isObject(value)) throw new WorkprintIntegrityError("Invalid public identity metadata.");
  const keys = Object.keys(value).sort();
  if (keys.join(",") !== "by,language,project,publicUrl,release") {
    throw new WorkprintIntegrityError("Public identity metadata has unknown or missing fields.");
  }
  for (const [key, maxLength] of [["project", 64], ["by", 48], ["release", 48]] as const) {
    const field = value[key];
    if (field !== null && (typeof field !== "string" || [...field].length > maxLength || /[\u0000-\u001f\u007f]/.test(field))) {
      throw new WorkprintIntegrityError(`Invalid public identity field: ${key}.`);
    }
  }
  if (typeof value.language !== "string" || !/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(value.language)) {
    throw new WorkprintIntegrityError("Invalid public language.");
  }
  if (value.publicUrl !== null) {
    if (typeof value.publicUrl !== "string" || value.publicUrl.length > 2048) throw new WorkprintIntegrityError("Invalid public URL.");
    let url: URL;
    try {
      url = new URL(value.publicUrl);
    } catch {
      throw new WorkprintIntegrityError("Invalid public URL.");
    }
    if (url.protocol !== "https:" || url.username || url.password || url.hash || url.search || value.publicUrl.includes("?") || url.href !== value.publicUrl) {
      throw new WorkprintIntegrityError("Invalid public URL.");
    }
  }
}

function assertObservation(value: unknown, index: number): asserts value is PublicObservation {
  if (!isObject(value)) throw new WorkprintIntegrityError(`Observation ${index + 1} is not an object.`);
  if (value.sequence !== index + 1) throw new WorkprintIntegrityError("Observation sequence is not contiguous.");
  const eventTypes = ["thread.started", "turn.started", "item.started", "item.completed", "turn.completed", "unknown"];
  const itemTypes = ["run", "turn", "command_execution", "file_change", "agent_message", "unknown", null];
  const statuses = ["observed", "in_progress", "completed", "failed", "not-observed"];
  const phases = ["inspect", "edit", "verify", "recover", "deliver", null];
  if (!eventTypes.includes(String(value.eventType))) throw new WorkprintIntegrityError(`Observation ${index + 1} has an invalid event type.`);
  if (!itemTypes.includes(value.itemType as never)) throw new WorkprintIntegrityError(`Observation ${index + 1} has an invalid item type.`);
  if (!statuses.includes(String(value.status))) throw new WorkprintIntegrityError(`Observation ${index + 1} has an invalid status.`);
  if (!phases.includes(value.publicPhase as never)) throw new WorkprintIntegrityError(`Observation ${index + 1} has an invalid public phase.`);
  if (value.itemId !== null && (typeof value.itemId !== "string" || !/^item-[1-9][0-9]*$/.test(value.itemId))) {
    throw new WorkprintIntegrityError(`Observation ${index + 1} has an invalid public item alias.`);
  }
  if (value.exitCode !== null && !Number.isSafeInteger(value.exitCode)) {
    throw new WorkprintIntegrityError(`Observation ${index + 1} has an invalid exit code.`);
  }
  if (value.publicLabel !== null && typeof value.publicLabel !== "string") {
    throw new WorkprintIntegrityError(`Observation ${index + 1} has an invalid public label.`);
  }
  if (typeof value.afterObservedFailure !== "boolean") {
    throw new WorkprintIntegrityError(`Observation ${index + 1} has an invalid observed relation.`);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): boolean {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}
