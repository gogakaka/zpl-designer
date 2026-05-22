// Domain model. All geometry is stored in millimetres and DPI-independent.

export type Dpi = 203 | 300 | 600;
export type Rotation = 0 | 90 | 180 | 270;

export type ElementType =
  | 'text'
  | 'barcode1d'
  | 'barcode2d'
  | 'line'
  | 'box'
  | 'circle'
  | 'ellipse'
  | 'diagonal'
  | 'image'
  | 'table';

export interface PrinterProfile {
  name: string;
  /** Output language id. 'zpl' for v1; pluggable for future languages. */
  language: string;
  dpi: Dpi;
  maxPrintWidthMm: number;
  safeFonts: string[];
}

export interface BaseElement {
  id: string;
  type: ElementType;
  name: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  rotation: Rotation;
  locked: boolean;
  visible: boolean;
  groupId?: string;
}

export type ZplFontId = '0' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
export type TextAlign = 'L' | 'C' | 'R';

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontId: ZplFontId;
  fontHeightDot: number;
  fontWidthDot: number;
  align: TextAlign;
  multiline: boolean;
  maxLines: number;
  lineGapDot: number;
  reverse: boolean;
}

export type Barcode1DSymbology =
  | 'CODE128'
  | 'CODE39'
  | 'CODE93'
  | 'EAN13'
  | 'EAN8'
  | 'UPCA'
  | 'UPCE'
  | 'ITF'
  | 'CODABAR'
  | 'MSI';

export interface Barcode1DElement extends BaseElement {
  type: 'barcode1d';
  symbology: Barcode1DSymbology;
  data: string;
  moduleWidthDot: number;
  ratio: number;
  barHeightDot: number;
  showHrt: boolean;
  hrtAbove: boolean;
  checkDigit: boolean;
}

export type Barcode2DSymbology = 'QR' | 'DATAMATRIX' | 'PDF417' | 'AZTEC' | 'MAXICODE';
export type QrEcLevel = 'L' | 'M' | 'Q' | 'H';

export interface Barcode2DElement extends BaseElement {
  type: 'barcode2d';
  symbology: Barcode2DSymbology;
  data: string;
  magnification: number;
  errorCorrection: QrEcLevel;
}

export type ShapeColor = 'B' | 'W';

export interface LineElement extends BaseElement {
  type: 'line';
  orientation: 'horizontal' | 'vertical';
  color: ShapeColor;
}

export interface BoxElement extends BaseElement {
  type: 'box';
  borderThicknessDot: number;
  color: ShapeColor;
  filled: boolean;
  /** ZPL ^GB rounding index, 0-8. */
  rounding: number;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  borderThicknessDot: number;
  color: ShapeColor;
  filled: boolean;
}

export interface EllipseElement extends BaseElement {
  type: 'ellipse';
  borderThicknessDot: number;
  color: ShapeColor;
  filled: boolean;
}

export interface DiagonalElement extends BaseElement {
  type: 'diagonal';
  thicknessDot: number;
  color: ShapeColor;
  lean: 'right' | 'left';
}

export type DitherMode = 'floyd-steinberg' | 'threshold';

export interface MonochromeData {
  widthDot: number;
  heightDot: number;
  rowBytes: number;
  /** ASCII-hex payload for ZPL ^GFA. */
  hex: string;
  /** Black/white PNG data URL for canvas preview. */
  previewDataUrl: string;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  sourceDataUrl: string;
  dither: DitherMode;
  threshold: number;
  invert: boolean;
  mono?: MonochromeData;
}

export interface TableCell {
  row: number;
  col: number;
  text: string;
  align: TextAlign;
}

export interface TableElement extends BaseElement {
  type: 'table';
  rows: number;
  cols: number;
  rowHeightsMm: number[];
  colWidthsMm: number[];
  borderThicknessDot: number;
  showInnerBorders: boolean;
  fontHeightDot: number;
  cells: TableCell[];
}

export type DesignElement =
  | TextElement
  | Barcode1DElement
  | Barcode2DElement
  | LineElement
  | BoxElement
  | CircleElement
  | EllipseElement
  | DiagonalElement
  | ImageElement
  | TableElement;

export type MediaType = 'continuous' | 'diecut';

export interface LabelDoc {
  widthMm: number;
  heightMm: number;
  /** Whole-label rotation, ^PO. */
  rotation: Rotation;
  mediaType: MediaType;
  darkness: number;
  printSpeed: number;
  printQuantity: number;
  elements: DesignElement[];
}

export interface Variable {
  name: string;
  sampleValue: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
  label: LabelDoc;
  variables: Variable[];
  printerProfile: PrinterProfile;
}

export interface ExportOptions {
  includeComments: boolean;
  encoding: boolean;
  resolveVariables: boolean;
  variableValues: Record<string, string>;
}

export const SCHEMA_VERSION = 1;
