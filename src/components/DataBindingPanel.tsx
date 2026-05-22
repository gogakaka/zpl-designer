import Papa from 'papaparse';
import { useState } from 'react';
import { useStore } from '../state/store';
import { CheckRow } from './controls';

export function DataBindingPanel() {
  const variables = useStore((s) => s.project.variables);
  const elements = useStore((s) => s.project.label.elements);
  const csvRows = useStore((s) => s.csvRows);
  const setCsvRows = useStore((s) => s.setCsvRows);
  const addVariable = useStore((s) => s.addVariable);
  const updateVariable = useStore((s) => s.updateVariable);
  const removeVariable = useStore((s) => s.removeVariable);
  const applyRecord = useStore((s) => s.applyRecord);
  const previewData = useStore((s) => s.ui.previewData);
  const setUi = useStore((s) => s.setUi);
  const [row, setRow] = useState(0);

  // discover {{placeholders}} used in the design
  const used = new Set<string>();
  for (const el of elements) {
    const texts: string[] = [];
    if (el.type === 'text') texts.push(el.content);
    if (el.type === 'barcode1d' || el.type === 'barcode2d') texts.push(el.data);
    if (el.type === 'table') el.cells.forEach((c) => texts.push(c.text));
    for (const t of texts) {
      for (const m of t.matchAll(/\{\{\s*([\w가-힣]+)\s*\}\}/g)) used.add(m[1]);
    }
  }
  const missing = [...used].filter((u) => !variables.some((v) => v.name === u));

  const onCsv = (file: File | undefined) => {
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setCsvRows((res.data as Record<string, string>[]).filter((r) => Object.keys(r).length));
        setRow(0);
      },
    });
  };

  return (
    <div>
      <div className="section">
        <div className="section-title">변수</div>
        <div className="hint" style={{ marginBottom: 6 }}>
          텍스트·바코드·셀에 <code>{'{{변수명}}'}</code> 형태로 사용합니다.
        </div>
        {variables.length === 0 && <div className="hint">아직 변수가 없습니다.</div>}
        {variables.map((v, i) => (
          <div className="row" key={i}>
            <input
              style={{ width: 96 }}
              value={v.name}
              onChange={(e) => updateVariable(i, { name: e.target.value })}
            />
            <input
              className="grow"
              placeholder="샘플 값"
              value={v.sampleValue}
              onChange={(e) => updateVariable(i, { sampleValue: e.target.value })}
            />
            <button className="mini danger" onClick={() => removeVariable(i)} title="삭제">
              ✕
            </button>
          </div>
        ))}
        <button onClick={addVariable}>+ 변수 추가</button>
        {missing.length > 0 && (
          <div className="issue warning" style={{ marginTop: 6 }}>
            디자인에 쓰였지만 정의되지 않은 변수: {missing.join(', ')}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title">미리보기</div>
        <CheckRow
          label="캔버스에 샘플 값 표시"
          value={previewData}
          onChange={(v) => setUi({ previewData: v })}
        />
      </div>

      <div className="section">
        <div className="section-title">CSV 데이터 머지</div>
        <input type="file" accept=".csv,text/csv" onChange={(e) => onCsv(e.target.files?.[0])} />
        {csvRows.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div className="row">
              <button disabled={row <= 0} onClick={() => setRow(row - 1)}>
                ◀
              </button>
              <span className="grow" style={{ textAlign: 'center' }}>
                레코드 {row + 1} / {csvRows.length}
              </span>
              <button disabled={row >= csvRows.length - 1} onClick={() => setRow(row + 1)}>
                ▶
              </button>
            </div>
            <button className="primary" style={{ width: '100%' }} onClick={() => applyRecord(csvRows[row])}>
              이 레코드를 샘플 값에 적용
            </button>
            <div className="hint" style={{ marginTop: 6 }}>
              열: {Object.keys(csvRows[0]).join(', ')}
            </div>
            <button style={{ marginTop: 6 }} onClick={() => setCsvRows([])}>
              CSV 비우기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
