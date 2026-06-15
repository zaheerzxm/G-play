import { useState } from "react";

export default function RoomPasswordSheet({ room, onSubmit, onClose, error: externalError }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (busy || !password.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit?.(password.trim());
    } catch (err) {
      setError(err?.message ?? "Incorrect password");
    } finally {
      setBusy(false);
    }
  }

  const message = externalError || error;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="room-password-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="sheet-header">
          <button type="button" className="sheet-back" onClick={onClose} aria-label="Close">‹</button>
          <h2>Room password</h2>
        </header>
        <p className="room-password-hint">
          <strong>{room?.name ?? "Voice room"}</strong> is password protected.
        </p>
        <form className="room-password-form" onSubmit={handleSubmit}>
          <input
            type="password"
            className="room-password-input"
            placeholder="Enter password"
            maxLength={32}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {message && <p className="banner error">{message}</p>}
          <button type="submit" className="room-password-submit" disabled={busy || !password.trim()}>
            {busy ? "Checking…" : "Join room"}
          </button>
        </form>
      </div>
    </div>
  );
}
