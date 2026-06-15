import { useCallback, useEffect, useRef, useState } from "react";
import {
  advanceDDDPhaseIfDue,
  createDDDGame,
  endActiveDDDGameForRoom,
  endDDDGame,
  fetchActiveDDDGame,
  fetchDDDPublicState,
  joinDDDGame,
  leaveDDDGame,
  startDDDGame,
  startDDDNextRound,
} from "./dddApi.js";
import { useDDDRealtime } from "./useDDDRealtime.js";
import { canControlRoomGame, isGameTimerDriver } from "../gameRoomControl.js";

export function useDDDGame({
  roomId,
  userId,
  userName,
  avatarUrl,
  seatNumber,
  canHost,
  roomControlContext,
  roomGameId,
  enablePhaseAdvance = false,
}) {
  const [gameId, setGameId] = useState(null);
  const [state, setState] = useState(null);
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
      id = await fetchActiveDDDGame(roomId);
      if (id) setGameId(id);
    }
    if (!id) {
      setState(null);
      setJoined(false);
      return;
    }

    const data = await fetchDDDPublicState(id);
    if (data?.game?.status === "cancelled" || data?.game?.status === "ended") {
      setGameId(null);
      setState(null);
      setJoined(false);
      return;
    }
    setState(data);
    const players = data?.players ?? [];
    setJoined(players.some((p) => String(p.user_id) === String(userId)));
  }, [roomId, gameId, userId]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const id = roomGameId ?? await fetchActiveDDDGame(roomId);
        if (!active) return;
        if (id) setGameId(id);
        await refresh(id ?? undefined);
      } catch {
        /* RPC may be missing until SQL migration */
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

  const realtimeConnected = useDDDRealtime(gameId, onRealtimeChange);
  const isTimerDriverRef = useRef(false);

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

  // Only the selected timer driver advances phases (1s interval), active play view only.
  useEffect(() => {
    if (!gameId || !enablePhaseAdvance) return undefined;
    const tick = () => {
      if (document.hidden || !isTimerDriverRef.current) return;
      advanceDDDPhaseIfDue(gameId).catch(() => {});
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [gameId, enablePhaseAdvance]);

  useEffect(() => {
    if (!gameId || !enablePhaseAdvance) return undefined;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshRef.current?.().catch(() => {});
        if (isTimerDriverRef.current) advanceDDDPhaseIfDue(gameId).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [gameId, enablePhaseAdvance]);

  const selectDDD = useCallback(async () => {
    const id = await createDDDGame(roomId);
    setGameId(id);
    await refresh(id);
    return id;
  }, [roomId, refresh]);

  const join = useCallback(async (forcedGameId) => {
    const id = forcedGameId ?? gameId ?? roomGameId ?? await fetchActiveDDDGame(roomId);
    if (!id) throw new Error("No DDD game in this room yet");
    if (!gameId) setGameId(id);
    await joinDDDGame(id, { nickname: userName, avatarUrl, seatNumber });
    await refresh(id);
  }, [gameId, roomGameId, roomId, userName, avatarUrl, seatNumber, refresh]);

  const leave = useCallback(async () => {
    if (!gameId) return;
    await leaveDDDGame(gameId);
    await refresh();
  }, [gameId, refresh]);

  const start = useCallback(async () => {
    if (!gameId) return;
    await startDDDGame(gameId);
    await refresh();
  }, [gameId, refresh]);

  const end = useCallback(async () => {
    const id = gameId ?? await fetchActiveDDDGame(roomId);
    if (!id) {
      setGameId(null);
      setState(null);
      setJoined(false);
      return;
    }
    try {
      await endDDDGame(id);
    } catch {
      await endActiveDDDGameForRoom(roomId);
    }
    setGameId(null);
    setState(null);
    setJoined(false);
  }, [gameId, roomId]);

  const nextRound = useCallback(async () => {
    if (!gameId) return;
    await startDDDNextRound(gameId);
    await refresh();
  }, [gameId, refresh]);

  const game = state?.game ?? null;
  const players = state?.players ?? [];
  const currentTurn = state?.currentTurn ?? null;
  const reactions = state?.reactions ?? [];
  const roundSummary = state?.roundSummary ?? null;
  const isHost = String(game?.host_id) === String(userId);
  const canManage = roomControlContext
    ? canControlRoomGame(userId, roomControlContext, game)
    : Boolean(isHost || canHost);
  isTimerDriverRef.current = isGameTimerDriver({
    localUserId: userId,
    tabVisible,
    game,
    players,
    roomContext: roomControlContext,
  });
  const inLobby = game?.status === "lobby";
  const inProgress = game?.status === "active";
  const isRoundEnd = game?.status === "round_end";
  const isOver = game?.status === "ended" || game?.status === "cancelled";

  return {
    gameId,
    game,
    players,
    currentTurn,
    reactions,
    roundSummary,
    loading,
    joined,
    isHost,
    canManage,
    inLobby,
    inProgress,
    isRoundEnd,
    isOver,
    refresh,
    selectDDD,
    join,
    leave,
    start,
    end,
    nextRound,
  };
}
