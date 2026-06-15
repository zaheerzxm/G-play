const PREFIX = "gplay.room_scoreboard.v1";

function storageKey(roomId) {
  return `${PREFIX}.${roomId}`;
}

export function loadRoomScoreboard(roomId) {
  if (!roomId) return {};
  try {
    const raw = localStorage.getItem(storageKey(roomId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const scores = {};
    for (const [key, value] of Object.entries(parsed)) {
      const num = Number(key);
      if (!Number.isFinite(num) || num < 1) continue;
      scores[num] = Math.max(0, Math.floor(Number(value) || 0));
    }
    return scores;
  } catch {
    return {};
  }
}

export function saveRoomScoreboard(roomId, scores) {
  if (!roomId) return;
  try {
    const payload = {};
    for (const [key, value] of Object.entries(scores ?? {})) {
      const num = Number(key);
      if (!Number.isFinite(num) || num < 1) continue;
      payload[num] = Math.max(0, Math.floor(Number(value) || 0));
    }
    localStorage.setItem(storageKey(roomId), JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}
