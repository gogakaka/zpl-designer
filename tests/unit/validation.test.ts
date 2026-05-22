import { describe, expect, it } from 'vitest';
import { validate1d } from '../../src/barcodes/validate';
import { createBarcode1d, createProject, createText } from '../../src/factory';
import { validateProject } from '../../src/validation';

describe('barcode validation', () => {
  it('rejects an EAN-13 with too few digits', () => {
    const b = createBarcode1d();
    b.symbology = 'EAN13';
    b.data = '123';
    expect(validate1d(b)).toBeTruthy();
  });

  it('accepts a valid EAN-13', () => {
    const b = createBarcode1d();
    b.symbology = 'EAN13';
    b.data = '123456789012';
    expect(validate1d(b)).toBeNull();
  });

  it('rejects non-digits for ITF', () => {
    const b = createBarcode1d();
    b.symbology = 'ITF';
    b.data = '12AB';
    expect(validate1d(b)).toBeTruthy();
  });

  it('accepts arbitrary data for Code 128', () => {
    const b = createBarcode1d();
    b.symbology = 'CODE128';
    b.data = 'ABC-123/xyz';
    expect(validate1d(b)).toBeNull();
  });
});

describe('project validation', () => {
  it('warns when an element is outside the printable area', () => {
    const p = createProject();
    const t = createText(500, 500);
    p.label.elements.push(t);
    const issues = validateProject(p);
    expect(issues.some((i) => i.message.includes('인쇄 영역'))).toBe(true);
  });

  it('produces no issues for a clean project', () => {
    const p = createProject();
    const t = createText(5, 5);
    p.label.elements.push(t);
    expect(validateProject(p)).toHaveLength(0);
  });
});
