import type { DesignElement, Variable } from './types';

export function sampleValues(vars: Variable[]): Record<string, string> {
  return Object.fromEntries(vars.map((v) => [v.name, v.sampleValue]));
}

export function applyValues(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{\s*([\w가-힣]+)\s*\}\}/g, (_m, name: string) =>
    values[name] !== undefined ? values[name] : `{{${name}}}`,
  );
}

/** Return a copy of the element with variable placeholders resolved. */
export function resolveElement(
  el: DesignElement,
  values: Record<string, string>,
): DesignElement {
  if (el.type === 'text') return { ...el, content: applyValues(el.content, values) };
  if (el.type === 'barcode1d' || el.type === 'barcode2d') {
    return { ...el, data: applyValues(el.data, values) };
  }
  if (el.type === 'table') {
    return { ...el, cells: el.cells.map((c) => ({ ...c, text: applyValues(c.text, values) })) };
  }
  return el;
}
