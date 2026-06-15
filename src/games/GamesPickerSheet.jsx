import { createPortal } from "react-dom";
import { liveMiniGames } from "./catalog.js";

export default function GamesPickerSheet({
  open,
  onClose,
  canHost,
  selectedType,
  gameInProgress,
  onSelectGame,
}) {
  if (!open) return null;

  const live = liveMiniGames();

  return createPortal(
    <div className="games-picker-portal">
      <div className="games-picker-backdrop" onClick={onClose}>
        <div className="games-picker-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="games-picker-handle" aria-hidden />
          <p className="games-picker-label">Please select a game</p>

          <div className="games-picker-row">
            {live.map((game) => {
              const picked = selectedType === game.id;
              const disabled = !canHost || gameInProgress;
              return (
                <button
                  key={game.id}
                  type="button"
                  className={`games-picker-item ${picked ? "games-picker-item--picked" : ""}`}
                  disabled={disabled}
                  onClick={() => {
                    if (!canHost || gameInProgress) return;
                    onSelectGame?.(game.id);
                    onClose?.();
                  }}
                >
                  <span className="games-picker-icon" aria-hidden>{game.emoji}</span>
                  <span className="games-picker-name">{game.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
