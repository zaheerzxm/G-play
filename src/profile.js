import { isSuperAdminEmail } from "./auth.js";
import { ROOM_CREATE_COST, STARTING_COINS, SUPER_ADMIN_COINS } from "./gifts.js";
import { normalizeRoomTag, roomTagLabel } from "./roomTags.js";
import { ROOM_SEAT_COUNT } from "./roomSeats.js";
import { supabase } from "./supabase.js";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PRESENCE_TTL_MS = 90_000;
const SEAT_GHOST_TTL_MS = 10 * 60_000;
const AVATAR_BUCKET = "avatars";

async function purgeStalePresence(roomId) {
  if (!supabase || !roomId) return;
  const since = new Date(Date.now() - SEAT_GHOST_TTL_MS).toISOString();
  await supabase.from("presence").delete().eq("room_id", roomId).lt("last_seen", since);
}

async function clearGhostSeats(roomId) {
  if (!supabase || !roomId) return;
  const since = new Date(Date.now() - SEAT_GHOST_TTL_MS).toISOString();
  const [{ data: seated }, { data: activePresence }] = await Promise.all([
    supabase.from("seats").select("seat_number, user_id").eq("room_id", roomId).not("user_id", "is", null),
    supabase.from("presence").select("user_id").eq("room_id", roomId).gte("last_seen", since),
  ]);
  const activeIds = new Set((activePresence ?? []).map((p) => p.user_id));
  const ghosts = (seated ?? []).filter((s) => s.user_id && !activeIds.has(s.user_id));
  await Promise.all(
    ghosts.map((seat) =>
      supabase
        .from("seats")
        .update({ user_id: null, nickname: null })
        .eq("room_id", roomId)
        .eq("seat_number", seat.seat_number),
    ),
  );
}

async function isTempRoomEmpty(roomId) {
  if (!supabase || !roomId) return false;
  const since = new Date(Date.now() - SEAT_GHOST_TTL_MS).toISOString();
  const [{ data: seated }, { count }] = await Promise.all([
    supabase.from("seats").select("seat_number").eq("room_id", roomId).not("user_id", "is", null),
    supabase
      .from("presence")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId)
      .gte("last_seen", since),
  ]);
  return (seated?.length ?? 0) === 0 && (count ?? 0) === 0;
}

async function deleteRoomRows(roomId) {
  if (!supabase || !roomId) return false;

  const childTables = [
    "presence",
    "room_waiting",
    "messages",
    "saved_rooms",
    "seats",
    "room_contributions",
    "room_admins",
    "room_blacklist",
    "room_kicks",
    "room_reaction_log",
    "red_packets",
    "room_auctions",
  ];

  for (const table of childTables) {
    const { error } = await supabase.from(table).delete().eq("room_id", roomId);
    if (error) throw error;
  }

  const { error } = await supabase.from("rooms").delete().eq("id", roomId);
  if (error) throw error;
  return true;
}

function generateCode(length) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function generateRoomCode() {
  return generateCode(6);
}

async function generateUniqueUserCode() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateCode(8);
    const { data } = await supabase.from("profiles").select("id").eq("user_code", code).maybeSingle();
    if (!data) return code;
  }
  return generateCode(10);
}

function walletUserId(id) {
  return String(id);
}

async function attachFreshOnlineCounts(rooms) {
  if (!supabase || !rooms?.length) return rooms ?? [];
  const roomIds = [...new Set(rooms.map((room) => room?.id).filter(Boolean))];
  if (!roomIds.length) return rooms;

  const since = new Date(Date.now() - PRESENCE_TTL_MS).toISOString();
  const { data: presenceRows } = await supabase
    .from("presence")
    .select("room_id")
    .in("room_id", roomIds)
    .gte("last_seen", since);

  const online = {};
  for (const row of presenceRows ?? []) {
    online[row.room_id] = (online[row.room_id] ?? 0) + 1;
  }

  return rooms.map((room) => ({
    ...room,
    online_count: online[room.id] ?? 0,
  }));
}

export async function ensureProfile(user) {
  if (!supabase || !user) return null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    let profile = existing;
    if (!existing.user_code) {
      const userCode = await generateUniqueUserCode();
      const { data: patched } = await supabase
        .from("profiles")
        .update({ user_code: userCode })
        .eq("id", user.id)
        .select()
        .single();
      if (patched) profile = patched;
    }
    if (isSuperAdminEmail(user.email) && !profile.is_super_admin) {
      const vipLevel = Math.max(Number(profile.vip_level ?? 0), 10);
      await supabase
        .from("profiles")
        .update({ is_super_admin: true, vip_level: vipLevel })
        .eq("id", user.id);
      await supabase
        .from("wallets")
        .update({ coins: SUPER_ADMIN_COINS })
        .eq("user_id", walletUserId(user.id));
      return { ...profile, is_super_admin: true, vip_level: Math.max(Number(profile.vip_level ?? 0), 10) };
    }
    return profile;
  }

  const isSuperAdmin = isSuperAdminEmail(user.email);
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const userCode = await generateUniqueUserCode();
  const profile = {
    id: user.id,
    display_name: displayName,
    avatar_url: user.user_metadata?.avatar_url ?? null,
    email: user.email,
    is_super_admin: isSuperAdmin,
    user_code: userCode,
  };

  await supabase.from("profiles").insert(profile);
  await supabase.from("wallets").insert({
    user_id: walletUserId(user.id),
    coins: isSuperAdmin ? SUPER_ADMIN_COINS : STARTING_COINS,
  });

  return profile;
}

export async function loadProfileBundle(userId) {
  if (!supabase) return null;

  const [{ data: profile }, { data: wallet }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("wallets").select("coins").eq("user_id", walletUserId(userId)).maybeSingle(),
  ]);

  if (!profile) return null;

  return {
    profile,
    coins: profile.is_super_admin ? SUPER_ADMIN_COINS : Number(wallet?.coins ?? STARTING_COINS),
  };
}

export async function updateProfile(userId, { displayName, avatarUrl, gender }) {
  if (!supabase) throw new Error("Supabase is not configured");

  const patch = {};
  if (displayName?.trim()) patch.display_name = displayName.trim();
  if (avatarUrl !== undefined) patch.avatar_url = avatarUrl.trim() || null;
  if (gender !== undefined) {
    const g = String(gender ?? "").trim().toLowerCase();
    if (g && !["male", "female"].includes(g)) {
      throw new Error("Gender must be male or female");
    }
    patch.gender = g || null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadProfileAvatar(userId, file) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!userId || !file) throw new Error("Choose a photo first");
  if (!file.type?.startsWith("image/")) throw new Error("Profile photo must be an image");
  if (file.size > 5 * 1024 * 1024) throw new Error("Profile photo must be under 5 MB");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/profile-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "image/jpeg",
    upsert: true,
  });

  if (error) {
    if (/bucket/i.test(error.message ?? "")) {
      throw new Error("Avatar storage is not ready. Run the latest supabase/RUN-THIS.sql first.");
    }
    throw error;
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function loadProfilesForUserIds(userIds) {
  if (!supabase) return {};
  const ids = [...new Set((userIds ?? []).filter(Boolean))];
  if (!ids.length) return {};

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, user_code, charm, user_level, user_exp, vip_level, vip_points, vip_expires_at, title, gender, is_super_admin")
    .in("id", ids);
  if (error) throw error;

  const map = {};
  for (const row of data ?? []) {
    map[row.id] = row;
  }
  return map;
}

export async function loadRoomSocialStats(roomId) {
  if (!supabase || !roomId) return { members: 0, fans: 0 };

  const { data, error } = await supabase.rpc("get_room_social_stats", { p_room_id: roomId });
  if (!error && data) {
    return {
      members: Number(data.members ?? 0),
      fans: Number(data.fans ?? 0),
    };
  }

  const [{ count: members }, { count: fans }] = await Promise.all([
    supabase
      .from("saved_rooms")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId),
    supabase
      .from("saved_rooms")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId)
      .eq("is_following", true),
  ]);

  return { members: members ?? 0, fans: fans ?? 0 };
}

export async function rallyRoomFans(roomId) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("rally_room_fans", { p_room_id: roomId });
  if (error) {
    if (/rally_room_fans/i.test(error.message ?? "")) {
      throw new Error("Rally fans needs the latest supabase/RUN-THIS.sql — run it in Supabase SQL Editor");
    }
    throw error;
  }
  return Number(data ?? 0);
}

export async function loadRoomMembers(roomId, limit = 50) {
  if (!supabase || !roomId) return [];

  const { data, error } = await supabase.rpc("list_room_members", {
    p_room_id: roomId,
    p_limit: limit,
  });

  if (!error && data?.length) {
    return data.map((row) => ({
      id: row.user_id,
      user_id: row.user_id,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      charm: Number(row.charm ?? 0),
      is_following: Boolean(row.is_following),
      joined_at: row.joined_at,
    }));
  }

  return [];
}

export async function loadRoomOwnerProfile(ownerId) {
  if (!supabase || !ownerId) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, user_code")
    .eq("id", ownerId)
    .maybeSingle();
  return data;
}

export async function lookupProfileByCode(userCode) {
  if (!supabase || !userCode?.trim()) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, user_code")
    .eq("user_code", userCode.trim().toUpperCase())
    .maybeSingle();
  return data;
}

export async function discoverRooms({ tab = "all", tag = "all", userId } = {}) {
  if (!supabase) return [];

  let roomsQuery = supabase
    .from("rooms")
    .select("*")
    .eq("is_temp", false)
    .order("room_level", { ascending: false })
    .limit(50);

  if (tag && tag !== "all") {
    roomsQuery = roomsQuery.eq("room_tag", normalizeRoomTag(tag));
  }

  const [{ data: rooms, error }, savedRows] = await Promise.all([
    roomsQuery,
    userId ? loadSavedRooms(userId).catch(() => []) : Promise.resolve([]),
  ]);
  if (error || !rooms?.length) return [];

  const withCounts = await attachFreshOnlineCounts(rooms);
  const enrich = (room) => ({
    ...room,
    tag: normalizeRoomTag(room.room_tag ?? room.tag),
    tag_label: roomTagLabel(room.room_tag ?? room.tag),
  });

  let list = withCounts.map(enrich);

  if (tab === "related" && userId) {
    const savedIds = new Set((savedRows ?? []).map((r) => r.id));
    list = list.filter((r) => savedIds.has(r.id));
  } else if (tab === "popular") {
    list = [...list].sort((a, b) => (b.online_count ?? 0) - (a.online_count ?? 0));
  }

  return list;
}

export async function loadMyRooms(userId) {
  if (!supabase) return [];
  const { data } = await supabase
    .from("rooms")
    .select("*")
    .eq("owner_id", userId)
    .eq("is_custom", true)
    .eq("is_temp", false)
    .order("created_at", { ascending: false });
  return attachFreshOnlineCounts(data ?? []);
}

export async function loadSavedRooms(userId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("saved_rooms")
    .select("is_following, created_at, rooms(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rooms = (data ?? [])
    .map((row) => {
      const room = row.rooms;
      if (!room) return null;
      if (room.is_temp) return null;
      return {
        ...room,
        is_following: row.is_following,
        saved_at: row.created_at,
      };
    })
    .filter(Boolean);
  return attachFreshOnlineCounts(rooms);
}

export async function loadRoomSaveState(userId, roomId) {
  if (!supabase || !userId || !roomId) {
    return { isSaved: false, isFollowing: false };
  }

  const { data } = await supabase
    .from("saved_rooms")
    .select("is_following")
    .eq("user_id", userId)
    .eq("room_id", roomId)
    .maybeSingle();

  return {
    isSaved: Boolean(data),
    isFollowing: Boolean(data?.is_following),
  };
}

export async function joinSavedRoom(userId, roomId) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data: existing } = await supabase
    .from("saved_rooms")
    .select("room_id")
    .eq("user_id", userId)
    .eq("room_id", roomId)
    .maybeSingle();
  if (existing) return;

  const { error } = await supabase.from("saved_rooms").insert({
    user_id: userId,
    room_id: roomId,
    is_following: false,
  });
  if (error) throw error;
}

export async function followRoom(userId, roomId) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("saved_rooms").upsert(
    {
      user_id: userId,
      room_id: roomId,
      is_following: true,
    },
    { onConflict: "user_id,room_id" },
  );
  if (error) throw error;
}

export async function unfollowRoom(userId, roomId) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase
    .from("saved_rooms")
    .update({ is_following: false })
    .eq("user_id", userId)
    .eq("room_id", roomId);
  if (error) throw error;
}

export async function leaveSavedRoom(userId, roomId) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase
    .from("saved_rooms")
    .delete()
    .eq("user_id", userId)
    .eq("room_id", roomId);
  if (error) throw error;
}

export async function searchRoomByCode(code) {
  if (!supabase) return null;
  const normalized = code.trim().toUpperCase();
  if (normalized.length < 4) return null;

  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("room_code", normalized)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function loadRoomById(roomId) {
  if (!supabase || !roomId) return null;
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function loadGlobalRoom() {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", "global-room")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Global room not found");
  return data;
}

export async function createTempPartyRoom({ userId, roomName, roomMode = "normal", backgroundKey = "golden_party" }) {
  if (!supabase) throw new Error("Supabase is not configured");

  await cleanupOwnedEmptyTempRooms(userId).catch(() => {});

  const roomId = `temp-${crypto.randomUUID()}`;
  let roomCode = generateRoomCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from("rooms")
      .select("id")
      .eq("room_code", roomCode)
      .maybeSingle();
    if (!existing) break;
    roomCode = generateRoomCode();
  }

  const { error: roomError } = await supabase.from("rooms").insert({
    id: roomId,
    name: roomName?.trim() || `Party ${roomCode}`,
    room_code: roomCode,
    owner_id: userId,
    is_custom: true,
    is_temp: true,
    room_mode: roomMode,
    background_key: backgroundKey,
  });
  if (roomError) throw roomError;

  const seatRows = Array.from({ length: ROOM_SEAT_COUNT }, (_, i) => ({
    room_id: roomId,
    seat_number: i + 1,
  }));
  const { error: seatsError } = await supabase.from("seats").insert(seatRows);
  if (seatsError) {
    await supabase.from("seats").delete().eq("room_id", roomId);
    await supabase.from("rooms").delete().eq("id", roomId);
    throw seatsError;
  }

  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  return { room };
}

export async function cleanupTempRoomIfEmpty(roomId) {
  if (!supabase || !roomId) return false;

  const { data: room } = await supabase
    .from("rooms")
    .select("is_temp")
    .eq("id", roomId)
    .maybeSingle();
  if (!room?.is_temp) return false;

  await purgeStalePresence(roomId);
  await clearGhostSeats(roomId);

  if (!(await isTempRoomEmpty(roomId))) return false;

  try {
    return await deleteRoomRows(roomId);
  } catch {
    return false;
  }
}

export async function cleanupInactiveRoomUsers(roomId) {
  if (!supabase || !roomId) return;
  await purgeStalePresence(roomId);
  await clearGhostSeats(roomId);
}

export async function deleteRoomAsSuperAdmin(roomId, isSuperAdmin) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!isSuperAdmin) throw new Error("Only super admin can delete rooms");
  try {
    await deleteRoomRows(roomId);
    return true;
  } catch (e) {
    throw new Error(e.message ?? "Could not delete room");
  }
}

/** Purge all of a user's abandoned temp rooms (ghost seats / stale presence). */
export async function cleanupOwnedEmptyTempRooms(userId) {
  if (!supabase || !userId) return 0;

  const { data: rooms } = await supabase
    .from("rooms")
    .select("id")
    .eq("owner_id", userId)
    .eq("is_temp", true);

  let removed = 0;
  for (const room of rooms ?? []) {
    const ok = await cleanupTempRoomIfEmpty(room.id);
    if (ok) removed += 1;
  }
  return removed;
}

/** Best-effort sweep for temp rooms older than 2h with no live users. */
export async function cleanupStaleTempRooms(maxAgeMs = 2 * 60 * 60 * 1000) {
  if (!supabase) return 0;

  const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id")
    .eq("is_temp", true)
    .lt("created_at", cutoff)
    .limit(40);

  let removed = 0;
  for (const room of rooms ?? []) {
    const ok = await cleanupTempRoomIfEmpty(room.id);
    if (ok) removed += 1;
  }
  return removed;
}

export async function createPersonalRoom({ userId, roomName, currentCoins, isSuperAdmin }) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!isSuperAdmin && currentCoins < ROOM_CREATE_COST) {
    throw new Error(`You need ${ROOM_CREATE_COST} coins to create a room`);
  }

  const roomId = `room-${crypto.randomUUID()}`;
  let roomCode = generateRoomCode();

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from("rooms")
      .select("id")
      .eq("room_code", roomCode)
      .maybeSingle();
    if (!existing) break;
    roomCode = generateRoomCode();
  }

  if (!isSuperAdmin) {
    const { error: walletError } = await supabase
      .from("wallets")
      .update({
        coins: currentCoins - ROOM_CREATE_COST,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", walletUserId(userId));
    if (walletError) throw walletError;
  }

  const { error: roomError } = await supabase.from("rooms").insert({
    id: roomId,
    name: roomName.trim() || `Room ${roomCode}`,
    room_code: roomCode,
    owner_id: userId,
    is_custom: true,
  });
  if (roomError) throw roomError;

  const seatRows = Array.from({ length: ROOM_SEAT_COUNT }, (_, i) => ({
    room_id: roomId,
    seat_number: i + 1,
  }));
  const { error: seatsError } = await supabase.from("seats").insert(seatRows);
  if (seatsError) throw seatsError;

  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  return {
    room,
    newBalance: isSuperAdmin ? currentCoins : currentCoins - ROOM_CREATE_COST,
  };
}

export async function sendCoinsToUser({
  fromUserId,
  recipientUserCode,
  recipientUserId,
  amount,
  isSuperAdmin,
  currentCoins,
}) {
  if (!supabase) throw new Error("Supabase is not configured");
  const code = recipientUserCode?.trim().toUpperCase() ?? "";
  const coinAmount = Number(amount);

  if ((!recipientUserId && (!code || code.length < 4)) || !coinAmount || coinAmount < 1) {
    throw new Error("Pick a friend and a valid amount");
  }
  if (!isSuperAdmin && coinAmount > currentCoins) {
    throw new Error("Not enough coins");
  }

  let recipient;
  if (recipientUserId) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, user_code")
      .eq("id", recipientUserId)
      .maybeSingle();
    if (profileError) throw profileError;
    recipient = data;
  } else {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, user_code")
      .eq("user_code", code)
      .maybeSingle();
    if (profileError) throw profileError;
    recipient = data;
  }

  if (!recipient) throw new Error("No account found for that friend");
  if (recipient.id === fromUserId) throw new Error("Cannot send coins to yourself");

  const recipientWalletId = walletUserId(recipient.id);
  const senderWalletId = walletUserId(fromUserId);

  const { data: recipientWallet } = await supabase
    .from("wallets")
    .select("coins")
    .eq("user_id", recipientWalletId)
    .maybeSingle();

  if (!recipientWallet) {
    await supabase.from("wallets").insert({ user_id: recipientWalletId, coins: 0 });
  }

  const recipientBalance = Number(recipientWallet?.coins ?? 0);
  const newRecipientBalance = recipientBalance + coinAmount;

  const { error: recvError } = await supabase
    .from("wallets")
    .update({ coins: newRecipientBalance, updated_at: new Date().toISOString() })
    .eq("user_id", recipientWalletId);
  if (recvError) throw recvError;

  let newSenderBalance = currentCoins;
  if (!isSuperAdmin) {
    newSenderBalance = currentCoins - coinAmount;
    const { error: sendError } = await supabase
      .from("wallets")
      .update({ coins: newSenderBalance, updated_at: new Date().toISOString() })
      .eq("user_id", senderWalletId);
    if (sendError) throw sendError;
  }

  return { newSenderBalance, recipientName: recipient.display_name };
}

export async function creditGiftReward(recipientUserId, rewardAmount) {
  if (!supabase) throw new Error("Supabase is not configured");
  const amount = Math.max(0, Math.floor(Number(rewardAmount)));
  if (!amount) return 0;

  const walletId = walletUserId(recipientUserId);
  const { data: wallet } = await supabase
    .from("wallets")
    .select("coins")
    .eq("user_id", walletId)
    .maybeSingle();

  if (!wallet) {
    const { error } = await supabase.from("wallets").insert({ user_id: walletId, coins: amount });
    if (error) throw error;
    return amount;
  }

  const newBalance = Number(wallet.coins) + amount;
  const { error } = await supabase
    .from("wallets")
    .update({ coins: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", walletId);
  if (error) throw error;
  return amount;
}
