import { useEffect, useMemo, useState } from 'react';
import { generateZpl } from '../codegen';
import { sampleValues } from '../preview';
import { useStore } from '../state/store';
import { downloadText } from '../utils/download';
import { Modal } from './Modal';

export function PreviewModal({
  onClose,
  onToast,
}: {
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const project = useStore((s) => s.project);
  const csvRows = useStore((s) => s.csvRows);

  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recordIdx, setRecordIdx] = useState(0);

  const dpi = project.printerProfile.dpi;
  const dpmm = dpi === 600 ? 24 : dpi === 300 ? 12 : 8;

  const values = useMemo(
    () => (csvRows.length ? csvRows[recordIdx] : sampleValues(project.variables)),
    [csvRows, recordIdx, project.variables],
  );

  const buildZpl = (vals: Record<string, string>) =>
    generateZpl(project, {
      includeComments: false,
      encoding: true,
      resolveVariables: true,
      variableValues: vals,
    });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const zpl = buildZpl(values);
    const wIn = Math.max(0.2, project.label.widthMm / 25.4);
    const hIn = Math.max(0.2, project.label.heightMm / 25.4);
    const url = `https://api.labelary.com/v1/printers/${dpmm}dpmm/labels/${wIn.toFixed(2)}x${hIn.toFixed(2)}/0/`;
    fetch(url, {
      method: 'POST',
      // Labelary는 Content-Type이 비어 있거나 text/plain이면 415를 돌려줌.
      // x-www-form-urlencoded로 보내야 ZPL 본문을 그대로 받아들임.
      headers: { Accept: 'image/png', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: zpl,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Labelary 응답 ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        if (!cancelled) {
          setImgUrl(URL.createObjectURL(blob));
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(String(e instanceof Error ? e.message : e));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, recordIdx]);

  const exportAll = () => {
    if (!csvRows.length) return;
    const all = csvRows.map((row) => buildZpl(row)).join('\n');
    downloadText(`${project.name || 'label'}-${csvRows.length}records.zpl`, all);
    onToast(`${csvRows.length}개 레코드 ZPL을 다운로드했습니다.`);
  };

  return (
    <Modal title="인쇄 미리보기" onClose={onClose} width={560}>
      {csvRows.length > 0 && (
        <div className="row" style={{ marginBottom: 10 }}>
          <button disabled={recordIdx <= 0} onClick={() => setRecordIdx(recordIdx - 1)}>
            ◀
          </button>
          <span className="grow" style={{ textAlign: 'center' }}>
            레코드 {recordIdx + 1} / {csvRows.length}
          </span>
          <button
            disabled={recordIdx >= csvRows.length - 1}
            onClick={() => setRecordIdx(recordIdx + 1)}
          >
            ▶
          </button>
          <button className="primary" onClick={exportAll}>
            전체 ZPL 다운로드
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 240,
          background: 'var(--canvas-bg)',
          borderRadius: 8,
          padding: 12,
        }}
      >
        {loading && <span className="hint">실측 미리보기 불러오는 중…</span>}
        {!loading && error && (
          <div className="empty-hint">
            실측 미리보기(Labelary)를 불러오지 못했습니다.
            <br />
            네트워크 정책으로 외부 API가 차단되었을 수 있습니다.
            <br />
            캔버스 화면이 기본 미리보기입니다.
            <br />
            <span className="hint">({error})</span>
          </div>
        )}
        {!loading && !error && imgUrl && (
          <img
            src={imgUrl}
            alt="라벨 미리보기"
            style={{ maxWidth: '100%', maxHeight: 420, boxShadow: 'var(--shadow)' }}
          />
        )}
      </div>
      <div className="hint" style={{ marginTop: 8 }}>
        실측 미리보기는 Labelary 온라인 ZPL 렌더러를 사용합니다(외부 네트워크 필요).
      </div>
    </Modal>
  );
}
