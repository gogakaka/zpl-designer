import { useStore } from '../state/store';
import type { ElementType } from '../types';

const GLYPH: Record<ElementType, string> = {
  text: 'T',
  barcode1d: '|||',
  barcode2d: '▣',
  line: '─',
  box: '▭',
  circle: '○',
  ellipse: '⬭',
  diagonal: '╱',
  image: '▦',
  table: '田',
  symbol: '®',
};

export function LayersPanel() {
  const elements = useStore((s) => s.project.label.elements);
  const selectedIds = useStore((s) => s.selectedIds);
  const selectElement = useStore((s) => s.selectElement);
  const toggleVisible = useStore((s) => s.toggleVisible);
  const toggleLock = useStore((s) => s.toggleLock);
  const reorderElement = useStore((s) => s.reorderElement);

  if (elements.length === 0) {
    return <div className="empty-hint">요소가 없습니다.
좌측 도구 팔레트에서 추가하세요.</div>;
  }

  const ordered = [...elements].reverse();

  return (
    <div>
      <div className="hint" style={{ marginBottom: 6 }}>
        위에 있을수록 앞쪽(나중에 그려짐) 레이어입니다.
      </div>
      {ordered.map((el, i) => {
        const realIndex = elements.length - 1 - i;
        const sel = selectedIds.includes(el.id);
        return (
          <div
            key={el.id}
            className={`layer-item ${sel ? 'selected' : ''}`}
            onClick={(e) => selectElement(el.id, e.shiftKey)}
          >
            <button
              className="mini"
              title="표시/숨김"
              onClick={(e) => {
                e.stopPropagation();
                toggleVisible(el.id);
              }}
            >
              {el.visible ? '◉' : '○'}
            </button>
            <button
              className="mini"
              title="잠금"
              onClick={(e) => {
                e.stopPropagation();
                toggleLock(el.id);
              }}
            >
              {el.locked ? '■' : '□'}
            </button>
            <span className="chip">{GLYPH[el.type]}</span>
            <span className="name" style={{ opacity: el.visible ? 1 : 0.5 }}>
              {el.name}
            </span>
            <button
              className="mini"
              disabled={realIndex === elements.length - 1}
              title="앞으로"
              onClick={(e) => {
                e.stopPropagation();
                reorderElement(el.id, realIndex + 1);
              }}
            >
              ▲
            </button>
            <button
              className="mini"
              disabled={realIndex === 0}
              title="뒤로"
              onClick={(e) => {
                e.stopPropagation();
                reorderElement(el.id, realIndex - 1);
              }}
            >
              ▼
            </button>
          </div>
        );
      })}
    </div>
  );
}
