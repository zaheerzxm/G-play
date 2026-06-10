import { useState } from "react";
import { createPortal } from "react-dom";

export default function KickUserDialog({ userName, onConfirm, onClose }) {
  const [addToBlacklist, setAddToBlacklist] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleKick() {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm(addToBlacklist);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="profile-card-backdrop" onClick={onClose}>
      <div className="kick-user-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="kick-user-dialog-title">Kick {userName}?</h3>
        <p className="kick-user-dialog-body">
          They will leave this room and can rejoin after 5 minutes unless you add them to the room
          blacklist.
        </p>
        <label className="kick-user-dialog-check">
          <input
            type="checkbox"
            checked={addToBlacklist}
            onChange={(e) => setAddToBlacklist(e.target.checked)}
            disabled={busy}
          />
          <span>Add to room blacklist</span>
        </label>
        <p className="kick-user-dialog-hint">
          Blacklisted users stay out until you remove them in Settings → Blacklist.
        </p>
        <div className="kick-user-dialog-actions">
          <button type="button" className="kick-user-dialog-cancel" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="kick-user-dialog-kick" onClick={handleKick} disabled={busy}>
            {busy ? "Kicking…" : "Kick"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
