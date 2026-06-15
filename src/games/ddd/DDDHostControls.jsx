export default function DDDHostControls({ canManage, onEnd, onSettings }) {
  if (!canManage) return null;

  return (
    <div className="ddd-host-controls">
      {onSettings && (
        <button type="button" className="game-btn game-btn--ghost" onClick={onSettings}>
          Settings
        </button>
      )}
      <button type="button" className="game-btn game-btn--ghost" onClick={onEnd}>
        End game
      </button>
    </div>
  );
}
