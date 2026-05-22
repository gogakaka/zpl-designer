import Konva from 'konva';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Group, Image as KImage, Layer, Line, Rect, Stage, Transformer } from 'react-konva';
import { useLoadedImage } from '../../hooks/useImage';
import { useStore } from '../../state/store';
import { dotToMm } from '../../units';
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
  const snapGuides = useStore((s) => s.snapGuides);
  const editingTextId = useStore((s) => s.editingTextId);
  const setUi = useStore((s) => s.setUi);
  const setSelection = useStore((s) => s.setSelection);
  const clearSelection = useStore((s) => s.clearSelection);
  const addElement = useStore((s) => s.addElement);
  const moveGuide = useStore((s) => s.moveGuide);
  const removeGuide = useStore((s) => s.removeGuide);

  const label = project.label;
  const elements = label.elements;
  const guides = label.guides ?? [];
  const zoom = ui.zoom;
  const labelWpx = label.widthMm * zoom;
  const labelHpx = label.heightMm * zoom;

  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const [size, setSize] = useState({ w: 800, h: 600 });
  const [pan, setPan] = useState({ x: 60, y: 40 });
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const panning = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  const spaceDown = useRef(false);
  const didInit = useRef(false);

  const bgImage = useLoadedImage(label.backgroundImage?.dataUrl);

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
    const name = e.target.name();
    const isEmpty = e.target === stage || name === 'label-bg' || name === 'grid' || name === 'bg-image';

    if (spaceDown.current || e.evt.button === 1) {
      const p = stage.getPointerPosition();
      if (p) panning.current = { active: true, startX: p.x, startY: p.y, panX: pan.x, panY: pan.y };
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
    for (let x = 0; x <= labelWpx + 0.1; x += step) {
      gridLines.push(
        <Line key={`gx${x}`} name="grid" points={[x, 0, x, labelHpx]} stroke="#cbd5e1" strokeWidth={1} listening={false} />,
      );
    }
    for (let y = 0; y <= labelHpx + 0.1; y += step) {
      gridLines.push(
        <Line key={`gy${y}`} name="grid" points={[0, y, labelWpx, y]} stroke="#cbd5e1" strokeWidth={1} listening={false} />,
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

  const editingEl = editingTextId
    ? elements.find((e) => e.id === editingTextId && e.type === 'text')
    : null;

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
              width={labelWpx}
              height={labelHpx}
              fill="#ffffff"
              shadowBlur={12}
              shadowColor="#0f172a"
              shadowOpacity={0.25}
            />
            {label.backgroundImage?.visible && bgImage && (
              <KImage
                name="bg-image"
                image={bgImage}
                width={labelWpx}
                height={labelHpx}
                opacity={label.backgroundImage.opacity}
                listening={false}
              />
            )}
            {gridLines}
            {elements.map((el) => (
              <ElementNode key={el.id} element={el} />
            ))}
            {guides.map((g) => (
              <Line
                key={g.id}
                points={
                  g.axis === 'x' ? [0, 0, 0, labelHpx] : [0, 0, labelWpx, 0]
                }
                x={g.axis === 'x' ? g.posMm * zoom : 0}
                y={g.axis === 'y' ? g.posMm * zoom : 0}
                stroke="#06b6d4"
                strokeWidth={1}
                dash={[5, 4]}
                hitStrokeWidth={9}
                draggable
                dragBoundFunc={(p) => ({
                  x: g.axis === 'x' ? p.x : pan.x,
                  y: g.axis === 'y' ? p.y : pan.y,
                })}
                onDragMove={(e) =>
                  moveGuide(g.id, (g.axis === 'x' ? e.target.x() : e.target.y()) / zoom)
                }
                onDblClick={() => removeGuide(g.id)}
                onMouseEnter={() => {
                  const c = stageRef.current?.container();
                  if (c) c.style.cursor = g.axis === 'x' ? 'ew-resize' : 'ns-resize';
                }}
                onMouseLeave={() => {
                  const c = stageRef.current?.container();
                  if (c) c.style.cursor = 'default';
                }}
              />
            ))}
            {snapGuides.x.map((gx, i) => (
              <Line
                key={`sx${i}`}
                points={[gx * zoom, -20, gx * zoom, labelHpx + 20]}
                stroke="#ec4899"
                strokeWidth={1}
                listening={false}
              />
            ))}
            {snapGuides.y.map((gy, i) => (
              <Line
                key={`sy${i}`}
                points={[-20, gy * zoom, labelWpx + 20, gy * zoom]}
                stroke="#ec4899"
                strokeWidth={1}
                listening={false}
              />
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

      {editingEl && editingEl.type === 'text' && (
        <TextEditOverlay
          key={editingEl.id}
          left={pan.x + editingEl.xMm * zoom}
          top={pan.y + editingEl.yMm * zoom}
          width={editingEl.widthMm * zoom}
          height={editingEl.heightMm * zoom}
          fontSize={dotToMm(editingEl.fontHeightDot, project.printerProfile.dpi) * zoom}
          value={editingEl.content}
          id={editingEl.id}
        />
      )}
    </div>
  );
}

function TextEditOverlay({
  left,
  top,
  width,
  height,
  fontSize,
  value,
  id,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  value: string;
  id: string;
}) {
  const updateElement = useStore((s) => s.updateElement);
  const setEditingTextId = useStore((s) => s.setEditingTextId);
  const pushHistory = useStore((s) => s.pushHistory);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    pushHistory('textedit');
    ref.current?.focus();
    ref.current?.select();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <textarea
      ref={ref}
      defaultValue={value}
      onChange={(e) => updateElement(id, { content: e.target.value }, { history: false })}
      onBlur={() => setEditingTextId(null)}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault();
          setEditingTextId(null);
        }
      }}
      style={{
        position: 'absolute',
        left,
        top,
        width: Math.max(60, width),
        height: Math.max(24, height),
        fontSize: Math.max(8, fontSize),
        lineHeight: 1.15,
        padding: 0,
        border: '2px solid var(--accent)',
        borderRadius: 2,
        resize: 'none',
        zIndex: 10,
        background: '#fff',
        color: '#111',
        fontFamily: "'Pretendard', 'Malgun Gothic', sans-serif",
      }}
    />
  );
}

function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
}
