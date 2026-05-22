import { useEffect } from 'react';
import { useStore } from '../state/store';

interface Props {
  x: number;
  y: number;
  onClose: () => void;
}

export function ContextMenu({ x, y, onClose }: Props) {
  const selectedIds = useStore((s) => s.selectedIds);
  const clipboardLen = useStore((s) => s.clipboard.length);
  const copySelected = useStore((s) => s.copySelected);
  const pasteClipboard = useStore((s) => s.pasteClipboard);
  const duplicateSelected = useStore((s) => s.duplicateSelected);
  const deleteSelected = useStore((s) => s.deleteSelected);
  const bringToFront = useStore((s) => s.bringToFront);
  const sendToBack = useStore((s) => s.sendToBack);
  const bringForward = useStore((s) => s.bringForward);
  const sendBackward = useStore((s) => s.sendBackward);
  const groupSelected = useStore((s) => s.groupSelected);
  const ungroupSelected = useStore((s) => s.ungroupSelected);

  const has = selectedIds.length > 0;
  const multi = selectedIds.length > 1;

  useEffect(() => {
    const close = () => onClose();
    window.addEventListener('mousedown', close);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('resize', close);
    };
  }, [onClose]);

  const run = (fn: () => void) => () => {
    fn();
    onClose();
  };

  return (
    <div
      className="context-menu"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button disabled={!has} onClick={run(copySelected)}>
        복사 <span>Ctrl+C</span>
      </button>
      <button disabled={clipboardLen === 0} onClick={run(pasteClipboard)}>
        붙여넣기 <span>Ctrl+V</span>
      </button>
      <button disabled={!has} onClick={run(duplicateSelected)}>
        복제 <span>Ctrl+D</span>
      </button>
      <div className="divider" />
      <button disabled={!has} onClick={run(bringToFront)}>
        맨 앞으로
      </button>
      <button disabled={!has} onClick={run(bringForward)}>
        앞으로
      </button>
      <button disabled={!has} onClick={run(sendBackward)}>
        뒤로
      </button>
      <button disabled={!has} onClick={run(sendToBack)}>
        맨 뒤로
      </button>
      <div className="divider" />
      <button disabled={!multi} onClick={run(groupSelected)}>
        그룹 <span>Ctrl+G</span>
      </button>
      <button disabled={!has} onClick={run(ungroupSelected)}>
        그룹 해제 <span>Ctrl+Shift+G</span>
      </button>
      <div className="divider" />
      <button disabled={!has} onClick={run(deleteSelected)}>
        삭제 <span>Del</span>
      </button>
    </div>
  );
}
