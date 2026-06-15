const STORAGE_PREFIX = "gplay.visitors.v1";
const MAX_VISITORS = 100;

function storageKey(userId) {
  return `${STORAGE_PREFIX}.${userId}`;
}

export function loadVisitors(userId) {
  if (!userId) return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveVisitors(userId, list) {
  if (!userId) return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(list.slice(0, MAX_VISITORS)));
  } catch {
    /* optional */
  }
}

/** Record that viewerId visited targetProfile (stored on target's visitor list). */
export function recordVisit(targetUserId, visitor) {
  if (!targetUserId || !visitor?.id) return;
  if (String(targetUserId) === String(visitor.id)) return;

  const list = loadVisitors(targetUserId);
  const now = Date.now();
  const existing = list.find((v) => String(v.id) === String(visitor.id));

  if (existing) {
    existing.visitedAt = now;
    existing.display_name = visitor.display_name ?? existing.display_name;
    existing.avatar_url = visitor.avatar_url ?? existing.avatar_url;
    existing.country = visitor.country ?? existing.country;
    existing.isNew = true;
    const filtered = list.filter((v) => String(v.id) !== String(visitor.id));
    saveVisitors(targetUserId, [existing, ...filtered]);
    return;
  }

  const entry = {
    id: visitor.id,
    display_name: visitor.display_name ?? "Guest",
    avatar_url: visitor.avatar_url ?? null,
    country: visitor.country ?? null,
    visitedAt: now,
    isNew: true,
  };
  saveVisitors(targetUserId, [entry, ...list]);
}

export function countNewVisitors(userId) {
  return loadVisitors(userId).filter((v) => v.isNew).length;
}

export function markVisitorsSeen(userId) {
  const list = loadVisitors(userId).map((v) => ({ ...v, isNew: false }));
  saveVisitors(userId, list);
}

export function formatVisitAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - Number(ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
