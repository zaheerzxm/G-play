import { useEffect, useMemo, useRef, useState } from "react";
import { emitAck, getSocket } from "../../lib/socket.js";
import { createMoment, uploadSpotlightPhoto } from "../../moments.js";
import CanvasBoard from "./CanvasBoard.jsx";
import DrawToolbar, { BRUSH_SIZES, DRAW_COLORS } from "./DrawToolbar.jsx";
import { formatCompactNumber } from "../../formatCompact.js";

function Countdown({ endsAt }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.ceil(((endsAt ?? 0) - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [endsAt]);
  return <span className="game-timer">{left}s</span>;
}

export default function DrawGuessGame({
  roomId,
  userId,
  userName,
  gameState,
  onLocalStroke,
  onLocalClear,
}) {
  const canvasRef = useRef(null);
  const [localStrokes, setLocalStrokes] = useState([]);
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState(DRAW_COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].width);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const isDrawer = gameState?.drawerId === userId;
  const strokes = [...(gameState?.strokes ?? []), ...localStrokes];
  const canDraw = isDrawer && gameState?.phase === "drawing";

  useEffect(() => {
    setLocalStrokes([]);
  }, [gameState?.roundIndex]);

  useEffect(() => {
    const socket = getSocket();
    const onStroke = ({ stroke }) => {
      if (stroke) setLocalStrokes((prev) => [...prev, stroke]);
    };
    const onClear = () => setLocalStrokes([]);
    socket.on("drawStroke", onStroke);
    socket.on("clearCanvas", onClear);
    return () => {
      socket.off("drawStroke", onStroke);
      socket.off("clearCanvas", onClear);
    };
  }, []);

  const leaderboard = useMemo(() => {
    const scores = gameState?.scores ?? {};
    return (gameState?.players ?? [])
      .map((p) => ({ ...p, score: scores[p.userId] ?? 0 }))
      .sort((a, b) => b.score - a.score);
  }, [gameState]);

  function handleStroke(stroke) {
    setLocalStrokes((prev) => [...prev, stroke]);
    onLocalStroke?.(stroke);
  }

  async function handleClear() {
    const res = await emitAck("clearCanvas", { roomId, userId });
    if (res.ok) {
      setLocalStrokes([]);
      onLocalClear?.();
    }
  }

  async function handleSaveSpotlight() {
    setSaveBusy(true);
    setSaveMsg(null);
    try {
      const blob = await canvasRef.current?.exportBlob?.("image/png");
      if (!blob) throw new Error("Could not export drawing");
      const file = new File([blob], `draw-${Date.now()}.png`, { type: "image/png" });
      const url = await uploadSpotlightPhoto(userId, file);
      await createMoment(userId, {
        content: `${userName || "Player"} shared a Draw & Guess sketch 🎨`,
        imageUrl: url,
      });
      setSaveMsg("Shared to Spotlight!");
    } catch (e) {
      setSaveMsg(e.message ?? "Could not share");
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <div className="game-room-panel game-room-panel--draw">
      <header className="draw-game-topbar">
        <div className="draw-game-title">
          <span className="draw-game-icon" aria-hidden>🎨</span>
          <div>
            <h2>Draw & Guess</h2>
            <small>
              Round {(gameState?.roundIndex ?? 0) + 1} · {gameState?.drawerName}
              {isDrawer ? " (you draw)" : ""}
            </small>
          </div>
        </div>
        {gameState?.endsAt && <Countdown endsAt={gameState.endsAt} />}
      </header>

      <div className="draw-game-prompt">
        {isDrawer ? (
          <span>Draw: <strong>{gameState?.word}</strong></span>
        ) : (
          <span className="draw-hint">{gameState?.hint}</span>
        )}
        <span className="draw-game-scores">
          {leaderboard.slice(0, 3).map((row) => (
            <em key={row.userId}>{row.userName} {formatCompactNumber(row.score)}</em>
          ))}
        </span>
      </div>

      <div className="draw-game-body">
        <CanvasBoard
          ref={canvasRef}
          strokes={strokes}
          canDraw={canDraw}
          tool={tool}
          color={color}
          brushSize={brushSize}
          onStroke={handleStroke}
        />
        {!isDrawer && (
          <p className="draw-chat-hint-overlay">Guess in chat ↓ — fastest correct answer wins the most points</p>
        )}
      </div>

      {canDraw && (
        <DrawToolbar
          tool={tool}
          color={color}
          brushSize={brushSize}
          onToolChange={setTool}
          onColorChange={setColor}
          onBrushSizeChange={setBrushSize}
          onClear={handleClear}
          onSaveSpotlight={handleSaveSpotlight}
          saveBusy={saveBusy}
        />
      )}

      {saveMsg && <p className="draw-save-msg">{saveMsg}</p>}
    </div>
  );
}
