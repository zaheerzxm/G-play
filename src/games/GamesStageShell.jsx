export default function GamesStageShell({ children, showBack, canEndForAll, onReturnToPicker }) {
  return (
    <div className={`games-stage-shell ${showBack ? "games-stage-shell--playing" : ""}`}>
      {showBack && onReturnToPicker && (
        <button
          type="button"
          className="games-stage-back"
          onClick={() => onReturnToPicker(canEndForAll)}
        >
          ← {canEndForAll ? "End & back to games" : "Back to games"}
        </button>
      )}
      <div className="games-stage-body">{children}</div>
    </div>
  );
}
