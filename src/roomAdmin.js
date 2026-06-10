import { supabase } from "./supabase.js";
import { loadProfilesForUserIds, loadRoomMembers } from "./profile.js";

const ROOM_BACKGROUND_BUCKET = "room-backgrounds";

function formatAdminError(error) {
  const msg = error?.message ?? "Admin update failed";
  if (/relation.*room_admins|does not exist/i.test(msg)) {
    return new Error("Run supabase/room-admins-fix.sql in Supabase SQL Editor first");
  }
  if (/duplicate key|unique constraint|already exists/i.test(msg)) {
    return new Error("Already an admin");
  }
  if (/Only the room owner|not authorized|permission|policy/i.test(msg)) {
    return new Error("Only the room owner can manage admins");
  }
  return new Error(msg);
}

export async function loadRoomAdmins(roomId) {
  if (!supabase || !roomId) return [];
  const { data, error } = await supabase
    .from("room_admins")
    .select("user_id, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) throw formatAdminError(error);

  const ids = (data ?? []).map((r) => r.user_id);
  if (!ids.length) return [];

  const profiles = await loadProfilesForUserIds(ids);
  return ids.map((id) => ({
    id,
    user_id: id,
    display_name: profiles[id]?.display_name ?? "Admin",
    avatar_url: profiles[id]?.avatar_url ?? null,
  }));
}

export async function loadAdminCandidates(roomId) {
  if (!supabase || !roomId) return [];

  const [members, seatsRes] = await Promise.all([
    loadRoomMembers(roomId, 100),
    supabase
      .from("seats")
      .select("user_id, nickname")
      .eq("room_id", roomId)
      .not("user_id", "is", null),
  ]);

  const byId = new Map();
  for (const row of members ?? []) {
    const id = row.user_id ?? row.id;
    if (id) byId.set(id, row);
  }
  for (const seat of seatsRes.data ?? []) {
    if (!seat.user_id || byId.has(seat.user_id)) continue;
    byId.set(seat.user_id, {
      user_id: seat.user_id,
      display_name: seat.nickname ?? "Guest",
    });
  }

  const ids = [...byId.keys()];
  if (!ids.length) return [];

  const profiles = await loadProfilesForUserIds(ids);
  return ids.map((id) => {
    const base = byId.get(id) ?? {};
    const profile = profiles[id] ?? {};
    return {
      id,
      user_id: id,
      display_name: profile.display_name ?? base.display_name ?? base.nickname ?? "Member",
      avatar_url: profile.avatar_url ?? base.avatar_url ?? null,
      is_following: Boolean(base.is_following),
    };
  });
}

export async function addRoomAdmin(roomId, adminUserId) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!roomId || !adminUserId) throw new Error("Missing room or user");

  const { data, error } = await supabase
    .from("room_admins")
    .insert({ room_id: roomId, user_id: adminUserId })
    .select("user_id")
    .maybeSingle();

  if (!error && data?.user_id) return data;

  const blocked = error && !/duplicate|unique constraint/i.test(error.message ?? "");
  if (blocked) {
    const { error: rpcError } = await supabase.rpc("add_room_admin", {
      p_room_id: roomId,
      p_user_id: adminUserId,
    });
    if (!rpcError) return { user_id: adminUserId };
    throw formatAdminError(rpcError);
  }

  if (error) throw formatAdminError(error);
  return { user_id: adminUserId };
}

export async function removeRoomAdmin(roomId, adminUserId) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!roomId || !adminUserId) throw new Error("Missing room or user");

  const { data, error } = await supabase
    .from("room_admins")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", adminUserId)
    .select("user_id");

  if (!error && (data?.length ?? 0) > 0) return true;

  const { error: rpcError } = await supabase.rpc("remove_room_admin", {
    p_room_id: roomId,
    p_user_id: adminUserId,
  });
  if (!rpcError) return true;

  if (error) throw formatAdminError(error);
  throw formatAdminError(rpcError);
}

export async function isRoomAdmin(roomId, userId, ownerId) {
  if (!userId) return false;
  if (ownerId && userId === ownerId) return true;
  if (!supabase) return false;
  const { data } = await supabase
    .from("room_admins")
    .select("user_id")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export const ROOM_KICK_COOLDOWN_MS = 5 * 60_000;

export async function blacklistUser(roomId, blockedUserId, reason = "") {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("room_blacklist").insert({
    room_id: roomId,
    user_id: blockedUserId,
    reason: reason || null,
  });
  if (error) throw error;
}

export async function removeFromBlacklist(roomId, userId) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase
    .from("room_blacklist")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", userId);
  if (error) throw error;
  await supabase.from("room_kicks").delete().eq("room_id", roomId).eq("user_id", userId);
}

export async function loadRoomBlacklist(roomId) {
  if (!supabase || !roomId) return [];
  const { data, error } = await supabase
    .from("room_blacklist")
    .select("user_id, reason, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const ids = (data ?? []).map((row) => row.user_id);
  if (!ids.length) return [];

  const profiles = await loadProfilesForUserIds(ids);
  return (data ?? []).map((row) => ({
    user_id: row.user_id,
    reason: row.reason,
    created_at: row.created_at,
    display_name: profiles[row.user_id]?.display_name ?? "User",
    avatar_url: profiles[row.user_id]?.avatar_url ?? null,
  }));
}

export async function isUserBlacklisted(roomId, userId) {
  if (!supabase || !userId) return false;
  const { data } = await supabase
    .from("room_blacklist")
    .select("user_id")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function getKickRemainingMs(roomId, userId) {
  if (!supabase || !userId) return 0;
  const { data } = await supabase
    .from("room_kicks")
    .select("expires_at")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data?.expires_at) return 0;
  const remaining = new Date(data.expires_at).getTime() - Date.now();
  return remaining > 0 ? remaining : 0;
}

export async function isUserKickedFromRoom(roomId, userId) {
  return (await getKickRemainingMs(roomId, userId)) > 0;
}

export function formatKickCooldown(ms) {
  const mins = Math.max(1, Math.ceil(ms / 60_000));
  return `${mins} minute${mins === 1 ? "" : "s"}`;
}

/** Remove user from room; they can rejoin after ROOM_KICK_COOLDOWN_MS. */
export async function kickUserFromRoom(roomId, targetUserId, kickedBy = null) {
  if (!supabase) throw new Error("Supabase is not configured");
  const expiresAt = new Date(Date.now() + ROOM_KICK_COOLDOWN_MS).toISOString();

  const { error: kickError } = await supabase.from("room_kicks").upsert(
    {
      room_id: roomId,
      user_id: targetUserId,
      kicked_by: kickedBy,
      kicked_at: new Date().toISOString(),
      expires_at: expiresAt,
    },
    { onConflict: "room_id,user_id" },
  );
  if (kickError) throw kickError;

  await supabase
    .from("seats")
    .update({ user_id: null, nickname: null })
    .eq("room_id", roomId)
    .eq("user_id", targetUserId);

  const { error: presenceError } = await supabase
    .from("presence")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", targetUserId);
  if (presenceError) throw presenceError;
}

export async function updateRoomSettings(roomId, patch) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("rooms")
    .update(patch)
    .eq("id", roomId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadRoomBackground(roomId, ownerId, file) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!roomId || !ownerId || !file) throw new Error("Choose a background image first");
  if (!file.type?.startsWith("image/")) throw new Error("Background must be an image");
  if (file.size > 8 * 1024 * 1024) throw new Error("Background image must be under 8 MB");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${ownerId}/${roomId}/background-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(ROOM_BACKGROUND_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "image/jpeg",
    upsert: true,
  });

  if (error) {
    if (/bucket/i.test(error.message ?? "")) {
      throw new Error("Room background storage is not ready. Run the latest supabase/RUN-THIS.sql first.");
    }
    throw error;
  }

  const { data } = supabase.storage.from(ROOM_BACKGROUND_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
