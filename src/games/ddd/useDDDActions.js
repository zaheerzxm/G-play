import { useCallback, useState } from "react";
import { addDDDReaction, submitDDDTurn } from "./dddApi.js";

export function useDDDActions(gameId, refresh) {
  const [submitting, setSubmitting] = useState(false);

  const submitTurn = useCallback(async (picks) => {
    if (!gameId || submitting) return;
    setSubmitting(true);
    try {
      await submitDDDTurn(gameId, picks);
      await refresh?.();
    } finally {
      setSubmitting(false);
    }
  }, [gameId, submitting, refresh]);

  const react = useCallback(async (turnId, reactionType) => {
    if (!gameId || !turnId) return;
    await addDDDReaction(gameId, turnId, reactionType);
    await refresh?.();
  }, [gameId, refresh]);

  return { submitTurn, react, submitting };
}
