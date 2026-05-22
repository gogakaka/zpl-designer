import type { DitherMode, MonochromeData } from '../types';

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'));
    img.src = dataUrl;
  });
}

/**
 * Convert a source image into a 1-bit monochrome bitmap ready for ZPL ^GFA.
 * Width is rounded up to a multiple of 8 dots as ZPL requires.
 */
export async function processImage(
  sourceDataUrl: string,
  targetWidthDot: number,
  targetHeightDot: number,
  dither: DitherMode,
  threshold: number,
  invert: boolean,
): Promise<MonochromeData> {
  const img = await loadImage(sourceDataUrl);
  const widthDot = Math.max(8, Math.ceil(Math.max(1, targetWidthDot) / 8) * 8);
  const heightDot = Math.max(1, Math.round(targetHeightDot));
  const rowBytes = widthDot / 8;

  const canvas = document.createElement('canvas');
  canvas.width = widthDot;
  canvas.height = heightDot;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, widthDot, heightDot);
  ctx.drawImage(img, 0, 0, widthDot, heightDot);
  const px = ctx.getImageData(0, 0, widthDot, heightDot).data;

  const gray = new Float32Array(widthDot * heightDot);
  for (let i = 0; i < widthDot * heightDot; i++) {
    const r = px[i * 4];
    const g = px[i * 4 + 1];
    const b = px[i * 4 + 2];
    const a = px[i * 4 + 3];
    gray[i] = a < 128 ? 255 : 0.299 * r + 0.587 * g + 0.114 * b;
  }

  const black = new Uint8Array(widthDot * heightDot);
  if (dither === 'floyd-steinberg') {
    for (let y = 0; y < heightDot; y++) {
      for (let x = 0; x < widthDot; x++) {
        const i = y * widthDot + x;
        const oldVal = gray[i];
        const isBlack = oldVal < threshold;
        black[i] = isBlack ? 1 : 0;
        const err = oldVal - (isBlack ? 0 : 255);
        if (x + 1 < widthDot) gray[i + 1] += (err * 7) / 16;
        if (x - 1 >= 0 && y + 1 < heightDot) gray[i - 1 + widthDot] += (err * 3) / 16;
        if (y + 1 < heightDot) gray[i + widthDot] += (err * 5) / 16;
        if (x + 1 < widthDot && y + 1 < heightDot) gray[i + 1 + widthDot] += (err * 1) / 16;
      }
    }
  } else {
    for (let i = 0; i < gray.length; i++) black[i] = gray[i] < threshold ? 1 : 0;
  }
  if (invert) {
    for (let i = 0; i < black.length; i++) black[i] ^= 1;
  }

  let hex = '';
  for (let y = 0; y < heightDot; y++) {
    for (let bx = 0; bx < rowBytes; bx++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = bx * 8 + bit;
        if (x < widthDot && black[y * widthDot + x] === 1) byte |= 1 << (7 - bit);
      }
      hex += byte.toString(16).toUpperCase().padStart(2, '0');
    }
  }

  const preview = document.createElement('canvas');
  preview.width = widthDot;
  preview.height = heightDot;
  const pctx = preview.getContext('2d');
  if (!pctx) throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.');
  const pimg = pctx.createImageData(widthDot, heightDot);
  for (let i = 0; i < widthDot * heightDot; i++) {
    const v = black[i] === 1 ? 0 : 255;
    pimg.data[i * 4] = v;
    pimg.data[i * 4 + 1] = v;
    pimg.data[i * 4 + 2] = v;
    pimg.data[i * 4 + 3] = 255;
  }
  pctx.putImageData(pimg, 0, 0);

  return {
    widthDot,
    heightDot,
    rowBytes,
    hex,
    previewDataUrl: preview.toDataURL('image/png'),
  };
}
