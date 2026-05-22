import { describe, expect, it } from 'vitest';
import { dotToMm, fromMm, mmToDot, toMm } from '../../src/units';

describe('units', () => {
  it('converts mm to dots at 203 dpi', () => {
    expect(mmToDot(25.4, 203)).toBe(203);
    expect(mmToDot(101.6, 203)).toBe(812);
  });

  it('converts mm to dots at 300 and 600 dpi', () => {
    expect(mmToDot(25.4, 300)).toBe(300);
    expect(mmToDot(25.4, 600)).toBe(600);
  });

  it('round-trips dot <-> mm', () => {
    expect(Math.round(dotToMm(mmToDot(50, 300), 300))).toBe(50);
  });

  it('fromMm / toMm are inverse for inch', () => {
    const mm = 50;
    const inch = fromMm(mm, 'inch', 203);
    expect(toMm(inch, 'inch', 203)).toBeCloseTo(mm, 1);
  });

  it('fromMm dot uses dpi', () => {
    expect(fromMm(25.4, 'dot', 203)).toBe(203);
  });
});
