import { useMemo } from "react";

export function useDDDPlayers(players, userId, currentTurnUserId) {
  return useMemo(() => {
    const list = players ?? [];
    const active = list.filter((p) => p.is_active !== false);
    const me = active.find((p) => String(p.user_id) === String(userId)) ?? null;
    const actor = active.find((p) => String(p.user_id) === String(currentTurnUserId)) ?? null;
    const pickable = active.filter((p) => String(p.user_id) !== String(userId));
    const allowSelfPick = active.length < 4;

    return {
      active,
      me,
      actor,
      pickable: allowSelfPick ? active : pickable,
      allowSelfPick,
      count: active.length,
    };
  }, [players, userId, currentTurnUserId]);
}
