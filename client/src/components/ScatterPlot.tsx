import { useRef, useEffect, useState, useCallback } from 'react';
import type { ProjectionPoint } from '../types';

const TYPE_COLORS: Record<string, string> = {
  note: '#3b82f6',
  decision: '#f59e0b',
  observation: '#22c55e',
  fact: '#a78bfa',
  reminder: '#f43f5e',
  document: '#6366f1',
};

const DEFAULT_COLOR = '#5c5c66';
const POINT_RADIUS = 5;
const HOVER_RADIUS = 8;

interface ScatterPlotProps {
  points: ProjectionPoint[];
  onPointClick?: (hash: string) => void;
  width?: number;
  height?: number;
  colorMap?: Record<string, string>;
}

function getColor(type: string | null, hash?: string, colorMap?: Record<string, string>): string {
  if (colorMap && hash && colorMap[hash]) return colorMap[hash];
  return TYPE_COLORS[type || ''] || DEFAULT_COLOR;
}

export function ScatterPlot({ points, onPointClick, width = 900, height = 500, colorMap }: ScatterPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [transform, setTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Normaliser les coordonnees dans le canvas
  const padding = 40;
  const normalizeX = useCallback((x: number) => {
    if (points.length < 2) return width / 2;
    const xs = points.map(p => p.x);
    const min = Math.min(...xs);
    const max = Math.max(...xs);
    const range = max - min || 1;
    return padding + ((x - min) / range) * (width - 2 * padding);
  }, [points, width]);

  const normalizeY = useCallback((y: number) => {
    if (points.length < 2) return height / 2;
    const ys = points.map(p => p.y);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const range = max - min || 1;
    return padding + ((y - min) / range) * (height - 2 * padding);
  }, [points, height]);

  // Rendu canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resolution haute DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Fond
    ctx.fillStyle = 'var(--bg-surface)';
    ctx.fillRect(0, 0, width, height);

    // Fond explicite (CSS var non supportee dans canvas)
    const computedBg = getComputedStyle(canvas).getPropertyValue('--bg-surface').trim() || '#1a1a1e';
    ctx.fillStyle = computedBg;
    ctx.fillRect(0, 0, width, height);

    // Appliquer la transformation
    ctx.save();
    ctx.translate(transform.offsetX, transform.offsetY);
    ctx.scale(transform.scale, transform.scale);

    // Dessiner les points
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const px = normalizeX(p.x);
      const py = normalizeY(p.y);
      const color = getColor(p.memory_type, p.content_hash, colorMap);
      const isHovered = i === hoveredIndex;
      const r = isHovered ? HOVER_RADIUS : POINT_RADIUS;

      // Glow effect
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(px, py, r + 6, 0, 2 * Math.PI);
        ctx.fillStyle = color + '30';
        ctx.fill();
      }

      // Glow subtil
      ctx.beginPath();
      ctx.arc(px, py, r + 3, 0, 2 * Math.PI);
      ctx.fillStyle = color + '20';
      ctx.fill();

      // Cercle principal
      ctx.beginPath();
      ctx.arc(px, py, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Bordure sur hover
      if (isHovered) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    ctx.restore();

    // Tooltip pour le point hovered
    if (hoveredIndex !== null && hoveredIndex < points.length) {
      const p = points[hoveredIndex];
      const px = normalizeX(p.x) * transform.scale + transform.offsetX;
      const py = normalizeY(p.y) * transform.scale + transform.offsetY;

      const tooltipText = p.content;
      const typeText = p.memory_type || 'sans type';
      const tagsText = p.tags.length > 0 ? p.tags.join(', ') : '';

      ctx.font = '12px Inter, system-ui, sans-serif';
      const textWidth = Math.max(
        ctx.measureText(tooltipText).width,
        ctx.measureText(typeText).width,
        tagsText ? ctx.measureText(tagsText).width : 0
      );

      const tooltipW = textWidth + 20;
      const tooltipH = tagsText ? 58 : 42;
      let tooltipX = px + 12;
      let tooltipY = py - tooltipH / 2;

      // Garder le tooltip dans le canvas
      if (tooltipX + tooltipW > width) tooltipX = px - tooltipW - 12;
      if (tooltipY < 0) tooltipY = 4;
      if (tooltipY + tooltipH > height) tooltipY = height - tooltipH - 4;

      // Fond du tooltip
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, tooltipW, tooltipH, 6);
      ctx.fill();

      // Texte du tooltip
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillText(tooltipText, tooltipX + 10, tooltipY + 16);

      ctx.fillStyle = getColor(p.memory_type);
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.fillText(typeText, tooltipX + 10, tooltipY + 32);

      if (tagsText) {
        ctx.fillStyle = '#8b8b97';
        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.fillText(tagsText, tooltipX + 10, tooltipY + 48);
      }
    }
  }, [points, hoveredIndex, transform, width, height, normalizeX, normalizeY]);

  // Hit detection souris
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setTransform(t => ({
        ...t,
        offsetX: t.offsetX + dx,
        offsetY: t.offsetY + dy,
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - transform.offsetX) / transform.scale;
    const my = (e.clientY - rect.top - transform.offsetY) / transform.scale;

    let found = -1;
    for (let i = 0; i < points.length; i++) {
      const px = normalizeX(points[i].x);
      const py = normalizeY(points[i].y);
      const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
      if (dist < HOVER_RADIUS + 2) {
        found = i;
        break;
      }
    }

    setHoveredIndex(found >= 0 ? found : null);
    canvas.style.cursor = found >= 0 ? 'pointer' : 'grab';
  }, [points, transform, isDragging, dragStart, normalizeX, normalizeY]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPointClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - transform.offsetX) / transform.scale;
    const my = (e.clientY - rect.top - transform.offsetY) / transform.scale;

    for (let i = 0; i < points.length; i++) {
      const px = normalizeX(points[i].x);
      const py = normalizeY(points[i].y);
      const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
      if (dist < HOVER_RADIUS + 2) {
        onPointClick(points[i].content_hash);
        return;
      }
    }
  }, [points, onPointClick, transform, normalizeX, normalizeY]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(t => ({
      ...t,
      scale: Math.min(Math.max(t.scale * scaleFactor, 0.1), 10),
    }));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="scatter-plot"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        cursor: 'grab',
      }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
