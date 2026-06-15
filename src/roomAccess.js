import {
  formatKickCooldown,
  getKickRemainingMs,
  isUserBlacklisted,
} from "./roomAdmin.js";
import {
  hasUnlockedRoom,
  isRoomPasswordProtected,
  verifyRoomPassword,
} from "./roomPassword.js";
import { isBlockedEitherWay } from "./userBlocks.js";

/** Whether viewer may enter a room (blacklist, kick cooldown, personal block vs owner, password). */
export async function checkRoomEntry(viewerId, room, { password } = {}) {
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

    if (isRoomPasswordProtected(room) && !hasUnlockedRoom(room.id)) {
      if (!password) {
        return { ok: false, reason: "password_required", needsPassword: true };
      }
      if (!verifyRoomPassword(room, password)) {
        return { ok: false, reason: "Incorrect room password" };
      }
    }
  }

  return { ok: true };
}
