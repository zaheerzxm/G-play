import { useCallback, useEffect, useState } from "react";
import { connectSocket, emitAck, getSocket } from "../lib/socket.js";
import CanvasBoard from "../games/draw/CanvasBoard.jsx";
import DrawToolbar, { BRUSH_SIZES, DRAW_COLORS } from "../games/draw/DrawToolbar.jsx";

export default function DrawingWidget({
  roomId,
  userId,
  userName,
  ownerUserId,
  canManage,
  syncState,
  onCloseSystemMessage,
}) {
  const [open, setOpen] = useState(false);
  const [serverStrokes, setServerStrokes] = useState([]);
  const [localStrokes, setLocalStrokes] = useState([]);
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState(DRAW_COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].width);
  const [closing, setClosing] = useState(false);

  const applyState = useCallback((state) => {
    if (!state) return;
    setOpen(Boolean(state.open));
    setServerStrokes(Array.isArray(state.strokes) ? state.strokes : []);
    setLocalStrokes([]);
  }, []);

  useEffect(() => {
    if (!roomId || !userId) return undefined;

    let active = true;
    const socket = connectSocket();
    if (!socket) return undefined;

    const onState = (state) => {
      if (!active) return;
      applyState(state);
    };

    const onStroke = ({ stroke }) => {
      if (!active || !stroke) return;
      setLocalStrokes((prev) => [...prev, stroke]);
    };

    const onClear = () => {
      if (!active) return;
      setServerStrokes([]);
      setLocalStrokes([]);
    };

    socket.on("drawingWidgetState", onState);
    socket.on("drawingWidgetStroke", onStroke);
    socket.on("drawingWidgetClear", onClear);

    emitAck("joinRoom", {
      roomId,
      userId,
      userName: userName || "Player",
      isHost: canManage,
      canManageGames: canManage,
      ownerUserId,
    }).then((res) => {
      if (!active || !res.ok) return;
      applyState(res.state?.drawingWidget);
    });

    return () => {
      active = false;
      socket.off("drawingWidgetState", onState);
      socket.off("drawingWidgetStroke", onStroke);
      socket.off("drawingWidgetClear", onClear);
    };
  }, [roomId, userId, userName, canManage, ownerUserId, applyState]);

  useEffect(() => {
    if (!syncState?.open) return;
    applyState({ open: syncState.open, strokes: syncState.strokes ?? [] });
  }, [syncState?.at, syncState, applyState]);

  const strokes = [...serverStrokes, ...localStrokes];
  const canDraw = open;

  function handleStroke(stroke) {
    setLocalStrokes((prev) => [...prev, stroke]);
    getSocket()?.emit("drawingWidgetStroke", { roomId, userId, stroke });
  }

  async function handleClear() {
    const res = await emitAck("drawingWidgetClear", { roomId, userId });
    if (res.ok) {
      setServerStrokes([]);
      setLocalStrokes([]);
    }
  }

  async function handleClose() {
    if (!canManage || closing) return;
    setClosing(true);
    try {
      await emitAck("joinRoom", {
        roomId,
        userId,
        userName: userName || "Player",
        isHost: canManage,
        canManageGames: canManage,
        ownerUserId,
      });
      const res = await emitAck("drawingWidgetClose", { roomId, userId });
      if (res.ok) {
        setOpen(false);
        setServerStrokes([]);
        setLocalStrokes([]);
        await onCloseSystemMessage?.();
      }
    } finally {
      setClosing(false);
    }
  }

  if (!open) return null;

  return (
    <div className="drawing-widget-overlay" role="dialog" aria-label="Collaborative drawing board">
      <div className="drawing-widget-backdrop" aria-hidden />
      <div className="drawing-widget-panel">
        <header className="drawing-widget-header">
          <h2 className="drawing-widget-title">Draw together</h2>
          {canManage && (
            <button
              type="button"
              className="drawing-widget-close"
              onClick={handleClose}
              disabled={closing}
              aria-label="Close drawing board"
            >
              ✕
            </button>
          )}
        </header>
        <div className="drawing-widget-canvas">
          <CanvasBoard
            strokes={strokes}
            canDraw={canDraw}
            tool={tool}
            color={color}
            brushSize={brushSize}
            onStroke={handleStroke}
          />
        </div>
        <DrawToolbar
          tool={tool}
          color={color}
          brushSize={brushSize}
          onToolChange={setTool}
          onColorChange={setColor}
          onBrushSizeChange={setBrushSize}
          onClear={canManage ? handleClear : undefined}
        />
      </div>
    </div>
  );
}
