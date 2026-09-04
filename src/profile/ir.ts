import { canonicalJsonCompact } from "../core/canonical.ts";
import { sha256 } from "../core/hash.ts";
import {
  PROFILE_COUNT_KEYS,
  PROFILE_INPUT_SCHEMA_VERSION,
  PROFILE_IR_SCHEMA_VERSION,
  PROFILE_KINDS,
  PROFILE_PNG_RENDERER_VERSION,
  PROFILE_QUESTIONS,
  PROFILE_RENDERER_VERSION,
  PROFILE_VERDICTS,
  PROFILE_VISUAL_FORMS,
  isProfileKind,
} from "./contract.ts";
import type { ProfileFinding, ProfileKind, ProfileSource, WorkprintProfileIR } from "./types.ts";

export class ProfileIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileIntegrityError";
  }
}

export function computeProfileIrSha256(profile: WorkprintProfileIR): string {
  const { profileIrSha256: _digest, ...sourceWithoutDigest } = profile.source;
  return sha256(canonicalJsonCompact({ ...profile, source: sourceWithoutDigest }));
}

export function assertValidProfileIR(value: unknown): asserts value is WorkprintProfileIR {
  if (!isObject(value)) throw new ProfileIntegrityError("workprint-profile.json must contain an object.");
  assertExactKeys(value, [
    "schemaVersion", "artifact", "profile", "question", "visualForm", "title", "sourceRevision",
    "sources", "findings", "summary", "source", "render",
  ], "Profile IR");
  if (value.schemaVersion !== PROFILE_IR_SCHEMA_VERSION || value.artifact !== "codex-workprint-profile") {
    throw new ProfileIntegrityError("Unsupported Profile IR bundle type.");
  }
  if (!isProfileKind(value.profile)) throw new ProfileIntegrityError("Unsupported Workprint profile.");
  const profile = value.profile;
  if (value.question !== PROFILE_QUESTIONS[profile] || value.visualForm !== PROFILE_VISUAL_FORMS[profile]) {
    throw new ProfileIntegrityError("Profile question or visual form does not match the profile contract.");
  }
  assertPublicText(value.title, "title", 240);
  assertPublicText(value.sourceRevision, "sourceRevision", 640);
  if (!Array.isArray(value.sources) || value.sources.length < 1 || value.sources.length > 64) {
    throw new ProfileIntegrityError("Profile sources must contain 1 to 64 entries.");
  }
  const sourceIds = new Set<string>();
  value.sources.forEach((source, index) => {
    assertProfileSource(source, index);
    if (sourceIds.has(source.id)) throw new ProfileIntegrityError(`Duplicate source id: ${source.id}.`);
    sourceIds.add(source.id);
  });
  if (!Array.isArray(value.findings) || value.findings.length < 1 || value.findings.length > 128) {
    throw new ProfileIntegrityError("Profile findings must contain 1 to 128 entries.");
  }
  const findingIds = new Set<string>();
  value.findings.forEach((finding, index) => {
    assertProfileFinding(finding, index, profile, sourceIds);
    if (findingIds.has(finding.id)) throw new ProfileIntegrityError(`Duplicate finding id: ${finding.id}.`);
    findingIds.add(finding.id);
  });
  if (!isObject(value.summary)) throw new ProfileIntegrityError("Missing profile summary.");
  assertExactKeys(value.summary, ["headline", "counts"], "Profile summary");
  assertPublicText(value.summary.headline, "summary.headline", 360);
  if (!isObject(value.summary.counts)) throw new ProfileIntegrityError("Profile summary counts must be an object.");
  const countKeys = Object.keys(value.summary.counts);
  const allowedCountKeys = PROFILE_COUNT_KEYS[profile];
  if (countKeys.some((key) => !allowedCountKeys.includes(key))) {
    throw new ProfileIntegrityError("Profile summary contains an unsupported count.");
  }
  for (const verdict of PROFILE_VERDICTS[profile]) {
    if (!countKeys.includes(verdict)) throw new ProfileIntegrityError(`Profile summary is missing ${verdict}.`);
  }
  for (const [key, count] of Object.entries(value.summary.counts)) {
    if (!Number.isSafeInteger(count) || Number(count) < 0) {
      throw new ProfileIntegrityError(`Profile summary count ${key} is invalid.`);
    }
  }
  for (const verdict of PROFILE_VERDICTS[profile]) {
    const derived = value.findings.filter((finding) => finding.verdict === verdict).length;
    if (value.summary.counts[verdict] !== derived) {
      throw new ProfileIntegrityError(`Profile summary count ${verdict} does not match findings.`);
    }
  }
  if (!isObject(value.source)) throw new ProfileIntegrityError("Missing Profile IR source binding.");
  assertExactKeys(value.source, ["kind", "schemaVersion", "profileIrSha256"], "Profile IR source");
  if (value.source.kind !== "workprint-profile-public-projection" || value.source.schemaVersion !== PROFILE_INPUT_SCHEMA_VERSION) {
    throw new ProfileIntegrityError("Unsupported Profile IR source binding.");
  }
  if (typeof value.source.profileIrSha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.source.profileIrSha256)) {
    throw new ProfileIntegrityError("Invalid Profile IR digest.");
  }
  if (!isObject(value.render)) throw new ProfileIntegrityError("Missing profile renderer identity.");
  assertExactKeys(value.render, ["rendererVersion", "pngRenderer", "palette"], "Profile renderer");
  if (
    value.render.rendererVersion !== PROFILE_RENDERER_VERSION ||
    value.render.pngRenderer !== PROFILE_PNG_RENDERER_VERSION ||
    value.render.palette !== "workprint-profile-family-v1"
  ) {
    throw new ProfileIntegrityError("Unsupported profile renderer identity.");
  }

  const profileIr = value as unknown as WorkprintProfileIR;
  if (computeProfileIrSha256(profileIr) !== profileIr.source.profileIrSha256) {
    throw new ProfileIntegrityError("Profile IR digest does not match profile content.");
  }
}

function assertProfileSource(value: unknown, index: number): asserts value is ProfileSource {
  if (!isObject(value)) throw new ProfileIntegrityError(`Source ${index + 1} is not an object.`);
  assertExactKeys(value, ["id", "label", "revision"], `Source ${index + 1}`);
  assertIdentifier(value.id, `sources[${index}].id`);
  assertPublicText(value.label, `sources[${index}].label`, 200);
  assertPublicText(value.revision, `sources[${index}].revision`, 240);
}

function assertProfileFinding(
  value: unknown,
  index: number,
  profile: ProfileKind,
  sourceIds: Set<string>,
): asserts value is ProfileFinding {
  if (!isObject(value)) throw new ProfileIntegrityError(`Finding ${index + 1} is not an object.`);
  const common = ["id", "kind", "verdict", "subject", "sourceRefs"];
  const allowed = profile === "goal-delta"
    ? [...common, "affectedEvidenceIds"]
    : profile === "context-receipt"
      ? [...common, "reasonCode", "currentRevision", "expectedRevision", "resolved"]
      : common;
  assertAllowedKeys(value, allowed, `Finding ${index + 1}`);
  for (const required of common) {
    if (!(required in value)) throw new ProfileIntegrityError(`Finding ${index + 1} is missing field: ${required}.`);
  }
  assertIdentifier(value.id, `findings[${index}].id`);
  assertIdentifier(value.kind, `findings[${index}].kind`, 64);
  if (!PROFILE_VERDICTS[profile].includes(value.verdict as never)) {
    throw new ProfileIntegrityError(`Finding ${index + 1} has an invalid verdict for ${profile}.`);
  }
  assertPublicText(value.subject, `findings[${index}].subject`, 500);
  if (!Array.isArray(value.sourceRefs) || value.sourceRefs.length > 32) {
    throw new ProfileIntegrityError(`Finding ${index + 1} has invalid sourceRefs.`);
  }
  const refs = new Set<string>();
  for (const reference of value.sourceRefs) {
    assertIdentifier(reference, `findings[${index}].sourceRefs[]`);
    if (!sourceIds.has(reference)) throw new ProfileIntegrityError(`Finding ${value.id} references unknown source ${reference}.`);
    if (refs.has(reference)) throw new ProfileIntegrityError(`Finding ${value.id} repeats source ${reference}.`);
    refs.add(reference);
  }
  if (profile === "goal-delta") {
    if (!Array.isArray(value.affectedEvidenceIds) || value.affectedEvidenceIds.length > 128) {
      throw new ProfileIntegrityError(`Finding ${index + 1} has invalid affectedEvidenceIds.`);
    }
    value.affectedEvidenceIds.forEach((id, evidenceIndex) => assertPublicText(id, `findings[${index}].affectedEvidenceIds[${evidenceIndex}]`, 240));
  }
  if (profile === "context-receipt") {
    if (value.reasonCode !== undefined) assertIdentifier(value.reasonCode, `findings[${index}].reasonCode`, 96);
    if (value.currentRevision !== undefined) assertPublicText(value.currentRevision, `findings[${index}].currentRevision`, 240);
    if (value.expectedRevision !== undefined) assertPublicText(value.expectedRevision, `findings[${index}].expectedRevision`, 240);
    if (value.resolved !== undefined && typeof value.resolved !== "boolean") {
      throw new ProfileIntegrityError(`Finding ${index + 1} has invalid resolved state.`);
    }
  }
}

function assertExactKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const extra = Object.keys(value).filter((key) => !allowed.includes(key));
  const missing = allowed.filter((key) => !(key in value));
  if (extra.length) throw new ProfileIntegrityError(`${label} contains unsupported fields: ${extra.join(", ")}.`);
  if (missing.length) throw new ProfileIntegrityError(`${label} is missing fields: ${missing.join(", ")}.`);
}

function assertAllowedKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const extra = Object.keys(value).filter((key) => !allowed.includes(key));
  if (extra.length) throw new ProfileIntegrityError(`${label} contains unsupported fields: ${extra.join(", ")}.`);
}

function assertIdentifier(value: unknown, field: string, max = 128): asserts value is string {
  if (typeof value !== "string" || value.length < 1 || value.length > max || !/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(value)) {
    throw new ProfileIntegrityError(`${field} is not a valid public identifier.`);
  }
}

function assertPublicText(value: unknown, field: string, max: number): asserts value is string {
  if (typeof value !== "string" || value.length < 1 || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new ProfileIntegrityError(`${field} is not valid public text.`);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
