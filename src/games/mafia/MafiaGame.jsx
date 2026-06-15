import { useCallback } from "react";
import { useMafiaGame } from "./useMafiaGame.js";
import { useMafiaPlayerRole } from "./useMafiaPlayerRole.js";
import { useMafiaActions } from "./useMafiaActions.js";
import { useMafiaTimer } from "./useMafiaTimer.js";
import MafiaGameScreen from "./MafiaGameScreen.jsx";
import MafiaGameOver from "./MafiaGameOver.jsx";
import { isConfigured } from "../../supabase.js";

export default function MafiaGame({
  roomId,
  userId,
  userName,
  avatarUrl,
  seatNumber,
  canHost,
  roomControlContext,
  roomMafiaGameId,
  onReturnToPicker,
  onToast,
}) {
  const mafia = useMafiaGame({
    roomId,
    userId,
    userName,
    avatarUrl,
    seatNumber,
    canHost,
    roomControlContext,
    roomGameId: roomMafiaGameId,
  });

  const roleInfo = useMafiaPlayerRole(mafia.privateState, mafia.game?.status);
  const actions = useMafiaActions(
    mafia.gameId,
    roleInfo.role,
    mafia.game?.phase,
    roleInfo.isAlive,
    mafia.refresh,
  );

  const secondsLeft = useMafiaTimer(mafia.game, mafia.gameId, mafia.refresh, mafia.isTimerDriver);

  const handlePlayAgain = useCallback(async () => {
    try {
      await mafia.end();
      onReturnToPicker?.(mafia.canManage);
    } catch (e) {
      onToast?.(e.message ?? "Could not restart");
    }
  }, [mafia, onReturnToPicker, onToast]);

  if (!isConfigured) {
    return (
      <div className="mafia-loading">
        Mafia requires Supabase — add VITE_SUPABASE_URL and VITE_SUPABASE_KEY.
      </div>
    );
  }

  if (mafia.loading && !mafia.game) {
    return <div className="mafia-loading">Loading Mafia…</div>;
  }

  if (mafia.isOver && mafia.reveal) {
    return (
      <MafiaGameOver
        reveal={mafia.reveal}
        userId={userId}
        canHost={mafia.isHost}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  if (!mafia.inProgress) {
    return <div className="mafia-loading">Starting Mafia…</div>;
  }

  const spectator = mafia.joined && !roleInfo.role && mafia.inProgress;

  return (
    <MafiaGameScreen
      game={mafia.game}
      players={mafia.players}
      events={mafia.events}
      voteCounts={mafia.voteCounts}
      userId={userId}
      roleInfo={roleInfo}
      actions={actions}
      secondsLeft={secondsLeft}
      spectator={spectator || !mafia.joined}
    />
  );
}
