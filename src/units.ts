import type { Dpi } from './types';

export const MM_PER_INCH = 25.4;

export type Unit = 'mm' | 'inch' | 'dot';

export function mmToDot(mm: number, dpi: Dpi): number {
  return Math.round((mm * dpi) / MM_PER_INCH);
}

export function dotToMm(dot: number, dpi: Dpi): number {
  return (dot * MM_PER_INCH) / dpi;
}

export function mmToInch(mm: number): number {
  return mm / MM_PER_INCH;
}

export function inchToMm(inch: number): number {
  return inch * MM_PER_INCH;
}

export function dpmm(dpi: Dpi): number {
  return dpi / MM_PER_INCH;
}

/** Convert a millimetre value into the chosen display unit. */
export function fromMm(mm: number, unit: Unit, dpi: Dpi): number {
  switch (unit) {
    case 'mm':
      return round(mm, 2);
    case 'inch':
      return round(mmToInch(mm), 3);
    case 'dot':
      return mmToDot(mm, dpi);
  }
}

/** Convert a display-unit value back into millimetres. */
export function toMm(value: number, unit: Unit, dpi: Dpi): number {
  switch (unit) {
    case 'mm':
      return value;
    case 'inch':
      return inchToMm(value);
    case 'dot':
      return dotToMm(value, dpi);
  }
}

export function unitLabel(unit: Unit): string {
  return unit === 'inch' ? 'in' : unit;
}

export function round(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
