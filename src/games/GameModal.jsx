import { liveMiniGames, comingMiniGames } from "./catalog.js";

export default function GameModal({
  open,
  onClose,
  canHost,
  activeGame,
  onStartGame,
  onJoinGame,
  onEndGame,
}) {
  if (!open) return null;

  const live = liveMiniGames();
  const coming = comingMiniGames();

  return (
    <div className="game-modal-backdrop" onClick={onClose}>
      <div className="game-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="game-modal-header">
          <h2>Start a game</h2>
          <button type="button" className="game-modal-close" onClick={onClose}>✕</button>
        </header>

        {activeGame && (
          <div className="game-modal-active">
            <strong>Active: {activeGame.type === "trivia" ? "Trivia Battle" : activeGame.type === "draw" ? "Draw & Guess" : activeGame.type}</strong>
            <div className="game-modal-active-actions">
              <button type="button" className="game-btn game-btn--primary" onClick={onJoinGame}>
                {activeGame.joined ? "Playing" : "Join game"}
              </button>
              {canHost && (
                <button type="button" className="game-btn game-btn--ghost" onClick={onEndGame}>
                  End game
                </button>
              )}
            </div>
          </div>
        )}

        <p className="game-modal-section-label">Play now</p>
        <div className="game-card-grid">
          {live.map((game) => (
            <button
              key={game.id}
              type="button"
              className="game-card"
              disabled={!canHost && !activeGame}
              onClick={() => {
                if (canHost && !activeGame) onStartGame(game.id);
                else if (activeGame) onJoinGame();
              }}
            >
              <span className="game-card-emoji">{game.emoji}</span>
              <strong>{game.name}</strong>
              <small>{game.description}</small>
              <em>{game.players}</em>
            </button>
          ))}
        </div>

        <p className="game-modal-section-label">Coming soon</p>
        <div className="game-card-grid game-card-grid--soon">
          {coming.map((game) => (
            <div key={game.id} className="game-card game-card--soon">
              <span className="game-card-emoji">{game.emoji}</span>
              <strong>{game.name}</strong>
              <small>{game.description}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
