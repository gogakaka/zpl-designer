import { useEffect, useState, type ReactNode } from 'react';

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="row">
      <label>{label}</label>
      <div className="grow">{children}</div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <span>{label}</span>
      {children}
    </div>
  );
}

interface NumProps {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

export function NumberInput({ value, onChange, step = 1, min, max }: NumProps) {
  const [text, setText] = useState(format(value));
  useEffect(() => {
    setText(format(value));
  }, [value]);
  return (
    <input
      type="number"
      value={text}
      step={step}
      min={min}
      max={max}
      onChange={(e) => {
        setText(e.target.value);
        const v = parseFloat(e.target.value);
        if (Number.isFinite(v)) {
          let n = v;
          if (min !== undefined) n = Math.max(min, n);
          if (max !== undefined) n = Math.min(max, n);
          onChange(n);
        }
      }}
    />
  );
}

function format(v: number): string {
  if (!Number.isFinite(v)) return '0';
  return String(Math.round(v * 1000) / 1000);
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  );
}

export function SelectInput<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function CheckRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="row" style={{ cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 'auto' }}
      />
      <span style={{ color: 'var(--text)' }}>{label}</span>
    </label>
  );
}

export function SegButtons<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {options.map((o) => (
        <button
          key={o.value}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
