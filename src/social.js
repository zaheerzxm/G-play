import { supabase } from "./supabase.js";
import { loadProfilesForUserIds } from "./profile.js";

export async function followUser(followerId, followingId) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("user_follows").insert({
    follower_id: followerId,
    following_id: followingId,
  });
  if (error) throw error;
}

export async function unfollowUser(followerId, followingId) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw error;
}

export async function isFollowingUser(followerId, followingId) {
  if (!supabase || !followerId || !followingId) return false;
  const { data } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return Boolean(data);
}

export async function loadFollowLists(userId) {
  if (!supabase || !userId) return { following: [], followers: [] };
  const [{ data: following }, { data: followers }] = await Promise.all([
    supabase.from("user_follows").select("following_id").eq("follower_id", userId),
    supabase.from("user_follows").select("follower_id").eq("following_id", userId),
  ]);
  const followingIds = (following ?? []).map((r) => r.following_id);
  const followerIds = (followers ?? []).map((r) => r.follower_id);
  const profiles = await loadProfilesForUserIds([...followingIds, ...followerIds]);
  return {
    following: followingIds.map((id) => profiles[id]).filter(Boolean),
    followers: followerIds.map((id) => profiles[id]).filter(Boolean),
  };
}

/** Both users added each other as friend */
export async function isMutualFriend(userId, otherId) {
  if (!userId || !otherId || userId === otherId) return false;
  const [a, b] = await Promise.all([
    isFollowingUser(userId, otherId),
    isFollowingUser(otherId, userId),
  ]);
  return a && b;
}

export async function loadMutualFriends(userId) {
  if (!supabase || !userId) return [];
  const { following, followers } = await loadFollowLists(userId);
  const followerIds = new Set(followers.map((f) => f.id));
  return following.filter((f) => followerIds.has(f.id));
}

/** People who added you but you have not added back yet. */
export async function loadPendingFriendRequests(userId) {
  if (!supabase || !userId) return [];
  const { following, followers } = await loadFollowLists(userId);
  const followingIds = new Set(following.map((f) => f.id));
  return followers.filter((f) => !followingIds.has(f.id));
}

export async function countPendingFriendRequests(userId) {
  const rows = await loadPendingFriendRequests(userId);
  return rows.length;
}

/** Accept a friend request by following them back. */
export async function acceptFriendRequest(userId, requesterId) {
  if (!supabase) throw new Error("Supabase is not configured");
  await followUser(userId, requesterId);
}

/** Decline a friend request — removes their follow toward you. */
export async function rejectFriendRequest(userId, requesterId) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", requesterId)
    .eq("following_id", userId);
  if (error) throw error;
}

/** You sent a request and are waiting for them to accept. */
export async function hasOutgoingFriendRequest(userId, otherId) {
  if (!userId || !otherId || userId === otherId) return false;
  const [following, mutual] = await Promise.all([
    isFollowingUser(userId, otherId),
    isMutualFriend(userId, otherId),
  ]);
  return following && !mutual;
}

export async function reportRoom(roomId, reporterId, reason) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("room_reports").insert({
    room_id: roomId,
    reporter_id: reporterId,
    reason: reason.trim(),
  });
  if (error) throw error;
}
