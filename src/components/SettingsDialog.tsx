import { useStore } from '../state/store';
import type { Unit } from '../units';
import { CheckRow, NumberInput, Row, SegButtons } from './controls';
import { Modal } from './Modal';

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const ui = useStore((s) => s.ui);
  const setUi = useStore((s) => s.setUi);

  return (
    <Modal title="설정" onClose={onClose} width={460}>
      <div className="section">
        <div className="section-title">테마</div>
        <SegButtons
          value={ui.theme}
          options={[
            { value: 'light', label: '라이트' },
            { value: 'dark', label: '다크' },
          ]}
          onChange={(v) => setUi({ theme: v })}
        />
      </div>

      <div className="section">
        <div className="section-title">기본 단위</div>
        <SegButtons<Unit>
          value={ui.unit}
          options={[
            { value: 'mm', label: 'mm' },
            { value: 'inch', label: 'inch' },
            { value: 'dot', label: 'dot' },
          ]}
          onChange={(v) => setUi({ unit: v })}
        />
      </div>

      <div className="section">
        <div className="section-title">그리드 & 스냅</div>
        <CheckRow label="그리드 표시" value={ui.showGrid} onChange={(v) => setUi({ showGrid: v })} />
        <CheckRow label="눈금자 표시" value={ui.showRulers} onChange={(v) => setUi({ showRulers: v })} />
        <CheckRow
          label="그리드에 스냅"
          value={ui.snapToGrid}
          onChange={(v) => setUi({ snapToGrid: v })}
        />
        <Row label="그리드 간격(mm)">
          <NumberInput
            value={ui.gridMm}
            min={0.5}
            step={0.5}
            onChange={(v) => setUi({ gridMm: v })}
          />
        </Row>
      </div>

      <div className="hint">
        모든 데이터는 브라우저(IndexedDB)에만 저장되며 외부로 전송되지 않습니다.
      </div>
    </Modal>
  );
}
