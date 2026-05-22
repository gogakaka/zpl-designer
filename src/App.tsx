import { useEffect, useRef, useState } from 'react';
import { ContextMenu } from './components/ContextMenu';
import { DataBindingPanel } from './components/DataBindingPanel';
import { ImportDialog } from './components/ImportDialog';
import { LayersPanel } from './components/LayersPanel';
import { PreviewModal } from './components/PreviewModal';
import { PropertyPanel } from './components/PropertyPanel';
import { SettingsDialog } from './components/SettingsDialog';
import { TemplateGallery } from './components/TemplateGallery';
import { Toolbar } from './components/Toolbar';
import { ToolPalette } from './components/ToolPalette';
import { ZplPanel } from './components/ZplPanel';
import { DesignCanvas } from './components/canvas/DesignCanvas';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { loadLastProject, saveProject } from './persistence/projectIo';
import { useStore } from './state/store';
import { round } from './units';
import { validateProject } from './validation';

type ModalKind = 'templates' | 'import' | 'preview' | 'settings' | null;
type RightTab = 'props' | 'layers' | 'data';

export function App() {
  useKeyboardShortcuts();

  const project = useStore((s) => s.project);
  const theme = useStore((s) => s.ui.theme);
  const selectedIds = useStore((s) => s.selectedIds);
  const replaceProject = useStore((s) => s.replaceProject);
  const requestFit = useStore((s) => s.requestFit);

  const [modal, setModal] = useState<ModalKind>(null);
  const [tab, setTab] = useState<RightTab>('props');
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    loadLastProject()
      .then((p) => {
        if (p) replaceProject(p);
      })
      .finally(() => {
        loaded.current = true;
        requestFit();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      void saveProject(useStore.getState().project);
    }, 800);
    return () => clearTimeout(t);
  }, [project]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2400);
  };

  const issues = validateProject(project);
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warnCount = issues.length - errorCount;

  return (
    <div className="app">
      <Toolbar
        onOpenTemplates={() => setModal('templates')}
        onOpenImport={() => setModal('import')}
        onOpenPreview={() => setModal('preview')}
        onOpenSettings={() => setModal('settings')}
        onToast={showToast}
      />
      <div className="workspace">
        <ToolPalette />
        <div className="canvas-area">
          <DesignCanvas onContextMenu={(x, y) => setCtx({ x, y })} />
          <div className="status-bar">
            <span>
              {round(project.label.widthMm, 1)} × {round(project.label.heightMm, 1)} mm
            </span>
            <span>{project.printerProfile.dpi} dpi</span>
            <span>요소 {project.label.elements.length}개</span>
            <span>선택 {selectedIds.length}개</span>
            <span style={{ flex: 1 }} />
            {errorCount > 0 && <span className="badge error">오류 {errorCount}</span>}
            {warnCount > 0 && <span className="badge warning">경고 {warnCount}</span>}
            {errorCount === 0 && warnCount === 0 && <span className="badge ok">정상</span>}
          </div>
        </div>
        <div className="right-panel">
          <div className="tabs">
            <button className={`tab ${tab === 'props' ? 'active' : ''}`} onClick={() => setTab('props')}>
              속성
            </button>
            <button className={`tab ${tab === 'layers' ? 'active' : ''}`} onClick={() => setTab('layers')}>
              레이어
            </button>
            <button className={`tab ${tab === 'data' ? 'active' : ''}`} onClick={() => setTab('data')}>
              데이터
            </button>
          </div>
          <div className="panel-body">
            {tab === 'props' && <PropertyPanel />}
            {tab === 'layers' && <LayersPanel />}
            {tab === 'data' && <DataBindingPanel />}
            {tab !== 'data' && issues.length > 0 && (
              <div className="section" style={{ marginTop: 14 }}>
                <div className="section-title">검증 ({issues.length})</div>
                {issues.map((it, i) => (
                  <div key={i} className={`issue ${it.severity}`}>
                    {it.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ZplPanel onToast={showToast} />

      {modal === 'templates' && <TemplateGallery onClose={() => setModal(null)} />}
      {modal === 'import' && <ImportDialog onClose={() => setModal(null)} onToast={showToast} />}
      {modal === 'preview' && <PreviewModal onClose={() => setModal(null)} onToast={showToast} />}
      {modal === 'settings' && <SettingsDialog onClose={() => setModal(null)} />}
      {ctx && <ContextMenu x={ctx.x} y={ctx.y} onClose={() => setCtx(null)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
