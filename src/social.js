import { supabase } from "./supabase.js";
import { loadProfilesForUserIds } from "./profile.js";
import { markGameTaskProgress } from "./gameTasks.js";

const FOLLOW_GRAPH_CACHE_TTL_MS = 60_000;
const followGraphCache = new Map();

export function invalidateFollowGraphCache(userId) {
  if (userId) followGraphCache.delete(userId);
}

function readFollowGraphCache(userId) {
  const entry = followGraphCache.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > FOLLOW_GRAPH_CACHE_TTL_MS) {
    followGraphCache.delete(userId);
    return null;
  }
  return entry;
}

export function mutualFriendsFromGraph({ following, followers }) {
  const followerIds = new Set(followers.map((f) => f.id));
  return following.filter((f) => followerIds.has(f.id));
}

export function pendingRequestsFromGraph({ following, followers }) {
  const followingIds = new Set(following.map((f) => f.id));
  return followers.filter((f) => !followingIds.has(f.id));
}

export async function loadFollowLists(userId, { forceRefresh = false } = {}) {
  if (!supabase || !userId) return { following: [], followers: [] };

  if (!forceRefresh) {
    const cached = readFollowGraphCache(userId);
    if (cached) return { following: cached.following, followers: cached.followers };
  }

  const [{ data: following }, { data: followers }] = await Promise.all([
    supabase.from("user_follows").select("following_id").eq("follower_id", userId),
    supabase.from("user_follows").select("follower_id").eq("following_id", userId),
  ]);
  const followingIds = (following ?? []).map((r) => r.following_id);
  const followerIds = (followers ?? []).map((r) => r.follower_id);
  const profiles = await loadProfilesForUserIds([...followingIds, ...followerIds]);
  const result = {
    following: followingIds.map((id) => profiles[id]).filter(Boolean),
    followers: followerIds.map((id) => profiles[id]).filter(Boolean),
  };
  followGraphCache.set(userId, { ...result, fetchedAt: Date.now() });
  return result;
}

export async function followUser(followerId, followingId) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("user_follows").insert({
    follower_id: followerId,
    following_id: followingId,
  });
  if (error) throw error;
  invalidateFollowGraphCache(followerId);
  invalidateFollowGraphCache(followingId);
  markGameTaskProgress(followerId, "follow_user");
}

export async function unfollowUser(followerId, followingId) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw error;
  invalidateFollowGraphCache(followerId);
  invalidateFollowGraphCache(followingId);
}

export async function isFollowingUser(followerId, followingId) {
  if (!supabase || !followerId || !followingId) return false;
  const { following } = await loadFollowLists(followerId);
  return following.some((f) => f.id === followingId);
}

/** Both users added each other as friend */
export async function isMutualFriend(userId, otherId) {
  if (!userId || !otherId || userId === otherId) return false;
  const { following, followers } = await loadFollowLists(userId);
  const followingIds = new Set(following.map((f) => f.id));
  const followerIds = new Set(followers.map((f) => f.id));
  return followingIds.has(otherId) && followerIds.has(otherId);
}

export async function loadMutualFriends(userId) {
  if (!supabase || !userId) return [];
  const graph = await loadFollowLists(userId);
  return mutualFriendsFromGraph(graph);
}

/** People who added you but you have not added back yet. */
export async function loadPendingFriendRequests(userId) {
  if (!supabase || !userId) return [];
  const graph = await loadFollowLists(userId);
  return pendingRequestsFromGraph(graph);
}

export async function countPendingFriendRequests(userId) {
  const rows = await loadPendingFriendRequests(userId);
  return rows.length;
}

/** Accept a friend request by following them back. */
export async function acceptFriendRequest(userId, requesterId) {
  if (!supabase) throw new Error("Supabase is not configured");
  await followUser(userId, requesterId);
  if (await isMutualFriend(userId, requesterId)) {
    markGameTaskProgress(userId, "add_friend");
    markGameTaskProgress(requesterId, "add_friend");
  }
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
  invalidateFollowGraphCache(userId);
  invalidateFollowGraphCache(requesterId);
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

const ONLINE_TTL_MS = 90_000;

async function enrichOnlineMutualFriends(mutualFriends) {
  if (!mutualFriends.length || !supabase) return [];

  const friendIds = mutualFriends.map((f) => f.id);
  const since = new Date(Date.now() - ONLINE_TTL_MS).toISOString();

  const [{ data: presenceRows }, { data: activeRows }] = await Promise.all([
    supabase.from("presence").select("user_id, room_id, nickname").in("user_id", friendIds).gte("last_seen", since),
    supabase.from("profiles").select("id").in("id", friendIds).gte("last_active_at", since),
  ]);

  const presenceByUser = new Map((presenceRows ?? []).map((r) => [r.user_id, r]));
  const onlineIds = new Set([
    ...(presenceRows ?? []).map((r) => r.user_id),
    ...(activeRows ?? []).map((r) => r.id),
  ]);

  const roomIds = [...new Set((presenceRows ?? []).map((r) => r.room_id).filter(Boolean))];
  let roomMap = {};
  if (roomIds.length) {
    const { data: rooms } = await supabase.from("rooms").select("id, name, room_code").in("id", roomIds);
    roomMap = Object.fromEntries((rooms ?? []).map((r) => [r.id, r]));
  }

  return mutualFriends
    .filter((f) => onlineIds.has(f.id))
    .map((f) => {
      const presence = presenceByUser.get(f.id);
      const room = presence?.room_id ? roomMap[presence.room_id] : null;
      return {
        ...f,
        in_voice_room: Boolean(presence?.room_id),
        room_id: presence?.room_id ?? null,
        room_name: room?.name ?? null,
        room_code: room?.room_code ?? null,
      };
    });
}

/** Mutual friends currently online (in a room, chat, or app-active). */
export async function loadOnlineMutualFriends(userId) {
  const friends = await loadMutualFriends(userId);
  return enrichOnlineMutualFriends(friends);
}

/** Online mutual friends with room presence (alias — keeps room_code/name from loadOnlineMutualFriends). */
export async function loadOnlineMutualFriendsWithPresence(userId) {
  return loadOnlineMutualFriends(userId);
}

/** One follow-graph fetch + inbox + online presence for lobby polling. */
export async function loadLobbySocialSnapshot(userId) {
  if (!userId) {
    return {
      conversations: [],
      mutualFriends: [],
      onlineFriends: [],
      pendingRequestUsers: [],
    };
  }

  const graph = await loadFollowLists(userId);
  const mutualFriends = mutualFriendsFromGraph(graph);
  const pendingRequestUsers = pendingRequestsFromGraph(graph);
  const [{ loadConversations }, onlineFriends] = await Promise.all([
    import("./privateChat.js"),
    enrichOnlineMutualFriends(mutualFriends),
  ]);
  const conversations = await loadConversations(userId, { mutualFriends }).catch(() => []);

  return {
    conversations,
    mutualFriends,
    onlineFriends,
    pendingRequestUsers,
  };
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
