import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import type { WorkprintIR } from "../core/types.ts";
import { createRunReceiptStory } from "../core/story.ts";
import {
  PALETTE,
  colorForObservation,
  createWorklineLayout,
  cubicPoint,
  type WorklineSegment,
} from "./workline.ts";
import { PNG_RENDERER_VERSION } from "../version.ts";

/**
 * The PNG renderer is deliberately identified independently from the HTML/SVG
 * renderers.  It is part of the public artifact receipt, so changing drawing
 * code should result in a new identifier rather than a silently different
 * share card.
 */
export const PNG_RENDERER_ID = PNG_RENDERER_VERSION;

const WIDTH = 1200;
const HEIGHT = 630;
const CHANNELS = 3;
const UNIFONT_PATH = new URL("../../assets/fonts/unifont-17.0.05.hex.gz", import.meta.url);

type Rgb = readonly [number, number, number];

const colorFromHex = (hex: string): Rgb => {
  const value = Number.parseInt(hex.replace(/^#/, ""), 16);
  if (!Number.isFinite(value)) return [0, 0, 0];
  return [(value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
};

const COLORS = {
  carbon: colorFromHex(PALETTE.carbon),
  paper: colorFromHex(PALETTE.paper),
  acid: colorFromHex(PALETTE.acid),
  cobalt: colorFromHex(PALETTE.cobalt),
  coral: colorFromHex(PALETTE.coral),
  silver: colorFromHex(PALETTE.silver),
  ink: colorFromHex(PALETTE.ink),
  paleInk: colorFromHex("#55584f"),
  palePaper: colorFromHex("#d5d8cf"),
  carbonSoft: colorFromHex("#1d201a"),
  paperShadow: colorFromHex("#d8d1c2"),
} as const;

const PNG_PALETTE: readonly Rgb[] = [
  COLORS.carbon,
  COLORS.paper,
  COLORS.acid,
  COLORS.cobalt,
  COLORS.coral,
  COLORS.silver,
  COLORS.ink,
  COLORS.paleInk,
  COLORS.palePaper,
  COLORS.carbonSoft,
  COLORS.paperShadow,
];

/**
 * A compact 5x7 bitmap alphabet.  It keeps the share card independent of
 * browser rendering, installed fonts, and operating-system text rasterizers.
 */
const FONT: Record<string, readonly string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  6: ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "_": ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00000", "00100"],
  ":": ["00000", "00100", "00100", "00000", "00100", "00100", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "\\": ["10000", "01000", "01000", "00100", "00010", "00010", "00001"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "11111", "00000", "11111", "00000", "00000", "00000"],
  "#": ["01010", "11111", "01010", "01010", "11111", "01010", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "'": ["00100", "00100", "00000", "00000", "00000", "00000", "00000"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  ",": ["00000", "00000", "00000", "00000", "00100", "00100", "01000"],
};

interface UnicodeGlyph {
  width: 8 | 16;
  rows: Uint16Array;
}

export interface BitmapCoverage {
  characters: number;
  supported: number;
  missingCodePoints: string[];
}

export interface ShareCardBitmapCoverage {
  supported: boolean;
  missingByField: Array<{ field: string; missingCodePoints: string[] }>;
}

let unicodeGlyphs: Map<number, UnicodeGlyph> | undefined;

export function inspectBitmapCoverage(value: string): BitmapCoverage {
  const glyphs = loadUnicodeGlyphs();
  const characters = [...String(value)];
  const missingCodePoints = characters
    .map((character) => character.codePointAt(0) ?? 0)
    .filter((codePoint) => !glyphs.has(codePoint))
    .map((codePoint) => `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`);
  return {
    characters: characters.length,
    supported: characters.length - missingCodePoints.length,
    missingCodePoints,
  };
}

function loadUnicodeGlyphs(): Map<number, UnicodeGlyph> {
  if (unicodeGlyphs) return unicodeGlyphs;
  const source = gunzipSync(readFileSync(UNIFONT_PATH)).toString("ascii");
  const glyphs = new Map<number, UnicodeGlyph>();
  for (const line of source.split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 1) continue;
    const codePoint = Number.parseInt(line.slice(0, separator), 16);
    const bitmap = line.slice(separator + 1).trim();
    const width = bitmap.length === 32 ? 8 : bitmap.length === 64 ? 16 : null;
    if (!Number.isInteger(codePoint) || width === null) continue;
    const digitsPerRow = width / 4;
    const rows = new Uint16Array(16);
    for (let row = 0; row < 16; row += 1) rows[row] = Number.parseInt(bitmap.slice(row * digitsPerRow, (row + 1) * digitsPerRow), 16);
    glyphs.set(codePoint, { width, rows });
  }
  unicodeGlyphs = glyphs;
  return glyphs;
}

function uppercaseAscii(value: string): string {
  let result = "";
  for (const character of value) {
    const code = character.charCodeAt(0);
    result += code >= 0x61 && code <= 0x7a ? String.fromCharCode(code - 0x20) : character;
  }
  return result;
}

function putRgb(pixels: Uint8Array, x: number, y: number, color: Rgb): void {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= WIDTH || iy >= HEIGHT) return;
  const index = (iy * WIDTH + ix) * CHANNELS;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
}

function fillRgb(pixels: Uint8Array, color: Rgb): void {
  for (let index = 0; index < pixels.length; index += CHANNELS) {
    pixels[index] = color[0];
    pixels[index + 1] = color[1];
    pixels[index + 2] = color[2];
  }
}

function fillRect(pixels: Uint8Array, x: number, y: number, width: number, height: number, color: Rgb): void {
  const left = Math.max(0, Math.floor(x));
  const top = Math.max(0, Math.floor(y));
  const right = Math.min(WIDTH, Math.ceil(x + width));
  const bottom = Math.min(HEIGHT, Math.ceil(y + height));
  if (right <= left || bottom <= top) return;
  for (let iy = top; iy < bottom; iy += 1) {
    let index = (iy * WIDTH + left) * CHANNELS;
    for (let ix = left; ix < right; ix += 1) {
      pixels[index] = color[0];
      pixels[index + 1] = color[1];
      pixels[index + 2] = color[2];
      index += CHANNELS;
    }
  }
}

function drawRectOutline(
  pixels: Uint8Array,
  x: number,
  y: number,
  width: number,
  height: number,
  thickness: number,
  color: Rgb,
): void {
  fillRect(pixels, x, y, width, thickness, color);
  fillRect(pixels, x, y + height - thickness, width, thickness, color);
  fillRect(pixels, x, y, thickness, height, color);
  fillRect(pixels, x + width - thickness, y, thickness, height, color);
}

function drawDisc(pixels: Uint8Array, cx: number, cy: number, radius: number, color: Rgb): void {
  const r = Math.max(0, Math.round(radius));
  const centerX = Math.round(cx);
  const centerY = Math.round(cy);
  const radiusSquared = r * r;
  for (let y = -r; y <= r; y += 1) {
    for (let x = -r; x <= r; x += 1) {
      if (x * x + y * y <= radiusSquared) putRgb(pixels, centerX + x, centerY + y, color);
    }
  }
}

function drawLine(
  pixels: Uint8Array,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: number,
  color: Rgb,
): void {
  if (![x0, y0, x1, y1, width].every(Number.isFinite)) return;
  const startX = Math.round(x0);
  const startY = Math.round(y0);
  const endX = Math.round(x1);
  const endY = Math.round(y1);
  const dx = Math.abs(endX - startX);
  const sx = startX < endX ? 1 : -1;
  const dy = -Math.abs(endY - startY);
  const sy = startY < endY ? 1 : -1;
  let error = dx + dy;
  const radius = Math.max(0, Math.floor(width / 2));
  let x = startX;
  let y = startY;
  while (true) {
    drawDisc(pixels, x, y, radius, color);
    if (x === endX && y === endY) break;
    const twiceError = 2 * error;
    if (twiceError >= dy) {
      error += dy;
      x += sx;
    }
    if (twiceError <= dx) {
      error += dx;
      y += sy;
    }
  }
}

function drawText(pixels: Uint8Array, value: string, x: number, y: number, scale: number, color: Rgb): void {
  const safeText = uppercaseAscii(String(value));
  const glyphScale = Math.max(1, Math.round(scale));
  let cursorX = Math.round(x);
  const originY = Math.round(y);
  for (const character of safeText) {
    const glyph = FONT[character];
    if (!glyph) throw new Error(`Fixed share-card text contains unsupported character U+${(character.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}.`);
    for (let row = 0; row < glyph.length; row += 1) {
      const bits = glyph[row];
      for (let column = 0; column < bits.length; column += 1) {
        if (bits[column] !== "1") continue;
        fillRect(
          pixels,
          cursorX + column * glyphScale,
          originY + row * glyphScale,
          glyphScale,
          glyphScale,
          color,
        );
      }
    }
    cursorX += 6 * glyphScale;
  }
}

function unicodeTextWidth(value: string, scale: number): number {
  const glyphs = loadUnicodeGlyphs();
  const characters = [...String(value)];
  if (characters.length === 0) return 0;
  return characters.reduce((width, character) => {
    const glyph = glyphs.get(character.codePointAt(0) ?? 0) ?? glyphs.get(0x25a1);
    return width + ((glyph?.width ?? 16) + 2) * scale;
  }, 0) - 2 * scale;
}

function drawUnicodeText(pixels: Uint8Array, value: string, x: number, y: number, scale: number, color: Rgb): void {
  const glyphs = loadUnicodeGlyphs();
  const glyphScale = Math.max(1, Math.round(scale));
  let cursorX = Math.round(x);
  const originY = Math.round(y);
  for (const character of String(value)) {
    const codePoint = character.codePointAt(0) ?? 0;
    const glyph = glyphs.get(codePoint);
    if (!glyph) throw new Error(`Unicode share-card text contains unsupported character U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}.`);
    for (let row = 0; row < 16; row += 1) {
      const bits = glyph.rows[row];
      for (let column = 0; column < glyph.width; column += 1) {
        if (((bits >>> (glyph.width - column - 1)) & 1) === 0) continue;
        fillRect(pixels, cursorX + column * glyphScale, originY + row * glyphScale, glyphScale, glyphScale, color);
      }
    }
    cursorX += (glyph.width + 2) * glyphScale;
  }
}

function drawFittedUnicodeText(
  pixels: Uint8Array,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  maxScale: number,
  color: Rgb,
): void {
  let scale = Math.max(1, Math.round(maxScale));
  while (scale > 1 && unicodeTextWidth(value, scale) > maxWidth) scale -= 1;
  let visible = [...String(value)];
  if (unicodeTextWidth(visible.join(""), scale) > maxWidth) {
    const ellipsis = "…";
    while (visible.length > 1 && unicodeTextWidth(`${visible.join("")}${ellipsis}`, scale) > maxWidth) visible.pop();
    visible.push(ellipsis);
  }
  drawUnicodeText(pixels, visible.join(""), x, y, scale, color);
}

function colorForWorkline(hex: string): Rgb {
  return colorFromHex(hex);
}

function drawCubicSegment(
  pixels: Uint8Array,
  segment: WorklineSegment,
  offsetX: number,
  offsetY: number,
): void {
  const samples = 48;
  let previous = cubicPoint(segment, 0);
  for (let step = 1; step <= samples; step += 1) {
    const t = step / samples;
    const current = cubicPoint(segment, t);
    const dashedOn = !segment.dashed || Math.floor((step - 1) / 4) % 2 === 0;
    if (dashedOn) {
      drawLine(
        pixels,
        previous.x + offsetX,
        previous.y + offsetY,
        current.x + offsetX,
        current.y + offsetY,
        5,
        colorForWorkline(segment.color),
      );
    }
    previous = current;
  }
}

function drawDashedLine(
  pixels: Uint8Array,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: number,
  color: Rgb,
): void {
  const steps = 28;
  let previousX = x0;
  let previousY = y0;
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    if (Math.floor((step - 1) / 3) % 2 === 0) drawLine(pixels, previousX, previousY, x, y, width, color);
    previousX = x;
    previousY = y;
  }
}

function drawWorkline(pixels: Uint8Array, workprint: WorkprintIR): void {
  const layout = createWorklineLayout(workprint, 1040, 230, 18);
  const offsetX = 80;
  const offsetY = 226;

  // The lane rules are a quiet reference grid: the trajectory remains the
  // visual object, while the labels make the color and shape legible at a
  // glance in a small social preview.
  const horizontalPadding = 42;
  const verticalPadding = 28;
  const usableHeight = layout.height - verticalPadding * 2;
  if (layout.rows === 1) {
    const laneRows: Array<[string, number]> = [
      ["RUN", 0.13], ["TURN", 0.25], ["COMMAND", 0.5], ["FILE", 0.66], ["AGENT", 0.78],
    ];
    for (const [label, ratio] of laneRows) {
      const y = offsetY + verticalPadding + usableHeight * ratio;
      drawLine(pixels, offsetX + horizontalPadding, y, offsetX + layout.width - horizontalPadding, y, 1, COLORS.paperShadow);
      drawText(pixels, label, 42, y - 3, 1, COLORS.paleInk);
    }
    drawText(pixels, "UNKNOWN", 42, offsetY + verticalPadding + usableHeight * 0.58 - 3, 1, COLORS.paleInk);
  } else {
    const rowHeight = usableHeight / layout.rows;
    for (let row = 0; row < layout.rows; row += 1) {
      const middle = offsetY + verticalPadding + row * rowHeight + rowHeight * 0.52;
      const bottom = offsetY + verticalPadding + (row + 1) * rowHeight;
      drawLine(pixels, offsetX + horizontalPadding, middle, offsetX + layout.width - horizontalPadding, middle, 1, COLORS.paperShadow);
      drawDashedLine(pixels, offsetX + horizontalPadding, bottom, offsetX + layout.width - horizontalPadding, bottom, 1, COLORS.paperShadow);
      drawText(pixels, `F${String(row + 1).padStart(2, "0")}`, 45, middle - 3, 1, COLORS.paleInk);
    }
  }

  // Started/completed associations are drawn beneath the main route. They
  // come only from pseudonymized public item associations.
  for (const stitch of layout.itemStitches) {
    const fromX = stitch.from.x + offsetX;
    const fromY = stitch.from.y + offsetY;
    const toX = (stitch.to?.x ?? stitch.from.x + stitch.from.direction * 28) + offsetX;
    const toY = (stitch.to?.y ?? stitch.from.y + 16) + offsetY;
    drawDashedLine(pixels, fromX, fromY, toX, toY, 1, COLORS.silver);
    if (!stitch.terminalObserved) {
      drawLine(pixels, toX - 3, toY - 3, toX + 3, toY + 3, 1, COLORS.silver);
      drawLine(pixels, toX + 3, toY - 3, toX - 3, toY + 3, 1, COLORS.silver);
    }
  }

  for (const segment of layout.segments) {
    // A carbon under-stroke makes the line survive the paper grid and a
    // shrunken social-media thumbnail without introducing anti-aliasing.
    let previous = cubicPoint(segment, 0);
    for (let step = 1; step <= 48; step += 1) {
      const current = cubicPoint(segment, step / 48);
      const dashedOn = !segment.dashed || Math.floor((step - 1) / 4) % 2 === 0;
      if (dashedOn) {
        drawLine(
          pixels,
          previous.x + offsetX,
          previous.y + offsetY,
          current.x + offsetX,
          current.y + offsetY,
          9,
          COLORS.carbonSoft,
        );
      }
      previous = current;
    }
    drawCubicSegment(pixels, segment, offsetX, offsetY);
  }

  // A return arc only joins an observation explicitly marked after an
  // observed failure. It is a relation in the receipt, not an inferred task-level
  // recovery claim; there is intentionally no "recovered" label here.
  for (const arc of layout.returnArcs) {
    const fromX = arc.from.x + offsetX;
    const fromY = arc.from.y + offsetY;
    const toX = arc.to.x + offsetX;
    const toY = arc.to.y + offsetY;
    const controlX = (fromX + toX) / 2;
    const controlY = Math.max(offsetY + 6, Math.min(fromY, toY) - 64);
    let previousX = fromX;
    let previousY = fromY;
    for (let step = 1; step <= 32; step += 1) {
      const t = step / 32;
      const inv = 1 - t;
      const currentX = inv * inv * fromX + 2 * inv * t * controlX + t * t * toX;
      const currentY = inv * inv * fromY + 2 * inv * t * controlY + t * t * toY;
      drawLine(pixels, previousX, previousY, currentX, currentY, 3, COLORS.coral);
      previousX = currentX;
      previousY = currentY;
    }
  }

  for (const point of layout.points) {
    const x = point.x + offsetX;
    const y = point.y + offsetY;
    const observation = point.observation;
    const eventColor = observation.itemType === "unknown" ? COLORS.silver : colorForWorkline(point.color);
    const nonzero = observation.status === "failed" || (observation.exitCode !== null && observation.exitCode !== 0);
    drawDisc(pixels, x, y, nonzero ? 13 : 11, COLORS.carbon);
    drawDisc(pixels, x, y, nonzero ? 8 : 6, eventColor);
    if (observation.afterObservedFailure && observation.publicPhase !== null) {
      drawRectOutline(pixels, x - 11, y - 11, 22, 22, 2, COLORS.coral);
    }
    drawText(pixels, String(Math.max(0, Math.round(observation.sequence))), x - 3, y + 14, 1, COLORS.ink);
  }

  if (layout.points.length === 0) {
    drawText(pixels, "NO OBSERVED EVENTS", 414, offsetY + 112, 2, COLORS.paleInk);
  }

  // A compact event rhythm adds a second reading layer without inventing
  // duration. Bar height is categorical; horizontal position is sequence.
  const rhythmY = 468;
  const rhythmX = 122;
  const rhythmWidth = 998;
  drawText(pixels, "RHYTHM", 42, rhythmY - 3, 1, COLORS.paleInk);
  drawLine(pixels, rhythmX, rhythmY + 13, rhythmX + rhythmWidth, rhythmY + 13, 1, COLORS.paperShadow);
  const slot = rhythmWidth / Math.max(1, workprint.observations.length);
  for (let index = 0; index < workprint.observations.length; index += 1) {
    const observation = workprint.observations[index];
    const heights: Record<string, number> = { run: 5, turn: 7, command_execution: 11, file_change: 14, agent_message: 9, unknown: 15 };
    const height = heights[observation.itemType ?? "unknown"] ?? 15;
    const barWidth = Math.max(2, Math.min(8, slot * 0.58));
    const x = rhythmX + index * slot + (slot - barWidth) / 2;
    fillRect(pixels, x, rhythmY + 13 - height, barWidth, height, colorForWorkline(colorForObservation(observation)));
  }
}

function drawShareGlyph(pixels: Uint8Array, workprint: WorkprintIR): void {
  const layout = createWorklineLayout(workprint, 1020, 218, 20);
  const offsetX = 90;
  const offsetY = 232;

  for (const stitch of layout.itemStitches) {
    const fromX = stitch.from.x + offsetX;
    const fromY = stitch.from.y + offsetY;
    const toX = (stitch.to?.x ?? stitch.from.x + stitch.from.direction * 34) + offsetX;
    const toY = (stitch.to?.y ?? stitch.from.y + 18) + offsetY;
    drawDashedLine(pixels, fromX, fromY, toX, toY, 2, COLORS.silver);
    if (!stitch.terminalObserved) {
      drawLine(pixels, toX - 5, toY - 5, toX + 5, toY + 5, 2, COLORS.silver);
      drawLine(pixels, toX + 5, toY - 5, toX - 5, toY + 5, 2, COLORS.silver);
    }
  }

  for (const segment of layout.segments) {
    let previous = cubicPoint(segment, 0);
    for (let step = 1; step <= 48; step += 1) {
      const current = cubicPoint(segment, step / 48);
      if (!segment.dashed || Math.floor((step - 1) / 4) % 2 === 0) {
        drawLine(pixels, previous.x + offsetX, previous.y + offsetY, current.x + offsetX, current.y + offsetY, 13, COLORS.carbonSoft);
      }
      previous = current;
    }
    drawCubicSegment(pixels, segment, offsetX, offsetY);
  }

  for (const arc of layout.returnArcs) {
    const fromX = arc.from.x + offsetX;
    const fromY = arc.from.y + offsetY;
    const toX = arc.to.x + offsetX;
    const toY = arc.to.y + offsetY;
    const controlX = (fromX + toX) / 2;
    const controlY = Math.max(offsetY + 4, Math.min(fromY, toY) - 72);
    let previousX = fromX;
    let previousY = fromY;
    for (let step = 1; step <= 32; step += 1) {
      const t = step / 32;
      const inv = 1 - t;
      const currentX = inv * inv * fromX + 2 * inv * t * controlX + t * t * toX;
      const currentY = inv * inv * fromY + 2 * inv * t * controlY + t * t * toY;
      drawLine(pixels, previousX, previousY, currentX, currentY, 4, COLORS.coral);
      previousX = currentX;
      previousY = currentY;
    }
  }

  for (const point of layout.points) {
    const x = point.x + offsetX;
    const y = point.y + offsetY;
    const observation = point.observation;
    const eventColor = observation.itemType === "unknown" ? COLORS.silver : colorForWorkline(point.color);
    const nonzero = observation.status === "failed" || (observation.exitCode !== null && observation.exitCode !== 0);
    drawDisc(pixels, x, y, nonzero ? 16 : 14, COLORS.carbon);
    drawDisc(pixels, x, y, nonzero ? 10 : 8, eventColor);
  }

  if (layout.points.length === 0) drawText(pixels, "NO OBSERVED EVENTS", 414, offsetY + 100, 3, COLORS.paleInk);
}

function drawMetric(
  pixels: Uint8Array,
  x: number,
  y: number,
  value: number,
  label: string,
  color: Rgb,
  labelScale = 1,
): void {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  drawText(pixels, String(safeValue), x, y, 4, color);
  drawText(pixels, label, x, y + 34, labelScale, COLORS.paleInk);
}

function summaryValue(workprint: WorkprintIR, key: keyof WorkprintIR["summary"]): number {
  const value = workprint.summary?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function writeUint32BigEndian(target: Uint8Array, offset: number, value: number): void {
  target[offset] = (value >>> 24) & 0xff;
  target[offset + 1] = (value >>> 16) & 0xff;
  target[offset + 2] = (value >>> 8) & 0xff;
  target[offset + 3] = value & 0xff;
}

function crc32(type: string, data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let index = 0; index < type.length; index += 1) {
    crc ^= type.charCodeAt(index);
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function adler32(data: Uint8Array): number {
  let sumA = 1;
  let sumB = 0;
  for (const byte of data) {
    sumA += byte;
    if (sumA >= 65521) sumA -= 65521;
    sumB += sumA;
    if (sumB >= 65521) sumB -= 65521;
  }
  return ((sumB << 16) | sumA) >>> 0;
}

function deflateStored(data: Uint8Array): Uint8Array {
  const blockCount = Math.max(1, Math.ceil(data.length / 65535));
  const output = new Uint8Array(2 + data.length + blockCount * 5 + 4);
  let offset = 0;
  output[offset++] = 0x78;
  output[offset++] = 0x01;
  let inputOffset = 0;
  if (data.length === 0) {
    output[offset++] = 0x01;
    output[offset++] = 0;
    output[offset++] = 0;
    output[offset++] = 0xff;
    output[offset++] = 0xff;
  } else {
    while (inputOffset < data.length) {
      const blockLength = Math.min(65535, data.length - inputOffset);
      const isFinal = inputOffset + blockLength === data.length;
      output[offset++] = isFinal ? 0x01 : 0x00;
      output[offset++] = blockLength & 0xff;
      output[offset++] = (blockLength >>> 8) & 0xff;
      const inverseLength = (~blockLength) & 0xffff;
      output[offset++] = inverseLength & 0xff;
      output[offset++] = (inverseLength >>> 8) & 0xff;
      output.set(data.subarray(inputOffset, inputOffset + blockLength), offset);
      offset += blockLength;
      inputOffset += blockLength;
    }
  }
  writeUint32BigEndian(output, offset, adler32(data));
  return output;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length);
  writeUint32BigEndian(chunk, 0, data.length);
  for (let index = 0; index < 4; index += 1) chunk[4 + index] = type.charCodeAt(index);
  chunk.set(data, 8);
  writeUint32BigEndian(chunk, 8 + data.length, crc32(type, data));
  return chunk;
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  let length = 0;
  for (const part of parts) length += part.length;
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function rasterize(workprint: WorkprintIR): Uint8Array {
  const pixels = new Uint8Array(WIDTH * HEIGHT * CHANNELS);
  fillRgb(pixels, COLORS.carbon);
  const story = createRunReceiptStory(workprint);
  const publicIdentity = workprint.run.publicIdentity;
  const identityLine = [publicIdentity?.project, publicIdentity?.release, publicIdentity?.by].filter(Boolean).join(" / ") || "LOCAL / PRIVACY-SAFE PUBLIC PROJECTION";
  const coverage = inspectShareCardBitmapCoverage(workprint);
  if (!coverage.supported) {
    const detail = coverage.missingByField.map((entry) => `${entry.field}: ${entry.missingCodePoints.join(", ")}`).join("; ");
    throw new Error(`Share-card glyph coverage failed (${detail}).`);
  }

  fillRect(pixels, 34, 28, 1132, 574, COLORS.paperShadow);
  fillRect(pixels, 40, 34, 1120, 562, COLORS.paper);
  fillRect(pixels, 40, 34, 1120, 6, COLORS.acid);
  drawRectOutline(pixels, 40, 34, 1120, 562, 1, COLORS.ink);

  drawText(pixels, "CODEX WORKPRINT / RUN RECEIPT", 76, 58, 2, COLORS.cobalt);
  drawFittedUnicodeText(pixels, identityLine, 730, 57, 392, 1, COLORS.paleInk);
  drawFittedUnicodeText(pixels, workprint.run.publicTitle || "Untitled run", 76, 91, 1048, 2, COLORS.ink);
  drawFittedUnicodeText(pixels, story.headline, 76, 137, 1048, 2, workprint.summary.itemFailed > 0 ? COLORS.coral : COLORS.ink);
  drawLine(pixels, 76, 199, 1124, 199, 3, COLORS.coral);

  drawShareGlyph(pixels, workprint);
  drawFittedUnicodeText(pixels, story.shapeName, 76, 474, 520, 1, COLORS.cobalt);
  drawFittedUnicodeText(pixels, story.detail, 76, 500, 1048, 1, COLORS.paleInk);

  fillRect(pixels, 40, 536, 1120, 60, COLORS.carbon);
  drawText(pixels, `${story.excludedCategoryCount} PRIVATE CATEGORIES EXCLUDED`, 76, 551, 2, COLORS.acid);
  drawText(pixels, "NO PROMPTS / NO CODE / NO UPLOADS", 76, 577, 1, COLORS.silver);
  drawText(pixels, "RECEIPT / NOT ATTESTATION", 760, 551, 2, COLORS.paper);
  if (publicIdentity?.publicUrl) drawFittedUnicodeText(pixels, publicIdentity.publicUrl, 760, 579, 360, 1, COLORS.acid);
  else drawText(pixels, "VERIFY / BUILD YOURS", 900, 579, 1, COLORS.acid);

  return pixels;
}

export function inspectShareCardBitmapCoverage(workprint: WorkprintIR): ShareCardBitmapCoverage {
  const story = createRunReceiptStory(workprint);
  const publicIdentity = workprint.run.publicIdentity;
  const identityLine = [publicIdentity?.project, publicIdentity?.release, publicIdentity?.by].filter(Boolean).join(" / ") || "LOCAL / PRIVACY-SAFE PUBLIC PROJECTION";
  const fields = [
    ["run.publicTitle", workprint.run.publicTitle || "Untitled run"],
    ["identity", identityLine],
    ["story.headline", story.headline],
    ["story.shapeName", story.shapeName],
    ["story.detail", story.detail],
    ...(publicIdentity?.publicUrl ? [["run.publicIdentity.publicUrl", publicIdentity.publicUrl]] : []),
  ] as Array<[string, string]>;
  const missingByField = fields.flatMap(([field, value]) => {
    const coverage = inspectBitmapCoverage(value);
    return coverage.missingCodePoints.length > 0 ? [{ field, missingCodePoints: [...new Set(coverage.missingCodePoints)] }] : [];
  });
  return { supported: missingByField.length === 0, missingByField };
}

function indexedScanlines(pixels: Uint8Array): Uint8Array {
  const indexes = new Map(PNG_PALETTE.map((color, index) => [color.join(","), index]));
  const raw = new Uint8Array(HEIGHT * (WIDTH + 1));
  for (let row = 0; row < HEIGHT; row += 1) {
    const rawOffset = row * (WIDTH + 1);
    raw[rawOffset] = 0; // PNG filter: None, fixed for deterministic bytes.
    for (let column = 0; column < WIDTH; column += 1) {
      const pixelOffset = (row * WIDTH + column) * CHANNELS;
      const key = `${pixels[pixelOffset]},${pixels[pixelOffset + 1]},${pixels[pixelOffset + 2]}`;
      const index = indexes.get(key);
      if (index === undefined) throw new Error(`PNG pixel is outside the fixed palette: ${key}.`);
      raw[rawOffset + column + 1] = index;
    }
  }
  return raw;
}

function paletteBytes(): Uint8Array {
  const bytes = new Uint8Array(PNG_PALETTE.length * 3);
  for (let index = 0; index < PNG_PALETTE.length; index += 1) bytes.set(PNG_PALETTE[index], index * 3);
  return bytes;
}

/**
 * Render a 1200x630 indexed PNG without canvas, browser APIs, system fonts, or
 * runtime dependencies. Public Unicode title glyphs come from one fixed local
 * Unifont bitmap source. Stored DEFLATE keeps output stable across Node and OS.
 */
export function renderShareCardPng(workprint: WorkprintIR): Uint8Array {
  const pixels = rasterize(workprint);
  const compressed = deflateStored(indexedScanlines(pixels));
  const ihdr = new Uint8Array(13);
  writeUint32BigEndian(ihdr, 0, WIDTH);
  writeUint32BigEndian(ihdr, 4, HEIGHT);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 3; // color type indexed
  ihdr[10] = 0; // compression method
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // no interlace

  return concatBytes([
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("PLTE", paletteBytes()),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", new Uint8Array(0)),
  ]);
}
