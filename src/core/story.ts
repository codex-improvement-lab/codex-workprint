import type { WorkprintIR } from "./types.ts";

export interface RunReceiptStory {
  headline: string;
  detail: string;
  shapeName: string;
  shareText: string;
  caption: string;
  openItemCount: number;
  statusAbsentObservationCount: number;
  excludedCategoryCount: number;
}

const SHAPE_COLORS = ["COBALT", "CORAL", "ACID", "CARBON", "IVORY", "SILVER", "SAFFRON", "INK"] as const;
const SHAPE_FORMS = ["SWITCHBACK", "BRIDGE", "FOLD", "SPINE", "TRACE", "ARC", "LOOP", "CROSSING"] as const;

export function createRunReceiptStory(workprint: WorkprintIR): RunReceiptStory {
  const failed = workprint.summary.itemFailed;
  const later = workprint.summary.completionAfterObservedFailure;
  const completed = workprint.summary.itemCompleted;
  const observations = workprint.observations.length;
  const openItemCount = countOpenItems(workprint);
  const statusAbsentObservationCount = workprint.summary.itemStatusNotObserved;
  const excludedCategoryCount = workprint.privacy.excludedCategories.length;
  const headline = failed > 0 && later > 0
    ? `${failed} failed ${noun(failed, "item")} → ${later} later ${noun(later, "completion")}`
    : failed > 0
      ? `${failed} failed ${noun(failed, "item")} observed`
      : completed > 0
        ? `${completed} completed ${noun(completed, "item")} / no failed item observed`
        : `${observations} public ${noun(observations, "observation")} / outcome not observed`;
  const detail = `${observations} public ${noun(observations, "observation")} · ${openItemCount} ${noun(openItemCount, "item")} left open · ${statusAbsentObservationCount} status-absent ${noun(statusAbsentObservationCount, "observation")} · ${excludedCategoryCount} private categories excluded`;
  const shapeName = createShapeName(workprint.source.shapeSha256);
  const url = workprint.run.publicIdentity?.publicUrl;
  const shareText = `${workprint.run.publicTitle} — ${headline}. ${observations} public ${noun(observations, "observation")}; ${excludedCategoryCount} private categories excluded. ${shapeName}. Receipt, not attestation.`;
  const caption = `${shareText}${url ? ` ${url}` : ""}`;
  return {
    headline,
    detail,
    shapeName,
    shareText,
    caption,
    openItemCount,
    statusAbsentObservationCount,
    excludedCategoryCount,
  };
}

export function createShapeName(shapeSha256: string): string {
  const normalized = /^[a-f0-9]{64}$/.test(shapeSha256) ? shapeSha256 : "0000000000000000";
  const color = SHAPE_COLORS[Number.parseInt(normalized.slice(0, 2), 16) % SHAPE_COLORS.length];
  const form = SHAPE_FORMS[Number.parseInt(normalized.slice(2, 4), 16) % SHAPE_FORMS.length];
  return `${color} ${form} · ${normalized.slice(0, 4).toUpperCase()}`;
}

function noun(count: number, singular: string): string {
  return count === 1 ? singular : `${singular}s`;
}

function countOpenItems(workprint: WorkprintIR): number {
  const started = new Set(
    workprint.observations
      .filter((observation) => observation.eventType === "item.started" && observation.itemId !== null)
      .map((observation) => observation.itemId as string),
  );
  for (const observation of workprint.observations) {
    if (observation.eventType === "item.completed" && observation.itemId !== null) started.delete(observation.itemId);
  }
  return started.size;
}
