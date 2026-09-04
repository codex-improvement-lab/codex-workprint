import type { ObservationKind, ObservationStatus, PublicObservation, WorkprintIR } from "../core/types.ts";
import { deriveRunSheetStructure } from "./run-sheet.ts";

export const PALETTE = {
  carbon: "#11120f",
  paper: "#f1ecdf",
  acid: "#c7ff36",
  cobalt: "#2457ff",
  coral: "#ff665c",
  silver: "#aeb4ad",
  ink: "#24251f",
} as const;

export interface WorklinePoint {
  x: number;
  y: number;
  row: number;
  indexInRow: number;
  direction: 1 | -1;
  color: string;
  observation: PublicObservation;
}

export interface WorklineSegment {
  from: WorklinePoint;
  to: WorklinePoint;
  c1x: number;
  c1y: number;
  c2x: number;
  c2y: number;
  color: string;
  dashed: boolean;
  folded: boolean;
}

export interface ReturnArc {
  from: WorklinePoint;
  to: WorklinePoint;
}

export interface ItemStitch {
  itemId: string;
  from: WorklinePoint;
  to: WorklinePoint | null;
  terminalObserved: boolean;
}

export interface TurnSpan {
  index: number;
  from: WorklinePoint;
  to: WorklinePoint | null;
  terminalObserved: boolean;
}

export interface WorklineLayout {
  width: number;
  height: number;
  points: WorklinePoint[];
  segments: WorklineSegment[];
  returnArcs: ReturnArc[];
  itemStitches: ItemStitch[];
  turnSpans: TurnSpan[];
  rows: number;
  maxPerRow: number;
}

const KIND_LANES: Record<ObservationKind, number> = {
  run: 0.13,
  turn: 0.25,
  command_execution: 0.5,
  file_change: 0.66,
  agent_message: 0.78,
  unknown: 0.58,
};

const STATUS_SHIFT: Record<ObservationStatus, number> = {
  observed: 0,
  in_progress: -0.08,
  completed: 0.08,
  failed: 0.18,
  "not-observed": 0.02,
};

export function colorForObservation(observation: PublicObservation): string {
  if (observation.status === "failed" || (observation.exitCode !== null && observation.exitCode !== 0)) {
    return PALETTE.coral;
  }
  if (observation.status === "completed" || observation.exitCode === 0) return PALETTE.acid;
  if (observation.status === "in_progress") return PALETTE.cobalt;
  if (observation.status === "not-observed" || observation.itemType === "unknown") return PALETTE.silver;
  return PALETTE.paper;
}

export function createWorklineLayout(
  workprint: WorkprintIR,
  width = 1040,
  height = 360,
  requestedMaxPerRow = 18,
): WorklineLayout {
  const horizontalPadding = 42;
  const verticalPadding = 28;
  const usableWidth = width - horizontalPadding * 2;
  const usableHeight = height - verticalPadding * 2;
  const count = workprint.observations.length;
  const seed = workprint.source.shapeSha256;
  const maxPerRow = Math.max(4, Math.floor(requestedMaxPerRow));
  const rows = Math.max(1, Math.ceil(Math.max(1, count) / maxPerRow));
  const rowHeight = usableHeight / rows;

  const points = workprint.observations.map((observation, index): WorklinePoint => {
    const row = Math.floor(index / maxPerRow);
    const indexInRow = index % maxPerRow;
    const countInRow = Math.min(maxPerRow, count - row * maxPerRow);
    const direction = (row % 2 === 0 ? 1 : -1) as 1 | -1;
    const rawProgress = countInRow <= 1 ? 0.5 : indexInRow / (countInRow - 1);
    const progress = direction === 1 ? rawProgress : 1 - rawProgress;
    const seedIndex = (index * 2) % Math.max(2, seed.length - 1);
    const seedByte = Number.parseInt(seed.slice(seedIndex, seedIndex + 2), 16) || 0;
    const jitter = ((seedByte % 15) - 7) / 150;
    const lane = KIND_LANES[observation.itemType ?? "unknown"];
    const shifted = lane + STATUS_SHIFT[observation.status] + jitter;
    const yRatio = Math.min(0.94, Math.max(0.06, shifted));
    return {
      x: horizontalPadding + usableWidth * progress,
      y: verticalPadding + row * rowHeight + rowHeight * yRatio,
      row,
      indexInRow,
      direction,
      color: colorForObservation(observation),
      observation,
    };
  });

  const segments = points.slice(1).map((to, index): WorklineSegment => {
    const from = points[index];
    const deltaX = to.x - from.x;
    const folded = from.row !== to.row;
    const bend = folded ? 0 : deltaX * 0.42;
    const verticalBend = folded ? (to.y - from.y) * 0.44 : 0;
    return {
      from,
      to,
      c1x: from.x + bend,
      c1y: from.y + verticalBend,
      c2x: to.x - bend,
      c2y: to.y - verticalBend,
      color: to.color,
      dashed: to.observation.itemType === "unknown",
      folded,
    };
  });

  const returnArcs: ReturnArc[] = [];
  let lastFailure: WorklinePoint | null = null;
  for (const point of points) {
    const observation = point.observation;
    const failed = observation.status === "failed" || (observation.exitCode !== null && observation.exitCode !== 0);
    if (failed) lastFailure = point;
    if (observation.afterObservedFailure && lastFailure) {
      returnArcs.push({ from: lastFailure, to: point });
      lastFailure = null;
    }
  }

  const pointBySequence = new Map(points.map((point) => [point.observation.sequence, point]));
  const structure = deriveRunSheetStructure(workprint);
  const itemStitches = structure.itemThreads.flatMap((thread): ItemStitch[] => {
    const from = pointBySequence.get(thread.startedSequence);
    if (!from) return [];
    const to = thread.terminalSequence === null ? null : pointBySequence.get(thread.terminalSequence) ?? null;
    return [{ itemId: thread.itemId, from, to, terminalObserved: to !== null }];
  });
  const turnSpans = structure.turnRanges.flatMap((range): TurnSpan[] => {
    const from = pointBySequence.get(range.startedSequence);
    if (!from) return [];
    const to = range.completedSequence === null ? null : pointBySequence.get(range.completedSequence) ?? null;
    return [{ index: range.index, from, to, terminalObserved: to !== null }];
  });

  return { width, height, points, segments, returnArcs, itemStitches, turnSpans, rows, maxPerRow };
}

export function cubicPoint(segment: WorklineSegment, t: number): { x: number; y: number } {
  const inv = 1 - t;
  return {
    x:
      inv ** 3 * segment.from.x +
      3 * inv ** 2 * t * segment.c1x +
      3 * inv * t ** 2 * segment.c2x +
      t ** 3 * segment.to.x,
    y:
      inv ** 3 * segment.from.y +
      3 * inv ** 2 * t * segment.c1y +
      3 * inv * t ** 2 * segment.c2y +
      t ** 3 * segment.to.y,
  };
}
