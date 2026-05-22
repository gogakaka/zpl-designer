import { useStore } from '../state/store';
import type { Dpi, MediaType, Rotation } from '../types';
import { fromMm, toMm } from '../units';
import { NumberInput, Row, SegButtons, SelectInput, TextInput } from './controls';

export function LabelSettingsPanel() {
  const project = useStore((s) => s.project);
  const unit = useStore((s) => s.ui.unit);
  const updateLabel = useStore((s) => s.updateLabel);
  const updateProfile = useStore((s) => s.updateProfile);
  const setProjectName = useStore((s) => s.setProjectName);
  const reprocessImage = useStore((s) => s.reprocessImage);

  const label = project.label;
  const profile = project.printerProfile;
  const dpi = profile.dpi;

  const setDpi = (d: Dpi) => {
    updateProfile({ dpi: d });
    for (const el of project.label.elements) {
      if (el.type === 'image') void reprocessImage(el.id);
    }
  };

  return (
    <div>
      <div className="section">
        <div className="section-title">프로젝트</div>
        <Row label="이름">
          <TextInput value={project.name} onChange={setProjectName} />
        </Row>
      </div>

      <div className="section">
        <div className="section-title">라벨 크기</div>
        <Row label={`폭 (${unit})`}>
          <NumberInput
            value={fromMm(label.widthMm, unit, dpi)}
            min={0.1}
            onChange={(v) => updateLabel({ widthMm: toMm(v, unit, dpi) })}
          />
        </Row>
        <Row label={`높이 (${unit})`}>
          <NumberInput
            value={fromMm(label.heightMm, unit, dpi)}
            min={0.1}
            onChange={(v) => updateLabel({ heightMm: toMm(v, unit, dpi) })}
          />
        </Row>
        <div className="hint">
          {fromMm(label.widthMm, 'dot', dpi)} × {fromMm(label.heightMm, 'dot', dpi)} dot @ {dpi}dpi
        </div>
      </div>

      <div className="section">
        <div className="section-title">프린터 프로필</div>
        <Row label="해상도">
          <SelectInput
            value={String(dpi)}
            options={[
              { value: '203', label: '203 dpi (8 dpmm)' },
              { value: '300', label: '300 dpi (12 dpmm)' },
              { value: '600', label: '600 dpi (24 dpmm)' },
            ]}
            onChange={(v) => setDpi(Number(v) as Dpi)}
          />
        </Row>
        <Row label="최대 폭(mm)">
          <NumberInput
            value={profile.maxPrintWidthMm}
            min={10}
            onChange={(v) => updateProfile({ maxPrintWidthMm: v })}
          />
        </Row>
      </div>

      <div className="section">
        <div className="section-title">미디어 & 출력</div>
        <Row label="용지">
          <SegButtons<MediaType>
            value={label.mediaType}
            options={[
              { value: 'diecut', label: '다이컷' },
              { value: 'continuous', label: '연속' },
            ]}
            onChange={(v) => updateLabel({ mediaType: v })}
          />
        </Row>
        <Row label="라벨 회전">
          <SelectInput
            value={String(label.rotation)}
            options={[
              { value: '0', label: '0°' },
              { value: '90', label: '90°' },
              { value: '180', label: '180°' },
              { value: '270', label: '270°' },
            ]}
            onChange={(v) => updateLabel({ rotation: Number(v) as Rotation })}
          />
        </Row>
        <Row label="농도 ^MD">
          <NumberInput
            value={label.darkness}
            min={-30}
            max={30}
            onChange={(v) => updateLabel({ darkness: Math.round(v) })}
          />
        </Row>
        <Row label="속도 ^PR">
          <NumberInput
            value={label.printSpeed}
            min={1}
            max={14}
            onChange={(v) => updateLabel({ printSpeed: Math.round(v) })}
          />
        </Row>
        <Row label="수량 ^PQ">
          <NumberInput
            value={label.printQuantity}
            min={1}
            onChange={(v) => updateLabel({ printQuantity: Math.max(1, Math.round(v)) })}
          />
        </Row>
      </div>
    </div>
  );
}
