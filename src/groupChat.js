import { supabase } from "./supabase.js";
import { loadProfilesForUserIds } from "./profile.js";
import { isMutualFriend } from "./social.js";
import { isBlockedEitherWay } from "./userBlocks.js";

const GROUP_MESSAGE_COLUMNS = "id, group_id, sender_id, message, created_at";
const GROUP_MEMBER_COLUMNS = "group_id, user_id, role, joined_at";

export const GROUP_DM_MIN_MEMBERS = 3;

function missingGroupChat(error) {
  const msg = String(error?.message ?? error ?? "");
  return /dm_group|create_dm_group|send_dm_group_message|does not exist|schema cache/i.test(msg);
}

export function groupChatMissingError() {
  return new Error("Group chat is not available — run supabase/group-dm-migration.sql");
}

async function assertCreateGroupClientRules(creatorId, memberIds) {
  const unique = [...new Set((memberIds ?? []).filter((id) => id && id !== creatorId))];
  const total = unique.length + 1;
  if (total < GROUP_DM_MIN_MEMBERS) {
    throw new Error(`Group needs at least ${GROUP_DM_MIN_MEMBERS} members`);
  }

  for (const memberId of unique) {
    if (await isBlockedEitherWay(creatorId, memberId)) {
      throw new Error("Blocked users cannot be in the same group");
    }
    const mutual = await isMutualFriend(creatorId, memberId);
    if (!mutual) {
      throw new Error("All members must be mutual friends");
    }
  }

  return unique;
}

export async function createGroup(creatorId, name, memberIds) {
  if (!supabase || !creatorId) throw groupChatMissingError();
  const trimmedName = String(name ?? "").trim();
  if (!trimmedName) throw new Error("Group name is required");

  const uniqueMemberIds = await assertCreateGroupClientRules(creatorId, memberIds);

  const { data, error } = await supabase.rpc("create_dm_group", {
    p_name: trimmedName,
    p_member_ids: uniqueMemberIds,
  });
  if (error) {
    if (missingGroupChat(error)) throw groupChatMissingError();
    throw error;
  }
  return data ?? {};
}

export async function loadMyGroups(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from("dm_group_members")
    .select(`${GROUP_MEMBER_COLUMNS}, dm_groups(id, name, created_by, created_at)`)
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });
  if (error) {
    if (missingGroupChat(error)) return [];
    throw error;
  }

  const rows = (data ?? []).map((row) => ({
    group_id: row.group_id,
    user_id: row.user_id,
    role: row.role,
    joined_at: row.joined_at,
    group: row.dm_groups ?? null,
  }));

  const groupIds = rows.map((row) => row.group_id).filter(Boolean);
  if (!groupIds.length) return rows;

  const { data: members, error: membersError } = await supabase
    .from("dm_group_members")
    .select(GROUP_MEMBER_COLUMNS)
    .in("group_id", groupIds);
  if (membersError && !missingGroupChat(membersError)) throw membersError;

  const membersByGroup = new Map();
  for (const member of members ?? []) {
    const list = membersByGroup.get(member.group_id) ?? [];
    list.push(member);
    membersByGroup.set(member.group_id, list);
  }

  const profileIds = [...new Set((members ?? []).map((m) => m.user_id))];
  const profiles = await loadProfilesForUserIds(profileIds);

  return rows.map((row) => ({
    ...row,
    members: (membersByGroup.get(row.group_id) ?? []).map((member) => ({
      ...member,
      profile: profiles[member.user_id] ?? null,
    })),
  }));
}

export async function loadGroupMessages(groupId, userId, limit = 80) {
  if (!supabase || !groupId || !userId) return [];

  const { data: membership, error: memberError } = await supabase
    .from("dm_group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (memberError) {
    if (missingGroupChat(memberError)) throw groupChatMissingError();
    throw memberError;
  }
  if (!membership) throw new Error("Not a group member");

  const { data, error } = await supabase
    .from("dm_group_messages")
    .select(GROUP_MESSAGE_COLUMNS)
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) {
    if (missingGroupChat(error)) throw groupChatMissingError();
    throw error;
  }

  const rows = data ?? [];
  const profiles = await loadProfilesForUserIds(rows.map((row) => row.sender_id));
  return rows.map((row) => ({
    ...row,
    profile: profiles[row.sender_id] ?? null,
  }));
}

export async function sendGroupMessage(groupId, userId, text) {
  if (!supabase || !groupId || !userId) throw groupChatMissingError();
  const message = String(text ?? "").trim();
  if (!message) throw new Error("Message is empty");

  const { data, error } = await supabase.rpc("send_dm_group_message", {
    p_group_id: groupId,
    p_message: message,
  });
  if (error) {
    if (missingGroupChat(error)) throw groupChatMissingError();
    throw error;
  }
  return data ?? {};
}

export async function markGroupRead(userId, groupId, lastMessageId = null) {
  if (!supabase || !userId || !groupId) return;

  let messageId = lastMessageId;
  if (messageId == null) {
    const { data: latest, error: latestError } = await supabase
      .from("dm_group_messages")
      .select("id")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestError) {
      if (missingGroupChat(latestError)) throw groupChatMissingError();
      throw latestError;
    }
    messageId = latest?.id ?? null;
  }

  const payload = {
    last_read_at: new Date().toISOString(),
    last_read_message_id: messageId,
  };

  const { error } = await supabase
    .from("dm_group_reads")
    .update(payload)
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) {
    if (missingGroupChat(error)) throw groupChatMissingError();
    throw error;
  }
}
