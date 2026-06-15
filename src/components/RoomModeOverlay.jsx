import FunctionsGrid from "./FunctionsGrid.jsx";
import {
  IconChats,
  IconGames,
  IconHammer,
  IconVideo,
  IconVoiceRoom,
} from "./NavIcons.jsx";

const MODES = [
  { key: "normal", label: "Normal", Icon: IconVoiceRoom },
  { key: "acquaint", label: "Acquaint", Icon: IconChats },
  { key: "auction", label: "Auction", Icon: IconHammer, badge: "NEW" },
  { key: "video", label: "Video", Icon: IconVideo },
  { key: "games", label: "Games", Icon: IconGames },
];

export default function RoomModeOverlay({
  currentMode,
  canEdit,
  onPick,
  onClose,
  functionsProps,
}) {
  return (
    <div className="room-mode-overlay-backdrop" onClick={onClose}>
      <div className="room-mode-overlay" onClick={(e) => e.stopPropagation()}>
        <header className="room-mode-overlay-header">
          <span>Room mode</span>
          <button type="button" className="room-mode-overlay-close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="room-mode-overlay-tabs">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`room-mode-overlay-tab ${currentMode === m.key ? "room-mode-overlay-tab--active" : ""}`}
              disabled={!canEdit}
              onClick={() => canEdit && onPick?.(m.key)}
            >
              <span className="room-mode-overlay-tab-icon"><m.Icon /></span>
              <span>{m.label}</span>
              {m.badge && <em className="room-mode-overlay-badge">{m.badge}</em>}
            </button>
          ))}
        </div>
        {functionsProps && (
          <div className="room-mode-overlay-functions">
            <FunctionsGrid embedded {...functionsProps} />
          </div>
        )}
      </div>
    </div>
  );
}
