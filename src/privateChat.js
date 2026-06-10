import { supabase } from "./supabase.js";
import { isMutualFriend, loadMutualFriends } from "./social.js";
import { isBlockedEitherWay } from "./userBlocks.js";
import { loadProfilesForUserIds } from "./profile.js";

export const ROOM_INVITE_RE = /\[\[room:([A-Z0-9]+)\]\]/i;

export function parseRoomInvite(message) {
  if (!message) return null;
  const match = String(message).match(ROOM_INVITE_RE);
  if (!match) return null;
  const text = String(message).replace(ROOM_INVITE_RE, "").trim();
  return { roomCode: match[1].toUpperCase(), text };
}

async function hasRoomInviteBetween(userId, otherUserId) {
  if (!supabase || !userId || !otherUserId) return false;
  const { data } = await supabase
    .from("private_messages")
    .select("id, sender_id, recipient_id")
    .like("message", "%[[room:%")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .limit(40);
  return (data ?? []).some(
    (m) =>
      (m.sender_id === userId && m.recipient_id === otherUserId) ||
      (m.sender_id === otherUserId && m.recipient_id === userId),
  );
}

export async function loadPrivateMessages(userId, otherUserId, limit = 100) {
  if (!supabase || !userId || !otherUserId) return [];

  if (await isBlockedEitherWay(userId, otherUserId)) {
    throw new Error("You can't chat with this user");
  }

  const canChat =
    (await isMutualFriend(userId, otherUserId)) ||
    (await hasRoomInviteBetween(userId, otherUserId));

  if (!canChat) throw new Error("Add each other as friends to chat");

  const { data, error } = await supabase
    .from("private_messages")
    .select("*")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: true })
    .limit(limit * 2);

  if (error) throw error;
  return (data ?? []).filter(
    (m) =>
      (m.sender_id === userId && m.recipient_id === otherUserId) ||
      (m.sender_id === otherUserId && m.recipient_id === userId),
  ).slice(-limit);
}

export async function sendPrivateMessage(senderId, recipientId, text) {
  if (!supabase) throw new Error("Supabase is not configured");
  const message = text?.trim();
  if (!message) throw new Error("Message is empty");

  if (await isBlockedEitherWay(senderId, recipientId)) {
    throw new Error("You can't message this user");
  }

  const canChat = await isMutualFriend(senderId, recipientId);
  if (!canChat) throw new Error("You can only message mutual friends");

  const { data, error } = await supabase
    .from("private_messages")
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      message,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markMessagesRead(userId, otherUserId) {
  if (!supabase || !userId || !otherUserId) return;
  await supabase
    .from("private_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .eq("sender_id", otherUserId)
    .is("read_at", null);
}

export async function loadConversations(userId) {
  if (!supabase || !userId) return [];

  const friends = await loadMutualFriends(userId);
  const byFriend = new Map();
  for (const f of friends) {
    byFriend.set(f.id, { friend: f, lastMessage: null, unread: 0 });
  }

  const { data: inviteMsgs, error: inviteErr } = await supabase
    .from("private_messages")
    .select("*")
    .eq("recipient_id", userId)
    .like("message", "%[[room:%")
    .order("created_at", { ascending: false })
    .limit(80);

  if (!inviteErr && inviteMsgs?.length) {
    const senderIds = [...new Set(inviteMsgs.map((m) => m.sender_id))];
    const profiles = await loadProfilesForUserIds(senderIds);
    for (const msg of inviteMsgs) {
      const profile = profiles[msg.sender_id];
      if (!profile || byFriend.has(profile.id)) continue;
      const unread = msg.read_at ? 0 : 1;
      byFriend.set(profile.id, { friend: profile, lastMessage: msg, unread });
    }
  }

  if (!byFriend.size) return [];

  const { data, error } = await supabase
    .from("private_messages")
    .select("*")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!error) {
    for (const msg of data ?? []) {
      const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      const row = byFriend.get(otherId);
      if (!row) continue;
      if (!row.lastMessage) row.lastMessage = msg;
      if (msg.recipient_id === userId && !msg.read_at) row.unread += 1;
    }
  }

  const list = [...byFriend.values()];
  list.sort((a, b) => {
    const ta = a.lastMessage?.created_at ?? "";
    const tb = b.lastMessage?.created_at ?? "";
    return tb.localeCompare(ta);
  });
  return list;
}
