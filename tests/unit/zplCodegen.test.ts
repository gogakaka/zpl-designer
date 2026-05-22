import { describe, expect, it } from 'vitest';
import { generateTspl, generateZpl } from '../../src/codegen';
import {
  createBarcode1d,
  createBarcode2d,
  createBox,
  createProject,
  createText,
} from '../../src/factory';
import type { ExportOptions } from '../../src/types';

const OPTS: ExportOptions = {
  includeComments: false,
  encoding: true,
  resolveVariables: false,
  variableValues: {},
};

describe('ZPL code generation', () => {
  it('wraps output with ^XA and ^XZ', () => {
    const zpl = generateZpl(createProject(), OPTS);
    expect(zpl.startsWith('^XA')).toBe(true);
    expect(zpl.trimEnd().endsWith('^XZ')).toBe(true);
  });

  it('emits print width, length and UTF-8 encoding', () => {
    const zpl = generateZpl(createProject(), OPTS);
    expect(zpl).toContain('^PW');
    expect(zpl).toContain('^LL');
    expect(zpl).toContain('^CI28');
  });

  it('emits a text field', () => {
    const p = createProject();
    const t = createText(5, 5);
    t.content = 'HELLO';
    p.label.elements.push(t);
    const zpl = generateZpl(p, OPTS);
    expect(zpl).toContain('^A0N');
    expect(zpl).toContain('^FDHELLO^FS');
  });

  it('emits a Code 128 barcode', () => {
    const p = createProject();
    const b = createBarcode1d();
    b.symbology = 'CODE128';
    b.data = '12345678';
    p.label.elements.push(b);
    const zpl = generateZpl(p, OPTS);
    expect(zpl).toContain('^BC');
    expect(zpl).toContain('^BY');
    expect(zpl).toContain('^FD12345678^FS');
  });

  it('emits a QR code with error correction', () => {
    const p = createProject();
    const q = createBarcode2d();
    q.symbology = 'QR';
    q.data = 'https://x.io';
    q.errorCorrection = 'H';
    p.label.elements.push(q);
    const zpl = generateZpl(p, OPTS);
    expect(zpl).toContain('^BQ');
    expect(zpl).toContain('^FDHA,https://x.io^FS');
  });

  it('emits a graphic box', () => {
    const p = createProject();
    p.label.elements.push(createBox(2, 2));
    expect(generateZpl(p, OPTS)).toContain('^GB');
  });

  it('resolves variable placeholders when requested', () => {
    const p = createProject();
    const t = createText();
    t.content = '{{name}}';
    p.label.elements.push(t);
    const zpl = generateZpl(p, {
      ...OPTS,
      resolveVariables: true,
      variableValues: { name: '홍길동' },
    });
    expect(zpl).toContain('홍길동');
    expect(zpl).not.toContain('{{name}}');
  });

  it('escapes caret characters with ^FH', () => {
    const p = createProject();
    const t = createText();
    t.content = 'A^B';
    p.label.elements.push(t);
    expect(generateZpl(p, OPTS)).toContain('^FH_');
  });

  it('TSPL generator produces SIZE and PRINT commands', () => {
    const p = createProject();
    p.label.elements.push(createText());
    const tspl = generateTspl(p, OPTS);
    expect(tspl).toContain('SIZE');
    expect(tspl).toContain('CLS');
    expect(tspl).toContain('PRINT');
  });
});
