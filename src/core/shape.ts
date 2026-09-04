import { canonicalJsonCompact } from "./canonical.ts";
import { sha256 } from "./hash.ts";
import type { PublicObservation } from "./types.ts";

export interface ShapeObservation {
  eventType: PublicObservation["eventType"];
  itemId: string | null;
  itemType: PublicObservation["itemType"];
  status: PublicObservation["status"];
  exitCode: number | null;
  afterObservedFailure: boolean;
}

/**
 * Project only the ordered, public observation structure that is permitted to
 * influence Workline geometry. Public copy and reviewed semantic annotations
 * deliberately do not enter this projection.
 */
export function createShapeProjection(observations: PublicObservation[]): ShapeObservation[] {
  return observations.map((observation) => ({
    eventType: observation.eventType,
    itemId: observation.itemId,
    itemType: observation.itemType,
    status: observation.status,
    exitCode: observation.exitCode,
    afterObservedFailure: observation.afterObservedFailure,
  }));
}

export function computeShapeSha256(observations: PublicObservation[]): string {
  return sha256(canonicalJsonCompact(createShapeProjection(observations)));
}
