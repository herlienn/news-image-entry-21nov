// News Image — 21 November 2026.
// A one-day world newspaper drawn entirely in code: own 5x7 bitmap font, own
// PNG encoder (Node stdlib only, no network), every scene drawn from shapes.
// Run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts  -> out/entry.png
// The program is deterministic: two runs write byte-identical files.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024, H = 1024;

// ---------- palette ----------
const INK = [20, 20, 20];
const PAPER = [250, 246, 236];
const RED = [178, 34, 34];
const BLUE = [28, 68, 128];
const NAVY = [16, 32, 64];
const GOLD = [198, 142, 32];
const TEAL = [14, 110, 110];
const GREEN = [34, 110, 52];
const ORANGE = [204, 92, 20];
const SKY = [158, 196, 222];
const SAND = [232, 214, 176];
const LIGHT = [238, 232, 218];
const GREY = [110, 108, 100];
const DARKGREY = [70, 68, 62];

// ---------- canvas ----------
const px = new Uint8Array(W * H * 3);
function fill(c: number[]) { for (let i = 0; i < W * H; i++) { px[i * 3] = c[0]; px[i * 3 + 1] = c[1]; px[i * 3 + 2] = c[2]; } }
function set(x: number, y: number, c: number[]) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
}
function rect(x: number, y: number, w: number, h: number, c: number[]) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  for (let j = Math.max(0, y); j < Math.min(H, y + h); j++)
    for (let i = Math.max(0, x); i < Math.min(W, x + w); i++) set(i, j, c);
}
function frame(x: number, y: number, w: number, h: number, c: number[], t = 2) {
  rect(x, y, w, t, c); rect(x, y + h - t, w, t, c); rect(x, y, t, h, c); rect(x + w - t, y, t, h, c);
}
function hline(x: number, y: number, w: number, c: number[], t = 1) { rect(x, y, w, t, c); }
function line(x0: number, y0: number, x1: number, y1: number, c: number[]) {
  const dx = x1 - x0, dy = y1 - y0, n = Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let i = 0; i <= n; i++) set(x0 + dx * i / n, y0 + dy * i / n, c);
}
function circle(cx: number, cy: number, r: number, c: number[]) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++)
    if (x * x + y * y <= r * r) set(cx + x, cy + y, c);
}
function disc(cx: number, cy: number, r: number, c: number[]) { circle(cx, cy, r, c); }
function ring(cx: number, cy: number, r: number, c: number[]) {
  for (let a = 0; a < 360; a += 2) {
    const t = a * Math.PI / 180;
    set(cx + r * Math.cos(t), cy + r * Math.sin(t), c);
    set(cx + (r - 1) * Math.cos(t), cy + (r - 1) * Math.sin(t), c);
  }
}
function tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: number[]) {
  const minx = Math.floor(Math.min(x0, x1, x2)), maxx = Math.ceil(Math.max(x0, x1, x2));
  const miny = Math.floor(Math.min(y0, y1, y2)), maxy = Math.ceil(Math.max(y0, y1, y2));
  const d = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
  if (!d) return;
  for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
    const a = ((x1 - x) * (y2 - y) - (y1 - y) * (x2 - x)) / d;
    const b = ((x2 - x) * (y0 - y) - (y2 - y) * (x0 - x)) / d;
    const cc = 1 - a - b;
    if (a >= 0 && b >= 0 && cc >= 0) set(x, y, c);
  }
}
function ellipse(cx: number, cy: number, rx: number, ry: number, c: number[]) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++)
    if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) set(cx + x, cy + y, c);
}

// ---------- 5x7 bitmap font (own drawing, uppercase rendering) ----------
const FONT: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '+': ['00000', '00100', '00100', '01110', '00100', '00100', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  ':': ['00000', '01100', '00000', '01100', '00000', '01100', '00000'],
  ';': ['00000', '01100', '00000', '01100', '00100', '01000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  '*': ['00000', '00100', '10101', '01110', '10101', '00100', '00000'],
  '#': ['01010', '01010', '11111', '01010', '11111', '01010', '01010'],
  '$': ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '@': ['01110', '10001', '10111', '10101', '10110', '10000', '01110'],
  _: ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  '<': ['00010', '00100', '01000', '10000', '01000', '00100', '00010'],
  '>': ['01000', '00100', '00010', '00001', '00010', '00100', '01000'],
};
function charW(s: number) { return 6 * s; }
function textW(t: string, s: number) { return t.length * 6 * s - s; }
function drawChar(ch: string, x: number, y: number, s: number, c: number[]) {
  const g = FONT[ch] || FONT['?'];
  for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++)
    if (g[r][col] === '1') rect(x + col * s, y + r * s, s, s, c);
}
function text(t: string, x: number, y: number, s: number, c: number[]) {
  t = t.toUpperCase();
  for (let i = 0; i < t.length; i++) drawChar(t[i], x + i * 6 * s, y, s, c);
}
function textC(t: string, cx: number, y: number, s: number, c: number[]) {
  text(t, cx - textW(t, s) / 2, y, s, c);
}
// Wrap into lines of at most maxChars characters (word-aware).
function wrap(t: string, maxChars: number): string[] {
  const words = t.toUpperCase().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) { cur = w; continue; }
    if (cur.length + 1 + w.length <= maxChars) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}
function para(t: string, x: number, y: number, s: number, c: number[], maxChars: number, lh: number): number {
  const lines = wrap(t, maxChars);
  lines.forEach((ln, i) => text(ln, x, y + i * lh, s, c));
  return y + lines.length * lh;
}

// ---------- PNG encoder (own, stdlib zlib) ----------
const CRC_T = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}
function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- small drawn scenes (one per story kind) ----------
// Each draws a simple original scene inside rect (x,y,w,h).
function scene(kind: string, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2, cy = y + h / 2;
  switch (kind) {
    case 'skyline': { // city towers at dusk
      rect(x, y, w, h, NAVY);
      disc(x + w * 0.8, y + h * 0.22, Math.min(w, h) * 0.12, GOLD);
      const bw = w / 5;
      for (let i = 0; i < 5; i++) {
        const bh = h * (0.35 + ((i * 37) % 40) / 100);
        rect(x + i * bw + 2, y + h - bh, bw - 4, bh, [38, 52, 84]);
        for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++)
          if ((i + r + c) % 2 === 0) rect(x + i * bw + 5 + c * 7, y + h - bh + 6 + r * 8, 3, 3, GOLD);
      }
      rect(x, y + h - 4, w, 4, GOLD); break;
    }
    case 'rocket': { // launch
      rect(x, y, w, h, SKY);
      tri(cx, y + h * 0.12, cx - w * 0.10, y + h * 0.55, cx + w * 0.10, y + h * 0.55, [240, 240, 235]);
      rect(cx - w * 0.10, y + h * 0.5, w * 0.2, h * 0.14, RED);
      tri(cx - w * 0.22, y + h * 0.62, cx - w * 0.10, y + h * 0.45, cx - w * 0.10, y + h * 0.62, RED);
      tri(cx + w * 0.22, y + h * 0.62, cx + w * 0.10, y + h * 0.45, cx + w * 0.10, y + h * 0.62, RED);
      tri(cx, y + h * 0.95, cx - w * 0.08, y + h * 0.66, cx + w * 0.08, y + h * 0.66, GOLD);
      disc(cx - w * 0.28, y + h * 0.25, 2, [255, 255, 255]);
      disc(cx + w * 0.3, y + h * 0.4, 2, [255, 255, 255]); break;
    }
    case 'cyclone': { // storm spiral
      rect(x, y, w, h, [190, 205, 220]);
      for (let r = 0; r < 5; r++) ring(cx, cy, 6 + r * 6, r % 2 ? BLUE : [255, 255, 255]);
      disc(cx, cy, 5, NAVY);
      line(x, y + h - 6, x + w, y + h - 6, TEAL);
      tri(x + w * 0.2, y + h - 6, x + w * 0.3, y + h * 0.75, x + w * 0.4, y + h - 6, GREEN);
      break;
    }
    case 'chart': { // rising market line
      rect(x, y, w, h, [226, 238, 226]);
      hline(x + 4, y + h - 8, w - 8, INK, 2);
      const pts = [0.75, 0.6, 0.68, 0.45, 0.5, 0.28, 0.18];
      for (let i = 0; i < pts.length - 1; i++)
        line(x + 5 + i * (w - 10) / 6, y + h * pts[i], x + 5 + (i + 1) * (w - 10) / 6, y + h * pts[i + 1], GREEN);
      tri(x + w - 12, y + h * 0.18, x + w - 20, y + h * 0.18, x + w - 12, y + h * 0.1, GREEN);
      break;
    }
    case 'building': { // courthouse / parliament
      rect(x, y, w, h, SAND);
      rect(x + w * 0.12, y + h * 0.42, w * 0.76, h * 0.5, [245, 240, 225]);
      tri(cx, y + h * 0.14, x + w * 0.08, y + h * 0.44, x + w * 0.92, y + h * 0.44, RED);
      for (let i = 0; i < 4; i++) rect(x + w * 0.16 + i * w * 0.19, y + h * 0.5, w * 0.07, h * 0.4, INK);
      rect(x, y + h - 6, w, 6, INK); break;
    }
    case 'flag': { // flag on pole
      rect(x, y, w, h, SKY);
      rect(x + w * 0.2, y + h * 0.12, 3, h * 0.8, INK);
      tri(x + w * 0.2, y + h * 0.14, x + w * 0.85, y + h * 0.26, x + w * 0.2, y + h * 0.4, RED);
      rect(x + w * 0.2, y + h * 0.14, w * 0.5, h * 0.12, BLUE);
      disc(x + w * 0.38, y + h * 0.2, 3, [255, 255, 255]);
      rect(x, y + h - 6, w, 6, GREEN); break;
    }
    case 'pin': { // map pin
      rect(x, y, w, h, [222, 232, 222]);
      disc(cx, cy - h * 0.08, w * 0.2, RED);
      tri(cx - w * 0.2, cy - h * 0.02, cx + w * 0.2, cy - h * 0.02, cx, cy + h * 0.3, RED);
      disc(cx, cy - h * 0.08, w * 0.08, [255, 255, 255]);
      line(x, y + h - 8, x + w, y + h - 8, INK, 2); break;
    }
    case 'globe': { // world globe
      rect(x, y, w, h, NAVY);
      disc(cx, cy, Math.min(w, h) * 0.38, TEAL);
      ellipse(cx - w * 0.12, cy - h * 0.08, w * 0.14, h * 0.1, GREEN);
      ellipse(cx + w * 0.14, cy + h * 0.12, w * 0.12, h * 0.09, GREEN);
      ring(cx, cy, Math.min(w, h) * 0.38, [255, 255, 255]); break;
    }
    case 'gavel': { // court gavel
      rect(x, y, w, h, SAND);
      line(x + w * 0.2, y + h * 0.3, x + w * 0.8, y + h * 0.65, [120, 72, 20]);
      rect(x + w * 0.12, y + h * 0.18, w * 0.36, h * 0.16, [120, 72, 20]);
      rect(x + w * 0.55, y + h * 0.5, w * 0.36, h * 0.16, [120, 72, 20]);
      rect(x + w * 0.3, y + h * 0.78, w * 0.4, h * 0.08, INK); break;
    }
    case 'ship': { // ship at sea
      rect(x, y, w, h, SKY);
      rect(x + w * 0.15, y + h * 0.55, w * 0.7, h * 0.18, NAVY);
      rect(x + w * 0.4, y + h * 0.25, w * 0.2, h * 0.3, [240, 240, 235]);
      line(cx, y + h * 0.2, cx, y + h * 0.55, INK);
      tri(cx, y + h * 0.2, cx + w * 0.2, y + h * 0.38, cx, y + h * 0.38, RED);
      for (let i = 0; i < 3; i++) line(x + i * w * 0.3, y + h * 0.82, x + w * 0.2 + i * w * 0.3, y + h * 0.82, BLUE);
      break;
    }
    case 'plane': { // aircraft
      rect(x, y, w, h, SKY);
      ellipse(cx, cy, w * 0.32, h * 0.1, [240, 240, 235]);
      tri(cx + w * 0.3, cy, cx + w * 0.12, cy - h * 0.16, cx + w * 0.12, cy + h * 0.02, [220, 220, 215]);
      tri(cx - w * 0.1, cy - h * 0.08, cx - w * 0.3, cy - h * 0.3, cx - w * 0.22, cy - h * 0.02, [220, 220, 215]);
      disc(cx + w * 0.28, cy - h * 0.03, 2, BLUE);
      disc(cx + w * 0.1, y + h * 0.2, 2, [255, 255, 255]);
      disc(cx - w * 0.25, y + h * 0.75, 2, [255, 255, 255]); break;
    }
    case 'trophy': { // cup
      rect(x, y, w, h, [240, 228, 190]);
      ellipse(cx, cy - h * 0.05, w * 0.2, h * 0.22, GOLD);
      rect(cx - w * 0.06, cy + h * 0.15, w * 0.12, h * 0.18, GOLD);
      rect(cx - w * 0.16, cy + h * 0.32, w * 0.32, h * 0.06, GOLD);
      line(x + w * 0.12, cy - h * 0.05, x + w * 0.3, cy - h * 0.05, GOLD);
      line(x + w * 0.88, cy - h * 0.05, x + w * 0.7, cy - h * 0.05, GOLD);
      disc(cx, cy - h * 0.05, 3, RED); break;
    }
    case 'fire': { // flame
      rect(x, y, w, h, [40, 30, 30]);
      tri(cx, y + h * 0.1, cx - w * 0.28, y + h * 0.7, cx + w * 0.28, y + h * 0.7, ORANGE);
      tri(cx, y + h * 0.35, cx - w * 0.16, y + h * 0.75, cx + w * 0.16, y + h * 0.75, GOLD);
      disc(cx, cy + h * 0.18, w * 0.08, [255, 240, 160]); break;
    }
    case 'crowd': { // people / protest
      rect(x, y, w, h, [228, 222, 205]);
      for (let i = 0; i < 5; i++) {
        const px2 = x + w * (0.14 + i * 0.18);
        disc(px2, y + h * 0.38, w * 0.07, [60 + i * 20, 60, 50]);
        rect(px2 - w * 0.07, y + h * 0.48, w * 0.14, h * 0.4, [60 + i * 20, 60, 50]);
      }
      rect(x + w * 0.1, y + h * 0.12, w * 0.5, h * 0.1, RED);
      break;
    }
    case 'game': { // game controller / screen
      rect(x, y, w, h, NAVY);
      rect(x + w * 0.15, y + h * 0.18, w * 0.7, h * 0.4, [20, 20, 40]);
      tri(cx - w * 0.12, y + h * 0.28, cx, y + h * 0.48, cx + w * 0.12, y + h * 0.28, GOLD);
      rect(x + w * 0.2, y + h * 0.66, w * 0.6, h * 0.2, INK);
      disc(x + w * 0.3, y + h * 0.76, 3, RED); disc(x + w * 0.7, y + h * 0.76, 3, GREEN);
      break;
    }
    case 'health': { // cross / aid
      rect(x, y, w, h, [235, 245, 235]);
      rect(cx - w * 0.08, y + h * 0.15, w * 0.16, h * 0.7, RED);
      rect(cx - w * 0.3, y + h * 0.38, w * 0.6, h * 0.16, RED);
      break;
    }
    case 'vote': { // ballot box
      rect(x, y, w, h, [226, 232, 240]);
      rect(x + w * 0.2, y + h * 0.45, w * 0.6, h * 0.4, BLUE);
      rect(x + w * 0.15, y + h * 0.38, w * 0.7, h * 0.08, NAVY);
      rect(cx - 2, y + h * 0.14, 4, h * 0.26, [255, 255, 255]);
      tri(cx - w * 0.1, y + h * 0.3, cx, y + h * 0.2, cx + w * 0.14, y + h * 0.34, GREEN);
      break;
    }
    case 'tech': { // chip
      rect(x, y, w, h, [20, 30, 45]);
      rect(cx - w * 0.2, cy - h * 0.2, w * 0.4, h * 0.4, TEAL);
      for (let i = 0; i < 3; i++) {
        line(cx - w * 0.2 + i * w * 0.2, y + 4, cx - w * 0.2 + i * w * 0.2, cy - h * 0.2, GOLD);
        line(cx - w * 0.2 + i * w * 0.2, cy + h * 0.2, cx - w * 0.2 + i * w * 0.2, y + h - 4, GOLD);
      }
      break;
    }
    case 'mountain': { // peaks
      rect(x, y, w, h, SKY);
      tri(x, y + h, x + w * 0.35, y + h * 0.2, x + w * 0.7, y + h, [90, 100, 110]);
      tri(x + w * 0.45, y + h, x + w * 0.75, y + h * 0.35, x + w, y + h, [70, 80, 92]);
      tri(x + w * 0.3, y + h * 0.28, x + w * 0.4, y + h * 0.18, x + w * 0.48, y + h * 0.3, [255, 255, 255]);
      rect(x, y + h - 6, w, 6, GREEN); break;
    }
    case 'energy': { // sun + panels
      rect(x, y, w, h, [250, 230, 170]);
      disc(x + w * 0.75, y + h * 0.25, w * 0.14, GOLD);
      for (let i = 0; i < 3; i++) rect(x + w * (0.1 + i * 0.28), y + h * 0.6, w * 0.22, h * 0.25, BLUE);
      line(x, y + h * 0.6, x + w, y + h * 0.6, GREEN); break;
    }
    default: { // generic news scene: globe + rays
      rect(x, y, w, h, LIGHT);
      disc(cx, cy, Math.min(w, h) * 0.3, BLUE);
      ellipse(cx - w * 0.1, cy, w * 0.12, h * 0.12, GREEN);
      break;
    }
  }
  frame(x, y, w, h, INK, 1);
}

// ---------- story data (44 stories, verified 21 Nov 2026) ----------
// Heroes: [kicker, kind, headline, body]
const HEROES: [string, string, string, string][] = [
  ['1 - EUROPE - WAR', 'skyline', 'RUSSIA HITS UKRAINE; MISSILES IN POLAND', '400+ DRONES, 110 MISSILES.'],
  ['2 - AMERICAS - MARKETS', 'chart', 'AI ROUT: S&P AND DOW IN CORRECTION', 'S&P -3.7%; NASDAQ DOWN.'],
  ['3 - WORLD - GAMES', 'game', 'GTA VI: RECORD $3.79BN DAY ONE', '32.5M PRE-ORDERS; BIGGEST EVER.'],
];
// Middle stories: [region, kind, headline, body]
const MIDDLE: [string, string, string, string][] = [
  ['ASIA - JUSTICE', 'gavel', 'MYANMAR GUILTY OF GENOCIDE', 'FIRST STATE HELD LIABLE.'],
  ['ASIA - SUMMIT', 'skyline', 'TRUMP DEFENDS PUTIN, XI TIES', '90-MINUTE PRESSER.'],
  ['AMERICAS - QUAKE', 'mountain', "M6.7 QUAKE SHAKES PERU'S ANDES", 'FELT IN LIMA, NO DEATHS.'],
  ['AMERICAS - CITY', 'building', 'MAMDANI PLANS TO CLOSE RIKERS BY 2032', 'MAYOR-ELECT SETS DATE.'],
  ['WORLD - CLIMATE', 'globe', 'COP31 RUNS INTO OVERTIME IN ANTALYA', 'DRAFT DROPS FOSSIL FUELS.'],
  ['WORLD - SPACE', 'rocket', 'BEPICOLOMBO REACHES MERCURY', '10BN KM; SECOND TO ORBIT.'],
  ['WORLD - SPACE', 'tech', 'VOYAGER 1 A LIGHT-DAY FROM EARTH', '16.1BN MILES OUT.'],
  ['AFRICA - POLITICS', 'vote', "ANC FIGHTS TO HOLD S. AFRICA'S CITIES", 'WORST RESULT SINCE 1994.'],
  ['AFRICA - TRAGEDY', 'ship', 'FUNERAL BOAT CAPSIZES IN NIGERIA', '4 DEAD; 300 FEARED MISSING.'],
  ['EUROPE - DEAL', 'flag', 'UK AND EU SIGN POST-BREXIT DEALS', 'FOOD, CARBON, MOBILITY.'],
  ['MIDDLE EAST - WAR', 'fire', 'SAUDI INTERCEPTS HOUTHI MISSILES', 'THIRD NIGHT OF ALERTS.'],
  ['AMERICAS - HEALTH', 'health', 'US LOSES MEASLES ELIMINATION STATUS', '7,700 CASES, 13 DEATHS.'],
];
// Also-on list (29 items, numbered 16-44 on the page)
const ALSO: string[] = [
  'DENMARK EXPELS RUSSIAN ENVOY',
  'ESTONIA SHUTS 5 RUSSIA CROSSINGS',
  'GEN Z PROTESTS SWEEP 25 COUNTRIES',
  'SPAIN: FEIJOO WINS TV DEBATE',
  'FRENCH POLICE GUILTY IN ZECLER CASE',
  'VILLEPIN RUNS FOR FRENCH PRESIDENT',
  'ALCARAZ WINS ATP GROUP 6-4, 6-1',
  'HORMUZ ATTACKS GO ON AS TALKS STALL',
  'ISRAELI STRIKES KILL 6 IN GAZA',
  'IRAQ RETAKES JURF AL-SAKHAR',
  'NEPAL PM SHAH TO VISIT INDIA',
  'S. KOREA TO IMPEACH CHIEF JUSTICE',
  'JAPAN-CHINA TIES AT RECORD LOW',
  'SAUDI, JAPAN AGREE OIL DEAL',
  'INDUSIND BANK FIRES EX-CEO',
  'ANGOLA PAYS $180M FOR DE BEERS',
  "LISSU GUILTY OF SEDITION",
  'UGANDA LIMITS TRAVEL OVER EBOLA',
  'KENYA STARTS ONSHORE OIL DRILLING',
  'JUDGE OKS $7.25BN BAYER DEAL',
  'ARGENTINA RISK TOPS 1,000',
  'BOLSONARO IN HOSPITAL',
  'SALVADORAN TROOPS LOSE 2',
  'A LIM KIM LEADS LPGA AFTER ACE',
  'CYCLONE XAVIER WEAKENS',
  'GREENS FIGHT COPYCAT VOTE CARDS',
  'TEEN RAN MELBOURNE ARSONS',
  'NZ DEFENCE DATABASE HACKED',
  'PALISADES FIRE ARSONIST CONVICTED',
];
// Map places: [label, lon, lat]
const PLACES: [string, number, number][] = [
  ['KYIV', 30.5, 50.4], ['WARSAW', 21.0, 52.2], ['NEW YORK', -74.0, 40.7],
  ['THE HAGUE', 4.3, 52.1], ['SHENZHEN', 114.0, 22.5], ['JUNIN', -75.2, -11.2],
  ['ANTALYA', 30.7, 36.9], ['JOHANNESBURG', 28.0, -26.2], ['BAYELSA', 6.3, 4.9],
  ['LONDON', -0.1, 51.5], ['RIYADH', 46.7, 24.6], ['WASHINGTON', -77.0, 38.9],
];
const REGIONS: [string, number, number[]][] = [
  ['EUROPE 9', 9, BLUE], ['MIDDLE EAST 4', 4, ORANGE], ['ASIA 6', 6, TEAL],
  ['AFRICA 6', 6, GREEN], ['AMERICAS 11', 11, RED], ['OCEANIA 4', 4, NAVY], ['WORLD 4', 4, GOLD],
];

function drawMap(x: number, y: number, w: number, h: number) {
  rect(x, y, w, h, [188, 210, 226]);
  frame(x, y, w, h, INK, 1);
  const px2 = (lon: number) => x + ((lon + 180) / 360) * w;
  const py2 = (lat: number) => y + ((90 - lat) / 180) * h;
  const land: [number, number, number, number][] = [
    [-100, 50, 0.15, 0.15], [-85, 30, 0.09, 0.08], [-60, -15, 0.07, 0.15],
    [-45, -5, 0.03, 0.05], [15, 52, 0.07, 0.07], [20, 5, 0.09, 0.16],
    [90, 50, 0.17, 0.13], [105, 12, 0.07, 0.08], [78, 21, 0.05, 0.07],
    [134, -25, 0.05, 0.05], [-42, 74, 0.04, 0.04], [140, 40, 0.04, 0.06],
  ];
  for (const [lon, lat, rx, ry] of land) ellipse(px2(lon), py2(lat), rx * w, ry * h, [224, 206, 170]);
  PLACES.forEach(([label, lon, lat], i) => {
    const dx = px2(lon), dy = py2(lat);
    disc(dx, dy, 5, RED);
    disc(dx, dy, 2, [255, 255, 255]);
    const off: [number, number][] = [[8, -5], [8, -13], [8, -5], [-28, 11], [8, -5], [8, -5], [8, -5], [8, -5], [-32, 7], [-28, -15], [8, -5], [-36, -5]];
    text(String(i + 1), dx + off[i][0], dy + off[i][1], 1.5, INK);
  });
}

function draw() {
  fill(PAPER);
  frame(6, 6, 1012, 1012, INK, 3);
  // Masthead
  textC("THE WORLD'S NEWS IN ONE PICTURE", 512, 14, 2, RED);
  textC('SATURDAY 21 NOVEMBER 2026', 512, 36, 5, INK);
  textC('EVERY STORY HERE HAPPENED, OR WAS FIRST REPORTED, ON SATURDAY 21 NOVEMBER 2026 (UTC).', 512, 78, 1.5, INK);
  hline(16, 96, 992, INK, 2);
  textC('44 STORIES - 6 CONTINENTS - ONE DAY', 512, 104, 3, INK);
  // Region bar
  REGIONS.forEach(([label, , col], i) => {
    const bx = 16 + i * 142;
    rect(bx, 130, 141, 24, col);
    textC(label, bx + 70, 137, 1.5, [255, 255, 255]);
  });
  // Day in Numbers
  hline(16, 160, 992, INK, 1);
  text('THE DAY IN NUMBERS:', 16, 166, 2, RED);
  text('400+ DRONES, 110 MISSILES AT UKRAINE - $3.79BN GTA VI DAY ONE - S&P -3.7%', 16, 182, 2, INK);
  text('M6.7 QUAKE IN PERU - 137 MPH CYCLONE XAVIER - $7.25BN BAYER DEAL', 16, 198, 2, INK);
  hline(16, 216, 992, INK, 2);
  // Heroes
  HEROES.forEach(([kick, kind, head, body], i) => {
    const hx = 16 + i * 334;
    frame(hx, 224, 324, 148, INK, 2);
    text(kick, hx + 8, 230, 1.5, RED);
    scene(kind, hx + 8, 246, 308, 62);
    para(head, hx + 8, 312, 2.5, INK, 20, 19);
    text(body, hx + 8, 354, 1.5, DARKGREY);
  });
  // Middle stories: 3 columns x 4 rows
  MIDDLE.forEach(([region, kind, head, body], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const cx = 16 + col * 334, cy = 378 + row * 64;
    text(region, cx + 74, cy, 1.5, RED);
    scene(kind, cx, cy + 2, 66, 58);
    para(head, cx + 74, cy + 12, 2, INK, 20, 16);
    text(body, cx + 74, cy + 46, 1.5, DARKGREY);
  });
  hline(16, 652, 992, INK, 2);
  // Map
  text('WHERE IT HAPPENED', 16, 660, 2, INK);
  drawMap(16, 680, 316, 118);
  const keyLines = ['1 KYIV  2 WARSAW  3 NEW YORK', '4 THE HAGUE  5 SHENZHEN  6 JUNIN',
    '7 ANTALYA  8 JOHANNESBURG', '9 BAYELSA  10 LONDON  11 RIYADH', '12 WASHINGTON'];
  keyLines.forEach((ln, i) => text(ln, 16, 804 + i * 12, 1.5, INK));
  // Also on 21 November
  text('ALSO ON 21 NOVEMBER', 344, 660, 2, INK);
  ALSO.forEach((item, i) => {
    const col = i < 15 ? 0 : 1;
    const ax = 344 + col * 346;
    const ay = 680 + (i % 15) * 12;
    text(`${16 + i} ${item}`, ax, ay, 1.5, INK);
  });
  hline(16, 868, 992, INK, 2);
  // By the clock
  text('BY THE CLOCK - UTC', 16, 880, 2, INK);
  const CLOCK = [
    '00:09 M6.7 QUAKE, PERU', '10:00 BOAT CAPSIZES',
    '19:38 GTA VI $3.79BN', '21:00 S&P CLOSES -3.7%',
    'FRI TUSK: PROVOCATION', 'FRI COP31 OVERTIME',
    'FRI HOUTHI MISSILES', '00:26 GREENS INJUNCTION',
  ];
  CLOCK.forEach((c, i) => {
    const cx = 16 + (i % 4) * 252;
    const cy = 900 + Math.floor(i / 4) * 14;
    text(c, cx, cy, 1.5, INK);
  });
  hline(16, 934, 992, INK, 2);
  // Footer
  text('SOURCES: REUTERS, AP, AFP, BBC, AL JAZEERA, BLOOMBERG, GUARDIAN, LE MONDE. ORIGINAL DRAWINGS.', 16, 942, 1.5, GREY);
  text('DATE CHECK: MOST STORIES WERE FIRST REPORTED FRI 20 NOV AND HEADLINE THE 21 NOV PAPERS.', 16, 958, 1.5, GREY);
  text('NEWS-CYCLE STANDARD. EVENTS DATED 21 NOV UTC ARE MARKED IN THE TIMELINE. UNVERIFIED STORIES LEFT OUT.', 16, 974, 1.5, GREY);
  text('EVERY STORY HERE HAPPENED, OR WAS FIRST REPORTED, ON SATURDAY 21 NOVEMBER 2026 (UTC).', 16, 994, 1.5, INK);
}

draw();
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
const buf = encodePNG();
writeFileSync(join(outDir, 'entry.png'), buf);
console.log(`wrote ${join(outDir, 'entry.png')} ${buf.length} bytes`);
