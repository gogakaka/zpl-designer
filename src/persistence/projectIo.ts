import { db } from './db';
import { SCHEMA_VERSION } from '../types';
import type { Project } from '../types';

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
}

export async function saveProject(p: Project): Promise<void> {
  await db.projects.put({ id: p.id, name: p.name, updatedAt: p.updatedAt, data: p });
  await db.meta.put({ key: 'currentProjectId', value: p.id });
}

export async function loadProject(id: string): Promise<Project | null> {
  const rec = await db.projects.get(id);
  return rec?.data ?? null;
}

export async function loadLastProject(): Promise<Project | null> {
  const meta = await db.meta.get('currentProjectId');
  if (!meta) return null;
  return loadProject(meta.value);
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const all = await db.projects.orderBy('updatedAt').reverse().toArray();
  return all.map((r) => ({ id: r.id, name: r.name, updatedAt: r.updatedAt }));
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id);
}

export function exportProjectJson(p: Project): void {
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `${sanitize(p.name)}.zpldesign.json`);
}

export async function importProjectJson(file: File): Promise<Project> {
  const text = await file.text();
  const data = JSON.parse(text) as Project;
  if (!data || !data.label || !Array.isArray(data.label.elements)) {
    throw new Error('올바른 ZPL Designer 프로젝트 파일이 아닙니다.');
  }
  data.schemaVersion = data.schemaVersion ?? SCHEMA_VERSION;
  return data;
}

function sanitize(name: string): string {
  return (name || 'label').replace(/[^\w가-힣\-]+/g, '_');
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
