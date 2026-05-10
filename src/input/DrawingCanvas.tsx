import { useRef, useState, useCallback, useEffect } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import type { DrawingPoint } from '../types';

const MAX_STROKES = 4;
const MIN_STROKE_LENGTH = 10;

function getDistance(points: DrawingPoint[]): number {
  let dist = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    dist += Math.sqrt(dx * dx + dy * dy);
  }
  return dist;
}

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<DrawingPoint[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const submitDrawing = useSessionStore((s) => s.submitDrawing);

  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent): DrawingPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number, pressure = 0.5;
    if ('touches' in e) {
      const touch = e.touches[0] ?? e.changedTouches[0];
      if (!touch) return null;
      clientX = touch.clientX; clientY = touch.clientY;
      pressure = (touch as unknown as { force?: number }).force ?? 0.5;
    } else {
      clientX = e.clientX; clientY = e.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top, pressure, timestamp: Date.now() };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (strokes.length >= MAX_STROKES) return;
    e.preventDefault();
    const pt = getPoint(e);
    if (!pt) return;
    setIsDrawing(true);
    setCurrentStroke([pt]);
  }, [getPoint, strokes.length]);

  const moveDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pt = getPoint(e);
    if (!pt) return;
    setCurrentStroke((prev) => [...prev, pt]);
  }, [isDrawing, getPoint]);

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (getDistance(currentStroke) >= MIN_STROKE_LENGTH) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
  }, [isDrawing, currentStroke]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawStroke = (points: DrawingPoint[]) => {
      if (points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineWidth = 2 + points[i].pressure * 3;
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    };
    strokes.forEach(drawStroke);
    if (currentStroke.length > 0) drawStroke(currentStroke);
  }, [strokes, currentStroke]);

  return (
    <div className="drawing-canvas">
      <canvas
        ref={canvasRef}
        className="drawing-canvas__canvas"
        onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw}
        aria-label="情绪画线区域" role="img"
      />
      <div className="drawing-canvas__footer">
        <span className="drawing-canvas__count">{strokes.length}/{MAX_STROKES} 条线段</span>
        <button className="btn btn--ghost" onClick={() => { setStrokes([]); setCurrentStroke([]); }} disabled={strokes.length === 0}>清除</button>
        <button className="btn btn--primary" onClick={() => { submitDrawing(strokes); setStrokes([]); }} disabled={strokes.length === 0}>提交</button>
      </div>
    </div>
  );
}
