import { validate1d, validate2d } from './barcodes/validate';
import type { Project } from './types';

export type IssueSeverity = 'error' | 'warning';

export interface Issue {
  elementId?: string;
  severity: IssueSeverity;
  message: string;
}

const OOB_TOLERANCE_MM = 0.5;

/** Run all design-time checks and return errors/warnings. */
export function validateProject(project: Project): Issue[] {
  const issues: Issue[] = [];
  const { label, printerProfile } = project;

  if (label.widthMm > printerProfile.maxPrintWidthMm + 0.1) {
    issues.push({
      severity: 'warning',
      message: `라벨 폭(${label.widthMm}mm)이 프린터 최대 인쇄 폭(${printerProfile.maxPrintWidthMm}mm)을 초과합니다.`,
    });
  }

  for (const el of label.elements) {
    if (
      el.xMm < -OOB_TOLERANCE_MM ||
      el.yMm < -OOB_TOLERANCE_MM ||
      el.xMm + el.widthMm > label.widthMm + OOB_TOLERANCE_MM ||
      el.yMm + el.heightMm > label.heightMm + OOB_TOLERANCE_MM
    ) {
      issues.push({
        elementId: el.id,
        severity: 'warning',
        message: `'${el.name}'이(가) 인쇄 영역을 벗어났습니다.`,
      });
    }

    if (el.type === 'barcode1d') {
      const err = validate1d(el);
      if (err) issues.push({ elementId: el.id, severity: 'error', message: `'${el.name}': ${err}` });
    }
    if (el.type === 'barcode2d') {
      const err = validate2d(el);
      if (err) issues.push({ elementId: el.id, severity: 'error', message: `'${el.name}': ${err}` });
    }
    if (el.type === 'image') {
      if (!el.sourceDataUrl) {
        issues.push({
          elementId: el.id,
          severity: 'warning',
          message: `'${el.name}': 이미지가 아직 업로드되지 않았습니다.`,
        });
      } else if (el.mono && el.mono.rowBytes * el.mono.heightDot > 60_000) {
        issues.push({
          elementId: el.id,
          severity: 'warning',
          message: `'${el.name}': 이미지 데이터가 큽니다. ZPL 용량과 전송 시간에 주의하세요.`,
        });
      }
    }
    if (el.type === 'box' && el.rounding > 0) {
      issues.push({
        elementId: el.id,
        severity: 'warning',
        message: `'${el.name}': 모서리 라운딩(^GB r)은 일부 프린터 펌웨어에서만 지원됩니다.`,
      });
    }
    if (el.type === 'text' && el.fontId !== '0' && el.rotation !== 0) {
      issues.push({
        elementId: el.id,
        severity: 'warning',
        message: `'${el.name}': 비트맵 폰트는 회전 시 픽셀이 거칠게 출력될 수 있습니다(스케일러블 폰트 0 권장).`,
      });
    }
  }
  return issues;
}
