import type { Barcode1DElement, Barcode2DElement } from '../types';

/** Returns a Korean error message, or null when the data is valid. */
export function validate1d(el: Barcode1DElement): string | null {
  const d = el.data;
  if (!d) return '바코드 데이터가 비어 있습니다.';
  const digits = /^\d+$/.test(d);

  switch (el.symbology) {
    case 'EAN13':
      if (!digits || (d.length !== 12 && d.length !== 13))
        return 'EAN-13은 숫자 12자리(체크디지트 제외) 또는 13자리여야 합니다.';
      break;
    case 'EAN8':
      if (!digits || (d.length !== 7 && d.length !== 8))
        return 'EAN-8은 숫자 7자리 또는 8자리여야 합니다.';
      break;
    case 'UPCA':
      if (!digits || (d.length !== 11 && d.length !== 12))
        return 'UPC-A는 숫자 11자리 또는 12자리여야 합니다.';
      break;
    case 'UPCE':
      if (!digits || d.length < 6 || d.length > 8)
        return 'UPC-E는 숫자 6~8자리여야 합니다.';
      break;
    case 'ITF':
      if (!digits) return 'Interleaved 2of5는 숫자만 입력할 수 있습니다.';
      if (d.length % 2 !== 0)
        return 'Interleaved 2of5는 짝수 자릿수가 필요합니다 (홀수면 0이 추가됩니다).';
      break;
    case 'MSI':
      if (!digits) return 'MSI 바코드는 숫자만 입력할 수 있습니다.';
      break;
    case 'CODE39':
      if (!/^[0-9A-Z\-. $/+%]*$/.test(d))
        return 'Code 39는 대문자/숫자/기호(- . $ / + %, 공백)만 지원합니다.';
      break;
    case 'CODABAR':
      if (!/^[A-D][0-9\-$:/.+]*[A-D]$/i.test(d))
        return 'Codabar는 시작/끝 문자(A~D)가 필요합니다. 예: A12345B';
      break;
    case 'CODE128':
    case 'CODE93':
      break;
  }
  return null;
}

export function validate2d(el: Barcode2DElement): string | null {
  if (!el.data) return '2D 코드 데이터가 비어 있습니다.';
  return null;
}
