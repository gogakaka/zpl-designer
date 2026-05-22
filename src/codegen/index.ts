import type { CodeGenerator } from './types';
import { zplGenerator } from './zpl';
import { tsplGenerator } from './tspl';

/** Registry of available printer-language code generators. */
export const generators: CodeGenerator[] = [zplGenerator, tsplGenerator];

export function getGenerator(id: string): CodeGenerator {
  return generators.find((g) => g.id === id) ?? zplGenerator;
}

export type { CodeGenerator } from './types';
export { resolveVariables } from './types';
export { zplGenerator, generateZpl } from './zpl';
export { tsplGenerator, generateTspl } from './tspl';
