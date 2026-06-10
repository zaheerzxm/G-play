import { useCallback, useEffect, useImperativeHandle, useRef, forwardRef } from "react";

function pct(v, size) {
  return (v / 100) * size;
}

function paintStroke(ctx, stroke, w, h) {
  if (stroke.x0 == null) return;
  const isErase = stroke.type === "erase";
  ctx.globalCompositeOperation = isErase ? "destination-out" : "source-over";
  ctx.strokeStyle = isErase ? "rgba(0,0,0,1)" : (stroke.color ?? "#18181b");
  ctx.lineWidth = stroke.width ?? 2.5;
  ctx.beginPath();
  ctx.moveTo(pct(stroke.x0, w), pct(stroke.y0, h));
  ctx.lineTo(pct(stroke.x1, w), pct(stroke.y1, h));
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
}

const CanvasBoard = forwardRef(function CanvasBoard(
  { strokes = [], canDraw, tool, color, brushSize, onStroke },
  ref,
) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastRef = useRef(null);
  const sizeRef = useRef({ w: 1, h: 1 });
  const toolRef = useRef({ tool, color, brushSize });
  toolRef.current = { tool, color, brushSize };

  useImperativeHandle(ref, () => ({
    exportBlob(type = "image/png") {
      const canvas = canvasRef.current;
      if (!canvas) return Promise.resolve(null);
      return new Promise((resolve) => canvas.toBlob(resolve, type));
    },
  }));

  const repaint = useCallback((list) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { w, h } = sizeRef.current;
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const s of list) paintStroke(ctx, s, w, h);
  }, []);

  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const fitCanvas = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const rect = wrap.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    const dpr = window.devicePixelRatio || 1;

    sizeRef.current = { w, h };
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    repaint(strokesRef.current);
  }, [repaint]);

  useEffect(() => {
    fitCanvas();
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const ro = new ResizeObserver(() => fitCanvas());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [fitCanvas]);

  useEffect(() => {
    repaint(strokes);
  }, [strokes, repaint]);

  function pointFromEvent(e) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }

  function startDraw(e) {
    if (!canDraw) return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastRef.current = pointFromEvent(e);
  }

  function moveDraw(e) {
    if (!canDraw || !drawingRef.current || !lastRef.current) return;
    e.preventDefault();
    const p = pointFromEvent(e);
    const { tool: t, color: c, brushSize: w } = toolRef.current;
    const stroke = {
      type: t === "erase" ? "erase" : "line",
      x0: lastRef.current.x,
      y0: lastRef.current.y,
      x1: p.x,
      y1: p.y,
      color: c,
      width: w,
    };
    onStroke?.(stroke);
    lastRef.current = p;
  }

  function endDraw(e) {
    if (e?.pointerId != null) {
      canvasRef.current?.releasePointerCapture?.(e.pointerId);
    }
    drawingRef.current = false;
    lastRef.current = null;
  }

  return (
    <div ref={wrapRef} className="draw-canvas-wrap">
      <canvas
        ref={canvasRef}
        className="draw-canvas"
        onPointerDown={startDraw}
        onPointerMove={moveDraw}
        onPointerUp={endDraw}
        onPointerCancel={endDraw}
        onPointerLeave={endDraw}
      />
    </div>
  );
});

export default CanvasBoard;
