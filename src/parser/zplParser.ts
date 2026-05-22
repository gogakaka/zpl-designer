import { uid } from '../ids';
import { dotToMm } from '../units';
import type {
  Barcode1DSymbology,
  Barcode2DSymbology,
  DesignElement,
  Dpi,
  Rotation,
  ZplFontId,
} from '../types';

const VALID_FONTS = new Set(['0', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);

export interface ZplParseResult {
  elements: DesignElement[];
  widthMm?: number;
  heightMm?: number;
  warnings: string[];
}

const ROT_REV: Record<string, Rotation> = { N: 0, R: 90, I: 180, B: 270 };

const SYM_1D: Record<string, Barcode1DSymbology> = {
  BC: 'CODE128',
  B3: 'CODE39',
  BA: 'CODE93',
  BE: 'EAN13',
  B8: 'EAN8',
  BU: 'UPCA',
  B9: 'UPCE',
  B2: 'ITF',
  BK: 'CODABAR',
  BM: 'MSI',
};

const SYM_2D: Record<string, Barcode2DSymbology> = {
  BQ: 'QR',
  BX: 'DATAMATRIX',
  B7: 'PDF417',
  B0: 'AZTEC',
  BD: 'MAXICODE',
};

interface Token {
  code: string;
  rest: string;
}

function tokenize(zpl: string): Token[] {
  const matches = zpl.match(/[\^~][^\^~]*/g) ?? [];
  return matches.map((t) => {
    if (t[1] === 'A' && t[2] !== '@') return { code: 'A', rest: t.slice(2) };
    return { code: t.slice(1, 3).toUpperCase(), rest: t.slice(3) };
  });
}

function nums(rest: string): number[] {
  return rest
    .split(',')
    .map((s) => parseFloat(s.trim()))
    .map((n) => (Number.isFinite(n) ? n : 0));
}

let nameSeq = 0;
function nm(label: string): string {
  nameSeq += 1;
  return `${label} ${nameSeq}`;
}

interface FieldState {
  foX: number;
  foY: number;
  font?: { id: string; rot: Rotation; h: number; w: number };
  by?: { module: number; ratio: number; height: number };
  bc1d?: { sym: Barcode1DSymbology; rot: Rotation; height: number; hrt: boolean };
  bc2d?: { sym: Barcode2DSymbology; rot: Rotation; mag: number };
  graphic?: { kind: string; nums: number[]; color: string; orient: string };
  symbol?: { rot: Rotation; h: number; w: number };
  fd?: string;
  reverse?: boolean;
}

function decodeFd(text: string): string {
  return text.replace(/_([0-9A-Fa-f]{2})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)));
}

/** Best-effort parser converting a ZPL II label into editable elements. */
export function parseZpl(zpl: string, dpi: Dpi): ZplParseResult {
  const warnings: string[] = [];
  const elements: DesignElement[] = [];
  let widthMm: number | undefined;
  let heightMm: number | undefined;

  const start = zpl.indexOf('^XA');
  const end = zpl.indexOf('^XZ');
  const body = start >= 0 ? zpl.slice(start, end >= 0 ? end : undefined) : zpl;
  const tokens = tokenize(body);

  let field: FieldState | null = null;

  const finalize = () => {
    if (!field) return;
    const f = field;
    field = null;
    const x = dotToMm(f.foX, dpi);
    const y = dotToMm(f.foY, dpi);

    if (f.graphic) {
      const g = f.graphic;
      const color = g.color === 'W' ? 'W' : 'B';
      if (g.kind === 'GB') {
        const [w = 1, h = 1, t = 1] = g.nums;
        const rounding = g.nums[4] ?? 0;
        if (h <= 5 && w > h) {
          elements.push({
            id: uid(), type: 'line', name: nm('선'), xMm: x, yMm: y,
            widthMm: dotToMm(w, dpi), heightMm: dotToMm(Math.max(h, 1), dpi),
            rotation: 0, locked: false, visible: true,
            orientation: 'horizontal', color,
          });
        } else if (w <= 5 && h > w) {
          elements.push({
            id: uid(), type: 'line', name: nm('선'), xMm: x, yMm: y,
            widthMm: dotToMm(Math.max(w, 1), dpi), heightMm: dotToMm(h, dpi),
            rotation: 0, locked: false, visible: true,
            orientation: 'vertical', color,
          });
        } else {
          elements.push({
            id: uid(), type: 'box', name: nm('박스'), xMm: x, yMm: y,
            widthMm: dotToMm(w, dpi), heightMm: dotToMm(h, dpi),
            rotation: 0, locked: false, visible: true,
            borderThicknessDot: Math.round(t), color,
            filled: t >= Math.min(w, h) / 2,
            rounding: Math.round(rounding),
          });
        }
      } else if (g.kind === 'GC') {
        const [d = 1, t = 1] = g.nums;
        elements.push({
          id: uid(), type: 'circle', name: nm('원'), xMm: x, yMm: y,
          widthMm: dotToMm(d, dpi), heightMm: dotToMm(d, dpi),
          rotation: 0, locked: false, visible: true,
          borderThicknessDot: Math.round(t), color, filled: t >= d / 2,
        });
      } else if (g.kind === 'GE') {
        const [w = 1, h = 1, t = 1] = g.nums;
        elements.push({
          id: uid(), type: 'ellipse', name: nm('타원'), xMm: x, yMm: y,
          widthMm: dotToMm(w, dpi), heightMm: dotToMm(h, dpi),
          rotation: 0, locked: false, visible: true,
          borderThicknessDot: Math.round(t), color, filled: t >= Math.min(w, h) / 2,
        });
      } else if (g.kind === 'GD') {
        const [w = 1, h = 1, t = 1] = g.nums;
        elements.push({
          id: uid(), type: 'diagonal', name: nm('대각선'), xMm: x, yMm: y,
          widthMm: dotToMm(w, dpi), heightMm: dotToMm(h, dpi),
          rotation: 0, locked: false, visible: true,
          thicknessDot: Math.round(t), color, lean: g.orient === 'L' ? 'left' : 'right',
        });
      }
      return;
    }

    if (f.symbol) {
      const sym = f.symbol;
      const chars = new Set(['A', 'B', 'C', 'D', 'E']);
      const ch = (f.fd ?? 'C').trim().charAt(0).toUpperCase();
      elements.push({
        id: uid(),
        type: 'symbol',
        name: nm('심볼'),
        xMm: x,
        yMm: y,
        widthMm: dotToMm(sym.w || 60, dpi),
        heightMm: dotToMm(sym.h || 60, dpi),
        rotation: sym.rot,
        locked: false,
        visible: true,
        symbolChar: (chars.has(ch) ? ch : 'C') as 'A' | 'B' | 'C' | 'D' | 'E',
      });
      return;
    }

    if (f.bc1d && f.fd !== undefined) {
      const b = f.bc1d;
      const height = b.height || f.by?.height || 80;
      elements.push({
        id: uid(), type: 'barcode1d', name: nm('바코드'), xMm: x, yMm: y,
        widthMm: Math.max(20, dotToMm(f.fd.length * 11 * (f.by?.module ?? 2), dpi)),
        heightMm: dotToMm(height, dpi) + (b.hrt ? 5 : 0),
        rotation: b.rot, locked: false, visible: true,
        symbology: b.sym, data: decodeFd(f.fd),
        moduleWidthDot: f.by?.module ?? 2, ratio: f.by?.ratio ?? 3,
        barHeightDot: Math.round(height), showHrt: b.hrt, hrtAbove: false,
        checkDigit: false, gs1: false,
      });
      return;
    }

    if (f.bc2d && f.fd !== undefined) {
      const b = f.bc2d;
      let data = f.fd;
      let ec: 'L' | 'M' | 'Q' | 'H' = 'M';
      if (b.sym === 'QR') {
        const m = /^([LMQH])[A-Z],(.*)$/s.exec(data);
        if (m) {
          ec = m[1] as 'L' | 'M' | 'Q' | 'H';
          data = m[2];
        }
      }
      const size = Math.max(15, dotToMm(b.mag * 25, dpi));
      elements.push({
        id: uid(), type: 'barcode2d', name: nm('2D코드'), xMm: x, yMm: y,
        widthMm: size, heightMm: size, rotation: b.rot, locked: false, visible: true,
        symbology: b.sym, data: decodeFd(data), magnification: b.mag, errorCorrection: ec,
      });
      return;
    }

    if (f.fd !== undefined) {
      const font = f.font;
      const fontId: ZplFontId =
        font && VALID_FONTS.has(font.id) ? (font.id as ZplFontId) : '0';
      elements.push({
        id: uid(),
        type: 'text',
        name: nm('텍스트'),
        xMm: x,
        yMm: y,
        widthMm: Math.max(15, dotToMm((f.fd.length + 1) * (font?.w || font?.h || 24) * 0.6, dpi)),
        heightMm: dotToMm((font?.h ?? 30) * 1.3, dpi),
        rotation: font?.rot ?? 0,
        locked: false,
        visible: true,
        content: decodeFd(f.fd),
        fontId,
        fontHeightDot: Math.round(font?.h ?? 30),
        fontWidthDot: Math.round(font?.w ?? font?.h ?? 30),
        align: 'L',
        multiline: false,
        maxLines: 3,
        lineGapDot: 4,
        reverse: !!f.reverse,
      });
      return;
    }
  };

  for (const tok of tokens) {
    const { code, rest } = tok;
    switch (code) {
      case 'PW':
        widthMm = dotToMm(nums(rest)[0] || 0, dpi);
        break;
      case 'LL':
        heightMm = dotToMm(nums(rest)[0] || 0, dpi);
        break;
      case 'FO':
      case 'FT': {
        if (field) finalize();
        const [fx = 0, fy = 0] = nums(rest);
        field = { foX: fx, foY: fy };
        break;
      }
      case 'A': {
        if (!field) field = { foX: 0, foY: 0 };
        const id = rest[0] ?? '0';
        const rotChar = rest[1] ?? 'N';
        const p = nums(rest.slice(2).replace(/^,/, ''));
        field.font = {
          id,
          rot: ROT_REV[rotChar] ?? 0,
          h: p[0] || 30,
          w: p[1] || p[0] || 30,
        };
        break;
      }
      case 'BY': {
        if (!field) field = { foX: 0, foY: 0 };
        const p = nums(rest);
        field.by = { module: p[0] || 2, ratio: p[1] || 3, height: p[2] || 0 };
        break;
      }
      case 'FR':
        if (field) field.reverse = true;
        break;
      case 'FD':
        if (!field) field = { foX: 0, foY: 0 };
        field.fd = rest;
        break;
      case 'FS':
        finalize();
        break;
      case 'GS': {
        if (!field) field = { foX: 0, foY: 0 };
        const p = nums(rest.slice(1));
        field.symbol = { rot: ROT_REV[rest[0]] ?? 0, h: p[0] || 60, w: p[1] || 60 };
        break;
      }
      case 'GB':
      case 'GC':
      case 'GE':
      case 'GD': {
        if (!field) field = { foX: 0, foY: 0 };
        const parts = rest.split(',');
        const numeric = parts.map((s) => parseFloat(s)).filter((n) => Number.isFinite(n));
        const color = (parts.find((s) => /^[BW]$/i.test(s.trim())) ?? 'B').toUpperCase();
        const orient = (parts.find((s) => /^[RL]$/i.test(s.trim())) ?? 'R').toUpperCase();
        field.graphic = { kind: code, nums: numeric, color, orient };
        break;
      }
      default: {
        if (SYM_1D[code]) {
          if (!field) field = { foX: 0, foY: 0 };
          const p = nums(rest);
          field.bc1d = {
            sym: SYM_1D[code],
            rot: ROT_REV[rest[0]] ?? 0,
            height: code === 'B3' ? p[2] || 0 : p[1] || 0,
            hrt: !/N/i.test((rest.split(',')[2] ?? 'Y')),
          };
        } else if (SYM_2D[code]) {
          if (!field) field = { foX: 0, foY: 0 };
          const p = nums(rest);
          field.bc2d = {
            sym: SYM_2D[code],
            rot: ROT_REV[rest[0]] ?? 0,
            mag: code === 'BQ' ? p[1] || 5 : p[0] || 5,
          };
        }
        break;
      }
    }
  }
  if (field) finalize();

  if (elements.length === 0) {
    warnings.push('해석 가능한 요소를 찾지 못했습니다. 지원되지 않는 명령일 수 있습니다.');
  }
  return { elements, widthMm, heightMm, warnings };
}
