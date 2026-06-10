import { useMemo } from "react";
import { ROLE_META } from "./constants.js";

export function useMafiaPlayerRole(privateState, gameStatus) {
  return useMemo(() => {
    const role = privateState?.role ?? null;
    const team = privateState?.team ?? null;
    const meta = role ? ROLE_META[role] : null;
    const isMafia = role === "mafia";
    const teammates = privateState?.mafia_teammates ?? [];
    const detectiveResults = (privateState?.private_events ?? []).filter(
      (e) => e.event_type === "detective_result",
    );

    return {
      role,
      team,
      meta,
      isMafia,
      teammates,
      detectiveResults,
      isAlive: privateState?.is_alive !== false,
      canAct: gameStatus === "active" && privateState?.is_alive !== false,
    };
  }, [privateState, gameStatus]);
}
