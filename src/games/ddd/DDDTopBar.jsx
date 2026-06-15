export default function DDDTopBar({ onExit, canEndGame = false }) {
  if (!onExit) return null;

  return (
    <div className="ddd-top-bar">
      <button type="button" className="ddd-back-btn" onClick={onExit}>
        ← {canEndGame ? "End & back to games" : "Back to games"}
      </button>
    </div>
  );
}
