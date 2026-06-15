import { DDD_MIN_PLAYERS } from "./constants.js";
import DDDPlayerList from "./DDDPlayerList.jsx";
import DDDSettingsModal from "./DDDSettingsModal.jsx";

export default function DDDLobby({
  players,
  userId,
  joined,
  isHost,
  canManage,
  canStart,
  onJoin,
  onLeave,
  onStart,
  onEnd,
  settingsOpen,
  settings,
  onSettingsChange,
  onSettingsClose,
  onOpenSettings,
}) {
  const needMore = players.length < DDD_MIN_PLAYERS;

  return (
    <div className="ddd-lobby game-lobby">
      <header className="ddd-lobby-header">
        <h2>❤️🧠🗑️ DDD</h2>
        <p>Dil, Dimaag, Dustbin — minimum {DDD_MIN_PLAYERS} players</p>
      </header>

      <DDDPlayerList players={players} userId={userId} />

      {needMore && (
        <p className="game-lobby-hint-warn">Need at least {DDD_MIN_PLAYERS} players to start</p>
      )}

      <div className="game-lobby-active-actions">
        {!joined && (
          <button type="button" className="game-btn game-btn--primary game-btn--wide" onClick={onJoin}>
            Join game
          </button>
        )}
        {joined && (
          <button type="button" className="game-btn game-btn--ghost game-btn--wide" onClick={onLeave}>
            Leave lobby
          </button>
        )}
        {isHost && canStart && !needMore && (
          <button type="button" className="game-btn game-btn--primary game-btn--wide" onClick={onStart}>
            Start DDD
          </button>
        )}
        {canManage && (
          <>
            <button type="button" className="game-btn game-btn--ghost" onClick={onOpenSettings}>
              Settings
            </button>
            <button type="button" className="game-btn game-btn--ghost" onClick={onEnd}>
              Cancel game
            </button>
          </>
        )}
      </div>

      {settingsOpen && (
        <DDDSettingsModal
          settings={settings}
          onChange={onSettingsChange}
          onClose={onSettingsClose}
        />
      )}
    </div>
  );
}
