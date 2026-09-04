export type ObservationKind =
  | "run"
  | "turn"
  | "command_execution"
  | "file_change"
  | "agent_message"
  | "unknown";

export type ObservationStatus =
  | "observed"
  | "in_progress"
  | "completed"
  | "failed"
  | "not-observed";

export type PublicPhase = "inspect" | "edit" | "verify" | "recover" | "deliver";

export interface PublicAnnotation {
  sequence: number;
  phase: PublicPhase;
  label?: string;
}

export interface PublicIdentity {
  project: string | null;
  by: string | null;
  release: string | null;
  publicUrl: string | null;
  language: string;
}

export interface PublicObservation {
  sequence: number;
  eventType:
    | "thread.started"
    | "turn.started"
    | "item.started"
    | "item.completed"
    | "turn.completed"
    | "unknown";
  itemId: string | null;
  itemType: ObservationKind | null;
  status: ObservationStatus;
  exitCode: number | null;
  publicPhase: PublicPhase | null;
  publicLabel: string | null;
  afterObservedFailure: boolean;
}

export interface WorkprintSummary {
  runObservations: number;
  turnObservations: number;
  itemStarted: number;
  itemCompleted: number;
  itemFailed: number;
  itemStatusNotObserved: number;
  commandStarted: number;
  commandCompleted: number;
  commandFailed: number;
  commandOutcomeNotObserved: number;
  fileChangeObservations: number;
  agentMessageObservations: number;
  unknown: number;
  completionAfterObservedFailure: number;
  publicInspect: number;
  publicEdit: number;
  publicVerify: number;
  publicRecover: number;
  publicDeliver: number;
}

export interface PrivacyProjection {
  policyVersion: "0.1";
  mode: "default-deny-public-projection";
  excludedCategories: string[];
  excludedFieldOccurrences: Record<string, number>;
  explicitPublicFields: string[];
  itemIds: "pseudonymized-for-sequence-association";
  rawValuesRetained: false;
  rawInputHashPublished: false;
  assurance: "receipt-not-guarantee";
}

export interface WorkprintIR {
  schemaVersion: "0.2";
  source: {
    kind: "codex-exec-jsonl";
    adapterVersion: string;
    shapeSha256: string;
    publicIrSha256: string;
    parsedRecords: number;
    malformedRecords: number;
    recognizedEvents: number;
    unknownEvents: number;
    timing: "not-observed";
  };
  run: {
    publicTitle: string;
    publicLabels: string[];
    publicIdentity: PublicIdentity;
    turnCompletion: "observed" | "not-observed";
    durationMs: null;
  };
  observations: PublicObservation[];
  summary: WorkprintSummary;
  privacy: PrivacyProjection;
  render: {
    rendererVersion: string;
    pngRenderer: string;
    palette: "the-run-has-a-shape-v1";
  };
}

export interface AdapterOptions {
  title?: string;
  labels?: string[];
  annotations?: PublicAnnotation[];
  project?: string;
  by?: string;
  release?: string;
  publicUrl?: string;
  language?: string;
}

export interface InspectionReport {
  shapeSha256: string;
  publicIrSha256: string;
  parsedRecords: number;
  malformedRecords: number;
  recognizedEvents: number;
  unknownEvents: number;
  observationCount: number;
  retainedCategories: string[];
  excludedCategories: string[];
  excludedFieldOccurrences: Record<string, number>;
  explicitPublicFields: string[];
  summary: WorkprintSummary;
  timing: "not-observed";
}
