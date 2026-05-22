import { useEffect } from 'react';
import { useStore } from '../state/store';

function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      const s = useStore.getState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        s.undo();
        return;
      }
      if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault();
        s.redo();
        return;
      }
      if (mod && key === 'a') {
        e.preventDefault();
        s.selectAll();
        return;
      }
      if (mod && key === 'd') {
        e.preventDefault();
        s.duplicateSelected();
        return;
      }
      if (mod && key === 'c') {
        s.copySelected();
        return;
      }
      if (mod && key === 'v') {
        e.preventDefault();
        s.pasteClipboard();
        return;
      }
      if (mod && key === 'g') {
        e.preventDefault();
        if (e.shiftKey) s.ungroupSelected();
        else s.groupSelected();
        return;
      }
      if (key === 'delete' || key === 'backspace') {
        if (s.selectedIds.length) {
          e.preventDefault();
          s.deleteSelected();
        }
        return;
      }
      if (key === 'escape') {
        s.clearSelection();
        s.setUi({ activeTool: 'select' });
        return;
      }
      if (key === 'v') {
        s.setUi({ activeTool: 'select' });
        return;
      }

      const step = s.ui.snapToGrid ? s.ui.gridMm : 1;
      const d = e.shiftKey ? step * 5 : step;
      if (key === 'arrowleft' && s.selectedIds.length) {
        e.preventDefault();
        s.nudgeSelected(-d, 0);
      } else if (key === 'arrowright' && s.selectedIds.length) {
        e.preventDefault();
        s.nudgeSelected(d, 0);
      } else if (key === 'arrowup' && s.selectedIds.length) {
        e.preventDefault();
        s.nudgeSelected(0, -d);
      } else if (key === 'arrowdown' && s.selectedIds.length) {
        e.preventDefault();
        s.nudgeSelected(0, d);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
