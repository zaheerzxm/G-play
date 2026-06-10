import { useState } from "react";

export const DRAW_COLORS = [
  "#18181b",
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#ffffff",
];

export const BRUSH_SIZES = [
  { id: "s", label: "S", width: 2 },
  { id: "m", label: "M", width: 5 },
  { id: "l", label: "L", width: 10 },
];

export default function DrawToolbar({
  tool,
  color,
  brushSize,
  onToolChange,
  onColorChange,
  onBrushSizeChange,
  onClear,
  onSaveSpotlight,
  saveBusy,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="draw-toolbar">
      <div className="draw-toolbar-main">
        <button
          type="button"
          className={`draw-tool-btn ${tool === "brush" ? "draw-tool-btn--active" : ""}`}
          onClick={() => onToolChange("brush")}
          title="Brush"
        >
          ✏️
        </button>
        <button
          type="button"
          className={`draw-tool-btn ${tool === "erase" ? "draw-tool-btn--active" : ""}`}
          onClick={() => onToolChange("erase")}
          title="Eraser"
        >
          🧽
        </button>

        <div className="draw-toolbar-sizes">
          {BRUSH_SIZES.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`draw-size-btn ${brushSize === b.width ? "draw-size-btn--active" : ""}`}
              onClick={() => onBrushSizeChange(b.width)}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="draw-toolbar-colors">
          {DRAW_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`draw-color-swatch ${color === c ? "draw-color-swatch--active" : ""}`}
              style={{ background: c }}
              onClick={() => onColorChange(c)}
              title={c}
            />
          ))}
        </div>
      </div>

      <div className="draw-toolbar-side">
        <button
          type="button"
          className="draw-tool-btn draw-tool-btn--save"
          onClick={onSaveSpotlight}
          disabled={saveBusy}
          title="Share to Spotlight"
        >
          {saveBusy ? "…" : "↗"}
        </button>
        <button
          type="button"
          className="draw-tool-btn"
          onClick={() => setMenuOpen((v) => !v)}
          title="More"
        >
          ⋯
        </button>
        {menuOpen && (
          <div className="draw-toolbar-menu">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                if (window.confirm("Clear the whole canvas? This cannot be undone.")) {
                  onClear?.();
                }
              }}
            >
              Clear canvas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
