export type ProfileKind = "continuity" | "goal-delta" | "context-receipt";

export type ContinuityVerdict = "carried" | "lost" | "stale" | "invented";
export type GoalDeltaVerdict = "added" | "removed" | "changed" | "unchanged";
export type ContextReceiptVerdict =
  | "prepared"
  | "observed"
  | "excluded"
  | "not_observed"
  | "stale"
  | "conflict";

export type ProfileVerdict = ContinuityVerdict | GoalDeltaVerdict | ContextReceiptVerdict;
export type ProfileVisualForm = "seam" | "fault" | "slice";

export interface ProfileSource {
  id: string;
  label: string;
  revision: string;
}

export interface ProfileFinding {
  id: string;
  kind: string;
  verdict: ProfileVerdict;
  subject: string;
  sourceRefs: string[];
  affectedEvidenceIds?: string[];
  reasonCode?: string;
  currentRevision?: string;
  expectedRevision?: string;
  resolved?: boolean;
}

export interface ProfileSummary {
  headline: string;
  counts: Record<string, number>;
}

export interface WorkprintProfileIR {
  schemaVersion: "workprint-profile-ir/0.1";
  artifact: "codex-workprint-profile";
  profile: ProfileKind;
  question: string;
  visualForm: ProfileVisualForm;
  title: string;
  sourceRevision: string;
  sources: ProfileSource[];
  findings: ProfileFinding[];
  summary: ProfileSummary;
  source: {
    kind: "workprint-profile-public-projection";
    schemaVersion: "workprint-profile/0.1";
    profileIrSha256: string;
  };
  render: {
    rendererVersion: string;
    pngRenderer: string;
    palette: "workprint-profile-family-v1";
  };
}

export interface ProfileInspection {
  schemaVersion: "workprint-profile-inspection/0.1";
  profile: ProfileKind;
  title: string;
  question: string;
  sourceRevision: string;
  sourceCount: number;
  findingCount: number;
  tracedFindingCount: number;
  verdictCounts: Record<string, number>;
  profileIrSha256: string;
  ignoredExtensionFields: number;
  retainedFields: string[];
  claimCeiling: string[];
}

