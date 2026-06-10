import { useEffect } from "react";
import { supabase } from "../../supabase.js";

export function useMafiaRealtime(gameId, onChange) {
  useEffect(() => {
    if (!supabase || !gameId || !onChange) return undefined;

    const channel = supabase
      .channel(`mafia:${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mafia_games", filter: `id=eq.${gameId}` },
        () => onChange(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mafia_events", filter: `game_id=eq.${gameId}` },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, onChange]);
}
