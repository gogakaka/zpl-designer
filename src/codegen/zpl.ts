import type {
  Barcode1DElement,
  Barcode2DElement,
  BoxElement,
  CircleElement,
  DesignElement,
  DiagonalElement,
  Dpi,
  EllipseElement,
  ExportOptions,
  ImageElement,
  LineElement,
  Project,
  Rotation,
  TableElement,
  TextElement,
} from '../types';
import { mmToDot } from '../units';
import type { CodeGenerator } from './types';
import { resolveVariables } from './types';

const ROT: Record<Rotation, string> = { 0: 'N', 90: 'R', 180: 'I', 270: 'B' };

/** Escape caret/tilde/underscore in field data, enabling ^FH when needed. */
function encodeFd(text: string): { fh: boolean; data: string } {
  if (/[\^~_]/.test(text)) {
    return {
      fh: true,
      data: text.replace(
        /[\^~_]/g,
        (c) => '_' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'),
      ),
    };
  }
  return { fh: false, data: text };
}

function pos(el: { xMm: number; yMm: number }, dpi: Dpi): string {
  return `^FO${mmToDot(el.xMm, dpi)},${mmToDot(el.yMm, dpi)}`;
}

function genText(el: TextElement, dpi: Dpi, opts: ExportOptions): string {
  const content = resolveVariables(el.content, opts);
  const enc = encodeFd(content);
  let s = pos(el, dpi);
  if (el.reverse) s += '^FR';
  s += `^A${el.fontId}${ROT[el.rotation]},${el.fontHeightDot},${el.fontWidthDot}`;
  const useFb = el.multiline || el.align !== 'L';
  if (useFb) {
    const blockW = mmToDot(el.widthMm, dpi);
    const lines = el.multiline ? el.maxLines : 1;
    s += `^FB${blockW},${lines},${el.lineGapDot},${el.align},0`;
  }
  if (enc.fh) s += '^FH_';
  s += `^FD${enc.data}^FS`;
  return s;
}

function gen1d(el: Barcode1DElement, dpi: Dpi, opts: ExportOptions): string {
  const rot = ROT[el.rotation];
  const h = el.barHeightDot;
  const f = el.showHrt ? 'Y' : 'N';
  const g = el.hrtAbove ? 'Y' : 'N';
  const e = el.checkDigit ? 'Y' : 'N';
  let bc: string;
  switch (el.symbology) {
    case 'CODE128':
      bc = `^BC${rot},${h},${f},${g},${e},N`;
      break;
    case 'CODE39':
      bc = `^B3${rot},${e},${h},${f},${g}`;
      break;
    case 'CODE93':
      bc = `^BA${rot},${h},${f},${g},${e}`;
      break;
    case 'EAN13':
      bc = `^BE${rot},${h},${f},${g}`;
      break;
    case 'EAN8':
      bc = `^B8${rot},${h},${f},${g}`;
      break;
    case 'UPCA':
      bc = `^BU${rot},${h},${f},${g},${e}`;
      break;
    case 'UPCE':
      bc = `^B9${rot},${h},${f},${g},${e}`;
      break;
    case 'ITF':
      bc = `^B2${rot},${h},${f},${g},${e}`;
      break;
    case 'CODABAR':
      bc = `^BK${rot},${e},${h},${f},${g}`;
      break;
    case 'MSI':
      bc = `^BM${rot},${e},${h},${f},${g},N`;
      break;
  }
  const enc = encodeFd(resolveVariables(el.data, opts));
  return (
    `${pos(el, dpi)}^BY${el.moduleWidthDot},${el.ratio},${h}${bc}` +
    `${enc.fh ? '^FH_' : ''}^FD${enc.data}^FS`
  );
}

function gen2d(el: Barcode2DElement, dpi: Dpi, opts: ExportOptions): string {
  const rot = ROT[el.rotation];
  const mag = el.magnification;
  const enc = encodeFd(resolveVariables(el.data, opts));
  const fh = enc.fh ? '^FH_' : '';
  switch (el.symbology) {
    case 'QR':
      return `${pos(el, dpi)}^BQ${rot},2,${mag}${fh}^FD${el.errorCorrection}A,${enc.data}^FS`;
    case 'DATAMATRIX':
      return `${pos(el, dpi)}^BX${rot},${mag},200${fh}^FD${enc.data}^FS`;
    case 'PDF417':
      return `${pos(el, dpi)}^B7${rot},${mag},5${fh}^FD${enc.data}^FS`;
    case 'AZTEC':
      return `${pos(el, dpi)}^B0${rot},${mag},0${fh}^FD${enc.data}^FS`;
    case 'MAXICODE':
      return `${pos(el, dpi)}^BD4,1,1${fh}^FD${enc.data}^FS`;
  }
}

function genLine(el: LineElement, dpi: Dpi): string {
  const w = Math.max(1, mmToDot(el.widthMm, dpi));
  const h = Math.max(1, mmToDot(el.heightMm, dpi));
  const t = Math.max(1, Math.min(w, h));
  return `${pos(el, dpi)}^GB${w},${h},${t},${el.color}^FS`;
}

function genBox(el: BoxElement, dpi: Dpi): string {
  const w = Math.max(1, mmToDot(el.widthMm, dpi));
  const h = Math.max(1, mmToDot(el.heightMm, dpi));
  const t = el.filled
    ? Math.ceil(Math.min(w, h) / 2)
    : Math.max(1, el.borderThicknessDot);
  const r = Math.max(0, Math.min(8, Math.round(el.rounding)));
  return `${pos(el, dpi)}^GB${w},${h},${t},${el.color},${r}^FS`;
}

function genCircle(el: CircleElement, dpi: Dpi): string {
  const d = Math.max(1, mmToDot(Math.min(el.widthMm, el.heightMm), dpi));
  const t = el.filled ? Math.ceil(d / 2) : Math.max(1, el.borderThicknessDot);
  return `${pos(el, dpi)}^GC${d},${t},${el.color}^FS`;
}

function genEllipse(el: EllipseElement, dpi: Dpi): string {
  const w = Math.max(1, mmToDot(el.widthMm, dpi));
  const h = Math.max(1, mmToDot(el.heightMm, dpi));
  const t = el.filled
    ? Math.ceil(Math.min(w, h) / 2)
    : Math.max(1, el.borderThicknessDot);
  return `${pos(el, dpi)}^GE${w},${h},${t},${el.color}^FS`;
}

function genDiagonal(el: DiagonalElement, dpi: Dpi): string {
  const w = Math.max(1, mmToDot(el.widthMm, dpi));
  const h = Math.max(1, mmToDot(el.heightMm, dpi));
  const o = el.lean === 'right' ? 'R' : 'L';
  return `${pos(el, dpi)}^GD${w},${h},${Math.max(1, el.thicknessDot)},${el.color},${o}^FS`;
}

function genImage(el: ImageElement, dpi: Dpi): string {
  if (!el.mono) {
    return `^FX[${el.name}] 이미지 미처리 — 속성 패널에서 이미지를 업로드하세요^FS`;
  }
  const { rowBytes, heightDot, hex } = el.mono;
  const total = rowBytes * heightDot;
  return `${pos(el, dpi)}^GFA,${total},${total},${rowBytes},${hex}^FS`;
}

export function genTable(el: TableElement, dpi: Dpi, opts: ExportOptions): string[] {
  const lines: string[] = [];
  const colX: number[] = [0];
  for (const cw of el.colWidthsMm) colX.push(colX[colX.length - 1] + cw);
  const rowY: number[] = [0];
  for (const rh of el.rowHeightsMm) rowY.push(rowY[rowY.length - 1] + rh);
  const totalW = colX[colX.length - 1];
  const totalH = rowY[rowY.length - 1];
  const t = Math.max(1, el.borderThicknessDot);

  lines.push(
    `^FO${mmToDot(el.xMm, dpi)},${mmToDot(el.yMm, dpi)}` +
      `^GB${mmToDot(totalW, dpi)},${mmToDot(totalH, dpi)},${t},B,0^FS`,
  );
  if (el.showInnerBorders) {
    for (let c = 1; c < el.cols; c++) {
      lines.push(
        `^FO${mmToDot(el.xMm + colX[c], dpi)},${mmToDot(el.yMm, dpi)}` +
          `^GB${t},${mmToDot(totalH, dpi)},${t},B^FS`,
      );
    }
    for (let r = 1; r < el.rows; r++) {
      lines.push(
        `^FO${mmToDot(el.xMm, dpi)},${mmToDot(el.yMm + rowY[r], dpi)}` +
          `^GB${mmToDot(totalW, dpi)},${t},${t},B^FS`,
      );
    }
  }
  for (const cell of el.cells) {
    if (!cell.text || cell.row >= el.rows || cell.col >= el.cols) continue;
    const padMm = 1;
    const cx = el.xMm + colX[cell.col] + padMm;
    const cy = el.yMm + rowY[cell.row] + padMm;
    const cw = Math.max(1, el.colWidthsMm[cell.col] - padMm * 2);
    const enc = encodeFd(resolveVariables(cell.text, opts));
    lines.push(
      `^FO${mmToDot(cx, dpi)},${mmToDot(cy, dpi)}` +
        `^A0N,${el.fontHeightDot},${el.fontHeightDot}` +
        `^FB${mmToDot(cw, dpi)},1,0,${cell.align},0` +
        `${enc.fh ? '^FH_' : ''}^FD${enc.data}^FS`,
    );
  }
  return lines;
}

function genElement(el: DesignElement, dpi: Dpi, opts: ExportOptions): string[] {
  switch (el.type) {
    case 'text':
      return [genText(el, dpi, opts)];
    case 'barcode1d':
      return [gen1d(el, dpi, opts)];
    case 'barcode2d':
      return [gen2d(el, dpi, opts)];
    case 'line':
      return [genLine(el, dpi)];
    case 'box':
      return [genBox(el, dpi)];
    case 'circle':
      return [genCircle(el, dpi)];
    case 'ellipse':
      return [genEllipse(el, dpi)];
    case 'diagonal':
      return [genDiagonal(el, dpi)];
    case 'image':
      return [genImage(el, dpi)];
    case 'table':
      return genTable(el, dpi, opts);
  }
}

export function generateZpl(project: Project, options: ExportOptions): string {
  const dpi = project.printerProfile.dpi;
  const label = project.label;
  const out: string[] = [];

  out.push('^XA');
  if (options.includeComments) {
    out.push(`^FX ${project.name} | ZPL Designer | ${dpi}dpi^FS`);
  }
  out.push(`^PW${mmToDot(label.widthMm, dpi)}`);
  out.push(`^LL${mmToDot(label.heightMm, dpi)}`);
  out.push('^LH0,0');
  if (options.encoding) out.push('^CI28');
  if (label.rotation !== 0) out.push(`^PO${ROT[label.rotation]}`);
  out.push(`^MN${label.mediaType === 'continuous' ? 'N' : 'Y'}`);
  if (label.darkness !== 0) out.push(`^MD${label.darkness}`);
  if (label.printSpeed) out.push(`^PR${label.printSpeed}`);

  for (const el of label.elements) {
    if (!el.visible) continue;
    if (options.includeComments) out.push(`^FX ${el.name}^FS`);
    out.push(...genElement(el, dpi, options));
  }

  if (label.printQuantity > 1) out.push(`^PQ${label.printQuantity}`);
  out.push('^XZ');
  return out.join('\n');
}

export const zplGenerator: CodeGenerator = {
  id: 'zpl',
  name: 'ZPL II',
  fileExtension: 'zpl',
  generate: generateZpl,
};
