/** Short, collision-resistant id for elements and projects. */
export function uid(prefix = 'el'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36).slice(-4);
  return `${prefix}_${rand}${time}`;
}
