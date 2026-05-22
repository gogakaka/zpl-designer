import { describe, expect, it } from 'vitest';
import { generateZpl } from '../../src/codegen';
import { createProject, createText } from '../../src/factory';
import { parseZpl } from '../../src/parser/zplParser';
import type { ExportOptions } from '../../src/types';

const OPTS: ExportOptions = {
  includeComments: false,
  encoding: true,
  resolveVariables: false,
  variableValues: {},
};

describe('ZPL parser', () => {
  it('parses a text field', () => {
    const result = parseZpl('^XA^PW812^LL1218^FO50,60^A0N,40,40^FDHello^FS^XZ', 203);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe('text');
  });

  it('parses label width and height', () => {
    const result = parseZpl('^XA^PW812^LL1218^FO0,0^A0N,20,20^FDx^FS^XZ', 203);
    expect(Math.round(result.widthMm ?? 0)).toBe(102);
    expect(Math.round(result.heightMm ?? 0)).toBe(152);
  });

  it('parses a graphic box', () => {
    const result = parseZpl('^XA^FO10,10^GB200,120,3,B,0^FS^XZ', 203);
    expect(result.elements[0].type).toBe('box');
  });

  it('round-trips text content through generate + parse', () => {
    const p = createProject();
    const t = createText(10, 10);
    t.content = 'RoundTrip';
    p.label.elements.push(t);
    const zpl = generateZpl(p, OPTS);
    const parsed = parseZpl(zpl, 203);
    const text = parsed.elements.find((e) => e.type === 'text');
    expect(text?.type).toBe('text');
    if (text?.type === 'text') expect(text.content).toBe('RoundTrip');
  });

  it('reports a warning for unrecognised input', () => {
    const result = parseZpl('not zpl at all', 203);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
