import { liveMiniGames } from "./catalog.js";

export default function GameLobby({
  canHost,
  socketReady,
  selectedType,
  joinedPlayers = [],
  joined,
  gameInProgress,
  onSelectGame,
  onJoinGame,
  onLeaveLobby,
  onBeginGame,
  onEndGame,
}) {
  const live = liveMiniGames();
  const needTwoForDraw = selectedType === "draw" && joinedPlayers.length < 2;
  const canStart =
    canHost
    && socketReady
    && selectedType
    && joinedPlayers.length >= 1
    && !needTwoForDraw
    && !gameInProgress;

  const selectedMeta = live.find((g) => g.id === selectedType);

  return (
    <div className="game-lobby">
      <header className="game-lobby-header">
        <h2>Room Games</h2>
        {gameInProgress ? (
          <p className="game-lobby-all-ready">Game in progress — wait for the round to finish</p>
        ) : (
          <p>
            {canHost
              ? "Pick a game (everyone sees it live) → players tap Join → you tap Start game"
              : "Host picks the game — tap Join if you want to play"}
          </p>
        )}
      </header>

      <p className="game-lobby-section-label">
        {!socketReady
          ? "Game server not connected"
          : canHost
            ? "Select game"
            : selectedType
              ? "Selected game"
              : "Waiting for host to pick a game"}
      </p>

      <div className="game-card-grid">
        {live.map((game) => (
          <button
            key={game.id}
            type="button"
            className={`game-card ${selectedType === game.id ? "game-card--picked" : ""}`}
            disabled={!canHost || gameInProgress || !socketReady}
            onClick={() => canHost && !gameInProgress && socketReady && onSelectGame(game.id)}
          >
            <span className="game-card-emoji">{game.emoji}</span>
            <strong>{game.name}</strong>
            <small>{game.description}</small>
            {selectedType === game.id ? (
              <em>Selected</em>
            ) : canHost ? (
              <em>Tap to select</em>
            ) : (
              <em>{game.players} players</em>
            )}
          </button>
        ))}
      </div>

      {selectedMeta && (
        <p className="game-lobby-live-label">
          Playing: <strong>{selectedMeta.name}</strong>
          {canHost && !gameInProgress && " — tap another card to change"}
        </p>
      )}

      <div className="game-lobby-action-panel">
        <div className="game-lobby-active-actions">
          {!gameInProgress && !joined && (
            <button
              type="button"
              className="game-btn game-btn--primary game-btn--wide"
              disabled={!socketReady || !selectedType}
              onClick={onJoinGame}
            >
              {!socketReady ? "Connecting…" : !selectedType ? "Waiting for game pick…" : "Join game"}
            </button>
          )}
          {!gameInProgress && joined && (
            <button type="button" className="game-btn game-btn--ghost game-btn--wide" onClick={onLeaveLobby}>
              Leave lobby
            </button>
          )}
          {canStart && (
            <button type="button" className="game-btn game-btn--primary game-btn--wide" onClick={onBeginGame}>
              Start game
            </button>
          )}
          {canHost && gameInProgress && (
            <button type="button" className="game-btn game-btn--ghost" onClick={onEndGame}>
              End game
            </button>
          )}
        </div>

        {needTwoForDraw && (
          <p className="game-lobby-hint-warn">Draw & Guess needs at least 2 players joined</p>
        )}

        <div className="game-lobby-joined-feed">
          <p className="game-lobby-joined-feed-title">Joined ({joinedPlayers.length})</p>
          {joinedPlayers.length === 0 ? (
            <p className="game-lobby-joined-feed-empty">Nobody joined yet</p>
          ) : (
            <ul className="game-lobby-joined-names">
              {joinedPlayers.map((p) => (
                <li key={p.userId}>
                  <span className="game-lobby-status-dot game-lobby-status-dot--ready" aria-hidden />
                  <strong>{p.userName}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedType === "draw" && joined && !gameInProgress && (
          <p className="game-lobby-draw-hint">
            When the host starts: one person draws, everyone else guesses in <strong>chat</strong>. Fastest correct guess wins the most points.
          </p>
        )}
      </div>
    </div>
  );
}
