import { loadProfilesForUserIds } from "./profile.js";
import { GUARD_PROPOSE_CP, bondMeta, loadBondBetween, loadCpSlotInfo } from "./relationships.js";
import { supabase } from "./supabase.js";

export const WEDDING_RING_TYPES = [
  { key: "floral", label: "Floral Ring", emoji: "🌸" },
  { key: "blue", label: "Blue Dream", emoji: "💙" },
  { key: "diamond", label: "Diamond", emoji: "💎" },
  { key: "wreath", label: "Golden Wreath", emoji: "👑" },
  { key: "platinum", label: "Platinum", emoji: "⚪" },
  { key: "purple_dream", label: "Purple Dream", emoji: "💜" },
];

export const WEDDING_TIME_SLOTS = [
  { hour: 8, label: "08:00" },
  { hour: 10, label: "10:00" },
  { hour: 12, label: "12:00" },
  { hour: 14, label: "14:00" },
  { hour: 16, label: "16:00" },
  { hour: 18, label: "18:00" },
  { hour: 20, label: "20:00" },
];

export function ringMeta(key) {
  return WEDDING_RING_TYPES.find((r) => r.key === key) ?? WEDDING_RING_TYPES[0];
}

export function weddingCeremonyPhase(scheduledAt) {
  if (!scheduledAt) return { status: "unknown", label: "" };
  const start = new Date(scheduledAt).getTime();
  if (Number.isNaN(start)) return { status: "unknown", label: "" };
  const now = Date.now();
  const diff = start - now;
  if (diff <= -60 * 60 * 1000) return { status: "past", label: "Completed" };
  if (diff <= 0) return { status: "live", label: "Happening now" };
  const mins = Math.ceil(diff / 60000);
  if (mins < 60) return { status: "soon", label: `Starts in ${mins}m` };
  const hours = Math.floor(mins / 60);
  return { status: "upcoming", label: `Starts in ${hours}h ${mins % 60}m` };
}

function nextSlotToday() {
  const now = new Date();
  for (const slot of WEDDING_TIME_SLOTS) {
    const d = new Date(now);
    d.setHours(slot.hour, 0, 0, 0);
    if (d.getTime() > now.getTime() + 30 * 60_000) return d;
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(WEDDING_TIME_SLOTS[0].hour, 0, 0, 0);
  return tomorrow;
}

export async function loadTodaysWeddings() {
  if (!supabase) return [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { data, error } = await supabase
    .from("wedding_schedules")
    .select("*")
    .eq("status", "scheduled")
    .gte("scheduled_at", start.toISOString())
    .lt("scheduled_at", end.toISOString())
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.warn("loadTodaysWeddings failed", error.message);
    return [];
  }

  const ids = new Set();
  for (const row of data ?? []) {
    ids.add(row.user_a);
    ids.add(row.user_b);
  }
  const profiles = await loadProfilesForUserIds([...ids]);

  return (data ?? []).map((row) => ({
    id: row.id,
    scheduledAt: row.scheduled_at,
    ringType: row.ring_type ?? "floral",
    userA: profiles[row.user_a] ?? { id: row.user_a, display_name: "Guest" },
    userB: profiles[row.user_b] ?? { id: row.user_b, display_name: "Guest" },
  }));
}

export async function loadMyWeddingSchedule(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("wedding_schedules")
    .select("*")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  const profiles = await loadProfilesForUserIds([data.user_a, data.user_b]);
  const partnerId = data.user_a === userId ? data.user_b : data.user_a;
  return {
    id: data.id,
    scheduledAt: data.scheduled_at,
    ringType: data.ring_type ?? "floral",
    partner: profiles[partnerId] ?? null,
  };
}

export async function scheduleWedding(userId, partnerId, ringType = "floral", scheduledAt = null) {
  if (!supabase) throw new Error("Supabase is not configured");
  const when = scheduledAt ?? nextSlotToday();
  const { data, error } = await supabase.rpc("schedule_wedding", {
    p_user_id: userId,
    p_partner_id: partnerId,
    p_scheduled_at: when.toISOString(),
    p_ring_type: ringType,
  });
  if (error) throw error;
  return data;
}

function cpBlockReason(mySlots, theirSlots) {
  if (!mySlots.hasGender) return "Set your gender in profile first";
  if (!theirSlots.hasGender) return "They need to set gender in profile";
  if (mySlots.remaining <= 0) return `You are at your CP limit (${mySlots.used}/${mySlots.limit})`;
  if (theirSlots.remaining <= 0) return `They are at their CP limit (${theirSlots.used}/${theirSlots.limit})`;
  return null;
}

/** Mutual friends with guard counts for Church propose picker. */
export async function loadChurchCandidates(userId, friends) {
  if (!userId || !friends?.length) return [];
  const mySlots = await loadCpSlotInfo(userId);
  const rows = await Promise.all(
    friends.map(async (friend) => {
      const [bond, theirSlots] = await Promise.all([
        loadBondBetween(userId, friend.id, userId),
        loadCpSlotInfo(friend.id),
      ]);
      const guardOk = (bond?.guardMine ?? 0) >= GUARD_PROPOSE_CP;
      const notBonded = bond?.status !== "active" && bond?.status !== "pending";
      const slotOk = mySlots.remaining > 0 && theirSlots.remaining > 0 && mySlots.hasGender && theirSlots.hasGender;
      const blockReason = cpBlockReason(mySlots, theirSlots);
      return {
        ...friend,
        guardMine: bond?.guardMine ?? 0,
        canPropose: guardOk && notBonded && slotOk,
        blockReason: guardOk && notBonded && !slotOk ? blockReason : null,
        activeBond: bond?.status === "active" ? bondMeta(bond.bondType).label : null,
        pendingBond: bond?.status === "pending" ? bondMeta(bond.proposedBondType ?? "cp").label : null,
      };
    }),
  );
  return rows.sort((a, b) => b.guardMine - a.guardMine);
}

export { GUARD_PROPOSE_CP };
