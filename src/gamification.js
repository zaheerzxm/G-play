import { addGiftToInventory } from "./giftInventory.js";
import { rollDailyChestReward } from "./gifts.js";
import { addGiftGuardPoints } from "./relationships.js";
import { supabase } from "./supabase.js";

const ROOM_LEVELS = [
  { level: 1, exp: 0 },
  { level: 2, exp: 8000 },
  { level: 3, exp: 30000 },
  { level: 4, exp: 100000 },
  { level: 5, exp: 300000 },
  { level: 6, exp: 600000 },
  { level: 7, exp: 1000000 },
  { level: 8, exp: 2000000 },
  { level: 9, exp: 4000000 },
  { level: 10, exp: 8000000 },
];

export function roomLevelFromExp(exp) {
  const value = Number(exp) || 0;
  let level = 1;
  for (const row of ROOM_LEVELS) {
    if (value >= row.exp) level = row.level;
  }
  return level;
}

export function nextLevelExp(level) {
  const next = ROOM_LEVELS.find((r) => r.level === level + 1);
  return next?.exp ?? null;
}

export function currentLevelExp(level) {
  return ROOM_LEVELS.find((r) => r.level === level)?.exp ?? 0;
}

export function roomExpPercent(roomExp, roomLevel) {
  const cur = currentLevelExp(roomLevel);
  const next = nextLevelExp(roomLevel);
  if (!next) return 100;
  return Math.min(100, ((Number(roomExp) - cur) / (next - cur)) * 100);
}

export async function addCharm(userId, amount) {
  if (!supabase || !userId || !amount) return null;
  const delta = Math.floor(Number(amount));
  if (delta <= 0) return null;

  const { data, error } = await supabase.rpc("add_profile_charm", {
    p_user_id: userId,
    p_amount: delta,
  });

  if (!error && data != null) return Number(data);

  // Fallback before SQL migration: only own profile can be updated via RLS
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (String(user?.id) !== String(userId)) {
    if (error) console.warn("add_profile_charm failed", error.message);
    return null;
  }

  const { data: row, error: readError } = await supabase
    .from("profiles")
    .select("charm")
    .eq("id", userId)
    .maybeSingle();
  if (readError) {
    console.warn("addCharm read failed", readError.message);
    return null;
  }

  const charm = Number(row?.charm ?? 0) + delta;
  const { error: updateError } = await supabase.from("profiles").update({ charm }).eq("id", userId);
  if (updateError) {
    console.warn("addCharm update failed", updateError.message);
    return null;
  }
  return charm;
}

/** Apply charm for a gift — uses DB RPC so receiver charm works across users. */
export async function applyGiftCharm({
  recipientId,
  senderId,
  charm,
  senderGetsCharm = true,
}) {
  if (!supabase || !recipientId || !charm) return null;
  const delta = Math.floor(Number(charm));
  if (delta <= 0) return null;

  const { data, error } = await supabase.rpc("apply_gift_charm", {
    p_recipient_id: recipientId,
    p_sender_id: senderId ?? null,
    p_charm: delta,
    p_sender_gets_charm: Boolean(senderGetsCharm),
  });

  let result = null;

  if (!error && data) {
    result = {
      recipientCharm: data.recipient_charm != null ? Number(data.recipient_charm) : null,
      senderCharm: data.sender_charm != null ? Number(data.sender_charm) : null,
      guardMine: data.guard_mine != null ? Number(data.guard_mine) : null,
      guardTheirs: data.guard_theirs != null ? Number(data.guard_theirs) : null,
    };
  } else {
    if (error) {
      console.warn("apply_gift_charm failed", error.message);
    }

    if (String(senderId) === String(recipientId)) {
      const total = await addCharm(recipientId, delta);
      result = { recipientCharm: total, senderCharm: total };
    } else {
      const [recipientCharm, senderCharm] = await Promise.all([
        addCharm(recipientId, delta),
        senderGetsCharm ? addCharm(senderId, delta) : Promise.resolve(null),
      ]);
      result = { recipientCharm, senderCharm };
    }
  }

  const crossUser =
    senderId &&
    recipientId &&
    String(senderId) !== String(recipientId);

  if (crossUser && result.guardMine == null) {
    const guard = await addGiftGuardPoints(senderId, recipientId, delta);
    if (guard) result = { ...result, ...guard };
  }

  return result;
}

export async function addRoomExp(roomId, amount) {
  if (!supabase || !roomId || !amount) return;
  const { data } = await supabase.from("rooms").select("room_exp").eq("id", roomId).maybeSingle();
  const room_exp = Number(data?.room_exp ?? 0) + amount;
  const room_level = roomLevelFromExp(room_exp);
  await supabase.from("rooms").update({ room_exp, room_level }).eq("id", roomId);
  return { room_exp, room_level };
}

export async function getDailyTasks(userId) {
  if (!supabase || !userId) return null;
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("daily_task_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("task_date", today)
    .maybeSingle();
  return data;
}

export async function ensureDailyTasks(userId) {
  if (!supabase || !userId) return null;
  const today = new Date().toISOString().slice(0, 10);
  const existing = await getDailyTasks(userId);
  if (existing) return existing;
  const { data } = await supabase
    .from("daily_task_progress")
    .insert({ user_id: userId, task_date: today })
    .select()
    .single();
  return data;
}

export async function markDailyTask(userId, field) {
  if (!supabase || !userId) return;
  await ensureDailyTasks(userId);
  const today = new Date().toISOString().slice(0, 10);
  await supabase
    .from("daily_task_progress")
    .update({ [field]: true })
    .eq("user_id", userId)
    .eq("task_date", today);
}

export const DAILY_CHEST_COUNT = 6;
export const DAILY_CHEST_UNLOCK_MINUTES = [5, 10, 20, 30, 45, 60];

export function isChestClaimed(mask, index) {
  return (Number(mask ?? 0) & (1 << index)) !== 0;
}

export function dailyChestStates(seatMinutes, chestsClaimedMask = 0) {
  const mins = Number(seatMinutes ?? 0);
  return DAILY_CHEST_UNLOCK_MINUTES.map((unlockMinutes, index) => ({
    index,
    unlockMinutes,
    unlocked: mins >= unlockMinutes,
    claimed: isChestClaimed(chestsClaimedMask, index),
    minutesLeft: Math.max(0, unlockMinutes - mins),
  }));
}

export async function tickWatchMinutes(userId, minutes = 1) {
  if (!supabase || !userId) return;
  await ensureDailyTasks(userId);
  const today = new Date().toISOString().slice(0, 10);
  const tasks = await getDailyTasks(userId);
  const watch_minutes = Number(tasks?.watch_minutes ?? 0) + minutes;
  await supabase
    .from("daily_task_progress")
    .update({ watch_minutes })
    .eq("user_id", userId)
    .eq("task_date", today);
  return watch_minutes;
}

export async function claimDailyChest(userId, chestIndex) {
  if (!supabase || !userId) return null;
  const index = Number(chestIndex);
  if (!Number.isInteger(index) || index < 0 || index >= DAILY_CHEST_COUNT) {
    throw new Error("Invalid chest");
  }

  const tasks = await ensureDailyTasks(userId);
  const seatMinutes = Number(tasks.watch_minutes ?? 0);
  const unlockMinutes = DAILY_CHEST_UNLOCK_MINUTES[index];
  if (seatMinutes < unlockMinutes) {
    throw new Error(`Sit ${unlockMinutes - seatMinutes} more min to unlock`);
  }
  if (isChestClaimed(tasks.chests_claimed, index)) {
    throw new Error("Chest already claimed");
  }

  const today = new Date().toISOString().slice(0, 10);
  const chests_claimed = Number(tasks.chests_claimed ?? 0) | (1 << index);
  await supabase
    .from("daily_task_progress")
    .update({ chests_claimed })
    .eq("user_id", userId)
    .eq("task_date", today);

  const reward = rollDailyChestReward();

  if (reward.type === "coins") {
    const { data: wallet } = await supabase
      .from("wallets")
      .select("coins")
      .eq("user_id", String(userId))
      .maybeSingle();
    const coins = Number(wallet?.coins ?? 0) + reward.coins;
    await supabase.from("wallets").update({ coins }).eq("user_id", String(userId));
    return { ...reward, chestIndex: index, newBalance: coins };
  }

  await addGiftToInventory(userId, reward.giftId, reward.quantity);
  return { ...reward, chestIndex: index };
}
