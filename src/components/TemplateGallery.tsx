import { useEffect, useState } from 'react';
import { deleteProject, listProjects, loadProject, type ProjectSummary } from '../persistence/projectIo';
import { useStore } from '../state/store';
import { templates } from '../templates';
import { Modal } from './Modal';

export function TemplateGallery({ onClose }: { onClose: () => void }) {
  const loadTemplate = useStore((s) => s.loadTemplate);
  const replaceProject = useStore((s) => s.replaceProject);
  const requestFit = useStore((s) => s.requestFit);
  const [saved, setSaved] = useState<ProjectSummary[]>([]);

  const refresh = () => {
    void listProjects().then(setSaved);
  };
  useEffect(refresh, []);

  const openTemplate = (id: string) => {
    loadTemplate(id);
    requestFit();
    onClose();
  };
  const openSaved = async (id: string) => {
    const p = await loadProject(id);
    if (p) {
      replaceProject(p);
      requestFit();
      onClose();
    }
  };
  const remove = async (id: string) => {
    await deleteProject(id);
    refresh();
  };

  return (
    <Modal title="새로 만들기 / 열기" onClose={onClose} width={620}>
      <div className="section">
        <div className="section-title">템플릿</div>
        <div className="template-grid">
          {templates.map((t) => (
            <div key={t.id} className="template-card" onClick={() => openTemplate(t.id)}>
              <div className="t-name">{t.name}</div>
              <div className="t-desc">{t.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">저장된 프로젝트 ({saved.length})</div>
        {saved.length === 0 && <div className="hint">저장된 프로젝트가 없습니다.</div>}
        {saved.map((p) => (
          <div className="layer-item" key={p.id}>
            <span className="name" onClick={() => openSaved(p.id)} style={{ cursor: 'pointer' }}>
              {p.name}
            </span>
            <span className="hint">{new Date(p.updatedAt).toLocaleString('ko-KR')}</span>
            <button className="mini danger" onClick={() => remove(p.id)}>
              삭제
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
