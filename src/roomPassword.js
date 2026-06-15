const UNLOCK_KEY = "gplay.room_unlocks";

export function isRoomPasswordProtected(room) {
  return Boolean(String(room?.room_password ?? "").trim());
}

export function roomShowsLock(room) {
  return isRoomPasswordProtected(room);
}

export function needsRoomPassword(room, viewerId) {
  if (!isRoomPasswordProtected(room)) return false;
  if (viewerId && room.owner_id && viewerId === room.owner_id) return false;
  return true;
}

function readUnlocks() {
  try {
    const raw = window.sessionStorage.getItem(UNLOCK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeUnlocks(ids) {
  try {
    window.sessionStorage.setItem(UNLOCK_KEY, JSON.stringify(ids));
  } catch {
    /* optional */
  }
}

export function hasUnlockedRoom(roomId) {
  if (!roomId) return false;
  return readUnlocks().includes(roomId);
}

export function rememberRoomUnlock(roomId) {
  if (!roomId) return;
  const ids = readUnlocks();
  if (!ids.includes(roomId)) writeUnlocks([...ids, roomId]);
}

export function forgetRoomUnlock(roomId) {
  if (!roomId) return;
  writeUnlocks(readUnlocks().filter((id) => id !== roomId));
}

export function verifyRoomPassword(room, password) {
  const expected = String(room?.room_password ?? "").trim();
  if (!expected) return true;
  return String(password ?? "").trim() === expected;
}

export function normalizeRoomPassword(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}
