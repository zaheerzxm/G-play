/** Shared room/game controller checks for Supabase Mafia & DDD. */

export const TIMER_DRIVER_PRESENCE_MS = 25_000;

export function activeOnlineUserIds(onlineUsers, now = Date.now()) {
  const cutoff = now - TIMER_DRIVER_PRESENCE_MS;
  return (onlineUsers ?? [])
    .filter((u) => u?.user_id && new Date(u.last_seen).getTime() >= cutoff)
    .map((u) => String(u.user_id));
}

/**
 * True when user may manage the game (start/end/kick/settings).
 * Covers game creator, room owner, room host seat, admins, super admins.
 */
export function canControlRoomGame(userId, roomContext, game) {
  if (!userId || !roomContext) return false;
  const uid = String(userId);

  if (game?.host_id && String(game.host_id) === uid) return true;
  if (roomContext.ownerUserId && String(roomContext.ownerUserId) === uid) return true;
  if (roomContext.roomHostUserId && String(roomContext.roomHostUserId) === uid) return true;

  if ((roomContext.roomAdminUserIds ?? []).some((id) => String(id) === uid)) return true;
  if ((roomContext.superAdminUserIds ?? []).some((id) => String(id) === uid)) return true;

  return false;
}

/**
 * Pick one timer driver among recently-active online users.
 * Global/deterministic — same result on every client.
 * Priority: game creator → room host → admins → super admins → active players.
 */
export function selectTimerDriverId({ game, players, roomContext }) {
  if (!roomContext) return null;

  const activeOnline = new Set(activeOnlineUserIds(roomContext.onlineUsers));
  const playerIds = (players ?? [])
    .map((p) => String(p.user_id))
    .filter((id) => activeOnline.has(id));

  const tiers = [
    game?.host_id,
    roomContext.roomHostUserId,
    ...(roomContext.roomAdminUserIds ?? []),
    ...(roomContext.superAdminUserIds ?? []),
    ...playerIds,
  ]
    .filter(Boolean)
    .map(String);

  const seen = new Set();
  for (const id of tiers) {
    if (seen.has(id)) continue;
    seen.add(id);
    if (!activeOnline.has(id)) continue;
    return id;
  }
  return null;
}

/** True when this client should call advance_*_phase_if_due. */
export function isGameTimerDriver(params) {
  const { localUserId, tabVisible, game, players, roomContext } = params;
  if (!localUserId) return false;

  const visible = tabVisible ?? (
    typeof document === "undefined" || document.visibilityState === "visible"
  );
  if (!visible) return false;

  const driverId = selectTimerDriverId({ game, players, roomContext });
  return driverId != null && String(driverId) === String(localUserId);
}
