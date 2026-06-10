import { MAFIA_MIN_PLAYERS } from "./constants.js";
import MafiaPlayerList from "./MafiaPlayerList.jsx";
import MafiaSettingsModal from "./MafiaSettingsModal.jsx";
import { useState } from "react";

export default function MafiaLobby({
  players,
  userId,
  joined,
  isHost,
  canStart,
  onJoin,
  onLeave,
  onStart,
  onEnd,
  onToggleReady,
  onKick,
  onOpenSettings,
  settingsOpen,
  settings,
  onSettingsChange,
  onSettingsClose,
}) {
  const needMore = players.length < MAFIA_MIN_PLAYERS;
  const me = players.find((p) => p.user_id === userId);

  return (
    <div className="mafia-lobby game-lobby">
      <header className="mafia-lobby-header">
        <h2>🕵️ Mafia</h2>
        <p>Social deduction on voice — minimum {MAFIA_MIN_PLAYERS} players</p>
      </header>

      <MafiaPlayerList
        players={players}
        userId={userId}
        showReady
        canKick={isHost}
        onKick={onKick}
      />

      {needMore && (
        <p className="game-lobby-hint-warn">Need at least {MAFIA_MIN_PLAYERS} players to start</p>
      )}

      <div className="game-lobby-active-actions">
        {!joined && (
          <button type="button" className="game-btn game-btn--primary game-btn--wide" onClick={onJoin}>
            Join game
          </button>
        )}
        {joined && (
          <>
            <button
              type="button"
              className="game-btn game-btn--ghost game-btn--wide"
              onClick={() => onToggleReady?.(!me?.is_ready)}
            >
              {me?.is_ready ? "Not ready" : "Ready up"}
            </button>
            <button type="button" className="game-btn game-btn--ghost game-btn--wide" onClick={onLeave}>
              Leave lobby
            </button>
          </>
        )}
        {isHost && canStart && !needMore && (
          <button type="button" className="game-btn game-btn--primary game-btn--wide" onClick={onStart}>
            Start Mafia
          </button>
        )}
        {isHost && (
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
        <MafiaSettingsModal
          settings={settings}
          onChange={onSettingsChange}
          onClose={onSettingsClose}
        />
      )}
    </div>
  );
}
