import { getGameById } from "./catalog.js";

function seatSize(count) {
  if (count <= 1) return 52;
  if (count <= 4) return 44;
  if (count <= 8) return 38;
  if (count <= 12) return 34;
  return 30;
}

export default function GameLaunchPad({
  selectedType,
  joined,
  joinedPlayers = [],
  canHost,
  canManage,
  canStart,
  gameInProgress,
  socketReady,
  isSupabaseGame,
  minPlayers,
  isReady,
  onJoin,
  onLeave,
  onStart,
  onToggleReady,
  onOpenSettings,
  onOpenPicker,
}) {
  const meta = selectedType ? getGameById(selectedType) : null;
  const count = joinedPlayers.length;
  const size = seatSize(count);
  const needMin = minPlayers != null && count < minPlayers;
  const needTwo = (selectedType === "draw" || selectedType === "wordle") && count < 2;
  const manager = canManage ?? canHost;
  const startBlocked = needMin || needTwo || !canStart;
  const startHint = needMin
    ? `Need at least ${minPlayers} players seated`
    : needTwo
      ? "Need at least 2 players seated"
      : selectedType === "mafia" && joined && !canStart
        ? "Everyone must ready up before start"
        : null;

  return (
    <div className="games-launch-pad">
      {meta ? (
        <button type="button" className="games-launch-chip" onClick={onOpenPicker}>
          <span className="games-launch-chip-icon" aria-hidden>{meta.emoji}</span>
          <span className="games-launch-chip-copy">
            <strong>{meta.name}</strong>
            <small>{meta.players} players</small>
          </span>
          {manager && <span className="games-launch-chip-swap" aria-hidden>⇄</span>}
        </button>
      ) : (
        <button type="button" className="games-launch-pick" onClick={onOpenPicker}>
          Please select a game
        </button>
      )}

      <div className="games-launch-stage">
        {count > 0 ? (
          <ul
            className="games-launch-seated"
            style={{ "--seat-size": `${size}px` }}
          >
            {joinedPlayers.map((p) => (
              <li
                key={p.userId}
                className={`games-launch-player ${p.isReady ? "games-launch-player--ready" : ""}`}
              >
                <span className="games-launch-player-avatar" title={p.userName}>
                  {(p.userName?.trim()?.[0] ?? "?").toUpperCase()}
                </span>
                <em>{p.userName ?? "Player"}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p className="games-launch-waiting">No one seated yet — tap Sit down to join</p>
        )}
        {count > 0 && (
          <p className="games-launch-count">{count} seated</p>
        )}
      </div>

      <div className="games-launch-actions">
        {!gameInProgress && !joined && (
          <button
            type="button"
            className="games-launch-btn games-launch-btn--primary"
            disabled={!selectedType || (!socketReady && !isSupabaseGame)}
            onClick={onJoin}
          >
            {!selectedType ? "Pick a game first" : "Sit down"}
          </button>
        )}
        {!gameInProgress && joined && (
          <button type="button" className="games-launch-btn games-launch-btn--ghost" onClick={onLeave}>
            Stand up
          </button>
        )}
        {selectedType === "mafia" && joined && onToggleReady && (
          <button type="button" className="games-launch-btn games-launch-btn--ghost" onClick={onToggleReady}>
            {isReady ? "Not ready" : "Ready up"}
          </button>
        )}
        {manager && selectedType && !gameInProgress && (
          <button
            type="button"
            className="games-launch-btn games-launch-btn--gold"
            disabled={startBlocked}
            onClick={onStart}
          >
            Start game
          </button>
        )}
        {manager && isSupabaseGame && onOpenSettings && (
          <button type="button" className="games-launch-btn games-launch-btn--ghost" onClick={onOpenSettings}>
            Settings
          </button>
        )}
      </div>

      {startHint && (
        <p className="games-launch-hint">{startHint}</p>
      )}
    </div>
  );
}
