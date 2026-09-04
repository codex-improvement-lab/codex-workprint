import type { PublicObservation, WorkprintIR } from "../core/types.ts";

export type RunSheetMomentKind =
  | "failure"
  | "later-completion"
  | "unknown"
  | "open-item"
  | "file-change"
  | "turn-completion"
  | "item-completion";

export interface RunSheetMoment {
  sequence: number;
  kind: RunSheetMomentKind;
  label: string;
  detail: string;
}

export interface ItemThread {
  itemId: string;
  startedSequence: number;
  terminalSequence: number | null;
  observationCount: number;
}

export interface TurnRange {
  index: number;
  startedSequence: number;
  completedSequence: number | null;
}

export interface ChapterMarker {
  sequence: number;
  phase: NonNullable<PublicObservation["publicPhase"]>;
  label: string | null;
}

export interface RunSheetStructure {
  itemThreads: ItemThread[];
  turnRanges: TurnRange[];
  chapterMarkers: ChapterMarker[];
  moments: RunSheetMoment[];
  openItemCount: number;
  pairedItemCount: number;
}

/**
 * Derive display structure only from the already-public IR. This layer never
 * reads source JSONL, command bodies, messages, paths, output, or timing.
 */
export function deriveRunSheetStructure(workprint: WorkprintIR): RunSheetStructure {
  const observations = workprint.observations;
  const itemThreads = deriveItemThreads(observations);
  const turnRanges = deriveTurnRanges(observations);
  const chapterMarkers = observations.flatMap((observation) =>
    observation.publicPhase
      ? [{
        sequence: observation.sequence,
        phase: observation.publicPhase,
        label: observation.publicLabel,
      }]
      : []
  );
  const moments = deriveMoments(observations, itemThreads);

  return {
    itemThreads,
    turnRanges,
    chapterMarkers,
    moments,
    openItemCount: itemThreads.filter((thread) => thread.terminalSequence === null).length,
    pairedItemCount: itemThreads.filter((thread) => thread.terminalSequence !== null).length,
  };
}

function deriveItemThreads(observations: PublicObservation[]): ItemThread[] {
  const byItem = new Map<string, PublicObservation[]>();
  for (const observation of observations) {
    if (observation.itemId === null) continue;
    const history = byItem.get(observation.itemId) ?? [];
    history.push(observation);
    byItem.set(observation.itemId, history);
  }

  const threads: ItemThread[] = [];
  for (const [itemId, history] of byItem) {
    const started = history.find((observation) => observation.eventType === "item.started");
    if (!started) continue;
    const terminal = history.find((observation) =>
      observation.sequence > started.sequence && observation.eventType === "item.completed"
    );
    threads.push({
      itemId,
      startedSequence: started.sequence,
      terminalSequence: terminal?.sequence ?? null,
      observationCount: history.length,
    });
  }
  return threads.sort((left, right) => left.startedSequence - right.startedSequence);
}

function deriveTurnRanges(observations: PublicObservation[]): TurnRange[] {
  const ranges: TurnRange[] = [];
  const open: TurnRange[] = [];
  for (const observation of observations) {
    if (observation.eventType === "turn.started") {
      const range = {
        index: ranges.length + 1,
        startedSequence: observation.sequence,
        completedSequence: null,
      };
      ranges.push(range);
      open.push(range);
      continue;
    }
    if (observation.eventType === "turn.completed") {
      const range = open.shift();
      if (range) range.completedSequence = observation.sequence;
    }
  }
  return ranges;
}

function deriveMoments(observations: PublicObservation[], itemThreads: ItemThread[]): RunSheetMoment[] {
  const candidates: RunSheetMoment[] = [];
  const add = (observation: PublicObservation | undefined, kind: RunSheetMomentKind, label: string, detail: string) => {
    if (!observation || candidates.some((candidate) => candidate.sequence === observation.sequence)) return;
    candidates.push({ sequence: observation.sequence, kind, label, detail });
  };

  add(
    observations.find(isFailure),
    "failure",
    "FAILED / NONZERO OBSERVED",
    "An item exposed an explicit failed status or nonzero exit code.",
  );
  add(
    observations.find((observation) => observation.afterObservedFailure),
    "later-completion",
    "LATER COMPLETION OBSERVED",
    "A completed item was observed after a failed item; recovery is not claimed.",
  );
  add(
    observations.find((observation) => observation.eventType === "unknown" || observation.itemType === "unknown"),
    "unknown",
    "UNKNOWN RECORD VISIBLE",
    "The source record stayed visible without retaining its unlisted content.",
  );

  const openThread = itemThreads.find((thread) => thread.terminalSequence === null);
  add(
    openThread ? observations[openThread.startedSequence - 1] : undefined,
    "open-item",
    "TERMINAL STATE NOT OBSERVED",
    "An item start remains in sequence without a matching completed observation.",
  );
  add(
    observations.find((observation) =>
      observation.itemType === "file_change" && observation.eventType === "item.completed"
    ),
    "file-change",
    "FILE CHANGE COMPLETION OBSERVED",
    "A file-change item emitted a completed observation; content stays excluded.",
  );
  add(
    observations.find((observation) => observation.eventType === "turn.completed"),
    "turn-completion",
    "TURN COMPLETION OBSERVED",
    "The event stream emitted turn.completed; task correctness is not implied.",
  );
  add(
    observations.find((observation) => observation.eventType === "item.completed"),
    "item-completion",
    "ITEM COMPLETION OBSERVED",
    "An item emitted a completed observation with no broader outcome inference.",
  );

  return candidates.slice(0, 3).sort((left, right) => left.sequence - right.sequence);
}

function isFailure(observation: PublicObservation): boolean {
  return observation.status === "failed" ||
    (observation.exitCode !== null && observation.exitCode !== 0);
}
