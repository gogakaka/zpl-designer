import Dexie, { type Table } from 'dexie';
import type { Project } from '../types';

export interface StoredProject {
  id: string;
  name: string;
  updatedAt: string;
  data: Project;
}

export interface MetaRow {
  key: string;
  value: string;
}

class ZplDesignerDb extends Dexie {
  projects!: Table<StoredProject, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super('zpl-designer');
    this.version(1).stores({
      projects: 'id, updatedAt',
      meta: 'key',
    });
  }
}

export const db = new ZplDesignerDb();
