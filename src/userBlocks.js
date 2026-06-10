import { supabase } from "./supabase.js";
import { loadProfilesForUserIds } from "./profile.js";
import { unfollowUser } from "./social.js";

/** Personal block — unfriend, no DM, can't enter each other's owned rooms. */
export async function blockUser(blockerId, blockedId) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!blockerId || !blockedId || blockerId === blockedId) {
    throw new Error("Invalid users");
  }

  const { error } = await supabase.from("user_blocks").insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });
  if (error && !/duplicate|unique constraint/i.test(error.message ?? "")) {
    throw error;
  }

  await Promise.all([
    unfollowUser(blockerId, blockedId).catch(() => {}),
    unfollowUser(blockedId, blockerId).catch(() => {}),
  ]);
}

export async function loadBlockedUsers(blockerId) {
  if (!supabase || !blockerId) return [];
  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocked_id, created_at")
    .eq("blocker_id", blockerId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const ids = (data ?? []).map((row) => row.blocked_id);
  if (!ids.length) return [];

  const profiles = await loadProfilesForUserIds(ids);
  return (data ?? []).map((row) => ({
    user_id: row.blocked_id,
    created_at: row.created_at,
    display_name: profiles[row.blocked_id]?.display_name ?? "User",
    avatar_url: profiles[row.blocked_id]?.avatar_url ?? null,
  }));
}

export async function unblockUser(blockerId, blockedId) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
}

export async function hasBlockedUser(blockerId, blockedId) {
  if (!supabase || !blockerId || !blockedId) return false;
  const { data } = await supabase
    .from("user_blocks")
    .select("blocker_id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();
  return Boolean(data);
}

/** True if either user blocked the other (personal block). */
export async function isBlockedEitherWay(userA, userB) {
  if (!userA || !userB || userA === userB) return false;
  const [aBlocksB, bBlocksA] = await Promise.all([
    hasBlockedUser(userA, userB),
    hasBlockedUser(userB, userA),
  ]);
  return aBlocksB || bBlocksA;
}
