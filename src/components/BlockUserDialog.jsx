import { useState } from "react";
import { createPortal } from "react-dom";

export default function BlockUserDialog({ userName, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);

  async function handleBlock() {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="profile-card-backdrop" onClick={onClose}>
      <div className="kick-user-dialog block-user-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="kick-user-dialog-title">Block {userName}?</h3>
        <ul className="block-user-dialog-list">
          <li>You will unfriend each other</li>
          <li>You can&apos;t chat in DMs</li>
          <li>You can&apos;t enter each other&apos;s rooms (rooms you own)</li>
          <li>You can still meet in rooms owned by other people</li>
        </ul>
        <p className="kick-user-dialog-hint">This is not a room kick. Use Kick in the mod bar to remove someone from this room.</p>
        <div className="kick-user-dialog-actions">
          <button type="button" className="kick-user-dialog-cancel" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="kick-user-dialog-kick" onClick={handleBlock} disabled={busy}>
            {busy ? "Blocking…" : "Block"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
