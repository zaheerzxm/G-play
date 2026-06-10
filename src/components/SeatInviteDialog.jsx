import { useState } from "react";
import { createPortal } from "react-dom";

export default function SeatInviteDialog({ inviterName, seatNumber, onAccept, onReject, onClose }) {
  const [busy, setBusy] = useState(false);

  async function handleAccept() {
    if (busy) return;
    setBusy(true);
    try {
      await onAccept();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (busy) return;
    setBusy(true);
    try {
      await onReject();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="profile-card-backdrop" onClick={onClose}>
      <div className="kick-user-dialog seat-invite-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="kick-user-dialog-title">Seat invite</h3>
        <p className="kick-user-dialog-body">
          {inviterName ?? "Host"} invited you to seat {seatNumber}. Accept to take the mic, or decline to
          stay in the audience.
        </p>
        <div className="kick-user-dialog-actions seat-invite-dialog-actions">
          <button type="button" className="kick-user-dialog-cancel" onClick={handleReject} disabled={busy}>
            {busy ? "…" : "Decline"}
          </button>
          <button type="button" className="kick-user-dialog-kick seat-invite-accept" onClick={handleAccept} disabled={busy}>
            {busy ? "…" : "Accept"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
