import { useStore } from '../state/store';
import type { ElementType } from '../types';

const TOOLS: { type: ElementType; glyph: string; label: string }[] = [
  { type: 'text', glyph: 'T', label: '텍스트' },
  { type: 'barcode1d', glyph: '|||', label: '바코드' },
  { type: 'barcode2d', glyph: '▣', label: 'QR/2D' },
  { type: 'line', glyph: '─', label: '선' },
  { type: 'box', glyph: '▭', label: '박스' },
  { type: 'circle', glyph: '○', label: '원' },
  { type: 'ellipse', glyph: '⬭', label: '타원' },
  { type: 'diagonal', glyph: '╱', label: '대각선' },
  { type: 'image', glyph: '▦', label: '이미지' },
  { type: 'table', glyph: '田', label: '테이블' },
];

export function ToolPalette() {
  const activeTool = useStore((s) => s.ui.activeTool);
  const setUi = useStore((s) => s.setUi);
  const addElement = useStore((s) => s.addElement);

  return (
    <div className="tool-palette">
      <button
        className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`}
        onClick={() => setUi({ activeTool: 'select' })}
        title="선택 도구 (V)"
      >
        <span className="glyph">⬚</span>
        선택
      </button>
      <div style={{ height: 1, background: 'var(--border)', margin: '2px 4px' }} />
      {TOOLS.map((t) => (
        <button
          key={t.type}
          className="tool-btn"
          onClick={() => addElement(t.type)}
          title={`${t.label} 추가`}
        >
          <span className="glyph">{t.glyph}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
