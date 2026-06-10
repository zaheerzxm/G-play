import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function SeatActionSheet({ variant = "default", title, subtitle, actions, onClose }) {
  const [mounted, setMounted] = useState(false);
  const mainActions = actions.filter((a) => a.label !== "Cancel");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (variant === "G-play") {
    return createPortal(
      <div className="G-play-sheet-backdrop" onClick={onClose}>
        <div className="G-play-sheet" onClick={(e) => e.stopPropagation()}>
          {mainActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`G-play-sheet-btn ${action.danger ? "G-play-sheet-btn--danger" : ""}`}
              disabled={action.disabled}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
          <button type="button" className="G-play-sheet-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {title && <p className="sheet-title">{title}</p>}
        {subtitle && <p className="sheet-subtitle">{subtitle}</p>}
        <div className="sheet-actions">
          {mainActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`sheet-btn ${action.danger ? "sheet-btn--danger" : ""} ${action.primary ? "sheet-btn--primary" : ""}`}
              disabled={action.disabled}
              onClick={action.onClick}
            >
              {action.icon && <span className="sheet-btn-icon">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
