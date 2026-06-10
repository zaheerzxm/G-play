import { useCallback, useState } from "react";
import {
  submitDayVote,
  submitDetectiveCheck,
  submitDoctorSave,
  submitMafiaKill,
} from "./mafiaApi.js";

export function useMafiaActions(gameId, role, phase, isAlive, onDone) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (fn) => {
    if (!gameId || busy) return false;
    setBusy(true);
    setError(null);
    try {
      await fn();
      onDone?.();
      return true;
    } catch (e) {
      setError(e.message ?? "Action failed");
      return false;
    } finally {
      setBusy(false);
    }
  }, [gameId, busy, onDone]);

  const kill = useCallback(
    (targetUserId) => run(() => submitMafiaKill(gameId, targetUserId)),
    [gameId, run],
  );

  const save = useCallback(
    (targetUserId) => run(() => submitDoctorSave(gameId, targetUserId)),
    [gameId, run],
  );

  const investigate = useCallback(
    (targetUserId) => run(() => submitDetectiveCheck(gameId, targetUserId)),
    [gameId, run],
  );

  const vote = useCallback(
    (targetUserId) => run(() => submitDayVote(gameId, targetUserId)),
    [gameId, run],
  );

  const canNightAct = isAlive && phase === "night";
  const canVote = isAlive && phase === "voting";

  return {
    busy,
    error,
    kill: role === "mafia" && canNightAct ? kill : null,
    save: role === "doctor" && canNightAct ? save : null,
    investigate: role === "detective" && canNightAct ? investigate : null,
    vote: canVote ? vote : null,
  };
}
