import { create } from 'zustand';
import { createElement, createProject } from '../factory';
import { processImage } from '../image/process';
import { mmToDot } from '../units';
import type { Unit } from '../units';
import { templates } from '../templates';
import { uid } from '../ids';
import type {
  DesignElement,
  ElementType,
  ImageElement,
  LabelDoc,
  PrinterProfile,
  Project,
  Variable,
} from '../types';
import { HISTORY_LIMIT, clone } from './history';

export type Tool = ElementType | 'select';
export type AlignMode = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom';
export type DistributeAxis = 'horizontal' | 'vertical';

export interface UiState {
  unit: Unit;
  zoom: number;
  showGrid: boolean;
  gridMm: number;
  snapToGrid: boolean;
  snapToObjects: boolean;
  showRulers: boolean;
  theme: 'light' | 'dark';
  activeTool: Tool;
  generatorId: string;
  previewData: boolean;
}

interface ElementPatch {
  [key: string]: unknown;
}

export interface DesignerState {
  project: Project;
  selectedIds: string[];
  past: Project[];
  future: Project[];
  ui: UiState;
  fitNonce: number;
  csvRows: Record<string, string>[];
  clipboard: DesignElement[];

  // project lifecycle
  replaceProject: (p: Project) => void;
  newProject: () => void;
  loadTemplate: (id: string) => void;
  setProjectName: (name: string) => void;

  // label / printer
  updateLabel: (patch: Partial<LabelDoc>) => void;
  updateProfile: (patch: Partial<PrinterProfile>) => void;

  // elements
  addElement: (type: ElementType, xMm?: number, yMm?: number) => void;
  updateElement: (
    id: string,
    patch: ElementPatch,
    opts?: { history?: boolean; tag?: string },
  ) => void;
  updateElements: (ids: string[], patch: ElementPatch, history?: boolean) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  reprocessImage: (id: string) => Promise<void>;

  // selection
  setSelection: (ids: string[]) => void;
  selectElement: (id: string, additive?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // z-order
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  reorderElement: (id: string, toIndex: number) => void;

  // arrange
  alignSelected: (mode: AlignMode) => void;
  distributeSelected: (axis: DistributeAxis) => void;
  groupSelected: () => void;
  ungroupSelected: () => void;

  // element flags
  toggleLock: (id: string) => void;
  toggleVisible: (id: string) => void;
  nudgeSelected: (dxMm: number, dyMm: number) => void;
  moveBy: (ids: string[], dxMm: number, dyMm: number) => void;

  // variables
  addVariable: () => void;
  updateVariable: (index: number, patch: Partial<Variable>) => void;
  removeVariable: (index: number) => void;
  applyRecord: (values: Record<string, string>) => void;

  // history
  pushHistory: (tag?: string) => void;
  undo: () => void;
  redo: () => void;

  // ui
  setUi: (patch: Partial<UiState>) => void;
  requestFit: () => void;
  setCsvRows: (rows: Record<string, string>[]) => void;
}

let lastPushAt = 0;
let lastPushTag = '';

function defaultUi(): UiState {
  return {
    unit: 'mm',
    zoom: 2.2,
    showGrid: true,
    gridMm: 2,
    snapToGrid: true,
    snapToObjects: true,
    showRulers: true,
    theme: 'light',
    activeTool: 'select',
    generatorId: 'zpl',
    previewData: false,
  };
}

export const useStore = create<DesignerState>((set, get) => {
  /** Mutate the project immutably without recording history. */
  const update = (fn: (p: Project) => void) => {
    const next = clone(get().project);
    next.updatedAt = new Date().toISOString();
    fn(next);
    set({ project: next });
  };

  /** Record history, then mutate. */
  const commit = (fn: (p: Project) => void, tag?: string) => {
    get().pushHistory(tag);
    update(fn);
  };

  const findEl = (p: Project, id: string) => p.label.elements.find((e) => e.id === id);

  const expandGroups = (ids: string[]): string[] => {
    const els = get().project.label.elements;
    const result = new Set(ids);
    for (const id of ids) {
      const el = els.find((e) => e.id === id);
      if (el?.groupId) {
        for (const e of els) if (e.groupId === el.groupId) result.add(e.id);
      }
    }
    return [...result];
  };

  const selectedElements = (): DesignElement[] => {
    const { project, selectedIds } = get();
    return project.label.elements.filter((e) => selectedIds.includes(e.id));
  };

  return {
    project: createProject(),
    selectedIds: [],
    past: [],
    future: [],
    ui: defaultUi(),
    fitNonce: 0,
    csvRows: [],
    clipboard: [],

    replaceProject: (p) => set({ project: p, selectedIds: [], past: [], future: [] }),

    newProject: () => set({ project: createProject(), selectedIds: [], past: [], future: [] }),

    loadTemplate: (id) => {
      const tpl = templates.find((t) => t.id === id);
      if (tpl) set({ project: tpl.build(), selectedIds: [], past: [], future: [] });
    },

    setProjectName: (name) => commit((p) => { p.name = name; }, 'name'),

    updateLabel: (patch) => commit((p) => { Object.assign(p.label, patch); }, 'label'),

    updateProfile: (patch) => commit((p) => { Object.assign(p.printerProfile, patch); }, 'profile'),

    addElement: (type, xMm, yMm) => {
      const n = get().project.label.elements.length;
      const x = xMm ?? 5 + (n % 8) * 4;
      const y = yMm ?? 5 + (n % 8) * 4;
      const el = createElement(type, x, y);
      commit((p) => { p.label.elements.push(el); });
      set({ selectedIds: [el.id], ui: { ...get().ui, activeTool: 'select' } });
    },

    updateElement: (id, patch, opts) => {
      const history = opts?.history ?? true;
      const apply = (p: Project) => {
        const el = findEl(p, id);
        if (el) Object.assign(el, patch);
      };
      if (history) commit(apply, opts?.tag ?? `el:${id}`);
      else update(apply);
    },

    updateElements: (ids, patch, history = true) => {
      const apply = (p: Project) => {
        for (const el of p.label.elements) {
          if (ids.includes(el.id)) Object.assign(el, patch);
        }
      };
      if (history) commit(apply, 'els');
      else update(apply);
    },

    deleteSelected: () => {
      const ids = expandGroups(get().selectedIds);
      if (!ids.length) return;
      commit((p) => {
        p.label.elements = p.label.elements.filter(
          (e) => !ids.includes(e.id) || e.locked,
        );
      });
      set({ selectedIds: [] });
    },

    duplicateSelected: () => {
      const ids = expandGroups(get().selectedIds);
      if (!ids.length) return;
      const newIds: string[] = [];
      commit((p) => {
        const copies: DesignElement[] = [];
        const groupRemap = new Map<string, string>();
        for (const el of p.label.elements) {
          if (!ids.includes(el.id)) continue;
          const copy = clone(el);
          copy.id = uid();
          copy.name = `${el.name} 사본`;
          copy.xMm += 3;
          copy.yMm += 3;
          if (el.groupId) {
            if (!groupRemap.has(el.groupId)) groupRemap.set(el.groupId, uid('grp'));
            copy.groupId = groupRemap.get(el.groupId);
          }
          copies.push(copy);
          newIds.push(copy.id);
        }
        p.label.elements.push(...copies);
      });
      set({ selectedIds: newIds });
    },

    copySelected: () => {
      const ids = expandGroups(get().selectedIds);
      const els = get().project.label.elements.filter((e) => ids.includes(e.id));
      set({ clipboard: els.map((e) => clone(e)) });
    },

    pasteClipboard: () => {
      const clip = get().clipboard;
      if (!clip.length) return;
      const newIds: string[] = [];
      commit((p) => {
        const groupRemap = new Map<string, string>();
        for (const src of clip) {
          const copy = clone(src);
          copy.id = uid();
          copy.xMm += 4;
          copy.yMm += 4;
          if (src.groupId) {
            if (!groupRemap.has(src.groupId)) groupRemap.set(src.groupId, uid('grp'));
            copy.groupId = groupRemap.get(src.groupId);
          }
          p.label.elements.push(copy);
          newIds.push(copy.id);
        }
      });
      set({ selectedIds: newIds });
    },

    reprocessImage: async (id) => {
      const project = get().project;
      const el = project.label.elements.find((e) => e.id === id);
      if (!el || el.type !== 'image') return;
      const image = el as ImageElement;
      if (!image.sourceDataUrl) return;
      const dpi = project.printerProfile.dpi;
      try {
        const mono = await processImage(
          image.sourceDataUrl,
          mmToDot(image.widthMm, dpi),
          mmToDot(image.heightMm, dpi),
          image.dither,
          image.threshold,
          image.invert,
        );
        update((p) => {
          const target = findEl(p, id);
          if (target && target.type === 'image') target.mono = mono;
        });
      } catch {
        /* ignore — invalid image */
      }
    },

    setSelection: (ids) => set({ selectedIds: expandGroups(ids) }),

    selectElement: (id, additive) => {
      const current = get().selectedIds;
      if (additive) {
        const next = current.includes(id)
          ? current.filter((x) => x !== id)
          : [...current, id];
        set({ selectedIds: expandGroups(next) });
      } else {
        set({ selectedIds: expandGroups([id]) });
      }
    },

    selectAll: () =>
      set({ selectedIds: get().project.label.elements.map((e) => e.id) }),

    clearSelection: () => set({ selectedIds: [] }),

    bringForward: () =>
      commit((p) => {
        const ids = get().selectedIds;
        const els = p.label.elements;
        for (let i = els.length - 2; i >= 0; i--) {
          if (ids.includes(els[i].id) && !ids.includes(els[i + 1].id)) {
            [els[i], els[i + 1]] = [els[i + 1], els[i]];
          }
        }
      }),

    sendBackward: () =>
      commit((p) => {
        const ids = get().selectedIds;
        const els = p.label.elements;
        for (let i = 1; i < els.length; i++) {
          if (ids.includes(els[i].id) && !ids.includes(els[i - 1].id)) {
            [els[i], els[i - 1]] = [els[i - 1], els[i]];
          }
        }
      }),

    bringToFront: () =>
      commit((p) => {
        const ids = get().selectedIds;
        const moved = p.label.elements.filter((e) => ids.includes(e.id));
        const rest = p.label.elements.filter((e) => !ids.includes(e.id));
        p.label.elements = [...rest, ...moved];
      }),

    sendToBack: () =>
      commit((p) => {
        const ids = get().selectedIds;
        const moved = p.label.elements.filter((e) => ids.includes(e.id));
        const rest = p.label.elements.filter((e) => !ids.includes(e.id));
        p.label.elements = [...moved, ...rest];
      }),

    reorderElement: (id, toIndex) =>
      commit((p) => {
        const els = p.label.elements;
        const from = els.findIndex((e) => e.id === id);
        if (from < 0) return;
        const [item] = els.splice(from, 1);
        els.splice(Math.max(0, Math.min(els.length, toIndex)), 0, item);
      }),

    alignSelected: (mode) => {
      const sel = selectedElements();
      if (sel.length < 2) return;
      const minX = Math.min(...sel.map((e) => e.xMm));
      const maxX = Math.max(...sel.map((e) => e.xMm + e.widthMm));
      const minY = Math.min(...sel.map((e) => e.yMm));
      const maxY = Math.max(...sel.map((e) => e.yMm + e.heightMm));
      commit((p) => {
        for (const el of p.label.elements) {
          if (!get().selectedIds.includes(el.id) || el.locked) continue;
          switch (mode) {
            case 'left': el.xMm = minX; break;
            case 'right': el.xMm = maxX - el.widthMm; break;
            case 'hcenter': el.xMm = (minX + maxX) / 2 - el.widthMm / 2; break;
            case 'top': el.yMm = minY; break;
            case 'bottom': el.yMm = maxY - el.heightMm; break;
            case 'vcenter': el.yMm = (minY + maxY) / 2 - el.heightMm / 2; break;
          }
        }
      });
    },

    distributeSelected: (axis) => {
      const sel = [...selectedElements()];
      if (sel.length < 3) return;
      if (axis === 'horizontal') {
        sel.sort((a, b) => a.xMm - b.xMm);
        const first = sel[0];
        const last = sel[sel.length - 1];
        const span = last.xMm - first.xMm;
        const step = span / (sel.length - 1);
        commit((p) => {
          sel.forEach((s, i) => {
            const el = findEl(p, s.id);
            if (el && !el.locked) el.xMm = first.xMm + step * i;
          });
        });
      } else {
        sel.sort((a, b) => a.yMm - b.yMm);
        const first = sel[0];
        const last = sel[sel.length - 1];
        const span = last.yMm - first.yMm;
        const step = span / (sel.length - 1);
        commit((p) => {
          sel.forEach((s, i) => {
            const el = findEl(p, s.id);
            if (el && !el.locked) el.yMm = first.yMm + step * i;
          });
        });
      }
    },

    groupSelected: () => {
      const ids = get().selectedIds;
      if (ids.length < 2) return;
      const gid = uid('grp');
      commit((p) => {
        for (const el of p.label.elements) {
          if (ids.includes(el.id)) el.groupId = gid;
        }
      });
    },

    ungroupSelected: () =>
      commit((p) => {
        const ids = get().selectedIds;
        for (const el of p.label.elements) {
          if (ids.includes(el.id)) delete el.groupId;
        }
      }),

    toggleLock: (id) =>
      commit((p) => {
        const el = findEl(p, id);
        if (el) el.locked = !el.locked;
      }),

    toggleVisible: (id) =>
      commit((p) => {
        const el = findEl(p, id);
        if (el) el.visible = !el.visible;
      }),

    nudgeSelected: (dxMm, dyMm) => {
      const ids = expandGroups(get().selectedIds);
      if (!ids.length) return;
      commit((p) => {
        for (const el of p.label.elements) {
          if (ids.includes(el.id) && !el.locked) {
            el.xMm += dxMm;
            el.yMm += dyMm;
          }
        }
      }, 'nudge');
    },

    moveBy: (ids, dxMm, dyMm) =>
      update((p) => {
        for (const el of p.label.elements) {
          if (ids.includes(el.id) && !el.locked) {
            el.xMm += dxMm;
            el.yMm += dyMm;
          }
        }
      }),

    addVariable: () =>
      commit((p) => {
        p.variables.push({ name: `변수${p.variables.length + 1}`, sampleValue: '' });
      }),

    updateVariable: (index, patch) =>
      commit((p) => {
        if (p.variables[index]) Object.assign(p.variables[index], patch);
      }, `var:${index}`),

    removeVariable: (index) =>
      commit((p) => {
        p.variables.splice(index, 1);
      }),

    applyRecord: (values) =>
      commit((p) => {
        for (const v of p.variables) {
          if (values[v.name] !== undefined) v.sampleValue = values[v.name];
        }
      }),

    pushHistory: (tag = '') => {
      const now = Date.now();
      if (tag && tag === lastPushTag && now - lastPushAt < 700) {
        lastPushAt = now;
        return;
      }
      lastPushTag = tag;
      lastPushAt = now;
      set((s) => ({
        past: [...s.past, clone(s.project)].slice(-HISTORY_LIMIT),
        future: [],
      }));
    },

    undo: () => {
      const { past, project, future } = get();
      if (!past.length) return;
      lastPushTag = '';
      set({
        project: past[past.length - 1],
        past: past.slice(0, -1),
        future: [clone(project), ...future].slice(0, HISTORY_LIMIT),
        selectedIds: [],
      });
    },

    redo: () => {
      const { past, project, future } = get();
      if (!future.length) return;
      lastPushTag = '';
      set({
        project: future[0],
        past: [...past, clone(project)].slice(-HISTORY_LIMIT),
        future: future.slice(1),
        selectedIds: [],
      });
    },

    setUi: (patch) => set({ ui: { ...get().ui, ...patch } }),

    requestFit: () => set((s) => ({ fitNonce: s.fitNonce + 1 })),

    setCsvRows: (rows) => set({ csvRows: rows }),
  };
});
