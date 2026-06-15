import { ROOM_SEAT_COUNT } from "../roomSeats.js";

const SEAT_NUMBERS = Array.from({ length: ROOM_SEAT_COUNT }, (_, i) => i + 1);

export default function ScoreboardSheet({
  scores = {},
  selected = [],
  canEdit = false,
  onToggleSeat,
  onAdjust,
  onClose,
}) {
  const step = 1;

  return (
    <div className="scoreboard-sheet-backdrop" onClick={onClose}>
      <div className="scoreboard-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="scoreboard-sheet-header">
          <button type="button" className="scoreboard-sheet-icon-btn" onClick={onClose} aria-label="Close">
            ⏻
          </button>
          <h2>Scoreboard</h2>
          <span className="scoreboard-sheet-icon-btn" aria-hidden>⇲</span>
        </header>

        <div className="scoreboard-sheet-grid">
          {SEAT_NUMBERS.map((num) => {
            const active = selected.includes(num);
            const score = Number(scores[num] ?? 0);
            return (
              <button
                key={num}
                type="button"
                className={`scoreboard-seat ${active ? "scoreboard-seat--active" : ""}`}
                onClick={() => canEdit && onToggleSeat?.(num)}
              >
                <span className="scoreboard-seat-num">{num}</span>
                <span className="scoreboard-seat-score">{score}</span>
                {active && <span className="scoreboard-seat-check" aria-hidden>✓</span>}
              </button>
            );
          })}
        </div>

        {canEdit && (
          <footer className="scoreboard-sheet-footer">
            <button
              type="button"
              className="scoreboard-adjust scoreboard-adjust--sub"
              onClick={() => onAdjust?.(-step)}
            >
              <span className="scoreboard-adjust-step">-{step}</span>
              <span>Subtract</span>
            </button>
            <button
              type="button"
              className="scoreboard-adjust scoreboard-adjust--add"
              onClick={() => onAdjust?.(step)}
            >
              <span className="scoreboard-adjust-step">+{step}</span>
              <span>Add</span>
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
