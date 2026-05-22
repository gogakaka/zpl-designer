import type {
  Barcode1DElement,
  Barcode2DElement,
  BoxElement,
  CircleElement,
  DesignElement,
  Dpi,
  EllipseElement,
  ExportOptions,
  LineElement,
  Project,
  TextElement,
} from '../types';
import { mmToDot } from '../units';
import type { CodeGenerator } from './types';
import { resolveVariables } from './types';

// Secondary generator. Demonstrates that the CodeGenerator plugin architecture
// supports additional printer languages without touching the design model.

function str(text: string): string {
  return text.replace(/"/g, "'");
}

const BC_TYPE: Record<Barcode1DElement['symbology'], string> = {
  CODE128: '128',
  CODE39: '39',
  CODE93: '93',
  EAN13: 'EAN13',
  EAN8: 'EAN8',
  UPCA: 'UPCA',
  UPCE: 'UPCE',
  ITF: '25',
  CODABAR: 'CODA',
  MSI: 'MSI',
};

function genText(el: TextElement, dpi: Dpi, opts: ExportOptions): string {
  const x = mmToDot(el.xMm, dpi);
  const y = mmToDot(el.yMm, dpi);
  const mul = Math.max(1, Math.min(10, Math.round(el.fontHeightDot / 24)));
  const content = resolveVariables(el.content, opts);
  return `TEXT ${x},${y},"3",${el.rotation},${mul},${mul},"${str(content)}"`;
}

function gen1d(el: Barcode1DElement, dpi: Dpi, opts: ExportOptions): string {
  const x = mmToDot(el.xMm, dpi);
  const y = mmToDot(el.yMm, dpi);
  const hr = el.showHrt ? (el.hrtAbove ? 2 : 1) : 0;
  const narrow = el.moduleWidthDot;
  const wide = Math.round(el.moduleWidthDot * el.ratio);
  const data = resolveVariables(el.data, opts);
  return (
    `BARCODE ${x},${y},"${BC_TYPE[el.symbology]}",${el.barHeightDot},` +
    `${hr},${el.rotation},${narrow},${wide},"${str(data)}"`
  );
}

function gen2d(el: Barcode2DElement, dpi: Dpi, opts: ExportOptions): string | null {
  const x = mmToDot(el.xMm, dpi);
  const y = mmToDot(el.yMm, dpi);
  const data = resolveVariables(el.data, opts);
  if (el.symbology === 'QR') {
    return `QRCODE ${x},${y},${el.errorCorrection},${el.magnification},A,${el.rotation},"${str(data)}"`;
  }
  if (el.symbology === 'DATAMATRIX') {
    const w = mmToDot(el.widthMm, dpi);
    const h = mmToDot(el.heightMm, dpi);
    return `DMATRIX ${x},${y},${w},${h},"${str(data)}"`;
  }
  return null;
}

function genLine(el: LineElement, dpi: Dpi): string {
  const x = mmToDot(el.xMm, dpi);
  const y = mmToDot(el.yMm, dpi);
  const w = Math.max(1, mmToDot(el.widthMm, dpi));
  const h = Math.max(1, mmToDot(el.heightMm, dpi));
  return `BAR ${x},${y},${w},${h}`;
}

function genBox(el: BoxElement, dpi: Dpi): string {
  const x = mmToDot(el.xMm, dpi);
  const y = mmToDot(el.yMm, dpi);
  const w = Math.max(1, mmToDot(el.widthMm, dpi));
  const h = Math.max(1, mmToDot(el.heightMm, dpi));
  if (el.filled) return `BAR ${x},${y},${w},${h}`;
  return `BOX ${x},${y},${x + w},${y + h},${Math.max(1, el.borderThicknessDot)}`;
}

function genCircle(el: CircleElement, dpi: Dpi): string {
  const x = mmToDot(el.xMm, dpi);
  const y = mmToDot(el.yMm, dpi);
  const d = Math.max(1, mmToDot(Math.min(el.widthMm, el.heightMm), dpi));
  return `CIRCLE ${x},${y},${d},${Math.max(1, el.borderThicknessDot)}`;
}

function genEllipse(el: EllipseElement, dpi: Dpi): string {
  const x = mmToDot(el.xMm, dpi);
  const y = mmToDot(el.yMm, dpi);
  const w = Math.max(1, mmToDot(el.widthMm, dpi));
  const h = Math.max(1, mmToDot(el.heightMm, dpi));
  return `ELLIPSE ${x},${y},${w},${h},${Math.max(1, el.borderThicknessDot)}`;
}

function genElement(el: DesignElement, dpi: Dpi, opts: ExportOptions): string[] {
  switch (el.type) {
    case 'text':
      return [genText(el, dpi, opts)];
    case 'barcode1d':
      return [gen1d(el, dpi, opts)];
    case 'barcode2d': {
      const line = gen2d(el, dpi, opts);
      return line ? [line] : [`; [${el.name}] TSPL 미지원 2D 심볼: ${el.symbology}`];
    }
    case 'line':
      return [genLine(el, dpi)];
    case 'box':
      return [genBox(el, dpi)];
    case 'circle':
      return [genCircle(el, dpi)];
    case 'ellipse':
      return [genEllipse(el, dpi)];
    default:
      return [`; [${el.name}] TSPL 생성기 미지원 요소: ${el.type}`];
  }
}

export function generateTspl(project: Project, options: ExportOptions): string {
  const label = project.label;
  const dpi = project.printerProfile.dpi;
  const out: string[] = [];

  out.push(`SIZE ${label.widthMm} mm, ${label.heightMm} mm`);
  out.push(label.mediaType === 'continuous' ? 'GAP 0 mm, 0 mm' : 'GAP 2 mm, 0 mm');
  out.push(`DENSITY ${Math.max(0, Math.min(15, 8 + label.darkness))}`);
  out.push(`SPEED ${label.printSpeed || 4}`);
  out.push(`DIRECTION ${label.rotation === 180 ? 1 : 0}`);
  out.push('CLS');

  for (const el of label.elements) {
    if (!el.visible) continue;
    if (options.includeComments) out.push(`; ${el.name}`);
    out.push(...genElement(el, dpi, options));
  }

  out.push(`PRINT 1,${label.printQuantity || 1}`);
  return out.join('\n');
}

export const tsplGenerator: CodeGenerator = {
  id: 'tspl',
  name: 'TSPL (실험적)',
  fileExtension: 'txt',
  generate: generateTspl,
};
