import { useEffect, useRef } from 'react';
import { useStore } from '../../state/store';
import type { Dpi } from '../../types';
import type { Unit } from '../../units';
import { dotToMm } from '../../units';

interface Props {
  width: number;
  height: number;
  panX: number;
  panY: number;
  zoom: number;
  unit: Unit;
  dpi: Dpi;
}

const SIZE = 20;

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
}

export function Rulers({ width, height, panX, panY, zoom, unit, dpi }: Props) {
  const topRef = useRef<HTMLCanvasElement>(null);
  const leftRef = useRef<HTMLCanvasElement>(null);
  const addGuide = useStore((s) => s.addGuide);

  const stepMm = unit === 'inch' ? 25.4 / 2 : unit === 'dot' ? dotToMm(100, dpi) : 10;
  const fmt = (mm: number): string => {
    if (unit === 'inch') return (mm / 25.4).toFixed(1);
    if (unit === 'dot') return String(Math.round((mm * dpi) / 25.4));
    return String(Math.round(mm));
  };

  useEffect(() => {
    const canvas = topRef.current;
    if (!canvas || width <= 0) return;
    canvas.width = width;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const panel = cssVar('--panel');
    const border = cssVar('--border');
    const muted = cssVar('--muted');
    ctx.fillStyle = panel;
    ctx.fillRect(0, 0, width, SIZE);
    ctx.strokeStyle = border;
    ctx.fillStyle = muted;
    ctx.font = '9px sans-serif';
    ctx.beginPath();
    const minorStep = stepMm / 5;
    const startMm = Math.floor(-panX / zoom / stepMm) * stepMm;
    const endMm = (width - panX) / zoom;
    for (let mm = startMm; mm <= endMm; mm += minorStep) {
      const px = Math.round(panX + mm * zoom) + 0.5;
      const isMajor = Math.abs(mm % stepMm) < 1e-6;
      ctx.moveTo(px, isMajor ? 6 : 13);
      ctx.lineTo(px, SIZE);
      if (isMajor) ctx.fillText(fmt(mm), px + 2, 9);
    }
    ctx.stroke();
  }, [width, panX, zoom, unit, dpi, stepMm]);

  useEffect(() => {
    const canvas = leftRef.current;
    if (!canvas || height <= 0) return;
    canvas.width = SIZE;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const panel = cssVar('--panel');
    const border = cssVar('--border');
    const muted = cssVar('--muted');
    ctx.fillStyle = panel;
    ctx.fillRect(0, 0, SIZE, height);
    ctx.strokeStyle = border;
    ctx.fillStyle = muted;
    ctx.font = '9px sans-serif';
    ctx.beginPath();
    const minorStep = stepMm / 5;
    const startMm = Math.floor(-panY / zoom / stepMm) * stepMm;
    const endMm = (height - panY) / zoom;
    for (let mm = startMm; mm <= endMm; mm += minorStep) {
      const px = Math.round(panY + mm * zoom) + 0.5;
      const isMajor = Math.abs(mm % stepMm) < 1e-6;
      ctx.moveTo(isMajor ? 6 : 13, px);
      ctx.lineTo(SIZE, px);
      if (isMajor) {
        ctx.save();
        ctx.translate(9, px + 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(fmt(mm), 0, 0);
        ctx.restore();
      }
    }
    ctx.stroke();
  }, [height, panY, zoom, unit, dpi, stepMm]);

  return (
    <>
      <canvas
        ref={topRef}
        title="클릭하여 세로 가이드 추가"
        onClick={(e) => addGuide('x', (e.nativeEvent.offsetX - panX) / zoom)}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 4, cursor: 'col-resize' }}
      />
      <canvas
        ref={leftRef}
        title="클릭하여 가로 가이드 추가"
        onClick={(e) => addGuide('y', (e.nativeEvent.offsetY - panY) / zoom)}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 4, cursor: 'row-resize' }}
      />
      <div className="ruler-corner" />
      <span aria-hidden style={{ position: 'absolute', left: 5, top: 4, fontSize: 9, color: 'var(--muted)', zIndex: 6 }}>
        {unit}
      </span>
    </>
  );
}
