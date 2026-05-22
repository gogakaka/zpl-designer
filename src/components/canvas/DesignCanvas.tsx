import Konva from 'konva';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Group, Layer, Line, Rect, Stage, Transformer } from 'react-konva';
import { useStore } from '../../state/store';
import { ElementNode } from './ElementNode';
import { Rulers } from './Rulers';

interface Props {
  onContextMenu?: (clientX: number, clientY: number) => void;
}

interface Marquee {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 24;

export function DesignCanvas({ onContextMenu }: Props) {
  const project = useStore((s) => s.project);
  const ui = useStore((s) => s.ui);
  const selectedIds = useStore((s) => s.selectedIds);
  const fitNonce = useStore((s) => s.fitNonce);
  const setUi = useStore((s) => s.setUi);
  const setSelection = useStore((s) => s.setSelection);
  const clearSelection = useStore((s) => s.clearSelection);
  const addElement = useStore((s) => s.addElement);

  const label = project.label;
  const elements = label.elements;
  const zoom = ui.zoom;

  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const [size, setSize] = useState({ w: 800, h: 600 });
  const [pan, setPan] = useState({ x: 60, y: 40 });
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const panning = useRef<{ active: boolean; startX: number; startY: number; panX: number; panY: number }>(
    { active: false, startX: 0, startY: 0, panX: 0, panY: 0 },
  );
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  const spaceDown = useRef(false);
  const didInit = useRef(false);

  // container sizing
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: host.clientWidth, h: host.clientHeight });
    });
    ro.observe(host);
    setSize({ w: host.clientWidth, h: host.clientHeight });
    return () => ro.disconnect();
  }, []);

  // space-to-pan
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping(e)) spaceDown.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDown.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const fit = () => {
    const { w, h } = size;
    if (!w || !h || !label.widthMm || !label.heightMm) return;
    const margin = 70;
    const z = Math.max(
      MIN_ZOOM,
      Math.min(MAX_ZOOM, (w - margin) / label.widthMm, (h - margin) / label.heightMm),
    );
    setUi({ zoom: z });
    setPan({ x: (w - label.widthMm * z) / 2, y: (h - label.heightMm * z) / 2 });
  };

  useEffect(() => {
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitNonce, label.widthMm, label.heightMm]);

  useEffect(() => {
    if (size.w > 0 && size.h > 0 && !didInit.current) {
      didInit.current = true;
      fit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  // transformer
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const nodes = selectedIds
      .map((id) => stage.findOne('#' + id))
      .filter((n): n is Konva.Node => !!n)
      .filter((n) => {
        const el = elements.find((e) => e.id === n.id());
        return !!el && !el.locked;
      });
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, elements, zoom, pan]);

  const localMm = (): { x: number; y: number } | null => {
    const stage = stageRef.current;
    const p = stage?.getPointerPosition();
    if (!p) return null;
    return { x: (p.x - pan.x) / zoom, y: (p.y - pan.y) / zoom };
  };

  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const dir = e.evt.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * dir));
    const mx = (pointer.x - pan.x) / zoom;
    const my = (pointer.y - pan.y) / zoom;
    setPan({ x: pointer.x - mx * newZoom, y: pointer.y - my * newZoom });
    setUi({ zoom: newZoom });
  };

  const onStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const targetName = e.target.name();
    const isEmpty = e.target === stage || targetName === 'label-bg' || targetName === 'grid';

    if (spaceDown.current || e.evt.button === 1) {
      const p = stage.getPointerPosition();
      if (p) {
        panning.current = { active: true, startX: p.x, startY: p.y, panX: pan.x, panY: pan.y };
      }
      return;
    }
    if (!isEmpty) return;

    const mm = localMm();
    if (!mm) return;
    if (ui.activeTool !== 'select') {
      addElement(ui.activeTool, Math.max(0, mm.x), Math.max(0, mm.y));
      return;
    }
    clearSelection();
    marqueeStart.current = mm;
  };

  const onStageMouseMove = () => {
    const stage = stageRef.current;
    if (!stage) return;
    if (panning.current.active) {
      const p = stage.getPointerPosition();
      if (!p) return;
      setPan({
        x: panning.current.panX + (p.x - panning.current.startX),
        y: panning.current.panY + (p.y - panning.current.startY),
      });
      return;
    }
    if (marqueeStart.current) {
      const mm = localMm();
      if (!mm) return;
      const s = marqueeStart.current;
      setMarquee({
        x: Math.min(s.x, mm.x),
        y: Math.min(s.y, mm.y),
        w: Math.abs(mm.x - s.x),
        h: Math.abs(mm.y - s.y),
      });
    }
  };

  const onStageMouseUp = () => {
    panning.current.active = false;
    if (marqueeStart.current && marquee && (marquee.w > 1 || marquee.h > 1)) {
      const hit = elements
        .filter(
          (el) =>
            el.visible &&
            el.xMm < marquee.x + marquee.w &&
            el.xMm + el.widthMm > marquee.x &&
            el.yMm < marquee.y + marquee.h &&
            el.yMm + el.heightMm > marquee.y,
        )
        .map((el) => el.id);
      setSelection(hit);
    }
    marqueeStart.current = null;
    setMarquee(null);
  };

  const gridLines: React.ReactNode[] = [];
  if (ui.showGrid && ui.gridMm * zoom >= 5) {
    const step = ui.gridMm * zoom;
    const lw = label.widthMm * zoom;
    const lh = label.heightMm * zoom;
    for (let x = 0; x <= lw + 0.1; x += step) {
      gridLines.push(
        <Line key={`gx${x}`} name="grid" points={[x, 0, x, lh]} stroke="#cbd5e1" strokeWidth={1} listening={false} />,
      );
    }
    for (let y = 0; y <= lh + 0.1; y += step) {
      gridLines.push(
        <Line key={`gy${y}`} name="grid" points={[0, y, lw, y]} stroke="#cbd5e1" strokeWidth={1} listening={false} />,
      );
    }
  }

  const cursor = panning.current.active
    ? 'grabbing'
    : spaceDown.current
      ? 'grab'
      : ui.activeTool !== 'select'
        ? 'crosshair'
        : 'default';

  return (
    <div
      ref={hostRef}
      className="canvas-host"
      style={{ cursor }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e.clientX, e.clientY);
      }}
    >
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        onWheel={onWheel}
        onMouseDown={onStageMouseDown}
        onMouseMove={onStageMouseMove}
        onMouseUp={onStageMouseUp}
      >
        <Layer>
          <Group x={pan.x} y={pan.y}>
            <Rect
              name="label-bg"
              width={label.widthMm * zoom}
              height={label.heightMm * zoom}
              fill="#ffffff"
              shadowBlur={12}
              shadowColor="#0f172a"
              shadowOpacity={0.25}
            />
            {gridLines}
            {elements.map((el) => (
              <ElementNode key={el.id} element={el} />
            ))}
            {marquee && (
              <Rect
                x={marquee.x * zoom}
                y={marquee.y * zoom}
                width={marquee.w * zoom}
                height={marquee.h * zoom}
                fill="rgba(37,99,235,0.12)"
                stroke="#2563eb"
                dash={[4, 3]}
                listening={false}
              />
            )}
            <Transformer
              ref={trRef}
              rotationSnaps={[0, 90, 180, 270]}
              rotationSnapTolerance={25}
              flipEnabled={false}
              ignoreStroke
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < 6 || newBox.height < 6 ? oldBox : newBox
              }
            />
          </Group>
        </Layer>
      </Stage>
      {ui.showRulers && (
        <Rulers
          width={size.w}
          height={size.h}
          panX={pan.x}
          panY={pan.y}
          zoom={zoom}
          unit={ui.unit}
          dpi={project.printerProfile.dpi}
        />
      )}
    </div>
  );
}

function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
}
