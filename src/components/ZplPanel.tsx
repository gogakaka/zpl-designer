import { useMemo, useState, type ReactNode } from 'react';
import { generators, getGenerator } from '../codegen';
import { createProject } from '../factory';
import { parseZpl } from '../parser/zplParser';
import { sampleValues } from '../preview';
import { useStore } from '../state/store';
import { copyToClipboard, downloadText } from '../utils/download';

function highlight(code: string, isZpl: boolean): ReactNode[] {
  if (!isZpl) {
    return code.split('\n').map((line, i) => (
      <span key={i} className={line.startsWith(';') ? 'cmt' : undefined}>
        {line}
        {'\n'}
      </span>
    ));
  }
  const parts = code.split(/(\^[A-Z][A-Z0-9@]?|~[A-Z][A-Z0-9])/g);
  return parts.map((p, i) =>
    /^[\^~]/.test(p) ? (
      <span key={i} className="cmd">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export function ZplPanel({ onToast }: { onToast: (msg: string) => void }) {
  const project = useStore((s) => s.project);
  const generatorId = useStore((s) => s.ui.generatorId);
  const setUi = useStore((s) => s.setUi);
  const replaceProject = useStore((s) => s.replaceProject);
  const requestFit = useStore((s) => s.requestFit);

  const [includeComments, setIncludeComments] = useState(true);
  const [encoding, setEncoding] = useState(true);
  const [resolveVars, setResolveVars] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const generator = getGenerator(generatorId);
  const code = useMemo(
    () =>
      generator.generate(project, {
        includeComments,
        encoding,
        resolveVariables: resolveVars,
        variableValues: sampleValues(project.variables),
      }),
    [project, generator, includeComments, encoding, resolveVars],
  );

  const bytes = new Blob([code]).size;
  const lines = code.split('\n').length;

  const applyEdit = () => {
    const result = parseZpl(draft, project.printerProfile.dpi);
    if (result.elements.length === 0) {
      onToast('해석 가능한 요소가 없습니다.');
      return;
    }
    const p = createProject(project.name);
    p.printerProfile = { ...project.printerProfile };
    p.variables = project.variables.map((v) => ({ ...v }));
    if (result.widthMm && result.widthMm > 1) p.label.widthMm = result.widthMm;
    if (result.heightMm && result.heightMm > 1) p.label.heightMm = result.heightMm;
    p.label.elements = result.elements;
    replaceProject(p);
    requestFit();
    setEditing(false);
    onToast(`${result.elements.length}개 요소로 캔버스를 갱신했습니다.`);
  };

  return (
    <div className="bottom-panel">
      <div className="bottom-head">
        <strong>출력 코드</strong>
        <select
          value={generatorId}
          onChange={(e) => setUi({ generatorId: e.target.value })}
          style={{ width: 150 }}
        >
          {generators.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <label className="chip">
          <input
            type="checkbox"
            checked={includeComments}
            onChange={(e) => setIncludeComments(e.target.checked)}
          />{' '}
          주석
        </label>
        <label className="chip">
          <input type="checkbox" checked={encoding} onChange={(e) => setEncoding(e.target.checked)} />{' '}
          UTF-8
        </label>
        <label className="chip">
          <input
            type="checkbox"
            checked={resolveVars}
            onChange={(e) => setResolveVars(e.target.checked)}
          />{' '}
          변수 치환
        </label>
        <span className="spacer" />
        <span className="chip">
          {lines}줄 · {bytes}B
        </span>
        {generator.id === 'zpl' && !editing && (
          <button
            onClick={() => {
              setDraft(code);
              setEditing(true);
              setCollapsed(false);
            }}
          >
            편집
          </button>
        )}
        <button
          onClick={async () => {
            const ok = await copyToClipboard(code);
            onToast(ok ? '코드를 클립보드에 복사했습니다.' : '복사에 실패했습니다.');
          }}
        >
          복사
        </button>
        <button
          className="primary"
          onClick={() => {
            downloadText(`${project.name || 'label'}.${generator.fileExtension}`, code);
            onToast('파일을 다운로드했습니다.');
          }}
        >
          다운로드
        </button>
        <button className="icon" onClick={() => setCollapsed(!collapsed)} title="펼치기/접기">
          {collapsed ? '▲' : '▼'}
        </button>
      </div>

      {!collapsed && !editing && (
        <pre className="code-area" data-testid="zpl-output">
          {highlight(code, generator.id === 'zpl')}
        </pre>
      )}

      {!collapsed && editing && (
        <>
          <textarea
            className="code-area"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            style={{ width: '100%', border: 'none', display: 'block' }}
          />
          <div className="bottom-head">
            <span className="hint">코드를 수정한 뒤 적용하면 캔버스가 재구성됩니다 (베스트 에포트 파싱).</span>
            <span className="spacer" />
            <button onClick={() => setEditing(false)}>취소</button>
            <button className="primary" onClick={applyEdit}>
              적용
            </button>
          </div>
        </>
      )}
    </div>
  );
}
