import { useEffect } from 'react';
import { validate1d, validate2d } from '../barcodes/validate';
import { useStore } from '../state/store';
import type {
  Barcode1DElement,
  Barcode1DSymbology,
  Barcode2DElement,
  Barcode2DSymbology,
  BoxElement,
  CircleElement,
  DesignElement,
  DiagonalElement,
  EllipseElement,
  ImageElement,
  LineElement,
  Rotation,
  ShapeColor,
  TableElement,
  TextAlign,
  TextElement,
  ZplFontId,
} from '../types';
import { fromMm, toMm } from '../units';
import {
  CheckRow,
  NumberInput,
  Row,
  SegButtons,
  SelectInput,
  TextInput,
} from './controls';
import { LabelSettingsPanel } from './LabelSettingsPanel';

const SYM_1D: { value: Barcode1DSymbology; label: string }[] = [
  { value: 'CODE128', label: 'Code 128' },
  { value: 'CODE39', label: 'Code 39' },
  { value: 'CODE93', label: 'Code 93' },
  { value: 'EAN13', label: 'EAN-13' },
  { value: 'EAN8', label: 'EAN-8' },
  { value: 'UPCA', label: 'UPC-A' },
  { value: 'UPCE', label: 'UPC-E' },
  { value: 'ITF', label: 'Interleaved 2of5' },
  { value: 'CODABAR', label: 'Codabar' },
  { value: 'MSI', label: 'MSI' },
];

const SYM_2D: { value: Barcode2DSymbology; label: string }[] = [
  { value: 'QR', label: 'QR Code' },
  { value: 'DATAMATRIX', label: 'Data Matrix' },
  { value: 'PDF417', label: 'PDF417' },
  { value: 'AZTEC', label: 'Aztec' },
  { value: 'MAXICODE', label: 'MaxiCode' },
];

const FONTS: { value: ZplFontId; label: string }[] = [
  { value: '0', label: '0 — 스케일러블' },
  { value: 'A', label: 'A — 비트맵' },
  { value: 'B', label: 'B — 비트맵' },
  { value: 'C', label: 'C — 비트맵' },
  { value: 'D', label: 'D — 비트맵' },
  { value: 'E', label: 'E — 비트맵' },
  { value: 'F', label: 'F — 비트맵' },
  { value: 'G', label: 'G — 비트맵' },
  { value: 'H', label: 'H — 비트맵' },
];

const COLOR_OPTS: { value: ShapeColor; label: string }[] = [
  { value: 'B', label: '검정' },
  { value: 'W', label: '흰색' },
];

const ALIGN_OPTS: { value: TextAlign; label: string }[] = [
  { value: 'L', label: '왼쪽' },
  { value: 'C', label: '가운데' },
  { value: 'R', label: '오른쪽' },
];

export function PropertyPanel() {
  const project = useStore((s) => s.project);
  const selectedIds = useStore((s) => s.selectedIds);
  const elements = project.label.elements;
  const selected = elements.filter((e) => selectedIds.includes(e.id));

  if (selected.length === 0) return <LabelSettingsPanel />;
  if (selected.length > 1) return <MultiPanel count={selected.length} />;
  return <SinglePanel element={selected[0]} />;
}

function MultiPanel({ count }: { count: number }) {
  const alignSelected = useStore((s) => s.alignSelected);
  const distributeSelected = useStore((s) => s.distributeSelected);
  const groupSelected = useStore((s) => s.groupSelected);
  const ungroupSelected = useStore((s) => s.ungroupSelected);
  const bringToFront = useStore((s) => s.bringToFront);
  const sendToBack = useStore((s) => s.sendToBack);
  const deleteSelected = useStore((s) => s.deleteSelected);

  return (
    <div>
      <div className="section">
        <div className="section-title">{count}개 선택됨</div>
      </div>
      <div className="section">
        <div className="section-title">정렬</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={() => alignSelected('left')}>좌</button>
          <button onClick={() => alignSelected('hcenter')}>수평중앙</button>
          <button onClick={() => alignSelected('right')}>우</button>
          <button onClick={() => alignSelected('top')}>상</button>
          <button onClick={() => alignSelected('vcenter')}>수직중앙</button>
          <button onClick={() => alignSelected('bottom')}>하</button>
        </div>
      </div>
      <div className="section">
        <div className="section-title">분배 (3개 이상)</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => distributeSelected('horizontal')}>가로 균등</button>
          <button onClick={() => distributeSelected('vertical')}>세로 균등</button>
        </div>
      </div>
      <div className="section">
        <div className="section-title">그룹 / 순서</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={groupSelected}>그룹</button>
          <button onClick={ungroupSelected}>해제</button>
          <button onClick={bringToFront}>맨 앞</button>
          <button onClick={sendToBack}>맨 뒤</button>
        </div>
      </div>
      <button className="danger" onClick={deleteSelected}>
        선택 삭제
      </button>
    </div>
  );
}

function SinglePanel({ element }: { element: DesignElement }) {
  const unit = useStore((s) => s.ui.unit);
  const dpi = useStore((s) => s.project.printerProfile.dpi);
  const updateElement = useStore((s) => s.updateElement);
  const toggleLock = useStore((s) => s.toggleLock);
  const toggleVisible = useStore((s) => s.toggleVisible);
  const deleteSelected = useStore((s) => s.deleteSelected);
  const bringForward = useStore((s) => s.bringForward);
  const sendBackward = useStore((s) => s.sendBackward);
  const reprocessImage = useStore((s) => s.reprocessImage);

  const el = element;
  const upd = (patch: Record<string, unknown>) => updateElement(el.id, patch);

  useEffect(() => {
    if (el.type !== 'image' || !el.sourceDataUrl) return;
    const t = setTimeout(() => void reprocessImage(el.id), 160);
    return () => clearTimeout(t);
  }, [
    el.id,
    el.type,
    el.type === 'image' ? el.sourceDataUrl : '',
    el.type === 'image' ? el.dither : '',
    el.type === 'image' ? el.threshold : 0,
    el.type === 'image' ? el.invert : false,
    el.widthMm,
    el.heightMm,
    dpi,
    reprocessImage,
  ]);

  return (
    <div>
      <div className="section">
        <div className="section-title">{typeLabel(el.type)}</div>
        <Row label="이름">
          <TextInput value={el.name} onChange={(v) => upd({ name: v })} />
        </Row>
      </div>

      <div className="section">
        <div className="section-title">위치 & 크기 ({unit})</div>
        <div className="row-2">
          <LabeledNum label="X" value={fromMm(el.xMm, unit, dpi)} onChange={(v) => upd({ xMm: toMm(v, unit, dpi) })} />
          <LabeledNum label="Y" value={fromMm(el.yMm, unit, dpi)} onChange={(v) => upd({ yMm: toMm(v, unit, dpi) })} />
        </div>
        <div className="row-2">
          <LabeledNum label="폭" value={fromMm(el.widthMm, unit, dpi)} onChange={(v) => upd({ widthMm: Math.max(0.1, toMm(v, unit, dpi)) })} />
          <LabeledNum label="높이" value={fromMm(el.heightMm, unit, dpi)} onChange={(v) => upd({ heightMm: Math.max(0.1, toMm(v, unit, dpi)) })} />
        </div>
        <Row label="회전">
          <SelectInput
            value={String(el.rotation)}
            options={[
              { value: '0', label: '0°' },
              { value: '90', label: '90°' },
              { value: '180', label: '180°' },
              { value: '270', label: '270°' },
            ]}
            onChange={(v) => upd({ rotation: Number(v) as Rotation })}
          />
        </Row>
      </div>

      {el.type === 'text' && <TextProps el={el} upd={upd} />}
      {el.type === 'barcode1d' && <Barcode1DProps el={el} upd={upd} />}
      {el.type === 'barcode2d' && <Barcode2DProps el={el} upd={upd} />}
      {el.type === 'line' && <LineProps el={el} upd={upd} />}
      {el.type === 'box' && <BoxProps el={el} upd={upd} />}
      {el.type === 'circle' && <ShapeProps el={el} upd={upd} />}
      {el.type === 'ellipse' && <ShapeProps el={el} upd={upd} />}
      {el.type === 'diagonal' && <DiagonalProps el={el} upd={upd} />}
      {el.type === 'image' && <ImageProps el={el} upd={upd} />}
      {el.type === 'table' && <TableProps el={el} upd={upd} />}

      <div className="section">
        <div className="section-title">정렬 순서 & 상태</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
          <button onClick={bringForward}>앞으로</button>
          <button onClick={sendBackward}>뒤로</button>
          <button onClick={() => toggleLock(el.id)}>{el.locked ? '잠금 해제' : '잠금'}</button>
          <button onClick={() => toggleVisible(el.id)}>{el.visible ? '숨기기' : '표시'}</button>
        </div>
        <button className="danger" onClick={deleteSelected}>
          삭제
        </button>
      </div>
    </div>
  );
}

function LabeledNum({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <NumberInput value={value} onChange={onChange} />
    </div>
  );
}

type Upd = (patch: Record<string, unknown>) => void;

function TextProps({ el, upd }: { el: TextElement; upd: Upd }) {
  return (
    <div className="section">
      <div className="section-title">텍스트</div>
      <textarea rows={3} value={el.content} onChange={(e) => upd({ content: e.target.value })} />
      <div style={{ height: 6 }} />
      <Row label="폰트">
        <SelectInput value={el.fontId} options={FONTS} onChange={(v) => upd({ fontId: v })} />
      </Row>
      <div className="row-2">
        <LabeledNum label="높이(dot)" value={el.fontHeightDot} onChange={(v) => upd({ fontHeightDot: Math.round(v) })} />
        <LabeledNum label="폭(dot)" value={el.fontWidthDot} onChange={(v) => upd({ fontWidthDot: Math.round(v) })} />
      </div>
      <Row label="정렬">
        <SegButtons value={el.align} options={ALIGN_OPTS} onChange={(v) => upd({ align: v })} />
      </Row>
      <CheckRow label="여러 줄 (^FB)" value={el.multiline} onChange={(v) => upd({ multiline: v })} />
      {el.multiline && (
        <div className="row-2">
          <LabeledNum label="최대 줄" value={el.maxLines} onChange={(v) => upd({ maxLines: Math.max(1, Math.round(v)) })} />
          <LabeledNum label="줄간격(dot)" value={el.lineGapDot} onChange={(v) => upd({ lineGapDot: Math.round(v) })} />
        </div>
      )}
      <CheckRow label="반전 출력 (^FR)" value={el.reverse} onChange={(v) => upd({ reverse: v })} />
    </div>
  );
}

function Barcode1DProps({ el, upd }: { el: Barcode1DElement; upd: Upd }) {
  const err = validate1d(el);
  return (
    <div className="section">
      <div className="section-title">1D 바코드</div>
      <Row label="심볼">
        <SelectInput value={el.symbology} options={SYM_1D} onChange={(v) => upd({ symbology: v })} />
      </Row>
      <Row label="데이터">
        <TextInput value={el.data} onChange={(v) => upd({ data: v })} />
      </Row>
      <div className="row-2">
        <LabeledNum label="모듈폭" value={el.moduleWidthDot} onChange={(v) => upd({ moduleWidthDot: Math.max(1, Math.round(v)) })} />
        <LabeledNum label="비율" value={el.ratio} onChange={(v) => upd({ ratio: v })} />
      </div>
      <LabeledNum label="바 높이(dot)" value={el.barHeightDot} onChange={(v) => upd({ barHeightDot: Math.round(v) })} />
      <CheckRow label="HRT 표시" value={el.showHrt} onChange={(v) => upd({ showHrt: v })} />
      <CheckRow label="HRT 위쪽" value={el.hrtAbove} onChange={(v) => upd({ hrtAbove: v })} />
      <CheckRow label="체크디지트" value={el.checkDigit} onChange={(v) => upd({ checkDigit: v })} />
      {err && <div className="issue error">{err}</div>}
    </div>
  );
}

function Barcode2DProps({ el, upd }: { el: Barcode2DElement; upd: Upd }) {
  const err = validate2d(el);
  return (
    <div className="section">
      <div className="section-title">2D 코드</div>
      <Row label="심볼">
        <SelectInput value={el.symbology} options={SYM_2D} onChange={(v) => upd({ symbology: v })} />
      </Row>
      <textarea rows={3} value={el.data} onChange={(e) => upd({ data: e.target.value })} />
      <div style={{ height: 6 }} />
      <LabeledNum label="배율" value={el.magnification} onChange={(v) => upd({ magnification: Math.max(1, Math.round(v)) })} />
      {el.symbology === 'QR' && (
        <Row label="오류정정">
          <SelectInput
            value={el.errorCorrection}
            options={[
              { value: 'L', label: 'L (7%)' },
              { value: 'M', label: 'M (15%)' },
              { value: 'Q', label: 'Q (25%)' },
              { value: 'H', label: 'H (30%)' },
            ]}
            onChange={(v) => upd({ errorCorrection: v })}
          />
        </Row>
      )}
      {err && <div className="issue error">{err}</div>}
    </div>
  );
}

function LineProps({ el, upd }: { el: LineElement; upd: Upd }) {
  return (
    <div className="section">
      <div className="section-title">선</div>
      <Row label="방향">
        <SegButtons
          value={el.orientation}
          options={[
            { value: 'horizontal', label: '수평' },
            { value: 'vertical', label: '수직' },
          ]}
          onChange={(v) => upd({ orientation: v })}
        />
      </Row>
      <Row label="색상">
        <SegButtons value={el.color} options={COLOR_OPTS} onChange={(v) => upd({ color: v })} />
      </Row>
    </div>
  );
}

function BoxProps({ el, upd }: { el: BoxElement; upd: Upd }) {
  return (
    <div className="section">
      <div className="section-title">박스</div>
      <LabeledNum label="테두리(dot)" value={el.borderThicknessDot} onChange={(v) => upd({ borderThicknessDot: Math.max(1, Math.round(v)) })} />
      <Row label="색상">
        <SegButtons value={el.color} options={COLOR_OPTS} onChange={(v) => upd({ color: v })} />
      </Row>
      <LabeledNum label="라운딩(0-8)" value={el.rounding} onChange={(v) => upd({ rounding: Math.max(0, Math.min(8, Math.round(v))) })} />
      <CheckRow label="채우기" value={el.filled} onChange={(v) => upd({ filled: v })} />
    </div>
  );
}

function ShapeProps({ el, upd }: { el: CircleElement | EllipseElement; upd: Upd }) {
  return (
    <div className="section">
      <div className="section-title">{el.type === 'circle' ? '원' : '타원'}</div>
      <LabeledNum label="테두리(dot)" value={el.borderThicknessDot} onChange={(v) => upd({ borderThicknessDot: Math.max(1, Math.round(v)) })} />
      <Row label="색상">
        <SegButtons value={el.color} options={COLOR_OPTS} onChange={(v) => upd({ color: v })} />
      </Row>
      <CheckRow label="채우기" value={el.filled} onChange={(v) => upd({ filled: v })} />
    </div>
  );
}

function DiagonalProps({ el, upd }: { el: DiagonalElement; upd: Upd }) {
  return (
    <div className="section">
      <div className="section-title">대각선</div>
      <LabeledNum label="두께(dot)" value={el.thicknessDot} onChange={(v) => upd({ thicknessDot: Math.max(1, Math.round(v)) })} />
      <Row label="기울기">
        <SegButtons
          value={el.lean}
          options={[
            { value: 'right', label: '/ 우상향' },
            { value: 'left', label: '\\ 좌상향' },
          ]}
          onChange={(v) => upd({ lean: v })}
        />
      </Row>
      <Row label="색상">
        <SegButtons value={el.color} options={COLOR_OPTS} onChange={(v) => upd({ color: v })} />
      </Row>
    </div>
  );
}

function ImageProps({ el, upd }: { el: ImageElement; upd: Upd }) {
  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => upd({ sourceDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };
  return (
    <div className="section">
      <div className="section-title">이미지</div>
      <input
        type="file"
        accept="image/png,image/jpeg,image/bmp,image/gif,image/webp,image/svg+xml"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <div style={{ height: 6 }} />
      <Row label="디더링">
        <SelectInput
          value={el.dither}
          options={[
            { value: 'floyd-steinberg', label: 'Floyd-Steinberg' },
            { value: 'threshold', label: '임계값' },
          ]}
          onChange={(v) => upd({ dither: v })}
        />
      </Row>
      <Row label="임계값">
        <input
          type="range"
          min={0}
          max={255}
          value={el.threshold}
          onChange={(e) => upd({ threshold: Number(e.target.value) })}
        />
      </Row>
      <CheckRow label="흑백 반전" value={el.invert} onChange={(v) => upd({ invert: v })} />
      {el.mono && (
        <div className="hint">
          {el.mono.widthDot} × {el.mono.heightDot} dot · {Math.round((el.mono.rowBytes * el.mono.heightDot) / 1024)} KB
        </div>
      )}
    </div>
  );
}

function TableProps({ el, upd }: { el: TableElement; upd: Upd }) {
  const setRows = (n: number) => {
    const rows = Math.max(1, Math.min(20, Math.round(n)));
    const rowHeightsMm = [...el.rowHeightsMm];
    while (rowHeightsMm.length < rows) rowHeightsMm.push(8);
    rowHeightsMm.length = rows;
    upd({
      rows,
      rowHeightsMm,
      cells: el.cells.filter((c) => c.row < rows),
      heightMm: rowHeightsMm.reduce((a, b) => a + b, 0),
    });
  };
  const setCols = (n: number) => {
    const cols = Math.max(1, Math.min(12, Math.round(n)));
    const colWidthsMm = [...el.colWidthsMm];
    while (colWidthsMm.length < cols) colWidthsMm.push(20);
    colWidthsMm.length = cols;
    upd({
      cols,
      colWidthsMm,
      cells: el.cells.filter((c) => c.col < cols),
      widthMm: colWidthsMm.reduce((a, b) => a + b, 0),
    });
  };
  const cellAt = (row: number, col: number) =>
    el.cells.find((c) => c.row === row && c.col === col);
  const setCell = (row: number, col: number, text: string) => {
    const cells = el.cells.filter((c) => !(c.row === row && c.col === col));
    const prev = cellAt(row, col);
    cells.push({ row, col, text, align: prev?.align ?? 'L' });
    upd({ cells });
  };

  return (
    <div className="section">
      <div className="section-title">테이블</div>
      <div className="row-2">
        <LabeledNum label="행" value={el.rows} onChange={setRows} />
        <LabeledNum label="열" value={el.cols} onChange={setCols} />
      </div>
      <LabeledNum label="테두리(dot)" value={el.borderThicknessDot} onChange={(v) => upd({ borderThicknessDot: Math.max(1, Math.round(v)) })} />
      <LabeledNum label="폰트(dot)" value={el.fontHeightDot} onChange={(v) => upd({ fontHeightDot: Math.round(v) })} />
      <CheckRow label="내부 선 표시" value={el.showInnerBorders} onChange={(v) => upd({ showInnerBorders: v })} />
      <div className="section-title" style={{ marginTop: 8 }}>
        셀 내용
      </div>
      <div style={{ display: 'grid', gap: 3, gridTemplateColumns: `repeat(${el.cols}, 1fr)` }}>
        {Array.from({ length: el.rows }).flatMap((_, r) =>
          Array.from({ length: el.cols }).map((__, c) => (
            <input
              key={`${r}-${c}`}
              value={cellAt(r, c)?.text ?? ''}
              placeholder={`${r + 1},${c + 1}`}
              onChange={(e) => setCell(r, c, e.target.value)}
              style={{ fontSize: 11, padding: '3px 4px' }}
            />
          )),
        )}
      </div>
    </div>
  );
}

function typeLabel(type: DesignElement['type']): string {
  const map: Record<DesignElement['type'], string> = {
    text: '텍스트',
    barcode1d: '1D 바코드',
    barcode2d: '2D 코드',
    line: '선',
    box: '박스',
    circle: '원',
    ellipse: '타원',
    diagonal: '대각선',
    image: '이미지',
    table: '테이블',
  };
  return map[type];
}
