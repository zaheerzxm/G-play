import { useState } from "react";
import { formatCoins, ROOM_CREATE_COST } from "../gifts.js";
import CoinIcon from "./CoinIcon.jsx";

export default function CreateRoomSheet({
  coins,
  isSuperAdmin,
  busy,
  onClose,
  onCreateTemp,
  onCreateAdvance,
}) {
  const [mode, setMode] = useState(null);
  const [roomName, setRoomName] = useState("");
  const canAdvance = isSuperAdmin || coins >= ROOM_CREATE_COST;

  async function handleAdvance() {
    const name = roomName.trim();
    if (!name) return;
    await onCreateAdvance(name);
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="create-room-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="sheet-header">
          <button type="button" className="sheet-back" onClick={onClose} aria-label="Close">‹</button>
          <h2>Create room</h2>
        </header>

        {!mode && (
          <div className="create-room-options">
            <button type="button" className="create-room-option" disabled={busy} onClick={() => setMode("temp")}>
              <strong>Temp party room</strong>
              <span>Quick voice chat — free, auto-closes when empty</span>
            </button>
            <button
              type="button"
              className="create-room-option create-room-option--gold"
              disabled={busy || !canAdvance}
              onClick={() => setMode("advance")}
            >
              <strong>Advanced room</strong>
              <span>
                Your permanent room · <CoinIcon size="sm" /> {formatCoins(ROOM_CREATE_COST)} gold
              </span>
            </button>
          </div>
        )}

        {mode === "temp" && (
          <div className="create-room-form">
            <p className="create-room-hint">Starts a temporary party room right away.</p>
            <button type="button" className="create-room-submit" disabled={busy} onClick={onCreateTemp}>
              {busy ? "Creating…" : "Start temp room"}
            </button>
            <button type="button" className="text-btn" onClick={() => setMode(null)}>Back</button>
          </div>
        )}

        {mode === "advance" && (
          <div className="create-room-form">
            <label className="field-label">Room name</label>
            <input
              type="text"
              placeholder="My voice room"
              maxLength={32}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <p className="create-room-hint">
              Costs <CoinIcon size="sm" /> {formatCoins(ROOM_CREATE_COST)}. You become the room admin.
            </p>
            <button
              type="button"
              className="create-room-submit"
              disabled={busy || roomName.trim().length < 2}
              onClick={handleAdvance}
            >
              {busy ? "Creating…" : "Create advanced room"}
            </button>
            <button type="button" className="text-btn" onClick={() => setMode(null)}>Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
