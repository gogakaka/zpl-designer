import type { ExportOptions, Project } from '../types';

/**
 * A printer-language code generator. The design model is decoupled from code
 * generation so additional languages (TSPL, DPL, ...) can be added without
 * touching the canvas or data model.
 */
export interface CodeGenerator {
  id: string;
  name: string;
  fileExtension: string;
  generate(project: Project, options: ExportOptions): string;
}

export function resolveVariables(text: string, options: ExportOptions): string {
  if (!options.resolveVariables) return text;
  return text.replace(/\{\{\s*([\w가-힣]+)\s*\}\}/g, (_match, name: string) => {
    const value = options.variableValues[name];
    return value !== undefined ? value : `{{${name}}}`;
  });
}
