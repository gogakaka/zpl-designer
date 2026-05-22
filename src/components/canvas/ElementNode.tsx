import Konva from 'konva';
import { useRef } from 'react';
import { Ellipse, Group, Image as KImage, Line as KLine, Rect, Text as KText } from 'react-konva';
import { render1d, render2d } from '../../barcodes/render';
import { useLoadedImage } from '../../hooks/useImage';
import { useStore } from '../../state/store';
import type { Dpi } from '../../types';
import type {
  Barcode1DElement,
  Barcode2DElement,
  BoxElement,
  CircleElement,
  DesignElement,
  DiagonalElement,
  EllipseElement,
  ImageElement,
  LineElement,
  Rotation,
  TableElement,
  TextElement,
} from '../../types';
import { dotToMm } from '../../units';
import { resolveElement, sampleValues } from '../../preview';

const MIN_MM = 1;

function shapeFill(color: 'B' | 'W'): string {
  return color === 'W' ? '#ffffff' : '#111111';
}

function TextShape({ el, w, h, dpi, zoom }: ShapeProps<TextElement>) {
  const fontSize = Math.max(2, dotToMm(el.fontHeightDot, dpi) * zoom);
  const align = el.align === 'C' ? 'center' : el.align === 'R' ? 'right' : 'left';
  return (
    <>
      {el.reverse && <Rect width={w} height={h} fill="#111111" />}
      <KText
        width={w}
        height={h}
        text={el.content || ' '}
        fontSize={fontSize}
        fontFamily="'Pretendard', 'Malgun Gothic', sans-serif"
        fill={el.reverse ? '#ffffff' : '#111111'}
        align={align}
        verticalAlign="top"
        wrap={el.multiline ? 'word' : 'none'}
        lineHeight={1.15}
        listening={false}
      />
    </>
  );
}

function BarcodeShape({
  el,
  w,
  h,
}: {
  el: Barcode1DElement | Barcode2DElement;
  w: number;
  h: number;
}) {
  const result =
    el.type === 'barcode1d' ? render1d(el) : render2d(el);
  if (!result.canvas) {
    return (
      <>
        <Rect width={w} height={h} stroke="#dc2626" dash={[4, 3]} />
        <KText
          width={w}
          height={h}
          text={'바코드 오류'}
          fontSize={Math.min(12, h / 2)}
          fill="#dc2626"
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      </>
    );
  }
  return <KImage image={result.canvas} width={w} height={h} listening={false} />;
}

function ImageShape({ el, w, h }: { el: ImageElement; w: number; h: number }) {
  const src = el.mono?.previewDataUrl || el.sourceDataUrl;
  const img = useLoadedImage(src || undefined);
  if (!src || !img) {
    return (
      <>
        <Rect width={w} height={h} stroke="#94a3b8" dash={[4, 3]} fill="#f1f5f9" />
        <KText
          width={w}
          height={h}
          text={'이미지 없음'}
          fontSize={Math.min(12, h / 3)}
          fill="#94a3b8"
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      </>
    );
  }
  return <KImage image={img} width={w} height={h} listening={false} />;
}

function TableShape({ el, zoom, dpi }: { el: TableElement; zoom: number; dpi: Dpi }) {
  const colX: number[] = [0];
  for (const c of el.colWidthsMm) colX.push(colX[colX.length - 1] + c * zoom);
  const rowY: number[] = [0];
  for (const r of el.rowHeightsMm) rowY.push(rowY[rowY.length - 1] + r * zoom);
  const totalW = colX[colX.length - 1];
  const totalH = rowY[rowY.length - 1];
  const stroke = Math.max(1, dotToMm(el.borderThicknessDot, dpi) * zoom);
  const fontSize = Math.max(4, dotToMm(el.fontHeightDot, dpi) * zoom);
  const lines: React.ReactNode[] = [];
  if (el.showInnerBorders) {
    for (let c = 1; c < el.cols; c++) {
      lines.push(
        <KLine key={`c${c}`} points={[colX[c], 0, colX[c], totalH]} stroke="#111" strokeWidth={stroke} />,
      );
    }
    for (let r = 1; r < el.rows; r++) {
      lines.push(
        <KLine key={`r${r}`} points={[0, rowY[r], totalW, rowY[r]]} stroke="#111" strokeWidth={stroke} />,
      );
    }
  }
  const texts = el.cells
    .filter((cell) => cell.text && cell.row < el.rows && cell.col < el.cols)
    .map((cell, i) => (
      <KText
        key={`t${i}`}
        x={colX[cell.col] + 2}
        y={rowY[cell.row] + 2}
        width={(el.colWidthsMm[cell.col] || 1) * zoom - 4}
        height={(el.rowHeightsMm[cell.row] || 1) * zoom - 4}
        text={cell.text}
        fontSize={fontSize}
        fill="#111"
        align={cell.align === 'C' ? 'center' : cell.align === 'R' ? 'right' : 'left'}
        listening={false}
      />
    ));
  return (
    <>
      <Rect width={totalW} height={totalH} stroke="#111" strokeWidth={stroke} />
      {lines}
      {texts}
    </>
  );
}

interface ShapeProps<T extends DesignElement> {
  el: T;
  w: number;
  h: number;
  dpi: Dpi;
  zoom: number;
}

function renderShape(el: DesignElement, w: number, h: number, dpi: Dpi, zoom: number) {
  switch (el.type) {
    case 'text':
      return <TextShape el={el} w={w} h={h} dpi={dpi} zoom={zoom} />;
    case 'barcode1d':
    case 'barcode2d':
      return <BarcodeShape el={el} w={w} h={h} />;
    case 'image':
      return <ImageShape el={el} w={w} h={h} />;
    case 'table':
      return <TableShape el={el} zoom={zoom} dpi={dpi} />;
    case 'line': {
      const line = el as LineElement;
      return <Rect width={w} height={h} fill={shapeFill(line.color)} />;
    }
    case 'box': {
      const box = el as BoxElement;
      const sw = Math.max(1, dotToMm(box.borderThicknessDot, dpi) * zoom);
      const radius = (box.rounding / 8) * (Math.min(w, h) / 2);
      return (
        <Rect
          width={w}
          height={h}
          cornerRadius={radius}
          stroke={box.color === 'W' ? '#94a3b8' : '#111111'}
          strokeWidth={box.filled ? 0 : sw}
          fill={box.filled ? shapeFill(box.color) : undefined}
          dash={box.color === 'W' && !box.filled ? [4, 3] : undefined}
        />
      );
    }
    case 'circle': {
      const c = el as CircleElement;
      const sw = Math.max(1, dotToMm(c.borderThicknessDot, dpi) * zoom);
      const r = Math.min(w, h) / 2;
      return (
        <Ellipse
          x={w / 2}
          y={h / 2}
          radiusX={r}
          radiusY={r}
          stroke={c.color === 'W' ? '#94a3b8' : '#111111'}
          strokeWidth={c.filled ? 0 : sw}
          fill={c.filled ? shapeFill(c.color) : undefined}
        />
      );
    }
    case 'ellipse': {
      const e = el as EllipseElement;
      const sw = Math.max(1, dotToMm(e.borderThicknessDot, dpi) * zoom);
      return (
        <Ellipse
          x={w / 2}
          y={h / 2}
          radiusX={w / 2}
          radiusY={h / 2}
          stroke={e.color === 'W' ? '#94a3b8' : '#111111'}
          strokeWidth={e.filled ? 0 : sw}
          fill={e.filled ? shapeFill(e.color) : undefined}
        />
      );
    }
    case 'diagonal': {
      const d = el as DiagonalElement;
      const sw = Math.max(1, dotToMm(d.thicknessDot, dpi) * zoom);
      const points = d.lean === 'right' ? [0, h, w, 0] : [0, 0, w, h];
      return <KLine points={points} stroke={shapeFill(d.color)} strokeWidth={sw} />;
    }
  }
}

export function ElementNode({ element }: { element: DesignElement }) {
  const zoom = useStore((s) => s.ui.zoom);
  const dpi = useStore((s) => s.project.printerProfile.dpi);
  const snapToGrid = useStore((s) => s.ui.snapToGrid);
  const gridMm = useStore((s) => s.ui.gridMm);
  const selectedIds = useStore((s) => s.selectedIds);
  const pushHistory = useStore((s) => s.pushHistory);
  const moveBy = useStore((s) => s.moveBy);
  const updateElement = useStore((s) => s.updateElement);
  const selectElement = useStore((s) => s.selectElement);
  const reprocessImage = useStore((s) => s.reprocessImage);
  const previewData = useStore((s) => s.ui.previewData);
  const variables = useStore((s) => s.project.variables);

  const dragLast = useRef({ x: 0, y: 0 });
  const el = element;

  if (!el.visible) return null;

  const w = el.widthMm * zoom;
  const h = el.heightMm * zoom;
  const selected = selectedIds.includes(el.id);
  const snapMm = (v: number) => (snapToGrid ? Math.round(v / gridMm) * gridMm : v);

  const onMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const additive = e.evt.shiftKey;
    if (!selected || additive) selectElement(el.id, additive);
  };

  const onDragStart = () => {
    pushHistory('drag');
    dragLast.current = { x: el.xMm, y: el.yMm };
    if (!selected) selectElement(el.id, false);
  };

  const onDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const xMm = snapMm(node.x() / zoom);
    const yMm = snapMm(node.y() / zoom);
    node.x(xMm * zoom);
    node.y(yMm * zoom);
    const dx = xMm - dragLast.current.x;
    const dy = yMm - dragLast.current.y;
    dragLast.current = { x: xMm, y: yMm };
    const ids = selected && selectedIds.length > 1 ? selectedIds : [el.id];
    moveBy(ids, dx, dy);
  };

  const onTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Group;
    const sx = node.scaleX();
    const sy = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    let rot = Math.round(node.rotation() / 90) * 90;
    rot = (((rot % 360) + 360) % 360) as Rotation;
    node.rotation(rot);
    const patch: Record<string, unknown> = {
      xMm: node.x() / zoom,
      yMm: node.y() / zoom,
      widthMm: Math.max(MIN_MM, el.widthMm * sx),
      heightMm: Math.max(MIN_MM, el.heightMm * sy),
      rotation: rot as Rotation,
    };
    if (el.type === 'table') {
      patch.colWidthsMm = el.colWidthsMm.map((c) => c * sx);
      patch.rowHeightsMm = el.rowHeightsMm.map((r) => r * sy);
    }
    updateElement(el.id, patch);
    if (el.type === 'image') void reprocessImage(el.id);
  };

  const renderEl = previewData ? resolveElement(el, sampleValues(variables)) : el;

  return (
    <Group
      id={el.id}
      name="element"
      x={el.xMm * zoom}
      y={el.yMm * zoom}
      rotation={el.rotation}
      opacity={el.locked ? 0.55 : 1}
      draggable={!el.locked}
      onMouseDown={onMouseDown}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onTransformEnd={onTransformEnd}
    >
      <Rect width={w} height={h} fill="rgba(127,127,127,0.001)" />
      {renderShape(renderEl, w, h, dpi, zoom)}
    </Group>
  );
}
