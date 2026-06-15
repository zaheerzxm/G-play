import { useCallback } from "react";
import { isConfigured } from "../../supabase.js";
import { useDDDGame } from "./useDDDGame.js";
import { useDDDActions } from "./useDDDActions.js";
import { useDDDSounds } from "./useDDDSounds.js";
import DDDGameScreen from "./DDDGameScreen.jsx";
import DDDPlayerList from "./DDDPlayerList.jsx";

export default function DDDGame({
  roomId,
  userId,
  userName,
  avatarUrl,
  seatNumber,
  canHost,
  roomControlContext,
  roomDDDGameId,
  onReturnToPicker,
  onToast,
}) {
  const sounds = useDDDSounds();

  const ddd = useDDDGame({
    roomId,
    userId,
    userName,
    avatarUrl,
    seatNumber,
    canHost,
    roomControlContext,
    roomGameId: roomDDDGameId,
    enablePhaseAdvance: true,
  });

  const { submitTurn, react, submitting } = useDDDActions(ddd.gameId, ddd.refresh);

  const handleEndGame = useCallback(async () => {
    try {
      await ddd.end();
    } catch (e) {
      onToast?.(e.message ?? "Could not end game");
    }
    onReturnToPicker?.(true);
  }, [ddd, onReturnToPicker, onToast]);

  const handleSubmit = useCallback(async (picks) => {
    sounds.play("button_click");
    try {
      await submitTurn(picks);
    } catch (e) {
      onToast?.(e.message ?? "Could not submit");
    }
  }, [submitTurn, onToast, sounds]);

  if (!isConfigured) {
    return (
      <div className="ddd-shell">
        <div className="ddd-loading">
          DDD requires Supabase — add VITE_SUPABASE_URL and VITE_SUPABASE_KEY.
        </div>
      </div>
    );
  }

  if (ddd.loading && !ddd.game) {
    return (
      <div className="ddd-shell">
        <div className="ddd-loading">Loading DDD…</div>
      </div>
    );
  }

  if (ddd.inProgress && !ddd.joined) {
    return (
      <div className="games-launch-pad games-launch-pad--spectator">
        <p className="games-launch-waiting">Game in progress — join the next round</p>
        <DDDPlayerList players={ddd.players} userId={userId} />
      </div>
    );
  }

  if (!ddd.inProgress && !ddd.isRoundEnd) {
    return (
      <div className="ddd-shell">
        <div className="ddd-loading">Starting DDD…</div>
      </div>
    );
  }

  return (
    <div className="ddd-shell ddd-game" onPointerDown={sounds.unlock}>
      <button
        type="button"
        className="ddd-mute-btn"
        onClick={sounds.toggleMute}
        aria-label={sounds.muted ? "Unmute sounds" : "Mute sounds"}
      >
        {sounds.muted ? "🔇" : "🔊"}
      </button>

      <DDDGameScreen
        game={ddd.game}
        players={ddd.players}
        currentTurn={ddd.currentTurn}
        reactions={ddd.reactions}
        userId={userId}
        roundSummary={ddd.roundSummary}
        onSubmit={handleSubmit}
        onReact={(turnId, type) => react(turnId, type).catch((e) => onToast?.(e.message))}
        onNextRound={() => ddd.nextRound().catch((e) => onToast?.(e.message))}
        onEnd={handleEndGame}
        canManage={ddd.canManage}
        sounds={sounds}
        submitting={submitting}
      />
    </div>
  );
}
