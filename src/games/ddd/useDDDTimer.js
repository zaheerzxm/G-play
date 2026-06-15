import { useEffect, useState } from "react";

export function useDDDTimer(game, onLastFiveTick) {
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [warning, setWarning] = useState(false);

  useEffect(() => {
    if (!game?.phase_ends_at) {
      setSecondsLeft(null);
      setWarning(false);
      return undefined;
    }

    const tick = () => {
      const end = new Date(game.phase_ends_at).getTime();
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setSecondsLeft(left);
      setWarning(left > 0 && left <= 5);
      if (left > 0 && left <= 5) onLastFiveTick?.(left);
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [game?.phase_ends_at, game?.phase, onLastFiveTick]);

  return { secondsLeft, warning };
}
