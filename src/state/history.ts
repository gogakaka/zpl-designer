export const HISTORY_LIMIT = 60;

/** Deep clone of plain project data for history snapshots. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}
