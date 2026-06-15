import { charmTierFromTotal } from "./charmTiers.js";
import { CLAN_TASK_DEFS, taskProgressValue, taskStatus } from "./gameTasks.js";
import { loadProfilesForUserIds } from "./profile.js";
import { clanMessageLooksSpoofed } from "./clanChatMessages.js";
import { sendPrivateMessage } from "./privateChat.js";
import { supabase } from "./supabase.js";
import { addUserExp } from "./userLevels.js";
import { deductWalletCoins } from "./wallet.js";

export const CREATE_CLAN_COST = 12000;

const CLAN_PROGRESS_PREFIX = "gplay.clan_tasks.v1";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function progressStorageKey(userId, clanId) {
  return `${CLAN_PROGRESS_PREFIX}.${userId}.${clanId}.${todayKey()}`;
}

function defaultClanProgress() {
  return { progress: {}, claimed: {} };
}

function loadLocalClanProgress(userId, clanId) {
  if (!userId || !clanId) return defaultClanProgress();
  try {
    const raw = window.localStorage.getItem(progressStorageKey(userId, clanId));
    return raw ? { ...defaultClanProgress(), ...JSON.parse(raw) } : defaultClanProgress();
  } catch {
    return defaultClanProgress();
  }
}

function saveLocalClanProgress(userId, clanId, state) {
  if (!userId || !clanId) return;
  try {
    window.localStorage.setItem(progressStorageKey(userId, clanId), JSON.stringify(state));
  } catch {
    /* optional */
  }
}

function missingClansTable(error) {
  return /clans|clan_members|clan_applications|clan_messages|clan_news|clan_task_claims|relation .* does not exist|schema cache/i.test(
    error?.message ?? "",
  );
}

export const CLAN_ROLES = ["leader", "deputy", "admin", "member"];

export const ROLE_LABELS = {
  leader: "Leader",
  deputy: "Deputy",
  admin: "Admin",
  member: "Member",
};

export function canManageClan(role) {
  return role === "leader" || role === "deputy";
}

export function isClanLeader(role) {
  return role === "leader";
}

export async function loadMyClan(userId) {
  if (!supabase || !userId) return null;
  const { data: membership, error: memError } = await supabase
    .from("clan_members")
    .select("clan_id, role, weekly_donation, total_donation, joined_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (memError) {
    if (missingClansTable(memError)) return null;
    throw memError;
  }
  if (!membership) return null;

  const { data: clan, error: clanError } = await supabase
    .from("clans")
    .select("*")
    .eq("id", membership.clan_id)
    .maybeSingle();
  if (clanError) {
    if (missingClansTable(clanError)) return null;
    throw clanError;
  }
  if (!clan) return null;

  return { ...clan, membership };
}

export async function loadClanByCode(clanCode) {
  if (!supabase || !clanCode) return null;
  const code = Number(String(clanCode).replace(/\D/g, ""));
  if (!code) return null;

  const { data, error } = await supabase
    .from("clans")
    .select("id, clan_code, name, avatar_url, intro, level, activeness, weekly_activeness, join_mode, accept_applications, min_charm_level, max_members")
    .eq("clan_code", code)
    .maybeSingle();
  if (error) {
    if (missingClansTable(error)) throw clansMissingError();
    throw error;
  }
  return data ?? null;
}

export async function createClan({ userId, name, onCoinsDeducted }) {
  if (!supabase || !userId) throw new Error("Supabase is not configured");
  const trimmed = String(name ?? "").trim();
  if (trimmed.length < 2) throw new Error("Clan name must be at least 2 characters");

  const newBalance = await deductWalletCoins(userId, CREATE_CLAN_COST);
  onCoinsDeducted?.(newBalance);

  const { data, error } = await supabase.rpc("create_clan", {
    p_name: trimmed,
    p_user_id: userId,
  });
  if (error) {
    if (missingClansTable(error)) throw clansMissingError();
    throw error;
  }

  await seedClanWelcomeChat(data.id, userId, trimmed, data.clan_code);

  return {
    ...data,
    membership: {
      clan_id: data.id,
      user_id: userId,
      role: "leader",
      weekly_donation: 0,
      total_donation: 0,
      joined_at: new Date().toISOString(),
    },
  };
}

export function clanInviteMessage(clan) {
  const name = clan?.name ?? "our clan";
  const code = clan?.clan_code ?? "";
  return `[[clan:${code}]]Join my clan "${name}" on G-play! Search Clan ID: ${code}`;
}

export async function copyClanInvite(clan) {
  const text = clanInviteMessage(clan);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return text;
  }
  return text;
}

export async function inviteFriendToClan(senderId, friendId, clan) {
  const text = clanInviteMessage(clan);
  await sendPrivateMessage(senderId, friendId, text);
}

export async function seedClanWelcomeChat(clanId, userId, clanName, clanCode) {
  if (!supabase || !clanId || !userId) return;
  const message = `Welcome to ${clanName}! Share Clan ID ${clanCode} to invite friends.`;
  const { error } = await supabase.from("clan_messages").insert({
    clan_id: clanId,
    user_id: userId,
    message,
  });
  if (error && !missingClansTable(error)) throw error;
}

export async function applyToClan(clanId, userId, message = "") {
  if (!supabase || !clanId || !userId) throw new Error("Supabase is not configured");

  const existing = await loadMyClan(userId);
  if (existing) throw new Error("Leave your current clan first");

  const { data: clan, error: clanError } = await supabase
    .from("clans")
    .select("id, join_mode, accept_applications, min_charm_level, max_members")
    .eq("id", clanId)
    .maybeSingle();
  if (clanError) {
    if (missingClansTable(clanError)) throw clansMissingError();
    throw clanError;
  }
  if (!clan) throw new Error("Clan not found");

  const { data: profile } = await supabase
    .from("profiles")
    .select("charm")
    .eq("id", userId)
    .maybeSingle();
  const charmLevel = charmTierFromTotal(profile?.charm ?? 0)?.level ?? 0;
  if (charmLevel < Number(clan.min_charm_level ?? 0)) {
    throw new Error(`Charm level ${clan.min_charm_level} required`);
  }

  const { count } = await supabase
    .from("clan_members")
    .select("user_id", { count: "exact", head: true })
    .eq("clan_id", clanId);
  if ((count ?? 0) >= Number(clan.max_members ?? 70)) {
    throw new Error("Clan is full");
  }

  if (clan.join_mode === "open") {
    const { error: joinError } = await supabase.from("clan_members").insert({
      clan_id: clanId,
      user_id: userId,
      role: "member",
    });
    if (joinError) {
      if (missingClansTable(joinError)) throw clansMissingError();
      throw joinError;
    }
    return { joined: true };
  }

  if (!clan.accept_applications) throw new Error("This clan is not accepting applications");

  const { data, error } = await supabase
    .from("clan_applications")
    .insert({
      clan_id: clanId,
      user_id: userId,
      message: String(message ?? "").trim(),
      status: "pending",
    })
    .select("id, status, created_at")
    .single();
  if (error) {
    if (missingClansTable(error)) throw clansMissingError();
    if (/unique|duplicate/i.test(error.message ?? "")) throw new Error("Application already pending");
    throw error;
  }
  return { joined: false, application: data };
}

export async function loadClanMembers(clanId) {
  if (!supabase || !clanId) return [];
  const { data, error } = await supabase
    .from("clan_members")
    .select("clan_id, user_id, role, weekly_donation, total_donation, joined_at")
    .eq("clan_id", clanId)
    .order("role", { ascending: true })
    .order("joined_at", { ascending: true });
  if (error) {
    if (missingClansTable(error)) return [];
    throw error;
  }
  const rows = data ?? [];
  const profiles = await loadProfilesForUserIds(rows.map((r) => r.user_id));
  return rows.map((r) => ({
    ...r,
    profile: profiles[r.user_id] ?? null,
  }));
}

export async function loadClanApplications(clanId) {
  if (!supabase || !clanId) return [];
  const { data, error } = await supabase
    .from("clan_applications")
    .select("id, clan_id, user_id, status, message, created_at")
    .eq("clan_id", clanId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) {
    if (missingClansTable(error)) return [];
    throw error;
  }
  const rows = data ?? [];
  const profiles = await loadProfilesForUserIds(rows.map((r) => r.user_id));
  return rows.map((r) => ({
    ...r,
    profile: profiles[r.user_id] ?? null,
  }));
}

export async function decideClanApplication({ applicationId, clanId, approverId, approve }) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data: app, error: readError } = await supabase
    .from("clan_applications")
    .select("id, clan_id, user_id, status")
    .eq("id", applicationId)
    .eq("clan_id", clanId)
    .maybeSingle();
  if (readError) {
    if (missingClansTable(readError)) throw clansMissingError();
    throw readError;
  }
  if (!app || app.status !== "pending") throw new Error("Application not found");

  const status = approve ? "approved" : "rejected";
  const { error: updateError } = await supabase
    .from("clan_applications")
    .update({
      status,
      decided_at: new Date().toISOString(),
      decided_by: approverId,
    })
    .eq("id", applicationId);
  if (updateError) {
    if (missingClansTable(updateError)) throw clansMissingError();
    throw updateError;
  }

  if (approve) {
    const { error: joinError } = await supabase.from("clan_members").insert({
      clan_id: clanId,
      user_id: app.user_id,
      role: "member",
    });
    if (joinError) {
      if (missingClansTable(joinError)) throw clansMissingError();
      throw joinError;
    }
  }
  return { status };
}

export async function updateClanSettings(clanId, userId, patch) {
  if (!supabase || !clanId || !userId) throw new Error("Supabase is not configured");

  const myClan = await loadMyClan(userId);
  if (!myClan || myClan.id !== clanId) throw new Error("Not in this clan");
  if (!canManageClan(myClan.membership.role)) throw new Error("Only leaders and deputies can manage settings");

  const allowed = {};
  if (patch.name != null) allowed.name = String(patch.name).trim().slice(0, 24);
  if (patch.intro != null) allowed.intro = String(patch.intro).slice(0, 200);
  if (patch.sign_label != null) allowed.sign_label = String(patch.sign_label).slice(0, 32);
  if (patch.announcement != null) allowed.announcement = String(patch.announcement).slice(0, 300);
  if (patch.join_mode != null) allowed.join_mode = patch.join_mode === "open" ? "open" : "application";
  if (patch.accept_applications != null) allowed.accept_applications = Boolean(patch.accept_applications);
  if (patch.min_charm_level != null) {
    allowed.min_charm_level = Math.max(0, Math.min(20, Math.floor(Number(patch.min_charm_level))));
  }

  const { data, error } = await supabase
    .from("clans")
    .update(allowed)
    .eq("id", clanId)
    .select("*")
    .single();
  if (error) {
    if (missingClansTable(error)) throw clansMissingError();
    throw error;
  }
  return data;
}

export async function loadClanChatThread(userId) {
  const clan = await loadMyClan(userId);
  if (!clan) return null;

  if (!supabase) return { clan, lastMessage: null };

  const { data, error } = await supabase
    .from("clan_messages")
    .select("id, clan_id, user_id, message, message_type, payload, created_at")
    .eq("clan_id", clan.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (missingClansTable(error)) return { clan, lastMessage: null };
    throw error;
  }

  return { clan, lastMessage: data ?? null };
}

export async function loadClanMessages(clanId, limit = 80) {
  if (!supabase || !clanId) return [];
  const [{ data, error }, { data: memberRows, error: memberError }] = await Promise.all([
    supabase
      .from("clan_messages")
      .select("id, clan_id, user_id, message, message_type, payload, created_at")
      .eq("clan_id", clanId)
      .order("created_at", { ascending: true })
      .limit(limit),
    supabase.from("clan_members").select("user_id, role").eq("clan_id", clanId),
  ]);
  if (error) {
    if (missingClansTable(error)) return [];
    throw error;
  }
  if (memberError && !missingClansTable(memberError)) throw memberError;
  const rows = data ?? [];
  const roleMap = Object.fromEntries((memberRows ?? []).map((row) => [row.user_id, row.role]));
  const profiles = await loadProfilesForUserIds(rows.map((r) => r.user_id));
  return rows.map((r) => ({
    ...r,
    message_type: r.message_type ?? "text",
    profile: profiles[r.user_id] ?? null,
    role: roleMap[r.user_id] ?? "member",
  }));
}

export async function sendClanMessage(clanId, userId, text) {
  if (!supabase) throw new Error("Supabase is not configured");
  const message = String(text ?? "").trim();
  if (!message) throw new Error("Message is empty");
  if (clanMessageLooksSpoofed(message)) {
    throw new Error("Message not allowed");
  }

  const { data, error } = await supabase.rpc("send_clan_chat_message", {
    p_clan_id: clanId,
    p_message: message,
  });
  if (error) {
    if (missingClansTable(error)) throw clansMissingError();
    if (/send_clan_chat_message|schema cache|does not exist/i.test(String(error.message ?? ""))) {
      const { data: legacy, error: legacyError } = await supabase
        .from("clan_messages")
        .insert({ clan_id: clanId, user_id: userId, message })
        .select("id, clan_id, user_id, message, message_type, payload, created_at")
        .single();
      if (legacyError) {
        if (missingClansTable(legacyError)) throw clansMissingError();
        throw legacyError;
      }
      markClanTaskProgress(userId, clanId, "clan_chat", 1);
      return { ...legacy, message_type: legacy.message_type ?? "text" };
    }
    throw error;
  }

  markClanTaskProgress(userId, clanId, "clan_chat", 1);
  return { ...(data ?? {}), message_type: data?.message_type ?? "text" };
}

export async function loadClanNews(clanId, scope = "clan") {
  if (!supabase) return [];
  let query = supabase
    .from("clan_news")
    .select("id, clan_id, kind, body, created_at")
    .order("created_at", { ascending: false })
    .limit(40);

  if (scope === "world") {
    query = query.is("clan_id", null);
  } else if (clanId) {
    query = query.eq("clan_id", clanId);
  }

  const { data, error } = await query;
  if (error) {
    if (missingClansTable(error)) return defaultWorldNews();
    throw error;
  }
  const rows = data ?? [];
  if (scope === "world" && rows.length === 0) return defaultWorldNews();
  return rows;
}

function defaultWorldNews() {
  return [
    { id: "w1", clan_id: null, kind: "info", body: "Welcome to G-play Clans! Create or join a clan to unlock daily missions.", created_at: new Date().toISOString() },
    { id: "w2", clan_id: null, kind: "milestone", body: "Clan voice rooms are coming soon — stay tuned!", created_at: new Date().toISOString() },
  ];
}

async function loadDbClaimedTaskIds(userId, clanId) {
  if (!supabase || !userId || !clanId) return new Set();
  const { data, error } = await supabase
    .from("clan_task_claims")
    .select("task_id")
    .eq("user_id", userId)
    .eq("clan_id", clanId)
    .eq("claimed_date", todayKey());
  if (error) {
    if (missingClansTable(error)) return new Set();
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.task_id));
}

export async function loadClanTasksState(userId, clanId) {
  const local = loadLocalClanProgress(userId, clanId);
  const dbClaimed = await loadDbClaimedTaskIds(userId, clanId);
  const claimed = { ...local.claimed };
  for (const id of dbClaimed) claimed[id] = true;
  return { progress: { ...local.progress }, claimed };
}

export function markClanTaskProgress(userId, clanId, taskId, amount = 1) {
  if (!userId || !clanId || !taskId) return loadLocalClanProgress(userId, clanId);
  const state = loadLocalClanProgress(userId, clanId);
  const cur = Number(state.progress[taskId] ?? 0);
  state.progress[taskId] = cur + amount;
  saveLocalClanProgress(userId, clanId, state);
  return state;
}

export function clanTaskStatus(state, task) {
  return taskStatus(state, task);
}

export function clanTaskProgressValue(state, task) {
  return taskProgressValue(state, task);
}

export function clanActivenessPercent(state, tasks = CLAN_TASK_DEFS) {
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => {
    const s = clanTaskStatus(state, t);
    return s === "claimable" || s === "claimed";
  }).length;
  return Math.round((done / tasks.length) * 100);
}

async function creditWalletCoins(userId, amount) {
  if (!amount || !supabase || !userId) return null;
  const { data: wallet } = await supabase
    .from("wallets")
    .select("coins")
    .eq("user_id", String(userId))
    .maybeSingle();
  const coins = Number(wallet?.coins ?? 0) + amount;
  await supabase.from("wallets").update({ coins }).eq("user_id", String(userId));
  return coins;
}

export async function claimClanTask(userId, clanId, taskId) {
  const task = CLAN_TASK_DEFS.find((t) => t.id === taskId);
  if (!task) throw new Error("Unknown task");

  const state = await loadClanTasksState(userId, clanId);
  if (clanTaskStatus(state, task) !== "claimable") throw new Error("Task not ready");

  state.claimed[taskId] = true;
  saveLocalClanProgress(userId, clanId, state);

  if (supabase) {
    const { error } = await supabase.from("clan_task_claims").insert({
      user_id: userId,
      clan_id: clanId,
      task_id: taskId,
      claimed_date: todayKey(),
    });
    if (error && !missingClansTable(error)) {
      /* local claim still valid */
    }
  }

  const coins = Number(task.rewards?.coins ?? 0);
  const exp = Number(task.rewards?.exp ?? 0);
  const [newBalance] = await Promise.all([
    creditWalletCoins(userId, coins),
    exp > 0 ? addUserExp(userId, exp) : Promise.resolve(null),
  ]);
  return { task, rewards: task.rewards, newBalance };
}

const CLAN_WEEKLY_CLAIMS_KEY = "gplay.clan.weeklyClaims";

function clanWeekKey() {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function loadWeeklyClaimMap(userId, clanId) {
  if (!userId || !clanId) return {};
  try {
    const raw = localStorage.getItem(`${CLAN_WEEKLY_CLAIMS_KEY}.${userId}.${clanId}`);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed.week !== clanWeekKey()) return {};
    return parsed.claimed ?? {};
  } catch {
    return {};
  }
}

function saveWeeklyClaim(userId, clanId, threshold) {
  const claimed = { ...loadWeeklyClaimMap(userId, clanId), [threshold]: true };
  try {
    localStorage.setItem(
      `${CLAN_WEEKLY_CLAIMS_KEY}.${userId}.${clanId}`,
      JSON.stringify({ week: clanWeekKey(), claimed }),
    );
  } catch {
    /* ignore */
  }
  return claimed;
}

export function clanWeeklyGiftStatus(userId, clanId, threshold, activeness) {
  const claimed = loadWeeklyClaimMap(userId, clanId);
  if (claimed[threshold]) return "claimed";
  if (activeness >= threshold) return "claimable";
  return "locked";
}

export async function claimClanWeeklyGift(userId, clanId, threshold, activeness) {
  if (!userId || !clanId) throw new Error("Not in a clan");
  if (activeness < threshold) throw new Error("Activeness too low");
  const status = clanWeeklyGiftStatus(userId, clanId, threshold, activeness);
  if (status === "claimed") throw new Error("Already claimed this week");
  if (status !== "claimable") throw new Error("Gift not unlocked");

  const coins = Math.max(50, Math.round(threshold / 200));
  saveWeeklyClaim(userId, clanId, threshold);
  const newBalance = await creditWalletCoins(userId, coins);
  return { coins, threshold, newBalance };
}

/** Open a clan-branded voice room (creates a temp party room for the member). */
export async function openClanVoiceRoom(userId, clan) {
  if (!userId || !clan?.id) throw new Error("Clan not found");
  const { createTempPartyRoom } = await import("./profile.js");
  const label = clan.name?.trim() || `Clan ${clan.clan_code}`;
  const { room } = await createTempPartyRoom({
    userId,
    roomName: `${label} · Clan Room`,
    roomMode: "normal",
    backgroundKey: "golden_party",
  });
  return room;
}

export async function leaveClan(userId) {
  if (!supabase || !userId) throw new Error("Supabase is not configured");
  const myClan = await loadMyClan(userId);
  if (!myClan) throw new Error("Not in a clan");

  if (myClan.membership.role === "leader") {
    const members = await loadClanMembers(myClan.id);
    const others = members.filter((m) => m.user_id !== userId);
    if (others.length > 0) {
      const deputy = others.find((m) => m.role === "deputy");
      const nextLeader = deputy ?? others[0];
      await supabase
        .from("clan_members")
        .update({ role: "leader" })
        .eq("clan_id", myClan.id)
        .eq("user_id", nextLeader.user_id);
    }
  }

  const { error } = await supabase
    .from("clan_members")
    .delete()
    .eq("clan_id", myClan.id)
    .eq("user_id", userId);
  if (error) {
    if (missingClansTable(error)) throw clansMissingError();
    throw error;
  }
  return true;
}

export async function promoteMember(clanId, leaderId, targetUserId, newRole) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!CLAN_ROLES.includes(newRole) || newRole === "leader") {
    throw new Error("Invalid role");
  }

  const myClan = await loadMyClan(leaderId);
  if (!myClan || myClan.id !== clanId || !isClanLeader(myClan.membership.role)) {
    throw new Error("Only the leader can change roles");
  }

  const { error } = await supabase
    .from("clan_members")
    .update({ role: newRole })
    .eq("clan_id", clanId)
    .eq("user_id", targetUserId);
  if (error) {
    if (missingClansTable(error)) throw clansMissingError();
    throw error;
  }
}

export async function demoteMember(clanId, leaderId, targetUserId) {
  return promoteMember(clanId, leaderId, targetUserId, "member");
}

function clansMissingError() {
  return new Error("Clan tables are missing. Run supabase/clans.sql in Supabase SQL editor.");
}
