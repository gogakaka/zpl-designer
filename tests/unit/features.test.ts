import { describe, expect, it } from 'vitest';
import { formatDateTime, generateZpl } from '../../src/codegen';
import {
  createBarcode1d,
  createImage,
  createProject,
  createSymbol,
  createText,
} from '../../src/factory';
import { parseZpl } from '../../src/parser/zplParser';
import type { ExportOptions } from '../../src/types';

const OPTS: ExportOptions = {
  includeComments: false,
  encoding: true,
  resolveVariables: false,
  variableValues: {},
};

describe('graphic symbol (^GS)', () => {
  it('emits ^GS for a symbol element', () => {
    const p = createProject();
    p.label.elements.push(createSymbol(5, 5));
    expect(generateZpl(p, OPTS)).toContain('^GS');
  });

  it('parses ^GS back into a symbol element', () => {
    const result = parseZpl('^XA^FO20,20^GSN,40,40^FDC^FS^XZ', 203);
    expect(result.elements[0]?.type).toBe('symbol');
  });
});

describe('GS1-128', () => {
  it('uses Code 128 mode D when gs1 is enabled', () => {
    const p = createProject();
    const b = createBarcode1d();
    b.symbology = 'CODE128';
    b.gs1 = true;
    b.data = '(01)08801234567890';
    p.label.elements.push(b);
    expect(generateZpl(p, OPTS)).toContain(',D^FD');
  });
});

describe('dynamic fields', () => {
  it('emits ^SN for a counter text element', () => {
    const p = createProject();
    const t = createText();
    t.dynamic = { kind: 'counter', start: 100, step: 5, padZeros: true };
    p.label.elements.push(t);
    const zpl = generateZpl(p, OPTS);
    expect(zpl).toContain('^SN100,5,Y');
  });

  it('resolves a datetime field to the current date', () => {
    const p = createProject();
    const t = createText();
    t.dynamic = { kind: 'datetime', format: 'YYYY' };
    p.label.elements.push(t);
    expect(generateZpl(p, OPTS)).toContain(String(new Date().getFullYear()));
  });

  it('formatDateTime substitutes tokens', () => {
    const out = formatDateTime(new Date(2026, 4, 22, 9, 7, 3), 'YYYY-MM-DD HH:mm:ss');
    expect(out).toBe('2026-05-22 09:07:03');
  });
});

describe('image printer memory', () => {
  it('emits ~DG download and ^XG recall when useMemory is set', () => {
    const p = createProject();
    const img = createImage(5, 5);
    img.useMemory = true;
    img.mono = {
      widthDot: 8,
      heightDot: 2,
      rowBytes: 1,
      hex: 'FF00',
      previewDataUrl: '',
    };
    p.label.elements.push(img);
    const zpl = generateZpl(p, OPTS);
    expect(zpl).toContain('~DGR:IMG0.GRF');
    expect(zpl).toContain('^XGR:IMG0.GRF');
  });

  it('emits inline ^GFA when useMemory is off', () => {
    const p = createProject();
    const img = createImage(5, 5);
    img.useMemory = false;
    img.mono = { widthDot: 8, heightDot: 2, rowBytes: 1, hex: 'FF00', previewDataUrl: '' };
    p.label.elements.push(img);
    expect(generateZpl(p, OPTS)).toContain('^GFA,');
  });
});
