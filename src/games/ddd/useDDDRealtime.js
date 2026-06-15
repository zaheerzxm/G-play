import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../supabase.js";

const REALTIME_DEBOUNCE_MS = 350;

export function useDDDRealtime(gameId, onChange) {
  const [connected, setConnected] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const debounceRef = useRef(null);

  const scheduleChange = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChangeRef.current?.();
    }, REALTIME_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    if (!supabase || !gameId || !onChange) {
      setConnected(false);
      return undefined;
    }

    const channel = supabase
      .channel(`ddd:${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ddd_games", filter: `id=eq.${gameId}` },
        () => scheduleChange(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ddd_players", filter: `game_id=eq.${gameId}` },
        () => scheduleChange(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ddd_turns", filter: `game_id=eq.${gameId}` },
        () => scheduleChange(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ddd_reactions", filter: `game_id=eq.${gameId}` },
        () => scheduleChange(),
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") scheduleChange();
      });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [gameId, onChange, scheduleChange]);

  return connected;
}
