function prefKey(prefix, userId, friendId) {
  return `gplay_dm_${prefix}_${userId}_${friendId}`;
}

export function loadDmAlias(userId, friendId) {
  if (!userId || !friendId) return "";
  try {
    return localStorage.getItem(prefKey("alias", userId, friendId)) ?? "";
  } catch {
    return "";
  }
}

export function saveDmAlias(userId, friendId, alias) {
  if (!userId || !friendId) return;
  const trimmed = String(alias ?? "").trim();
  try {
    if (trimmed) localStorage.setItem(prefKey("alias", userId, friendId), trimmed);
    else localStorage.removeItem(prefKey("alias", userId, friendId));
  } catch {
    /* ignore */
  }
}

export function loadDmMuted(userId, friendId) {
  if (!userId || !friendId) return false;
  try {
    return localStorage.getItem(prefKey("muted", userId, friendId)) === "1";
  } catch {
    return false;
  }
}

export function saveDmMuted(userId, friendId, muted) {
  if (!userId || !friendId) return;
  try {
    if (muted) localStorage.setItem(prefKey("muted", userId, friendId), "1");
    else localStorage.removeItem(prefKey("muted", userId, friendId));
  } catch {
    /* ignore */
  }
}

export function loadDmBlockInvites(userId, friendId) {
  if (!userId || !friendId) return false;
  try {
    return localStorage.getItem(prefKey("block_invites", userId, friendId)) === "1";
  } catch {
    return false;
  }
}

export function saveDmBlockInvites(userId, friendId, blocked) {
  if (!userId || !friendId) return;
  try {
    if (blocked) localStorage.setItem(prefKey("block_invites", userId, friendId), "1");
    else localStorage.removeItem(prefKey("block_invites", userId, friendId));
  } catch {
    /* ignore */
  }
}

const WALLPAPER_OPTIONS = [
  { key: "default", label: "Default", css: "" },
  { key: "lavender", label: "Lavender", css: "linear-gradient(180deg,#f5f3ff,#ede9fe)" },
  { key: "mint", label: "Mint", css: "linear-gradient(180deg,#ecfdf5,#d1fae5)" },
  { key: "sunset", label: "Sunset", css: "linear-gradient(180deg,#fff7ed,#fecdd3)" },
  { key: "night", label: "Night", css: "linear-gradient(180deg,#1e1b4b,#312e81)" },
];

export function dmWallpaperOptions() {
  return WALLPAPER_OPTIONS;
}

export function loadDmWallpaper(userId, friendId) {
  if (!userId || !friendId) return WALLPAPER_OPTIONS[0];
  try {
    const key = localStorage.getItem(prefKey("wallpaper", userId, friendId)) ?? "default";
    return WALLPAPER_OPTIONS.find((w) => w.key === key) ?? WALLPAPER_OPTIONS[0];
  } catch {
    return WALLPAPER_OPTIONS[0];
  }
}

export function saveDmWallpaper(userId, friendId, key) {
  if (!userId || !friendId) return;
  try {
    if (key && key !== "default") localStorage.setItem(prefKey("wallpaper", userId, friendId), key);
    else localStorage.removeItem(prefKey("wallpaper", userId, friendId));
  } catch {
    /* ignore */
  }
}
