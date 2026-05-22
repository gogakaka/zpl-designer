import { useState } from 'react';
import { createProject } from '../factory';
import { parseZpl } from '../parser/zplParser';
import { useStore } from '../state/store';
import { Modal } from './Modal';

export function ImportDialog({
  onClose,
  onToast,
}: {
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const project = useStore((s) => s.project);
  const replaceProject = useStore((s) => s.replaceProject);
  const requestFit = useStore((s) => s.requestFit);
  const [text, setText] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    void file.text().then(setText);
  };

  const doImport = () => {
    const result = parseZpl(text, project.printerProfile.dpi);
    setWarnings(result.warnings);
    if (result.elements.length === 0) return;
    const p = createProject('가져온 라벨');
    p.printerProfile = { ...project.printerProfile };
    if (result.widthMm && result.widthMm > 1) p.label.widthMm = result.widthMm;
    if (result.heightMm && result.heightMm > 1) p.label.heightMm = result.heightMm;
    p.label.elements = result.elements;
    replaceProject(p);
    requestFit();
    onToast(`${result.elements.length}개 요소를 가져왔습니다.`);
    onClose();
  };

  return (
    <Modal
      title="ZPL 코드 가져오기"
      onClose={onClose}
      width={620}
      footer={
        <>
          <button onClick={onClose}>취소</button>
          <button className="primary" onClick={doImport} disabled={!text.trim()}>
            가져오기
          </button>
        </>
      }
    >
      <div className="hint" style={{ marginBottom: 8 }}>
        기존 ZPL II 코드를 붙여넣거나 파일을 선택하면 캔버스 요소로 복원합니다(베스트 에포트).
      </div>
      <input
        type="file"
        accept=".zpl,.prn,.txt,text/plain"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <div style={{ height: 8 }} />
      <textarea
        rows={12}
        placeholder={'^XA\n^FO50,50^A0N,40,40^FDHello^FS\n^XZ'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      />
      {warnings.map((w, i) => (
        <div key={i} className="issue warning" style={{ marginTop: 6 }}>
          {w}
        </div>
      ))}
    </Modal>
  );
}
