import { useCallback, useEffect, useRef, useState } from "react";
import { useMafiaGame } from "./useMafiaGame.js";
import { useMafiaPlayerRole } from "./useMafiaPlayerRole.js";
import { useMafiaActions } from "./useMafiaActions.js";
import { useMafiaTimer } from "./useMafiaTimer.js";
import MafiaLobby from "./MafiaLobby.jsx";
import MafiaGameScreen from "./MafiaGameScreen.jsx";
import MafiaGameOver from "./MafiaGameOver.jsx";
import { isConfigured } from "../../supabase.js";

const DEFAULT_SETTINGS = {
  daySeconds: 90,
  votingSeconds: 45,
  revealOnDeath: false,
  allowDeadChat: true,
};

export default function MafiaGame({
  roomId,
  userId,
  userName,
  avatarUrl,
  seatNumber,
  canHost,
  onSessionActive,
  onWaiting,
  onToast,
  mafiaSelected,
  roomMafiaGameId,
  onSelectMafia,
  onCancel,
}) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hostSetupRef = useRef(false);

  const mafia = useMafiaGame({
    roomId,
    userId,
    userName,
    avatarUrl,
    seatNumber,
    canHost,
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

  const secondsLeft = useMafiaTimer(mafia.game, mafia.gameId, mafia.refresh);

  useEffect(() => {
    onSessionActive?.(mafia.inProgress && mafia.joined);
  }, [mafia.inProgress, mafia.joined, onSessionActive]);

  useEffect(() => {
    onWaiting?.(mafia.inLobby || (!mafia.gameId && mafiaSelected));
  }, [mafia.inLobby, mafia.gameId, mafiaSelected, onWaiting]);

  useEffect(() => {
    if (!mafiaSelected) hostSetupRef.current = false;
  }, [mafiaSelected]);

  useEffect(() => {
    if (!mafiaSelected || !canHost || hostSetupRef.current) return undefined;
    let cancelled = false;
    (async () => {
      try {
        let id = roomMafiaGameId;
        if (!id) id = await mafia.selectMafia(settings);
        if (cancelled) return;
        await mafia.join(id);
        hostSetupRef.current = true;
      } catch (e) {
        if (!cancelled) onToast?.(e.message ?? "Mafia setup failed");
      }
    })();
    return () => { cancelled = true; };
  }, [mafiaSelected, canHost, roomMafiaGameId, mafia.selectMafia, mafia.join, settings, onToast]);

  const handleStart = useCallback(async () => {
    try {
      await mafia.start();
    } catch (e) {
      onToast?.(e.message ?? "Could not start");
    }
  }, [mafia, onToast]);

  const handleJoin = useCallback(async () => {
    try {
      let id = mafia.gameId;
      if (!id && canHost) id = await mafia.selectMafia(settings);
      await mafia.join(id);
    } catch (e) {
      onToast?.(e.message ?? "Could not join");
    }
  }, [mafia, settings, canHost, onToast]);

  const handleCancel = useCallback(async () => {
    try {
      await mafia.end();
      onCancel?.();
    } catch (e) {
      onToast?.(e.message ?? "Could not cancel");
    }
  }, [mafia, onCancel, onToast]);

  const handlePlayAgain = useCallback(async () => {
    try {
      await mafia.end();
      await onSelectMafia?.(settings);
    } catch (e) {
      onToast?.(e.message ?? "Could not restart");
    }
  }, [mafia, settings, onSelectMafia, onToast]);

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

  if (mafia.inLobby || (mafiaSelected && !mafia.inProgress)) {
    return (
      <MafiaLobby
        players={mafia.players}
        userId={userId}
        joined={mafia.joined}
        isHost={mafia.isHost}
        canManage={mafia.canManage}
        canStart={mafia.players.filter((p) => p.is_ready).length >= mafia.players.length}
        onJoin={handleJoin}
        onLeave={() => mafia.leave().catch((e) => onToast?.(e.message))}
        onStart={handleStart}
        onEnd={handleCancel}
        onToggleReady={(r) => mafia.toggleReady(r).catch((e) => onToast?.(e.message))}
        onKick={(id) => mafia.kick(id).catch((e) => onToast?.(e.message))}
        onOpenSettings={() => setSettingsOpen(true)}
        settingsOpen={settingsOpen}
        settings={settings}
        onSettingsChange={setSettings}
        onSettingsClose={() => setSettingsOpen(false)}
      />
    );
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
