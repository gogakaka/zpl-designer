import { useMemo, useState, type ReactNode } from 'react';
import { getGenerator, generators } from '../codegen';
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

  const [includeComments, setIncludeComments] = useState(true);
  const [encoding, setEncoding] = useState(true);
  const [resolveVars, setResolveVars] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
      {!collapsed && (
        <pre className="code-area" data-testid="zpl-output">
          {highlight(code, generator.id === 'zpl')}
        </pre>
      )}
    </div>
  );
}
