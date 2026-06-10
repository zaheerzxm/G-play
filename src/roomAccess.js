import {
  formatKickCooldown,
  getKickRemainingMs,
  isUserBlacklisted,
} from "./roomAdmin.js";
import { isBlockedEitherWay } from "./userBlocks.js";

/** Whether viewer may enter a room (blacklist, kick cooldown, personal block vs owner). */
export async function checkRoomEntry(viewerId, room) {
  if (!room?.id) return { ok: false, reason: "Room not found" };

  if (viewerId && room.owner_id && viewerId === room.owner_id) {
    return { ok: true };
  }

  if (viewerId) {
    const blacklisted = await isUserBlacklisted(room.id, viewerId);
    if (blacklisted) {
      return { ok: false, reason: "You are blocked from this room" };
    }

    const kickRemaining = await getKickRemainingMs(room.id, viewerId);
    if (kickRemaining > 0) {
      return {
        ok: false,
        reason: `You were kicked. Try again in ${formatKickCooldown(kickRemaining)}.`,
      };
    }

    if (room.owner_id && (await isBlockedEitherWay(viewerId, room.owner_id))) {
      return {
        ok: false,
        reason: "You can't enter this room because of a personal block",
      };
    }
  }

  return { ok: true };
}
