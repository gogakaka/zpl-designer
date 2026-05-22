import { useRef } from 'react';
import { exportProjectJson, importProjectJson, saveProject } from '../persistence/projectIo';
import { useStore } from '../state/store';

interface Props {
  onOpenTemplates: () => void;
  onOpenImport: () => void;
  onOpenPreview: () => void;
  onOpenSettings: () => void;
  onToast: (msg: string) => void;
}

const SCREEN_PX_PER_MM = 3.7795;

export function Toolbar({
  onOpenTemplates,
  onOpenImport,
  onOpenPreview,
  onOpenSettings,
  onToast,
}: Props) {
  const project = useStore((s) => s.project);
  const ui = useStore((s) => s.ui);
  const pastLen = useStore((s) => s.past.length);
  const futureLen = useStore((s) => s.future.length);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const newProject = useStore((s) => s.newProject);
  const replaceProject = useStore((s) => s.replaceProject);
  const requestFit = useStore((s) => s.requestFit);
  const setUi = useStore((s) => s.setUi);
  const setProjectName = useStore((s) => s.setProjectName);

  const fileRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    await saveProject(useStore.getState().project);
    onToast('프로젝트를 저장했습니다.');
  };

  const onImportFile = (file: File | undefined) => {
    if (!file) return;
    importProjectJson(file)
      .then((p) => {
        replaceProject(p);
        requestFit();
        onToast('프로젝트를 불러왔습니다.');
      })
      .catch((e) => onToast(e instanceof Error ? e.message : '불러오기 실패'));
  };

  const zoomBy = (factor: number) =>
    setUi({ zoom: Math.max(0.3, Math.min(24, ui.zoom * factor)) });

  return (
    <div className="toolbar">
      <span className="brand">▣ ZPL Designer</span>
      <input
        className="project-name"
        value={project.name}
        onChange={(e) => setProjectName(e.target.value)}
        title="프로젝트 이름"
      />
      <div className="sep" />
      <button
        onClick={() => {
          newProject();
          requestFit();
        }}
      >
        새로
      </button>
      <button onClick={onOpenTemplates}>열기 / 템플릿</button>
      <button className="primary" onClick={save}>
        저장
      </button>
      <button onClick={() => exportProjectJson(useStore.getState().project)} title="프로젝트 JSON 내보내기">
        JSON↓
      </button>
      <button onClick={() => fileRef.current?.click()} title="프로젝트 JSON 가져오기">
        JSON↑
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          onImportFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <div className="sep" />
      <button className="icon" onClick={undo} disabled={pastLen === 0} title="실행취소 (Ctrl+Z)">
        ↶
      </button>
      <button className="icon" onClick={redo} disabled={futureLen === 0} title="다시실행 (Ctrl+Y)">
        ↷
      </button>
      <div className="sep" />
      <button onClick={onOpenImport}>ZPL 가져오기</button>
      <button onClick={onOpenPreview}>미리보기</button>
      <div className="sep" />
      <button className="icon" onClick={() => zoomBy(1 / 1.2)} title="축소">
        −
      </button>
      <span className="chip" style={{ minWidth: 48, textAlign: 'center' }}>
        {Math.round((ui.zoom / SCREEN_PX_PER_MM) * 100)}%
      </span>
      <button className="icon" onClick={() => zoomBy(1.2)} title="확대">
        +
      </button>
      <button onClick={requestFit} title="화면 맞춤">
        맞춤
      </button>
      <span className="spacer" />
      <button
        className="icon"
        onClick={() => setUi({ theme: ui.theme === 'dark' ? 'light' : 'dark' })}
        title="테마 전환"
      >
        {ui.theme === 'dark' ? '☀' : '☾'}
      </button>
      <button onClick={onOpenSettings}>설정</button>
    </div>
  );
}
