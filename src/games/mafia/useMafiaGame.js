import { useCallback, useEffect, useRef, useState } from "react";
import {
  createMafiaGame,
  endActiveMafiaGameForRoom,
  endMafiaGame,
  fetchActiveMafiaGame,
  fetchGameReveal,
  fetchPrivateState,
  fetchPublicState,
  joinMafiaGame,
  kickMafiaPlayer,
  leaveMafiaGame,
  setMafiaReady,
  startMafiaGame,
} from "./mafiaApi.js";
import { useMafiaRealtime } from "./useMafiaRealtime.js";
import { canControlRoomGame, isGameTimerDriver } from "../gameRoomControl.js";

export function useMafiaGame({
  roomId,
  userId,
  userName,
  avatarUrl,
  seatNumber,
  canHost,
  roomControlContext,
  roomGameId,
}) {
  const [gameId, setGameId] = useState(null);
  const [publicState, setPublicState] = useState(null);
  const [privateState, setPrivateState] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === "undefined" || !document.hidden,
  );

  useEffect(() => {
    const sync = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const refresh = useCallback(async (overrideGameId) => {
    if (!roomId) return;
    let id = overrideGameId ?? gameId;
    if (!id) {
      id = await fetchActiveMafiaGame(roomId);
      if (id) setGameId(id);
    }
    if (!id) {
      setPublicState(null);
      setPrivateState(null);
      setJoined(false);
      setReveal(null);
      return;
    }
    const [pub, priv] = await Promise.all([
      fetchPublicState(id),
      fetchPrivateState(id),
    ]);
    if (pub?.game?.status === "cancelled") {
      setGameId(null);
      setPublicState(null);
      setPrivateState(null);
      setJoined(false);
      setReveal(null);
      return;
    }
    setPublicState(pub);
    setPrivateState(priv);
    const players = pub?.players ?? [];
    setJoined(players.some((p) => String(p.user_id) === String(userId)));
    if (pub?.game?.phase === "game_over" || pub?.game?.status === "ended") {
      const rev = await fetchGameReveal(id);
      setReveal(rev);
    } else {
      setReveal(null);
    }
  }, [roomId, gameId, userId]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const id = roomGameId ?? await fetchActiveMafiaGame(roomId);
        if (!active) return;
        if (id) setGameId(id);
        await refresh(id ?? undefined);
      } catch {
        /* RPC may be missing until SQL migration is applied */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [roomId, roomGameId]);

  useEffect(() => {
    if (!roomGameId) return;
    setGameId(roomGameId);
    refresh(roomGameId).catch(() => {});
  }, [roomGameId, refresh]);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const onRealtimeChange = useCallback(() => {
    refreshRef.current?.().catch(() => {});
  }, []);

  const realtimeConnected = useMafiaRealtime(gameId, onRealtimeChange);

  useEffect(() => {
    if (gameId) refresh().catch(() => {});
  }, [gameId, refresh]);

  // Fallback poll only when Realtime is not connected.
  useEffect(() => {
    if (!gameId || realtimeConnected) return undefined;
    const poll = () => {
      if (document.hidden) return;
      refreshRef.current?.().catch(() => {});
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [gameId, realtimeConnected]);

  // Re-sync when user returns to the tab.
  useEffect(() => {
    if (!gameId) return undefined;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshRef.current?.().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [gameId]);

  const selectMafia = useCallback(async (settings) => {
    const id = await createMafiaGame(roomId, { ...settings, nickname: userName });
    setGameId(id);
    await refresh(id);
    return id;
  }, [roomId, userName, refresh]);

  const join = useCallback(async (forcedGameId) => {
    const id = forcedGameId ?? gameId ?? await fetchActiveMafiaGame(roomId);
    if (!id) throw new Error("No Mafia game in this room yet");
    if (!gameId) setGameId(id);
    await joinMafiaGame(id, {
      nickname: userName,
      avatarUrl,
      seatNumber,
    });
    await refresh(id);
  }, [gameId, roomId, userName, avatarUrl, seatNumber, refresh]);

  const leave = useCallback(async () => {
    if (!gameId) return;
    await leaveMafiaGame(gameId);
    await refresh();
  }, [gameId, refresh]);

  const toggleReady = useCallback(async (ready) => {
    if (!gameId) return;
    await setMafiaReady(gameId, ready);
    await refresh();
  }, [gameId, refresh]);

  const start = useCallback(async () => {
    if (!gameId) return;
    await startMafiaGame(gameId);
    await refresh();
  }, [gameId, refresh]);

  const end = useCallback(async () => {
    const id = gameId ?? await fetchActiveMafiaGame(roomId);
    if (!id) {
      setGameId(null);
      setPublicState(null);
      setPrivateState(null);
      setJoined(false);
      setReveal(null);
      return;
    }
    try {
      await endMafiaGame(id);
    } catch {
      await endActiveMafiaGameForRoom(roomId);
    }
    setGameId(null);
    setPublicState(null);
    setPrivateState(null);
    setJoined(false);
    setReveal(null);
  }, [gameId, roomId]);

  const kick = useCallback(async (targetUserId) => {
    if (!gameId) return;
    await kickMafiaPlayer(gameId, targetUserId);
    await refresh();
  }, [gameId, refresh]);

  const game = publicState?.game ?? null;
  const players = publicState?.players ?? [];
  const events = publicState?.events ?? [];
  const voteCounts = publicState?.voteCounts ?? [];
  const isHost = String(game?.host_id) === String(userId)
    || Boolean(players.find((p) => String(p.user_id) === String(userId))?.is_host);
  const canManage = roomControlContext
    ? canControlRoomGame(userId, roomControlContext, game)
    : Boolean(isHost || canHost);
  const isTimerDriver = isGameTimerDriver({
    localUserId: userId,
    tabVisible,
    game,
    players,
    roomContext: roomControlContext,
  });
  const inLobby = game?.status === "lobby";
  const inProgress = game?.status === "active";
  const isOver = game?.phase === "game_over" || game?.status === "ended" || game?.status === "cancelled";

  return {
    gameId,
    game,
    players,
    events,
    voteCounts,
    privateState,
    reveal,
    loading,
    joined,
    isHost,
    canManage,
    isTimerDriver,
    inLobby,
    inProgress,
    isOver,
    refresh,
    selectMafia,
    join,
    leave,
    toggleReady,
    start,
    end,
    kick,
  };
}
