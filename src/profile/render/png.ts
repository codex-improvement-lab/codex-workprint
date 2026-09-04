import type { ProfileVerdict, WorkprintProfileIR } from "../types.ts";

const WIDTH = 1200;
const HEIGHT = 630;
const CHANNELS = 3;

type Rgb = readonly [number, number, number];

const COLOR = {
  carbon: [17, 18, 15] as Rgb,
  carbonSoft: [28, 30, 25] as Rgb,
  paper: [241, 236, 223] as Rgb,
  acid: [199, 255, 54] as Rgb,
  cobalt: [36, 87, 255] as Rgb,
  coral: [255, 102, 92] as Rgb,
  silver: [174, 180, 173] as Rgb,
  amber: [255, 179, 64] as Rgb,
  ink: [36, 37, 31] as Rgb,
  rule: [56, 58, 50] as Rgb,
  shadow: [215, 208, 194] as Rgb,
} as const;

const PROFILE_PALETTE = Object.values(COLOR) as Rgb[];
const PROFILE_PALETTE_INDEX = new Map(PROFILE_PALETTE.map((color, index) => [color.join(","), index]));

const VERDICT_COLOR: Record<ProfileVerdict, Rgb> = {
  carried: COLOR.acid,
  lost: COLOR.coral,
  stale: COLOR.amber,
  invented: COLOR.silver,
  added: COLOR.cobalt,
  removed: COLOR.silver,
  changed: COLOR.coral,
  unchanged: COLOR.acid,
  prepared: COLOR.cobalt,
  observed: COLOR.acid,
  excluded: COLOR.silver,
  not_observed: COLOR.coral,
  conflict: COLOR.amber,
};

const FONT: Record<string, readonly string[]> = {
  A:["01110","10001","10001","11111","10001","10001","10001"],B:["11110","10001","10001","11110","10001","10001","11110"],C:["01111","10000","10000","10000","10000","10000","01111"],D:["11110","10001","10001","10001","10001","10001","11110"],E:["11111","10000","10000","11110","10000","10000","11111"],F:["11111","10000","10000","11110","10000","10000","10000"],G:["01111","10000","10000","10111","10001","10001","01111"],H:["10001","10001","10001","11111","10001","10001","10001"],I:["11111","00100","00100","00100","00100","00100","11111"],J:["00111","00010","00010","00010","10010","10010","01100"],K:["10001","10010","10100","11000","10100","10010","10001"],L:["10000","10000","10000","10000","10000","10000","11111"],M:["10001","11011","10101","10101","10001","10001","10001"],N:["10001","11001","10101","10011","10001","10001","10001"],O:["01110","10001","10001","10001","10001","10001","01110"],P:["11110","10001","10001","11110","10000","10000","10000"],Q:["01110","10001","10001","10001","10101","10010","01101"],R:["11110","10001","10001","11110","10100","10010","10001"],S:["01111","10000","10000","01110","00001","00001","11110"],T:["11111","00100","00100","00100","00100","00100","00100"],U:["10001","10001","10001","10001","10001","10001","01110"],V:["10001","10001","10001","10001","10001","01010","00100"],W:["10001","10001","10001","10101","10101","11011","10001"],X:["10001","10001","01010","00100","01010","10001","10001"],Y:["10001","10001","01010","00100","00100","00100","00100"],Z:["11111","00001","00010","00100","01000","10000","11111"],
  0:["01110","10001","10011","10101","11001","10001","01110"],1:["00100","01100","00100","00100","00100","00100","01110"],2:["01110","10001","00001","00010","00100","01000","11111"],3:["11110","00001","00001","01110","00001","00001","11110"],4:["00010","00110","01010","10010","11111","00010","00010"],5:["11111","10000","10000","11110","00001","00001","11110"],6:["01110","10000","10000","11110","10001","10001","01110"],7:["11111","00001","00010","00100","01000","01000","01000"],8:["01110","10001","10001","01110","10001","10001","01110"],9:["01110","10001","10001","01111","00001","00001","01110"],
  " ":["00000","00000","00000","00000","00000","00000","00000"],"-":["00000","00000","00000","11111","00000","00000","00000"],"_":["00000","00000","00000","00000","00000","00000","11111"],".":["00000","00000","00000","00000","00000","00000","00100"],":":["00000","00100","00100","00000","00100","00100","00000"],"/":["00001","00010","00010","00100","01000","01000","10000"],"+":["00000","00100","00100","11111","00100","00100","00000"],"#":["01010","11111","01010","01010","11111","01010","00000"],"!":["00100","00100","00100","00100","00100","00000","00100"],"?":["01110","10001","00001","00010","00100","00000","00100"],"(":["00010","00100","01000","01000","01000","00100","00010"],")":["01000","00100","00010","00010","00010","00100","01000"],"'": ["00100","00100","00000","00000","00000","00000","00000"],",": ["00000","00000","00000","00000","00100","00100","01000"],
};

export function renderProfileShareCardPng(profile: WorkprintProfileIR): Uint8Array {
  const pixels = new Uint8Array(WIDTH * HEIGHT * CHANNELS);
  fill(pixels, COLOR.carbon);
  fillRect(pixels, 28, 24, 1144, 582, COLOR.shadow);
  fillRect(pixels, 36, 32, 1128, 566, COLOR.paper);
  fillRect(pixels, 36, 32, 1128, 7, COLOR.cobalt);
  fillRect(pixels, 760, 32, 210, 7, COLOR.acid);
  fillRect(pixels, 970, 32, 194, 7, COLOR.coral);
  outline(pixels, 36, 32, 1128, 566, 1, COLOR.ink);
  drawText(pixels, "CODEX WORKPRINT / THREE QUESTIONS. ONE WORKPRINT.", 68, 58, 2, COLOR.cobalt);
  drawText(pixels, `${profile.profile} / ${profile.visualForm}`, 875, 58, 1, COLOR.ink);
  fittedText(pixels, profile.title, 68, 94, 1020, 4, COLOR.ink);
  drawText(pixels, profile.question, 68, 137, 2, COLOR.ink);
  drawText(pixels, "PUBLIC SUMMARY", 68, 172, 1, COLOR.silver);
  fittedText(pixels, profile.summary.headline, 68, 188, 1020, 2, COLOR.ink);
  fillRect(pixels, 68, 224, 1064, 276, COLOR.carbonSoft);
  outline(pixels, 68, 224, 1064, 276, 1, COLOR.rule);
  drawText(pixels, profile.visualForm === "seam" ? "HANDOFF SEAM / BLACK BOX" : profile.visualForm === "fault" ? "REVISION FAULT / SHOCKWAVE" : "OBSERVATION SLICE / X-RAY", 88, 244, 1, COLOR.silver);
  drawProfileShape(pixels, profile, 90, 270, 1020, 190);
  drawText(pixels, `SOURCES ${profile.sources.length}`, 68, 516, 1, COLOR.ink);
  drawLine(pixels, 172, 522, 1118, 522, 2, COLOR.silver);
  const sourceSlot = 920 / profile.sources.length;
  profile.sources.forEach((source, index) => {
    const x = 188 + sourceSlot * (index + 0.5);
    disc(pixels, x, 522, 6, COLOR.ink);
    disc(pixels, x, 522, 3, COLOR.acid);
    fittedText(pixels, source.label, x - sourceSlot * 0.42, 539, sourceSlot * 0.84, 1, COLOR.ink);
    fittedText(pixels, source.revision, x - sourceSlot * 0.42, 551, sourceSlot * 0.84, 1, COLOR.silver);
  });
  fillRect(pixels, 36, 574, 1128, 24, COLOR.carbon);
  drawText(pixels, "THE WORK HAS A STATE.", 68, 581, 1, COLOR.paper);
  drawText(pixels, "PUBLIC PROJECTION / NOT ATTESTATION", 846, 581, 1, COLOR.silver);
  return encodePng(pixels);
}

export function renderProfileTriptychPng(profiles: readonly WorkprintProfileIR[]): Uint8Array {
  if (profiles.length !== 3) throw new Error("Profile triptych requires exactly three profiles.");
  const pixels = new Uint8Array(WIDTH * HEIGHT * CHANNELS);
  fill(pixels, COLOR.paper);
  fillRect(pixels, 0, 0, WIDTH, 8, COLOR.cobalt);
  fillRect(pixels, 760, 0, 240, 8, COLOR.acid);
  fillRect(pixels, 1000, 0, 200, 8, COLOR.coral);
  drawText(pixels, "CODEX WORKPRINT", 46, 34, 2, COLOR.cobalt);
  drawText(pixels, "THREE QUESTIONS. ONE WORKPRINT.", 46, 66, 4, COLOR.ink);
  drawText(pixels, "THE WORK HAS A STATE.", 918, 43, 2, COLOR.ink);
  const columnWidth = 352;
  profiles.forEach((profile, index) => {
    const x = 42 + index * 374;
    fillRect(pixels, x, 118, columnWidth, 448, COLOR.carbon);
    fillRect(pixels, x, 118, columnWidth, 6, index === 0 ? COLOR.acid : index === 1 ? COLOR.coral : COLOR.cobalt);
    drawText(pixels, `${String(index + 1).padStart(2, "0")} / ${profile.profile}`, x + 18, 142, 1, COLOR.silver);
    fittedText(pixels, profile.question, x + 18, 170, columnWidth - 36, 2, COLOR.paper);
    fittedText(pixels, profile.summary.headline, x + 18, 220, columnWidth - 36, 1, COLOR.silver);
    drawMiniShape(pixels, profile, x + 24, 288, columnWidth - 48, 148);
    drawText(pixels, `${profile.findings.length} FINDINGS / ${profile.sources.length} SOURCES`, x + 18, 470, 1, COLOR.paper);
    drawText(pixels, profile.visualForm.toUpperCase(), x + 18, 500, 2, index === 0 ? COLOR.acid : index === 1 ? COLOR.coral : COLOR.cobalt);
    drawText(pixels, `IR ${profile.source.profileIrSha256.slice(0, 10).toUpperCase()}`, x + 18, 535, 1, COLOR.silver);
  });
  drawText(pixels, "DETERMINISTIC PUBLIC PROJECTION / NOT A NEW FACT SOURCE", 42, 592, 1, COLOR.ink);
  drawText(pixels, "CONTINUITY / GOAL DELTA / CONTEXT RECEIPT", 838, 592, 1, COLOR.ink);
  return encodePng(pixels);
}

function drawProfileShape(pixels: Uint8Array, profile: WorkprintProfileIR, x: number, y: number, width: number, height: number): void {
  if (profile.visualForm === "seam") {
    const seamY = y + height * 0.53;
    dashedLine(pixels, x, seamY, x + width, seamY, 1, COLOR.silver);
    const slot = width / profile.findings.length;
    profile.findings.forEach((finding, index) => {
      const px = x + slot * (index + 0.5);
      const color = VERDICT_COLOR[finding.verdict];
      if (finding.verdict === "lost" || finding.verdict === "invented") {
        drawLine(pixels, px, seamY - 35, px, seamY - 10, 4, color);
        drawLine(pixels, px, seamY + 10, px, seamY + 35, 4, color);
      } else {
        drawLine(pixels, px, seamY - 35, px, seamY + 35, 4, color);
      }
      disc(pixels, px, seamY, 7, COLOR.carbon);
      disc(pixels, px, seamY, 4, color);
      const label = width < 600
        ? ({ carried: "carry", invented: "invent" }[finding.verdict] ?? finding.verdict)
        : finding.verdict;
      fittedText(pixels, label, px - slot * 0.49, seamY + (index % 2 ? 49 : -57), slot * 0.98, 1, color);
    });
  } else if (profile.visualForm === "fault") {
    const cx = x + width / 2;
    const cy = y + height / 2;
    ellipse(pixels, cx, cy, 118, 70, 1, COLOR.coral);
    ellipse(pixels, cx, cy, 70, 42, 1, COLOR.coral);
    const points = [[cx + 8, y + 8], [cx - 18, y + 48], [cx + 14, y + 80], [cx - 12, y + 115], [cx + 20, y + height - 8]];
    for (let i = 1; i < points.length; i += 1) drawLine(pixels, points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], 6, COLOR.coral);
    profile.findings.forEach((finding, index) => {
      const left = index % 2 === 0;
      const py = y + 25 + Math.floor(index / 2) * 48;
      const px = left ? x + 55 : x + width - 55;
      const color = VERDICT_COLOR[finding.verdict];
      drawLine(pixels, px, py, left ? cx - 30 : cx + 30, py, 2, color);
      disc(pixels, px, py, 7, color);
    });
  } else {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const outerX = Math.min(245, width * 0.34);
    const outerY = Math.min(82, height * 0.42);
    ellipse(pixels, cx, cy, outerX, outerY, 3, COLOR.silver);
    ellipse(pixels, cx, cy, outerX * 0.73, outerY * 0.71, 3, COLOR.cobalt);
    ellipse(pixels, cx, cy, outerX * 0.43, outerY * 0.42, 3, COLOR.acid);
    profile.findings.forEach((finding, index) => {
      const angle = (Math.PI * 2 * index) / profile.findings.length;
      const px = cx + Math.cos(angle) * (outerX + 10);
      const py = cy + Math.sin(angle) * (outerY + 6);
      disc(pixels, px, py, 7, VERDICT_COLOR[finding.verdict]);
    });
  }
}

function drawMiniShape(pixels: Uint8Array, profile: WorkprintProfileIR, x: number, y: number, width: number, height: number): void {
  drawProfileShape(pixels, profile, x, y, width, height);
}

export function normalizeProfileBitmapText(value: string): string {
  let result = "";
  const punctuationNormalized = String(value).normalize("NFC")
    .replace(/[—–]/g, "-")
    .replace(/·/g, "/")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
  for (const character of punctuationNormalized) {
    const code = character.codePointAt(0) ?? 0;
    result += code >= 0x20 && code <= 0x7e ? character : "?";
  }
  return result.toUpperCase();
}

function textWidth(value: string, scale: number): number {
  const text = normalizeProfileBitmapText(value);
  return text.length ? text.length * 6 * scale - scale : 0;
}

function drawText(pixels: Uint8Array, value: string, x: number, y: number, scale: number, color: Rgb): void {
  let cursor = Math.round(x);
  const glyphScale = Math.max(1, Math.round(scale));
  for (const character of normalizeProfileBitmapText(value)) {
    const glyph = FONT[character] ?? FONT["?"];
    glyph.forEach((row, rowIndex) => [...row].forEach((bit, column) => {
      if (bit === "1") fillRect(pixels, cursor + column * glyphScale, y + rowIndex * glyphScale, glyphScale, glyphScale, color);
    }));
    cursor += 6 * glyphScale;
  }
}

function fittedText(pixels: Uint8Array, value: string, x: number, y: number, maxWidth: number, maxScale: number, color: Rgb): void {
  let scale = Math.max(1, Math.round(maxScale));
  while (scale > 1 && textWidth(value, scale) > maxWidth) scale -= 1;
  let visible = normalizeProfileBitmapText(value);
  if (textWidth(visible, scale) > maxWidth) {
    const count = Math.max(1, Math.floor((maxWidth + scale) / (6 * scale)));
    visible = count <= 1 ? "?" : `${visible.slice(0, count - 1)}?`;
  }
  drawText(pixels, visible, x, y, scale, color);
}

function fill(pixels: Uint8Array, color: Rgb): void {
  for (let index = 0; index < pixels.length; index += CHANNELS) {
    pixels[index] = color[0]; pixels[index + 1] = color[1]; pixels[index + 2] = color[2];
  }
}

function fillRect(pixels: Uint8Array, x: number, y: number, width: number, height: number, color: Rgb): void {
  const left = Math.max(0, Math.floor(x)); const top = Math.max(0, Math.floor(y)); const right = Math.min(WIDTH, Math.ceil(x + width)); const bottom = Math.min(HEIGHT, Math.ceil(y + height));
  for (let py = top; py < bottom; py += 1) {
    let offset = (py * WIDTH + left) * CHANNELS;
    for (let px = left; px < right; px += 1) { pixels[offset] = color[0]; pixels[offset + 1] = color[1]; pixels[offset + 2] = color[2]; offset += CHANNELS; }
  }
}

function disc(pixels: Uint8Array, cx: number, cy: number, radius: number, color: Rgb): void {
  const r = Math.round(radius); for (let y = -r; y <= r; y += 1) for (let x = -r; x <= r; x += 1) if (x * x + y * y <= r * r) put(pixels, cx + x, cy + y, color);
}

function put(pixels: Uint8Array, x: number, y: number, color: Rgb): void {
  const px = Math.round(x); const py = Math.round(y); if (px < 0 || py < 0 || px >= WIDTH || py >= HEIGHT) return; const offset = (py * WIDTH + px) * CHANNELS; pixels[offset] = color[0]; pixels[offset + 1] = color[1]; pixels[offset + 2] = color[2];
}

function drawLine(pixels: Uint8Array, x0: number, y0: number, x1: number, y1: number, width: number, color: Rgb): void {
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let step = 0; step <= steps; step += 1) { const t = step / steps; disc(pixels, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, Math.max(0, Math.floor(width / 2)), color); }
}

function dashedLine(pixels: Uint8Array, x0: number, y0: number, x1: number, y1: number, width: number, color: Rgb): void {
  const steps = 64; let px = x0; let py = y0; for (let step = 1; step <= steps; step += 1) { const t = step / steps; const x = x0 + (x1 - x0) * t; const y = y0 + (y1 - y0) * t; if (Math.floor((step - 1) / 4) % 2 === 0) drawLine(pixels, px, py, x, y, width, color); px = x; py = y; }
}

function ellipse(pixels: Uint8Array, cx: number, cy: number, rx: number, ry: number, width: number, color: Rgb): void {
  let previousX = cx + rx; let previousY = cy; for (let step = 1; step <= 128; step += 1) { const angle = (Math.PI * 2 * step) / 128; const x = cx + Math.cos(angle) * rx; const y = cy + Math.sin(angle) * ry; drawLine(pixels, previousX, previousY, x, y, width, color); previousX = x; previousY = y; }
}

function outline(pixels: Uint8Array, x: number, y: number, width: number, height: number, thickness: number, color: Rgb): void {
  fillRect(pixels, x, y, width, thickness, color); fillRect(pixels, x, y + height - thickness, width, thickness, color); fillRect(pixels, x, y, thickness, height, color); fillRect(pixels, x + width - thickness, y, thickness, height, color);
}

function encodePng(pixels: Uint8Array): Uint8Array {
  const raw = new Uint8Array(HEIGHT * (WIDTH + 1));
  for (let row = 0; row < HEIGHT; row += 1) {
    const rawOffset = row * (WIDTH + 1);
    raw[rawOffset] = 0;
    for (let column = 0; column < WIDTH; column += 1) {
      const pixelOffset = (row * WIDTH + column) * CHANNELS;
      const key = `${pixels[pixelOffset]},${pixels[pixelOffset + 1]},${pixels[pixelOffset + 2]}`;
      const paletteIndex = PROFILE_PALETTE_INDEX.get(key);
      if (paletteIndex === undefined) throw new Error("Profile PNG encountered a color outside its fixed palette.");
      raw[rawOffset + column + 1] = paletteIndex;
    }
  }
  const ihdr = new Uint8Array(13); writeU32(ihdr, 0, WIDTH); writeU32(ihdr, 4, HEIGHT); ihdr[8] = 8; ihdr[9] = 3;
  const palette = new Uint8Array(PROFILE_PALETTE.length * 3);
  PROFILE_PALETTE.forEach((color, index) => palette.set(color, index * 3));
  return concat([new Uint8Array([137,80,78,71,13,10,26,10]), chunk("IHDR", ihdr), chunk("PLTE", palette), chunk("IDAT", deflateStored(raw)), chunk("IEND", new Uint8Array())]);
}

function deflateStored(data: Uint8Array): Uint8Array {
  const blocks = Math.max(1, Math.ceil(data.length / 65535)); const output = new Uint8Array(2 + data.length + blocks * 5 + 4); let offset = 0; output[offset++] = 0x78; output[offset++] = 0x01; let input = 0;
  while (input < data.length) { const length = Math.min(65535, data.length - input); const final = input + length === data.length; output[offset++] = final ? 1 : 0; output[offset++] = length & 255; output[offset++] = length >>> 8; const inverse = (~length) & 0xffff; output[offset++] = inverse & 255; output[offset++] = inverse >>> 8; output.set(data.subarray(input, input + length), offset); offset += length; input += length; }
  writeU32(output, offset, adler32(data)); return output;
}

function chunk(type: string, data: Uint8Array): Uint8Array { const output = new Uint8Array(12 + data.length); writeU32(output, 0, data.length); [...type].forEach((character, index) => output[4 + index] = character.charCodeAt(0)); output.set(data, 8); writeU32(output, 8 + data.length, crc32(type, data)); return output; }
function concat(parts: Uint8Array[]): Uint8Array { const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0)); let offset = 0; parts.forEach((part) => { output.set(part, offset); offset += part.length; }); return output; }
function writeU32(target: Uint8Array, offset: number, value: number): void { target[offset] = value >>> 24; target[offset + 1] = value >>> 16; target[offset + 2] = value >>> 8; target[offset + 3] = value; }
function adler32(data: Uint8Array): number { let a = 1; let b = 0; for (const byte of data) { a = (a + byte) % 65521; b = (b + a) % 65521; } return ((b << 16) | a) >>> 0; }
function crc32(type: string, data: Uint8Array): number { let crc = 0xffffffff; for (const byte of [...type].map((character) => character.charCodeAt(0)).concat([...data])) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; }
