import { useCallback, useEffect, useState } from "react";
import {
  createMafiaGame,
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

export function useMafiaGame({ roomId, userId, userName, avatarUrl, seatNumber, canHost }) {
  const [gameId, setGameId] = useState(null);
  const [publicState, setPublicState] = useState(null);
  const [privateState, setPrivateState] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    try {
      let id = gameId;
      if (!id) {
        id = await fetchActiveMafiaGame(roomId);
        if (id) setGameId(id);
      }
      if (!id) {
        setPublicState(null);
        setPrivateState(null);
        setJoined(false);
        return;
      }
      const [pub, priv] = await Promise.all([
        fetchPublicState(id),
        fetchPrivateState(id),
      ]);
      setPublicState(pub);
      setPrivateState(priv);
      const players = pub?.players ?? [];
      setJoined(players.some((p) => p.user_id === userId));
      if (pub?.game?.phase === "game_over" || pub?.game?.status === "ended") {
        const rev = await fetchGameReveal(id);
        setReveal(rev);
      } else {
        setReveal(null);
      }
    } catch {
      /* keep last state on transient errors */
    }
  }, [roomId, gameId, userId]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const id = await fetchActiveMafiaGame(roomId);
        if (!active) return;
        if (id) setGameId(id);
        await refresh();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [roomId]);

  useMafiaRealtime(gameId, refresh);

  useEffect(() => {
    if (gameId) refresh();
  }, [gameId, refresh]);

  const selectMafia = useCallback(async (settings) => {
    const id = await createMafiaGame(roomId, { ...settings, nickname: userName });
    setGameId(id);
    await refresh();
    return id;
  }, [roomId, refresh]);

  const join = useCallback(async () => {
    if (!gameId) return;
    await joinMafiaGame(gameId, {
      nickname: userName,
      avatarUrl,
      seatNumber,
    });
    await refresh();
  }, [gameId, userName, avatarUrl, seatNumber, refresh]);

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
    if (!gameId) return;
    await endMafiaGame(gameId);
    await refresh();
  }, [gameId, refresh]);

  const kick = useCallback(async (targetUserId) => {
    if (!gameId) return;
    await kickMafiaPlayer(gameId, targetUserId);
    await refresh();
  }, [gameId, refresh]);

  const game = publicState?.game ?? null;
  const players = publicState?.players ?? [];
  const events = publicState?.events ?? [];
  const voteCounts = publicState?.voteCounts ?? [];
  const isHost = game?.host_id === userId || players.find((p) => p.user_id === userId)?.is_host;
  const inLobby = game?.status === "lobby";
  const inProgress = game?.status === "active";
  const isOver = game?.phase === "game_over" || game?.status === "ended";

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
    isHost: Boolean(isHost || canHost),
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
