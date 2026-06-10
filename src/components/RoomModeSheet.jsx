const MODES = [
  { key: "normal", label: "Normal", icon: "🎤", hint: "Classic voice chat" },
  { key: "acquaint", label: "Acquaint", icon: "💬", hint: "Meet new friends" },
  { key: "auction", label: "Auction", icon: "🔨", hint: "Bid for the mic" },
  { key: "video", label: "Video", icon: "📹", hint: "Watch together" },
  { key: "games", label: "Games", icon: "🎮", hint: "Play mini-games" },
];

export default function RoomModeSheet({ currentMode, canEdit, onPick, onClose }) {
  return (
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div className="room-mode-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 className="room-mode-title">Room mode</h3>
        <p className="room-mode-hint">
          {canEdit ? "Pick a mode for this room" : "Current room mode"}
        </p>
        <div className="room-mode-grid">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`room-mode-btn ${currentMode === m.key ? "room-mode-btn--active" : ""}`}
              disabled={!canEdit}
              onClick={() => canEdit && onPick(m.key)}
            >
              <span className="room-mode-icon">{m.icon}</span>
              <span className="room-mode-label">{m.label}</span>
              <span className="room-mode-sub">{m.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
