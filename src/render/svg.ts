import type { PublicObservation, PublicPhase, WorkprintIR } from "../core/types.ts";
import { deriveRunSheetStructure, type RunSheetMoment } from "./run-sheet.ts";
import {
  colorForObservation,
  createWorklineLayout,
  PALETTE,
  type ItemStitch,
  type ReturnArc,
  type TurnSpan,
  type WorklineLayout,
} from "./workline.ts";

const PHASE_COLORS: Record<PublicPhase, string> = {
  inspect: "#f1ecdf",
  edit: "#2457ff",
  verify: "#c7ff36",
  recover: "#ff665c",
  deliver: "#f1ecdf",
};

const RHYTHM_HEIGHT: Record<NonNullable<PublicObservation["itemType"]>, number> = {
  run: 22,
  turn: 30,
  command_execution: 54,
  file_change: 68,
  agent_message: 42,
  unknown: 74,
};

export function renderWorkprintSvg(workprint: WorkprintIR, interactive = false): string {
  const layout = createWorklineLayout(workprint, 1420, 350, 18);
  const structure = deriveRunSheetStructure(workprint);
  const shapeId = workprint.source.shapeSha256.slice(0, 12).toUpperCase();
  const visibleTitle = truncate(workprint.run.publicTitle, 62);
  const title = escapeXml(visibleTitle);
  const titleFontSize = Math.max(30, Math.min(56, Math.floor(1760 / Math.max(1, [...visibleTitle].length))));
  const labels = escapeXml(truncate(workprint.run.publicLabels.join(" · "), 90));
  const linePaths = layout.segments.map((segment, index) => {
    const path = `M ${n(segment.from.x)} ${n(segment.from.y)} C ${n(segment.c1x)} ${n(segment.c1y)}, ${n(segment.c2x)} ${n(segment.c2y)}, ${n(segment.to.x)} ${n(segment.to.y)}`;
    const dash = segment.dashed ? ` stroke-dasharray="5 10"` : "";
    const foldClass = segment.folded ? " fold-segment" : "";
    return [
      `<path d="${path}" fill="none" stroke="${segment.color}" stroke-width="24" opacity="0.055" stroke-linecap="round"${dash}/>`,
      `<path class="workline-segment${foldClass}" data-step="${index + 2}" style="--segment:${index}" d="${path}" fill="none" stroke="${segment.color}" stroke-width="6" stroke-linecap="round"${dash}/>`
    ].join("");
  }).join("");
  const stitches = layout.itemStitches.map(renderItemStitch).join("");
  const returnArcs = layout.returnArcs.map(renderReturnArc).join("");
  const turnSpans = layout.turnSpans.map(renderTurnSpan).join("");
  const stations = layout.points.map((point, index) =>
    renderStation(
      point.observation,
      point.x,
      point.y,
      point.color,
      interactive,
      shouldShowStationLabel(point.observation, workprint.observations.length),
      index,
    )
  ).join("");
  const emptyState = layout.points.length === 0
    ? `<text x="710" y="175" text-anchor="middle" class="empty">NO PUBLIC OBSERVATIONS</text>`
    : "";
  const followUp = workprint.summary.completionAfterObservedFailure > 0
    ? `<g transform="translate(785 0)"><circle cx="0" cy="0" r="5" fill="${PALETTE.coral}"/><text x="13" y="4" class="return-label">LATER COMPLETION OBSERVED · RECOVERY NOT CLAIMED</text></g>`
    : `<text x="785" y="4" class="quiet-label">NO POST-FAIL COMPLETION OBSERVED</text>`;

  return `${interactive ? "" : `<?xml version="1.0" encoding="UTF-8"?>\n`}<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 980" role="img" aria-labelledby="workprint-title workprint-desc" class="workprint-artifact shape-reveal">
  <title id="workprint-title">${title} — Codex Workprint Run Sheet</title>
  <desc id="workprint-desc">A privacy-first Run Sheet of ${workprint.observations.length} ordered Codex JSONL observations. Geometry expresses sequence and whitelisted observation structure, not time, correctness, recovery, identity, or authenticity.</desc>
  <style>
    .workprint-artifact{background:${PALETTE.paper};font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.eyebrow,.metric-label,.legend,.footer,.return-label,.quiet-label,.public-label,.panel-label,.moment-label,.structure-label,.fold-label,.turn-label{font-family:"Arial Narrow",Inter,ui-sans-serif,system-ui,sans-serif;font-weight:750;letter-spacing:1.7px}.eyebrow{font-size:13px;fill:${PALETTE.ink}}.run-title{font-family:Georgia,"Times New Roman",serif;font-weight:700;fill:${PALETTE.paper}}.metric-number{font-size:34px;font-weight:780;fill:${PALETTE.paper}}.metric-label{font-size:10px;fill:${PALETTE.silver}}.legend{font-size:10px;fill:${PALETTE.silver}}.footer{font-size:11px;fill:${PALETTE.ink}}.return-label{font-size:9px;fill:${PALETTE.coral}}.quiet-label{font-size:9px;fill:${PALETTE.silver}}.public-label{font-size:10px;fill:${PALETTE.ink}}.panel-label{font-size:10px;fill:${PALETTE.silver}}.moment-seq{font-size:22px;font-weight:800;fill:${PALETTE.carbon}}.moment-label{font-size:10px;fill:${PALETTE.paper}}.moment-detail{font-size:11px;fill:${PALETTE.silver}}.structure-number{font-size:25px;font-weight:800;fill:${PALETTE.paper}}.structure-label{font-size:9px;fill:${PALETTE.silver}}.station-label{font-size:8px;font-weight:760;fill:${PALETTE.paper};letter-spacing:.8px}.station-seq{font-size:8px;font-weight:800;fill:${PALETTE.carbon}}.empty{font-size:14px;letter-spacing:2px;fill:${PALETTE.silver}}.phase-text{font-size:8px;font-weight:800;letter-spacing:.7px;fill:${PALETTE.paper}}.fold-label,.turn-label{font-size:8px;fill:${PALETTE.silver}}.station:focus{outline:none}.station:focus .focus-ring,.workline-station.is-replay-current .focus-ring{opacity:1}.workline-segment{stroke-dasharray:1800;stroke-dashoffset:0}.fold-segment{stroke-width:4}.replay-running .workline-segment,.replay-running .workline-station{opacity:.12}.replay-running .workline-segment.is-revealed,.replay-running .workline-station.is-revealed{opacity:1}.workline-segment,.workline-station{transition:opacity .18s ease}.public-label+.public-label{margin-left:8px}
    @media(prefers-reduced-motion:no-preference){.shape-reveal .workline-segment{animation:reveal 1.65s cubic-bezier(.2,.75,.2,1) both;animation-delay:calc(var(--segment) * 38ms)}.workline-station.is-replay-current .focus-ring{animation:pulse .72s ease-out both}@keyframes reveal{from{stroke-dashoffset:1800}to{stroke-dashoffset:0}}@keyframes pulse{0%{r:10;opacity:1}100%{r:20;opacity:.15}}}
  </style>
  <rect width="1600" height="980" fill="${PALETTE.paper}"/>
  <path d="M0 0H1600V12H0Z" fill="${PALETTE.cobalt}"/>
  <path d="M1040 0H1330V12H1040Z" fill="${PALETTE.acid}"/>
  <path d="M1330 0H1600V12H1330Z" fill="${PALETTE.coral}"/>
  <g transform="translate(48 55)">
    <text class="eyebrow">CODEX WORKPRINT · THE RUN HAS A SHAPE</text>
    <text x="1504" text-anchor="end" class="eyebrow">RUN SHEET · SHAPE ${shapeId}</text>
  </g>
  <g transform="translate(30 82)">
    <rect width="1540" height="822" rx="4" fill="${PALETTE.carbon}"/>
    <path d="M0 168H1540M0 590H1540" stroke="#34362f" stroke-width="1"/>
    <text x="58" y="69" class="run-title" style="font-size:${titleFontSize}px">${title}</text>
    <text x="60" y="111" class="panel-label">ONE EXPLICIT RUN · PUBLIC OBSERVATION STRUCTURE · TIMING ${workprint.source.timing.toUpperCase()}</text>
    <g transform="translate(1065 39)">
      ${metric(0, "STARTED", workprint.summary.itemStarted)}
      ${metric(112, "COMPLETED", workprint.summary.itemCompleted)}
      ${metric(242, "FAILED", workprint.summary.itemFailed, PALETTE.coral)}
      ${metric(345, "NO STATUS / UNKNOWN", workprint.summary.itemStatusNotObserved + workprint.summary.unknown, PALETTE.silver)}
    </g>
    <g transform="translate(60 197)">
      <text class="panel-label">01 · OBSERVED WORKLINE</text>
      ${followUp}
      <text x="1420" text-anchor="end" class="panel-label">${layout.rows} FOLD${layout.rows === 1 ? "" : "S"} · ${workprint.observations.length} ORDERED OBSERVATIONS</text>
      <g transform="translate(0 24)">
        ${renderRowGrid(layout)}
        ${turnSpans}${stitches}${linePaths}${returnArcs}${stations}${emptyState}
      </g>
    </g>
    <g transform="translate(60 616)">
      <g>
        <text class="panel-label">02 · TURNING POINTS</text>
        ${renderMoments(structure.moments)}
      </g>
      <path d="M545 -4V164M1085 -4V164" stroke="#34362f" stroke-width="1"/>
      <g transform="translate(575 0)">
        <text class="panel-label">03 · RUN RHYTHM / SEQUENCE, NOT TIME</text>
        ${renderRhythm(workprint)}
        <text x="0" y="148" class="structure-label">${structure.pairedItemCount} ITEM PAIRS · ${structure.openItemCount} OPEN · ${layout.rows} WORKLINE FOLD${layout.rows === 1 ? "" : "S"}</text>
      </g>
      <g transform="translate(1115 0)">
        <text class="panel-label">04 · PUBLIC STRUCTURE</text>
        ${structureMetric(0, structure.turnRanges.length, "TURN RANGES")}
        ${structureMetric(112, structure.chapterMarkers.length, "PUBLIC MARKERS")}
        ${structureMetric(236, structure.pairedItemCount, "ITEM PAIRS")}
        ${renderChapterMarkers(structure.chapterMarkers)}
      </g>
    </g>
  </g>
  <g transform="translate(48 944)">
    <text class="footer">npx codex-workprint build run.jsonl --title &quot;…&quot; --out ./workprint</text>
    <text x="1504" text-anchor="end" class="footer">PUBLIC PROJECTION · NOT AN ATTESTATION · NO TRANSCRIPT</text>
    <text y="23" class="public-label">${labels || "NO OPTIONAL PUBLIC LABELS"}</text>
    <text x="1504" y="23" text-anchor="end" class="public-label">MADE WITH CODEX WORKPRINT · SHAPE ${shapeId}</text>
  </g>
</svg>\n`.replace(/[ \t]+$/gm, "");
}

function renderRowGrid(layout: WorklineLayout): string {
  const verticalPadding = 28;
  const usableHeight = layout.height - verticalPadding * 2;
  const rowHeight = usableHeight / layout.rows;
  return Array.from({ length: layout.rows }, (_, row) => {
    const top = verticalPadding + row * rowHeight;
    const middle = top + rowHeight * 0.52;
    const bottom = top + rowHeight;
    const direction = row % 2 === 0 ? "LEFT → RIGHT" : "RIGHT → LEFT";
    return `<g><path d="M0 ${n(middle)}H1420" stroke="#292b26" stroke-width="1"/><path d="M0 ${n(bottom)}H1420" stroke="#23241f" stroke-width="1" stroke-dasharray="3 9"/><text x="${row % 2 === 0 ? 0 : 1420}" y="${n(Math.max(10, top - 7))}" text-anchor="${row % 2 === 0 ? "start" : "end"}" class="fold-label">FOLD ${String(row + 1).padStart(2, "0")} · ${direction}</text></g>`;
  }).join("");
}

function renderItemStitch(stitch: ItemStitch): string {
  if (!stitch.to) {
    const endX = stitch.from.x + stitch.from.direction * 36;
    const endY = stitch.from.y + 18;
    return `<g opacity="0.7"><path d="M ${n(stitch.from.x)} ${n(stitch.from.y)} Q ${n((stitch.from.x + endX) / 2)} ${n(endY + 14)}, ${n(endX)} ${n(endY)}" fill="none" stroke="${PALETTE.silver}" stroke-width="2" stroke-dasharray="3 5"/><path d="M ${n(endX - 4)} ${n(endY - 4)}L${n(endX + 4)} ${n(endY + 4)}M${n(endX + 4)} ${n(endY - 4)}L${n(endX - 4)} ${n(endY + 4)}" stroke="${PALETTE.silver}" stroke-width="1.5"/></g>`;
  }
  if (stitch.from.row === stitch.to.row) {
    const centerX = (stitch.from.x + stitch.to.x) / 2;
    const controlY = Math.min(342, Math.max(stitch.from.y, stitch.to.y) + 42);
    return `<path d="M ${n(stitch.from.x)} ${n(stitch.from.y)} Q ${n(centerX)} ${n(controlY)}, ${n(stitch.to.x)} ${n(stitch.to.y)}" fill="none" stroke="${PALETTE.silver}" stroke-width="1.5" stroke-dasharray="3 5" opacity="0.52"/>`;
  }
  const edgeX = stitch.from.direction === 1 ? 1410 : 10;
  return `<path d="M ${n(stitch.from.x)} ${n(stitch.from.y)} C ${n(edgeX)} ${n(stitch.from.y)}, ${n(edgeX)} ${n(stitch.to.y)}, ${n(stitch.to.x)} ${n(stitch.to.y)}" fill="none" stroke="${PALETTE.silver}" stroke-width="1.5" stroke-dasharray="3 5" opacity="0.52"/>`;
}

function renderReturnArc(arc: ReturnArc): string {
  if (arc.from.row === arc.to.row) {
    const centerX = (arc.from.x + arc.to.x) / 2;
    const highY = Math.max(6, Math.min(arc.from.y, arc.to.y) - 70);
    return `<path d="M ${n(arc.from.x)} ${n(arc.from.y)} Q ${n(centerX)} ${n(highY)}, ${n(arc.to.x)} ${n(arc.to.y)}" fill="none" stroke="${PALETTE.coral}" stroke-width="3" stroke-dasharray="8 7" opacity="0.95"/>`;
  }
  const edgeX = arc.from.direction === 1 ? 1408 : 12;
  return `<path d="M ${n(arc.from.x)} ${n(arc.from.y)} C ${n(edgeX)} ${n(arc.from.y - 26)}, ${n(edgeX)} ${n(arc.to.y - 26)}, ${n(arc.to.x)} ${n(arc.to.y)}" fill="none" stroke="${PALETTE.coral}" stroke-width="3" stroke-dasharray="8 7" opacity="0.95"/>`;
}

function renderTurnSpan(span: TurnSpan): string {
  if (!span.to) {
    return `<text x="${n(span.from.x)}" y="${n(Math.max(10, span.from.y - 28))}" text-anchor="middle" class="turn-label">TURN ${String(span.index).padStart(2, "0")} · END NOT OBSERVED</text>`;
  }
  if (span.from.row !== span.to.row) {
    return `<g class="turn-span"><text x="${n(span.from.x)}" y="${n(Math.max(10, span.from.y - 27))}" text-anchor="middle" class="turn-label">TURN ${String(span.index).padStart(2, "0")} START</text><text x="${n(span.to.x)}" y="${n(Math.max(10, span.to.y - 27))}" text-anchor="middle" class="turn-label">TURN ${String(span.index).padStart(2, "0")} END</text></g>`;
  }
  const top = Math.max(11, Math.min(span.from.y, span.to.y) - 30);
  const left = Math.min(span.from.x, span.to.x);
  const right = Math.max(span.from.x, span.to.x);
  return `<g class="turn-span" opacity="0.72"><path d="M ${n(left)} ${n(top + 8)}V${n(top)}H${n(right)}V${n(top + 8)}" fill="none" stroke="${PALETTE.silver}" stroke-width="1"/><text x="${n((left + right) / 2)}" y="${n(top - 5)}" text-anchor="middle" class="turn-label">TURN ${String(span.index).padStart(2, "0")} · OBSERVED RANGE</text></g>`;
}

function renderStation(
  observation: PublicObservation,
  x: number,
  y: number,
  color: string,
  interactive: boolean,
  showLabel: boolean,
  index: number,
): string {
  const label = observation.itemType === "command_execution"
    ? "COMMAND"
    : observation.itemType === "file_change"
      ? "FILE CHANGE"
      : observation.itemType === "agent_message"
        ? "MESSAGE"
        : observation.itemType?.toUpperCase() ?? "EVENT";
  const phase = observation.publicPhase
    ? `<g transform="translate(0 20)"><rect x="-26" y="0" width="52" height="15" rx="2" fill="${PHASE_COLORS[observation.publicPhase]}" opacity="0.24"/><text y="11" text-anchor="middle" class="phase-text">${observation.publicPhase.toUpperCase()}</text></g>`
    : "";
  const attributes = interactive
    ? ` class="station workline-station" data-workline-station="true" data-sequence="${observation.sequence}" data-step="${observation.sequence}" tabindex="0" role="button" aria-pressed="false" aria-label="Observation ${observation.sequence}: ${escapeXml(label)}, ${escapeXml(observation.status)}"`
    : ` class="station workline-station" data-step="${observation.sequence}"`;
  return `<g transform="translate(${n(x)} ${n(y)})"${attributes} style="--station:${index}">
    <circle class="focus-ring" r="15" fill="none" stroke="${PALETTE.paper}" stroke-width="2" opacity="0"/>
    <circle r="10" fill="${color}" stroke="${PALETTE.carbon}" stroke-width="3"/>
    <circle r="4" fill="${PALETTE.carbon}"/>
    <text y="3" text-anchor="middle" class="station-seq">${observation.sequence}</text>
    ${showLabel ? `<text y="-16" text-anchor="middle" class="station-label">${escapeXml(label)}</text>` : ""}
    ${phase}
  </g>`;
}

function renderMoments(moments: RunSheetMoment[]): string {
  if (moments.length === 0) return `<text y="55" class="moment-detail">NO PRIORITIZED TURNING POINTS IN THE PUBLIC PROJECTION.</text>`;
  return moments.map((moment, index) => {
    const y = 36 + index * 48;
    const color = moment.kind === "failure" || moment.kind === "later-completion" ? PALETTE.coral : moment.kind === "unknown" || moment.kind === "open-item" ? PALETTE.silver : PALETTE.acid;
    return `<g transform="translate(0 ${y})"><rect width="38" height="30" rx="2" fill="${color}"/><text x="19" y="22" text-anchor="middle" class="moment-seq">${moment.sequence}</text><text x="53" y="11" class="moment-label">${escapeXml(moment.label)}</text><text x="53" y="28" class="moment-detail">${escapeXml(truncate(moment.detail, 66))}</text></g>`;
  }).join("");
}

function renderRhythm(workprint: WorkprintIR): string {
  const width = 485;
  const count = Math.max(1, workprint.observations.length);
  const slot = width / count;
  const barWidth = Math.max(2, Math.min(13, slot * 0.58));
  const bars = workprint.observations.map((observation, index) => {
    const height = RHYTHM_HEIGHT[observation.itemType ?? "unknown"];
    const x = index * slot + (slot - barWidth) / 2;
    const color = colorForObservation(observation);
    return `<rect x="${n(x)}" y="${n(92 - height)}" width="${n(barWidth)}" height="${height}" fill="${color}" opacity="${observation.status === "not-observed" ? "0.62" : "0.92"}"/>`;
  }).join("");
  return `<g transform="translate(0 30)"><path d="M0 92H485" stroke="#45473f" stroke-width="1"/>${bars}<text y="116" class="structure-label">1</text><text x="485" y="116" text-anchor="end" class="structure-label">${workprint.observations.length} · ORDERED</text></g>`;
}

function renderChapterMarkers(markers: ReturnType<typeof deriveRunSheetStructure>["chapterMarkers"]): string {
  if (markers.length === 0) return `<text y="122" class="structure-label">NO PUBLIC CHAPTER MARKERS</text>`;
  return markers.slice(0, 4).map((marker, index) => {
    const y = 80 + index * 18;
    return `<text y="${y}" class="structure-label">#${marker.sequence} · ${escapeXml(marker.phase.toUpperCase())}${marker.label ? ` · ${escapeXml(truncate(marker.label, 26))}` : ""}</text>`;
  }).join("");
}

function metric(x: number, label: string, value: number, color = PALETTE.paper): string {
  return `<g transform="translate(${x} 0)"><text y="34" class="metric-number" style="fill:${color}">${value}</text><text y="54" class="metric-label">${label}</text></g>`;
}

function structureMetric(x: number, value: number, label: string): string {
  return `<g transform="translate(${x} 28)"><text class="structure-number">${value}</text><text y="22" class="structure-label">${label}</text></g>`;
}

function shouldShowStationLabel(observation: PublicObservation, count: number): boolean {
  if (count <= 18) return true;
  if (observation.publicPhase || observation.afterObservedFailure || observation.status === "failed") return true;
  if (observation.sequence === 1 || observation.sequence === count) return true;
  const interval = Math.max(2, Math.ceil(count / 12));
  return observation.sequence % interval === 0;
}

function truncate(value: string, max: number): string {
  const chars = [...value];
  return chars.length <= max ? value : `${chars.slice(0, max - 1).join("")}…`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function n(value: number): string {
  return Number(value.toFixed(2)).toString();
}
