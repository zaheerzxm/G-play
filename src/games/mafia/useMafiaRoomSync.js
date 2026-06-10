import { useEffect, useState } from "react";
import { isConfigured, supabase } from "../../supabase.js";
import { fetchActiveMafiaGame } from "./mafiaApi.js";

/** Detect an active Mafia lobby/game in this voice room (all clients, no socket required). */
export function useMafiaRoomSync(roomId, active) {
  const [gameId, setGameId] = useState(null);

  useEffect(() => {
    if (!active || !roomId || !isConfigured) {
      setGameId(null);
      return undefined;
    }

    let cancelled = false;

    const sync = async () => {
      try {
        const id = await fetchActiveMafiaGame(roomId);
        if (!cancelled) setGameId(id ?? null);
      } catch {
        if (!cancelled) setGameId(null);
      }
    };

    sync();
    const poll = setInterval(sync, 2500);

    if (!supabase) {
      return () => {
        cancelled = true;
        clearInterval(poll);
      };
    }

    const channel = supabase
      .channel(`mafia-room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mafia_games", filter: `room_id=eq.${roomId}` },
        () => { sync(); },
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [roomId, active]);

  return { gameId, hasActiveMafia: Boolean(gameId) };
}
