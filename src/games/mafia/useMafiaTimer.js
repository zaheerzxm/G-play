import { useEffect, useState } from "react";
import { advanceMafiaPhaseIfDue } from "./mafiaApi.js";

export function useMafiaTimer(game, gameId, onTick, isTimerDriver) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!game?.phase_ends_at) {
      setSecondsLeft(0);
      return undefined;
    }

    const tick = async () => {
      const left = Math.max(0, Math.ceil((new Date(game.phase_ends_at).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0 && gameId && isTimerDriver) {
        try {
          await advanceMafiaPhaseIfDue(gameId);
          onTick?.();
        } catch {
          /* phase may already advanced */
        }
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [game?.phase_ends_at, game?.phase, gameId, onTick, isTimerDriver]);

  return secondsLeft;
}
