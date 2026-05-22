import { uid } from './ids';
import { SCHEMA_VERSION } from './types';
import type {
  BaseElement,
  Barcode1DElement,
  Barcode2DElement,
  BoxElement,
  CircleElement,
  DesignElement,
  DiagonalElement,
  EllipseElement,
  ElementType,
  ImageElement,
  LabelDoc,
  LineElement,
  PrinterProfile,
  Project,
  TableElement,
  TextElement,
} from './types';

const nameCounters: Record<string, number> = {};

const TYPE_LABELS: Record<ElementType, string> = {
  text: '텍스트',
  barcode1d: '바코드',
  barcode2d: '2D코드',
  line: '선',
  box: '박스',
  circle: '원',
  ellipse: '타원',
  diagonal: '대각선',
  image: '이미지',
  table: '테이블',
};

function nextName(type: ElementType): string {
  nameCounters[type] = (nameCounters[type] ?? 0) + 1;
  return `${TYPE_LABELS[type]} ${nameCounters[type]}`;
}

function base(
  type: ElementType,
  xMm: number,
  yMm: number,
  widthMm: number,
  heightMm: number,
): BaseElement {
  return {
    id: uid(),
    type,
    name: nextName(type),
    xMm,
    yMm,
    widthMm,
    heightMm,
    rotation: 0,
    locked: false,
    visible: true,
  };
}

export function createText(xMm = 5, yMm = 5): TextElement {
  return {
    ...base('text', xMm, yMm, 45, 8),
    type: 'text',
    content: '텍스트',
    fontId: '0',
    fontHeightDot: 30,
    fontWidthDot: 30,
    align: 'L',
    multiline: false,
    maxLines: 3,
    lineGapDot: 4,
    reverse: false,
  };
}

export function createBarcode1d(xMm = 5, yMm = 5): Barcode1DElement {
  return {
    ...base('barcode1d', xMm, yMm, 50, 18),
    type: 'barcode1d',
    symbology: 'CODE128',
    data: '12345678',
    moduleWidthDot: 3,
    ratio: 3,
    barHeightDot: 80,
    showHrt: true,
    hrtAbove: false,
    checkDigit: false,
  };
}

export function createBarcode2d(xMm = 5, yMm = 5): Barcode2DElement {
  return {
    ...base('barcode2d', xMm, yMm, 25, 25),
    type: 'barcode2d',
    symbology: 'QR',
    data: 'https://example.com',
    magnification: 5,
    errorCorrection: 'M',
  };
}

export function createLine(xMm = 5, yMm = 5): LineElement {
  return {
    ...base('line', xMm, yMm, 40, 0.5),
    type: 'line',
    orientation: 'horizontal',
    color: 'B',
  };
}

export function createBox(xMm = 5, yMm = 5): BoxElement {
  return {
    ...base('box', xMm, yMm, 40, 25),
    type: 'box',
    borderThicknessDot: 3,
    color: 'B',
    filled: false,
    rounding: 0,
  };
}

export function createCircle(xMm = 5, yMm = 5): CircleElement {
  return {
    ...base('circle', xMm, yMm, 20, 20),
    type: 'circle',
    borderThicknessDot: 3,
    color: 'B',
    filled: false,
  };
}

export function createEllipse(xMm = 5, yMm = 5): EllipseElement {
  return {
    ...base('ellipse', xMm, yMm, 30, 20),
    type: 'ellipse',
    borderThicknessDot: 3,
    color: 'B',
    filled: false,
  };
}

export function createDiagonal(xMm = 5, yMm = 5): DiagonalElement {
  return {
    ...base('diagonal', xMm, yMm, 30, 20),
    type: 'diagonal',
    thicknessDot: 3,
    color: 'B',
    lean: 'right',
  };
}

export function createImage(xMm = 5, yMm = 5): ImageElement {
  return {
    ...base('image', xMm, yMm, 25, 25),
    type: 'image',
    sourceDataUrl: '',
    dither: 'floyd-steinberg',
    threshold: 128,
    invert: false,
  };
}

export function createTable(xMm = 5, yMm = 5): TableElement {
  const rows = 3;
  const cols = 3;
  const rowHeightsMm = Array(rows).fill(8);
  const colWidthsMm = Array(cols).fill(20);
  return {
    ...base(
      'table',
      xMm,
      yMm,
      colWidthsMm.reduce((a, b) => a + b, 0),
      rowHeightsMm.reduce((a, b) => a + b, 0),
    ),
    type: 'table',
    rows,
    cols,
    rowHeightsMm,
    colWidthsMm,
    borderThicknessDot: 2,
    showInnerBorders: true,
    fontHeightDot: 24,
    cells: [],
  };
}

export function createElement(type: ElementType, xMm = 5, yMm = 5): DesignElement {
  switch (type) {
    case 'text':
      return createText(xMm, yMm);
    case 'barcode1d':
      return createBarcode1d(xMm, yMm);
    case 'barcode2d':
      return createBarcode2d(xMm, yMm);
    case 'line':
      return createLine(xMm, yMm);
    case 'box':
      return createBox(xMm, yMm);
    case 'circle':
      return createCircle(xMm, yMm);
    case 'ellipse':
      return createEllipse(xMm, yMm);
    case 'diagonal':
      return createDiagonal(xMm, yMm);
    case 'image':
      return createImage(xMm, yMm);
    case 'table':
      return createTable(xMm, yMm);
  }
}

export function createPrinterProfile(): PrinterProfile {
  return {
    name: 'Generic 203dpi',
    language: 'zpl',
    dpi: 203,
    maxPrintWidthMm: 104,
    safeFonts: ['0', 'A', 'B'],
  };
}

export function createLabel(): LabelDoc {
  return {
    widthMm: 101.6,
    heightMm: 152.4,
    rotation: 0,
    mediaType: 'diecut',
    darkness: 0,
    printSpeed: 4,
    printQuantity: 1,
    elements: [],
  };
}

export function createProject(name = '제목 없는 라벨'): Project {
  const now = new Date().toISOString();
  return {
    id: uid('prj'),
    name,
    createdAt: now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
    label: createLabel(),
    variables: [],
    printerProfile: createPrinterProfile(),
  };
}
