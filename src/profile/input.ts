import {
  PROFILE_COUNT_KEYS,
  PROFILE_INPUT_SCHEMA_VERSION,
  PROFILE_IR_SCHEMA_VERSION,
  PROFILE_PNG_RENDERER_VERSION,
  PROFILE_PUBLIC_FIELD_WHITELIST,
  PROFILE_QUESTIONS,
  PROFILE_RENDERER_VERSION,
  PROFILE_VERDICTS,
  PROFILE_VISUAL_FORMS,
  isProfileKind,
} from "./contract.ts";
import { assertValidProfileIR, computeProfileIrSha256, ProfileIntegrityError } from "./ir.ts";
import type {
  ProfileFinding,
  ProfileInspection,
  ProfileKind,
  ProfileSource,
  WorkprintProfileIR,
} from "./types.ts";

export class ProfileInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileInputError";
  }
}

export interface AdaptedProfile {
  profile: WorkprintProfileIR;
  inspection: ProfileInspection;
}

const ROOT_FIELDS = new Set(["schemaVersion", "profile", "title", "sourceRevision", "sources", "findings", "summary"]);
const SOURCE_FIELDS = new Set(["id", "label", "revision"]);
const COMMON_FINDING_FIELDS = new Set(["id", "kind", "verdict", "subject", "sourceRefs"]);
const GOAL_DELTA_FINDING_FIELDS = new Set([...COMMON_FINDING_FIELDS, "affectedEvidenceIds"]);
const CONTEXT_FINDING_FIELDS = new Set([...COMMON_FINDING_FIELDS, "reasonCode", "currentRevision", "expectedRevision", "resolved"]);
const SUMMARY_FIELDS = new Set(["headline", "counts"]);

export function adaptWorkprintProfileJson(input: string): AdaptedProfile {
  let raw: unknown;
  try {
    raw = JSON.parse(input.replace(/^\uFEFF/, ""));
  } catch {
    throw new ProfileInputError("Profile input must be valid UTF-8 JSON.");
  }
  if (!isObject(raw)) throw new ProfileInputError("Profile input must contain an object.");
  if (raw.schemaVersion !== PROFILE_INPUT_SCHEMA_VERSION) {
    throw new ProfileInputError("Profile input requires schemaVersion workprint-profile/0.1.");
  }
  if (!isProfileKind(raw.profile)) throw new ProfileInputError("Unknown Workprint profile.");
  const profileKind = raw.profile;

  try {
    const sources = normalizeSources(raw.sources);
    const sourceIds = new Set(sources.map((source) => source.id));
    const findings = normalizeFindings(raw.findings, profileKind, sourceIds);
    const summary = normalizeSummary(raw.summary, profileKind, findings);
    const profile: WorkprintProfileIR = {
      schemaVersion: PROFILE_IR_SCHEMA_VERSION,
      artifact: "codex-workprint-profile",
      profile: profileKind,
      question: PROFILE_QUESTIONS[profileKind],
      visualForm: PROFILE_VISUAL_FORMS[profileKind],
      title: normalizeText(raw.title, "title", 240),
      sourceRevision: normalizeText(raw.sourceRevision, "sourceRevision", 640),
      sources,
      findings,
      summary,
      source: {
        kind: "workprint-profile-public-projection",
        schemaVersion: PROFILE_INPUT_SCHEMA_VERSION,
        profileIrSha256: "0".repeat(64),
      },
      render: {
        rendererVersion: PROFILE_RENDERER_VERSION,
        pngRenderer: PROFILE_PNG_RENDERER_VERSION,
        palette: "workprint-profile-family-v1",
      },
    };
    profile.source.profileIrSha256 = computeProfileIrSha256(profile);
    assertValidProfileIR(profile);
    const ignoredExtensionFields = countIgnoredExtensionFields(raw, profileKind);
    const verdictCounts = Object.fromEntries(PROFILE_VERDICTS[profileKind].map((verdict) => [verdict, summary.counts[verdict]]));
    return {
      profile,
      inspection: {
        schemaVersion: "workprint-profile-inspection/0.1",
        profile: profileKind,
        title: profile.title,
        question: profile.question,
        sourceRevision: profile.sourceRevision,
        sourceCount: sources.length,
        findingCount: findings.length,
        tracedFindingCount: findings.filter((finding) => finding.sourceRefs.length > 0).length,
        verdictCounts,
        profileIrSha256: profile.source.profileIrSha256,
        ignoredExtensionFields,
        retainedFields: [...PROFILE_PUBLIC_FIELD_WHITELIST],
        claimCeiling: [
          "The artifact is a deterministic display of the supplied public projection, not a new fact source.",
          "Source labels and revisions are references, not authenticity or correctness attestations.",
          "Observed proximity or profile verdicts do not establish model influence or causality.",
        ],
      },
    };
  } catch (error) {
    if (error instanceof ProfileInputError) throw error;
    if (error instanceof ProfileIntegrityError) throw new ProfileInputError(error.message);
    throw error;
  }
}

function normalizeSources(value: unknown): ProfileSource[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 64) {
    throw new ProfileInputError("sources must contain 1 to 64 public source entries.");
  }
  const ids = new Set<string>();
  return value.map((entry, index) => {
    if (!isObject(entry)) throw new ProfileInputError(`sources[${index}] must be an object.`);
    const source = {
      id: normalizeIdentifier(entry.id, `sources[${index}].id`),
      label: normalizeText(entry.label, `sources[${index}].label`, 200),
      revision: normalizeText(entry.revision, `sources[${index}].revision`, 240),
    };
    if (ids.has(source.id)) throw new ProfileInputError(`Duplicate source id: ${source.id}.`);
    ids.add(source.id);
    return source;
  });
}

function normalizeFindings(value: unknown, profile: ProfileKind, sourceIds: Set<string>): ProfileFinding[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 128) {
    throw new ProfileInputError("findings must contain 1 to 128 public findings.");
  }
  const ids = new Set<string>();
  return value.map((entry, index) => {
    if (!isObject(entry)) throw new ProfileInputError(`findings[${index}] must be an object.`);
    const verdict = entry.verdict;
    if (typeof verdict !== "string" || !PROFILE_VERDICTS[profile].includes(verdict as never)) {
      throw new ProfileInputError(`findings[${index}].verdict is invalid for ${profile}.`);
    }
    if (!Array.isArray(entry.sourceRefs) || entry.sourceRefs.length > 32) {
      throw new ProfileInputError(`findings[${index}].sourceRefs must be an array.`);
    }
    const sourceRefs = entry.sourceRefs.map((reference, referenceIndex) => {
      const normalized = normalizeIdentifier(reference, `findings[${index}].sourceRefs[${referenceIndex}]`);
      if (!sourceIds.has(normalized)) throw new ProfileInputError(`Finding ${String(entry.id)} references unknown source ${normalized}.`);
      return normalized;
    });
    if (new Set(sourceRefs).size !== sourceRefs.length) {
      throw new ProfileInputError(`findings[${index}].sourceRefs contains a duplicate.`);
    }
    const finding: ProfileFinding = {
      id: normalizeIdentifier(entry.id, `findings[${index}].id`),
      kind: normalizeIdentifier(entry.kind, `findings[${index}].kind`, 64),
      verdict: verdict as ProfileFinding["verdict"],
      subject: normalizeText(entry.subject, `findings[${index}].subject`, 500),
      sourceRefs,
    };
    if (ids.has(finding.id)) throw new ProfileInputError(`Duplicate finding id: ${finding.id}.`);
    ids.add(finding.id);

    if (profile === "goal-delta") {
      const affected = entry.affectedEvidenceIds ?? [];
      if (!Array.isArray(affected) || affected.length > 128) {
        throw new ProfileInputError(`findings[${index}].affectedEvidenceIds must be an array.`);
      }
      finding.affectedEvidenceIds = affected.map((id, affectedIndex) =>
        normalizeText(id, `findings[${index}].affectedEvidenceIds[${affectedIndex}]`, 240)
      );
    }
    if (profile === "context-receipt") {
      if (entry.reasonCode !== undefined) finding.reasonCode = normalizeIdentifier(entry.reasonCode, `findings[${index}].reasonCode`, 96);
      if (entry.currentRevision !== undefined) finding.currentRevision = normalizeText(entry.currentRevision, `findings[${index}].currentRevision`, 240);
      if (entry.expectedRevision !== undefined) finding.expectedRevision = normalizeText(entry.expectedRevision, `findings[${index}].expectedRevision`, 240);
      if (entry.resolved !== undefined) {
        if (typeof entry.resolved !== "boolean") throw new ProfileInputError(`findings[${index}].resolved must be boolean.`);
        finding.resolved = entry.resolved;
      }
    }
    return finding;
  });
}

function normalizeSummary(value: unknown, profile: ProfileKind, findings: ProfileFinding[]): WorkprintProfileIR["summary"] {
  if (!isObject(value) || !isObject(value.counts)) throw new ProfileInputError("summary requires headline and counts.");
  const counts: Record<string, number> = {};
  for (const key of PROFILE_COUNT_KEYS[profile]) {
    if (!(key in value.counts)) continue;
    const count = value.counts[key];
    if (!Number.isSafeInteger(count) || Number(count) < 0) throw new ProfileInputError(`summary.counts.${key} must be a non-negative integer.`);
    counts[key] = Number(count);
  }
  for (const verdict of PROFILE_VERDICTS[profile]) {
    if (!(verdict in counts)) throw new ProfileInputError(`summary.counts.${verdict} is required.`);
    const derived = findings.filter((finding) => finding.verdict === verdict).length;
    if (counts[verdict] !== derived) {
      throw new ProfileInputError(`summary.counts.${verdict} does not match findings.`);
    }
  }
  return { headline: normalizeText(value.headline, "summary.headline", 360), counts };
}

function countIgnoredExtensionFields(raw: Record<string, unknown>, profile: ProfileKind): number {
  let count = Object.keys(raw).filter((key) => !ROOT_FIELDS.has(key)).length;
  if (Array.isArray(raw.sources)) {
    for (const source of raw.sources) if (isObject(source)) count += Object.keys(source).filter((key) => !SOURCE_FIELDS.has(key)).length;
  }
  const findingFields = profile === "goal-delta"
    ? GOAL_DELTA_FINDING_FIELDS
    : profile === "context-receipt"
      ? CONTEXT_FINDING_FIELDS
      : COMMON_FINDING_FIELDS;
  if (Array.isArray(raw.findings)) {
    for (const finding of raw.findings) if (isObject(finding)) count += Object.keys(finding).filter((key) => !findingFields.has(key)).length;
  }
  if (isObject(raw.summary)) {
    count += Object.keys(raw.summary).filter((key) => !SUMMARY_FIELDS.has(key)).length;
    if (isObject(raw.summary.counts)) {
      count += Object.keys(raw.summary.counts).filter((key) => !PROFILE_COUNT_KEYS[profile].includes(key)).length;
    }
  }
  return count;
}

function normalizeIdentifier(value: unknown, field: string, max = 128): string {
  const normalized = normalizeText(value, field, max);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(normalized)) {
    throw new ProfileInputError(`${field} is not a valid public identifier.`);
  }
  return normalized;
}

function normalizeText(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") throw new ProfileInputError(`${field} must be public text.`);
  const normalized = value.normalize("NFC").replace(/\s+/gu, " ").trim();
  if (!normalized || [...normalized].length > max || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new ProfileInputError(`${field} is not valid public text.`);
  }
  return normalized;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

