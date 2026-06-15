import { supabase } from "./supabase.js";

/** Keep room chat rows for this long (persistent + temp rooms). */
export const ROOM_MESSAGE_TTL_MS = 24 * 60 * 60 * 1000;

/** Matches presence TTL in profile.js — room counts as empty after this. */
export const ROOM_MESSAGE_PRESENCE_TTL_SEC = 90;

/**
 * Delete old room chat + wipe temp-room chat when nobody is online.
 * @param {string|null} roomId — single room, or null for a global sweep
 */
export async function purgeStaleRoomMessages(roomId = null) {
  if (!supabase) return null;

  const ttlHours = Math.max(1, Math.round(ROOM_MESSAGE_TTL_MS / (60 * 60 * 1000)));

  try {
    const { data, error } = await supabase.rpc("purge_stale_room_messages", {
      p_room_id: roomId,
      p_message_ttl: `${ttlHours} hours`,
      p_presence_ttl: `${ROOM_MESSAGE_PRESENCE_TTL_SEC} seconds`,
    });
    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

export function roomMessageCutoffIso() {
  return new Date(Date.now() - ROOM_MESSAGE_TTL_MS).toISOString();
}
