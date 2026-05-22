import bwipjs from 'bwip-js/browser';
import type { Barcode1DElement, Barcode2DElement } from '../types';

const BCID_1D: Record<Barcode1DElement['symbology'], string> = {
  CODE128: 'code128',
  CODE39: 'code39',
  CODE93: 'code93',
  EAN13: 'ean13',
  EAN8: 'ean8',
  UPCA: 'upca',
  UPCE: 'upce',
  ITF: 'interleaved2of5',
  CODABAR: 'rationalizedCodabar',
  MSI: 'msi',
};

const BCID_2D: Record<Barcode2DElement['symbology'], string> = {
  QR: 'qrcode',
  DATAMATRIX: 'datamatrix',
  PDF417: 'pdf417',
  AZTEC: 'azteccode',
  MAXICODE: 'maxicode',
};

export interface BarcodeRenderResult {
  canvas: HTMLCanvasElement | null;
  error: string | null;
}

const cache = new Map<string, BarcodeRenderResult>();

function renderRaw(key: string, opts: Record<string, unknown>): BarcodeRenderResult {
  const cached = cache.get(key);
  if (cached) return cached;
  let result: BarcodeRenderResult;
  try {
    const canvas = document.createElement('canvas');
    bwipjs.toCanvas(canvas, opts as never);
    result = { canvas, error: null };
  } catch (e) {
    result = { canvas: null, error: e instanceof Error ? e.message : String(e) };
  }
  cache.set(key, result);
  return result;
}

export function render1d(el: Barcode1DElement): BarcodeRenderResult {
  const key = `1d|${el.symbology}|${el.data}|${el.showHrt}`;
  return renderRaw(key, {
    bcid: BCID_1D[el.symbology],
    text: el.data || '0',
    scale: 2,
    height: 14,
    includetext: el.showHrt,
  });
}

export function render2d(el: Barcode2DElement): BarcodeRenderResult {
  const key = `2d|${el.symbology}|${el.data}|${el.errorCorrection}`;
  const opts: Record<string, unknown> = {
    bcid: BCID_2D[el.symbology],
    text: el.data || '0',
    scale: 3,
  };
  if (el.symbology === 'QR') opts.eclevel = el.errorCorrection;
  return renderRaw(key, opts);
}
