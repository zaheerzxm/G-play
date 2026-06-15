import { useEffect, useState } from "react";
import { isConfigured, supabase } from "../../supabase.js";
import { fetchActiveMafiaGame } from "./mafiaApi.js";

const FALLBACK_POLL_MS = 2000;

/** Detect an active Mafia lobby/game in this voice room (all clients, no socket required). */
export function useMafiaRoomSync(roomId, active) {
  const [gameId, setGameId] = useState(null);

  useEffect(() => {
    if (!active || !roomId || !isConfigured) {
      setGameId(null);
      return undefined;
    }

    let cancelled = false;
    let pollTimer = null;
    let realtimeLive = false;

    const sync = async () => {
      try {
        const id = await fetchActiveMafiaGame(roomId);
        if (!cancelled) setGameId(id ?? null);
      } catch {
        if (!cancelled) setGameId(null);
      }
    };

    const stopFallbackPoll = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const startFallbackPoll = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        if (document.hidden) return;
        sync();
      }, FALLBACK_POLL_MS);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && !realtimeLive) {
        sync();
      }
    };

    sync();
    startFallbackPoll();
    document.addEventListener("visibilitychange", onVisible);

    if (!supabase) {
      return () => {
        cancelled = true;
        stopFallbackPoll();
        document.removeEventListener("visibilitychange", onVisible);
      };
    }

    const channel = supabase
      .channel(`mafia-room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mafia_games", filter: `room_id=eq.${roomId}` },
        () => { sync(); },
      )
      .subscribe((status) => {
        realtimeLive = status === "SUBSCRIBED";
        if (realtimeLive) {
          stopFallbackPoll();
          sync();
        } else {
          startFallbackPoll();
        }
      });

    return () => {
      cancelled = true;
      stopFallbackPoll();
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [roomId, active]);

  return { gameId, hasActiveMafia: Boolean(gameId) };
}
