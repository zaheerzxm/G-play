import { createPortal } from "react-dom";

export default function ModeConfirmSheet({ mode, onConfirm, onCancel }) {
  const label = mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : "Normal";
  return createPortal(
    <div className="mode-confirm-backdrop mode-confirm-backdrop--portal" onClick={onCancel}>
      <div className="mode-confirm-sheet" onClick={(e) => e.stopPropagation()}>
        <p className="mode-confirm-text">
          By switching the mode all the players using the mic will stand up. Switch to{" "}
          <strong>{label}</strong> anyway?
        </p>
        <div className="mode-confirm-actions">
          <button type="button" className="mode-confirm-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="mode-confirm-ok" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
