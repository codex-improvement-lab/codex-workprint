import type { ProfileKind, ProfileVerdict, ProfileVisualForm } from "./types.ts";

export const PROFILE_INPUT_SCHEMA_VERSION = "workprint-profile/0.1" as const;
export const PROFILE_IR_SCHEMA_VERSION = "workprint-profile-ir/0.1" as const;
export const PROFILE_RENDERER_VERSION = "profile-print-0.1.0";
export const PROFILE_PNG_RENDERER_VERSION = "workprint-profile-png-v1/stored-deflate/bitmap-5x7";

export const PROFILE_KINDS = ["continuity", "goal-delta", "context-receipt"] as const;

export const PROFILE_QUESTIONS: Record<ProfileKind, string> = {
  continuity: "What still holds after handoff?",
  "goal-delta": "What evidence stops carrying when the goal changes?",
  "context-receipt": "What context was prepared, observed, or absent?",
};

export const PROFILE_VISUAL_FORMS: Record<ProfileKind, ProfileVisualForm> = {
  continuity: "seam",
  "goal-delta": "fault",
  "context-receipt": "slice",
};

export const PROFILE_VERDICTS: Record<ProfileKind, readonly ProfileVerdict[]> = {
  continuity: ["carried", "lost", "stale", "invented"],
  "goal-delta": ["added", "removed", "changed", "unchanged"],
  "context-receipt": ["prepared", "observed", "excluded", "not_observed", "stale", "conflict"],
};

export const PROFILE_COUNT_KEYS: Record<ProfileKind, readonly string[]> = {
  continuity: ["carried", "lost", "stale", "invented"],
  "goal-delta": [
    "added",
    "removed",
    "changed",
    "unchanged",
    "affectedEvidence",
    "newlyStaleEvidence",
    "usableEvidence",
    "rerunEvidence",
    "retireEvidence",
    "uncoveredAddedItems",
  ],
  "context-receipt": ["prepared", "observed", "excluded", "not_observed", "stale", "conflict"],
};

export const PROFILE_PUBLIC_FIELD_WHITELIST = [
  "schemaVersion",
  "profile",
  "title",
  "sourceRevision",
  "sources[].id",
  "sources[].label",
  "sources[].revision",
  "findings[].id",
  "findings[].kind",
  "findings[].verdict",
  "findings[].subject",
  "findings[].sourceRefs[]",
  "findings[].affectedEvidenceIds[] (goal-delta only)",
  "findings[].reasonCode (context-receipt only)",
  "findings[].currentRevision (context-receipt only)",
  "findings[].expectedRevision (context-receipt only)",
  "findings[].resolved (context-receipt only)",
  "summary.headline",
  "summary.counts.<profile allowlist>",
] as const;

export function isProfileKind(value: unknown): value is ProfileKind {
  return typeof value === "string" && (PROFILE_KINDS as readonly string[]).includes(value);
}

