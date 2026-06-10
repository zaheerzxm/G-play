import { bestieBowLevelFromExp } from "./bestieBowTiers.js";
import { cpHeartLevelFromExp } from "./cpHeartTiers.js";
import { loadProfilesForUserIds } from "./profile.js";
import { areHorizontalSeatNeighbors } from "./roomSeats.js";
import { supabase } from "./supabase.js";

/** Guard needed to propose CP (WePlay-style). */
export const GUARD_PROPOSE_CP = 3000;

/** Max active CP/wedding bonds by gender (WePlay-style). */
export const CP_LIMIT_MALE = 4;
export const CP_LIMIT_FEMALE = 1;

const CP_BOND_TYPES = new Set(["cp", "wedding", "choti_ghar_wali", "badi_ghar_wali"]);

export function isCpBondType(type) {
  return CP_BOND_TYPES.has(type);
}

const BESTIE_BOND_TYPES = new Set(["bff", "bestie"]);

export function isBestieBondType(type) {
  return BESTIE_BOND_TYPES.has(type);
}

export function cpLimitForGender(gender) {
  const g = String(gender ?? "").trim().toLowerCase();
  if (["male", "m", "man", "men", "boy"].includes(g)) return CP_LIMIT_MALE;
  if (["female", "f", "woman", "women", "girl"].includes(g)) return CP_LIMIT_FEMALE;
  return CP_LIMIT_FEMALE;
}

export function cpLimitHint(gender) {
  return cpLimitForGender(gender) === CP_LIMIT_MALE
    ? "Men can have up to 4 CP at a time"
    : "Women can have 1 CP at a time";
}

function pairKey(a, b) {
  return [String(a), String(b)].sort().join(":");
}

/** Count active CP/wedding bonds + outgoing pending CP proposals. */
export async function loadCpSlotInfo(userId, excludeOtherId = null) {
  if (!supabase || !userId) {
    return { used: 0, limit: CP_LIMIT_FEMALE, remaining: 0, hasGender: false, gender: null };
  }

  const [{ data: profile }, { data: rows, error }] = await Promise.all([
    supabase.from("profiles").select("gender").eq("id", userId).maybeSingle(),
    supabase
      .from("user_relationships")
      .select("user_a, user_b, status, bond_type, proposed_bond_type, proposed_by")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`),
  ]);

  if (error) {
    console.warn("loadCpSlotInfo failed", error.message);
  }

  const gender = profile?.gender ?? null;
  const limit = cpLimitForGender(gender);
  const hasGender = Boolean(gender?.trim());
  const excludeKey = excludeOtherId ? pairKey(userId, excludeOtherId) : null;

  let used = 0;
  for (const row of rows ?? []) {
    if (excludeKey && pairKey(row.user_a, row.user_b) === excludeKey) continue;
    const activeCp = row.status === "active" && CP_BOND_TYPES.has(row.bond_type);
    const pendingCp =
      row.status === "pending" &&
      CP_BOND_TYPES.has(row.proposed_bond_type) &&
      String(row.proposed_by) === String(userId);
    if (activeCp || pendingCp) used += 1;
  }

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    hasGender,
    gender,
  };
}

export async function loadCoupleBondsForUser(userId) {
  const bonds = await loadActiveBondsForUser(userId);
  return bonds.filter((b) => CP_BOND_TYPES.has(b.bondType));
}

/**
 * Guard = gift charm contributed by one friend toward the other.
 * X gifts Y → Y gets charm; X's guard toward Y increases by that charm amount.
 * Shown on Y's profile when X opens it (guardMine). Vice versa for Y → X.
 */

export const BOND_TYPES = {
  cp: {
    key: "cp",
    label: "CP",
    emoji: "💕",
    hint: "Couple partner",
    popupClass: "cp",
    minGuard: GUARD_PROPOSE_CP,
  },
  wedding: {
    key: "wedding",
    label: "Wedding",
    emoji: "💒",
    hint: "Married",
    popupClass: "wedding",
    minGuard: GUARD_PROPOSE_CP,
  },
  bro: {
    key: "bro",
    label: "Bro",
    emoji: "🤝",
    hint: "Brother bond",
    popupClass: "bro",
    minGuard: 1000,
  },
  sis: {
    key: "sis",
    label: "Sis",
    emoji: "🎀",
    hint: "Sister bond",
    popupClass: "sis",
    minGuard: 1000,
  },
  bff: {
    key: "bff",
    label: "Bestie",
    emoji: "🎀",
    hint: "Best friends",
    popupClass: "bff",
    minGuard: 1000,
  },
  bestie: {
    key: "bestie",
    label: "Bestie",
    emoji: "🎀",
    hint: "Best friends",
    popupClass: "bff",
    minGuard: 1000,
  },
  apprentice: {
    key: "apprentice",
    label: "Apprentice",
    emoji: "📿",
    hint: "Teacher and apprentice",
    popupClass: "mentor",
    minGuard: 1000,
  },
  son: {
    key: "son",
    label: "Son",
    emoji: "👦",
    hint: "Family son bond",
    popupClass: "bro",
    minGuard: 1000,
  },
  daughter: {
    key: "daughter",
    label: "Daughter",
    emoji: "👧",
    hint: "Family daughter bond",
    popupClass: "sis",
    minGuard: 1000,
  },
  choti_ghar_wali: {
    key: "choti_ghar_wali",
    label: "Choti Ghar Wali",
    emoji: "💗",
    hint: "Younger house partner",
    popupClass: "cp",
    minGuard: GUARD_PROPOSE_CP,
  },
  badi_ghar_wali: {
    key: "badi_ghar_wali",
    label: "Badi Ghar Wali",
    emoji: "💖",
    hint: "Elder house partner",
    popupClass: "wedding",
    minGuard: GUARD_PROPOSE_CP,
  },
  guard: {
    key: "guard",
    label: "Guard",
    emoji: "🛡️",
    hint: "Guardian",
    popupClass: "guard",
    minGuard: 500,
  },
  mentor: {
    key: "mentor",
    label: "Mentor",
    emoji: "📿",
    hint: "Mentor bond",
    popupClass: "mentor",
    minGuard: 1000,
  },
  confidant: {
    key: "confidant",
    label: "Confidant",
    emoji: "🌸",
    hint: "Confidant",
    popupClass: "confidant",
    minGuard: 1000,
  },
};

export const BOND_TYPE_KEYS = Object.keys(BOND_TYPES);

function canonicalPair(userIdA, userIdB) {
  const a = String(userIdA);
  const b = String(userIdB);
  return a < b ? [a, b] : [b, a];
}

export function bondMeta(type) {
  return BOND_TYPES[type] ?? BOND_TYPES.cp;
}

export function bondDisplayLevel(bond) {
  const exp = Number(bond?.relationshipExp ?? bond?.guardPoints ?? 0) || 0;
  if (isCpBondType(bond?.bondType)) return cpHeartLevelFromExp(exp);
  if (isBestieBondType(bond?.bondType)) return bestieBowLevelFromExp(exp);
  return Number(bond?.level ?? 1) || 1;
}

export function bondLevelTitle(type, level) {
  const meta = bondMeta(type);
  if (CP_BOND_TYPES.has(type)) return `${meta.label} LV${level}`;
  if (isBestieBondType(type)) return `${meta.label} LV${level}`;
  if (type === "confidant") return `Confidant LV${level}`;
  return `${meta.label} LV${level}`;
}

/** Calendar days since bond started (day 1 on start date, increases daily). */
export function daysTogether(startedAt) {
  if (!startedAt) return 0;
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return 0;
  const startDay = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const elapsed = Math.floor((today - startDay) / 86_400_000);
  return Math.max(1, elapsed + 1);
}

function guardForViewer(row, viewerId) {
  if (!row || !viewerId) return { mine: 0, theirs: 0 };
  const viewerIsA = String(viewerId) === String(row.user_a);
  const ga = Number(row.guard_a ?? 0);
  const gb = Number(row.guard_b ?? 0);
  return viewerIsA ? { mine: ga, theirs: gb } : { mine: gb, theirs: ga };
}

function normalizeBondRow(row, viewerId = null) {
  if (!row) return null;
  const guards = viewerId ? guardForViewer(row, viewerId) : { mine: 0, theirs: 0 };
  const ga = Number(row.guard_a ?? 0);
  const gb = Number(row.guard_b ?? 0);
  return {
    id: row.id,
    userA: row.user_a,
    userB: row.user_b,
    bondType: row.bond_type ?? null,
    level: Number(row.level ?? 1),
    guardPoints: ga + gb,
    guardMine: guards.mine,
    guardTheirs: guards.theirs,
    guardA: ga,
    guardB: gb,
    status: row.status ?? (row.bond_type ? "active" : "tracking"),
    proposedBy: row.proposed_by ?? null,
    proposedBondType: row.proposed_bond_type ?? null,
    startedAt: row.started_at,
    relationshipExp: Number(row.relationship_exp ?? 0),
    relationshipLevel: Number(row.relationship_level ?? row.level ?? 1),
    weddingRing: row.wedding_ring ?? null,
  };
}

export const PROTECT_COIN_OPTIONS = [100, 500, 1000];

/** Spend coins to add guard (WePlay Protect). 1 coin = 1 guard point. */
export async function protectUser(protectorId, targetId, coins) {
  if (!supabase) throw new Error("Supabase is not configured");
  const amount = Math.floor(Number(coins));
  if (amount <= 0) throw new Error("Invalid amount");

  const { data, error } = await supabase.rpc("protect_user", {
    p_protector_id: protectorId,
    p_target_id: targetId,
    p_coins: amount,
  });
  if (error) throw error;

  return {
    guardMine: Number(data?.guard_mine ?? 0),
    guardTheirs: Number(data?.guard_theirs ?? 0),
    coinsSpent: Number(data?.coins_spent ?? amount),
    guardApplied: true,
  };
}

export function relationshipLevelProgress(exp) {
  const value = Number(exp) || 0;
  const level = Math.max(1, 1 + Math.floor(value / 3000));
  const cur = (level - 1) * 3000;
  const next = level * 3000;
  return { level, cur, next, value, pct: Math.min(100, ((value - cur) / (next - cur)) * 100) };
}

/** Gift charm also adds to sender's guard toward recipient (mutual friends only). */
export async function addGiftGuardPoints(senderId, recipientId, charmAmount) {
  if (!supabase || !senderId || !recipientId || String(senderId) === String(recipientId)) {
    return null;
  }
  const delta = Math.floor(Number(charmAmount));
  if (delta <= 0) return null;

  const { data, error } = await supabase.rpc("add_gift_guard_points", {
    p_sender_id: senderId,
    p_recipient_id: recipientId,
    p_charm: delta,
  });

  if (error) {
    console.warn("add_gift_guard_points failed — run supabase/RUN-THIS.sql", error.message);
    return null;
  }

  return {
    guardMine: Number(data?.guard_mine ?? 0),
    guardTheirs: Number(data?.guard_theirs ?? 0),
    guardApplied: true,
  };
}

export async function loadBondBetween(userIdA, userIdB, viewerId = userIdA) {
  if (!supabase || !userIdA || !userIdB || userIdA === userIdB) return null;
  const [user_a, user_b] = canonicalPair(userIdA, userIdB);
  const { data, error } = await supabase
    .from("user_relationships")
    .select("*")
    .eq("user_a", user_a)
    .eq("user_b", user_b)
    .maybeSingle();
  if (error) {
    console.warn("loadBondBetween failed", error.message);
    return null;
  }
  return normalizeBondRow(data, viewerId);
}

export async function loadBondsAmongUsers(userIds) {
  if (!supabase) return [];
  const ids = [...new Set((userIds ?? []).filter(Boolean))];
  if (ids.length < 2) return [];

  const { data, error } = await supabase
    .from("user_relationships")
    .select("*")
    .or(`user_a.in.(${ids.join(",")}),user_b.in.(${ids.join(",")})`);
  if (error) {
    console.warn("loadBondsAmongUsers failed", error.message);
    return [];
  }

  const idSet = new Set(ids.map(String));
  return (data ?? [])
    .map((row) => normalizeBondRow(row))
    .filter((row) => idSet.has(String(row.userA)) && idSet.has(String(row.userB)))
    .filter((row) => row.status === "active" && row.bondType);
}

export async function proposeBond(userId, otherUserId, bondType) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("propose_user_bond", {
    p_proposer_id: userId,
    p_other_id: otherUserId,
    p_bond_type: bondType,
  });
  if (error) throw error;
  return loadBondBetween(userId, otherUserId, userId);
}

export async function respondBondProposal(userId, otherUserId, accept) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.rpc("respond_user_bond", {
    p_responder_id: userId,
    p_other_id: otherUserId,
    p_accept: accept,
  });
  if (error) throw error;
  return loadBondBetween(userId, otherUserId, userId);
}

export function partnerUserId(bond, viewerId) {
  if (!bond || !viewerId) return null;
  return String(bond.userA) === String(viewerId) ? bond.userB : bond.userA;
}

export async function loadActiveBondsForUser(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from("user_relationships")
    .select("*")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .eq("status", "active")
    .not("bond_type", "is", null);
  if (error) {
    console.warn("loadActiveBondsForUser failed", error.message);
    return [];
  }
  return (data ?? []).map((row) => normalizeBondRow(row, userId));
}

export async function loadPrimaryCoupleBond(userId) {
  const bonds = await loadCoupleBondsForUser(userId);
  return (
    bonds.find((b) => b.bondType === "wedding") ??
    bonds.find((b) => b.bondType === "cp") ??
    bonds[0] ??
    null
  );
}

export async function cancelBond(userId, otherUserId) {
  if (!supabase) throw new Error("Supabase is not configured");
  const [user_a, user_b] = canonicalPair(userId, otherUserId);
  const { error } = await supabase
    .from("user_relationships")
    .update({
      status: "tracking",
      bond_type: null,
      proposed_by: null,
      proposed_bond_type: null,
    })
    .eq("user_a", user_a)
    .eq("user_b", user_b);
  if (error) throw error;
  return loadBondBetween(userId, otherUserId, userId);
}

/** Bonds on stage when both partners are seated in adjacent left/right seats. */
export function activeSeatBonds(seats, bonds) {
  if (!seats?.length || !bonds?.length) return [];

  const seatByUser = new Map();
  for (const seat of seats) {
    if (seat?.user_id) seatByUser.set(String(seat.user_id), seat);
  }
  if (seatByUser.size < 2) return [];

  const seen = new Set();
  const results = [];

  for (const bond of bonds) {
    if (bond.status !== "active" || !bond.bondType) continue;

    const pairKey = canonicalPair(bond.userA, bond.userB).join(":");
    if (seen.has(pairKey)) continue;

    const leftSeat = seatByUser.get(String(bond.userA));
    const rightSeat = seatByUser.get(String(bond.userB));
    if (!leftSeat || !rightSeat) continue;

    if (!areHorizontalSeatNeighbors(leftSeat.seat_number, rightSeat.seat_number)) continue;

    seen.add(pairKey);
    const bondExp = bond.relationshipExp ?? bond.guardPoints ?? 0;
    const cpHeartLevel = isCpBondType(bond.bondType) ? cpHeartLevelFromExp(bondExp) : null;
    const bestieBowLevel = isBestieBondType(bond.bondType) ? bestieBowLevelFromExp(bondExp) : null;
    results.push({
      ...bond,
      seatA: leftSeat.seat_number,
      seatB: rightSeat.seat_number,
      leftSeat,
      rightSeat,
      cpHeartLevel,
      bestieBowLevel,
    });
  }

  return results;
}

export async function enrichBondWithProfiles(bond, profileMap = {}) {
  const ids = [bond.userA, bond.userB];
  const missing = ids.filter((id) => !profileMap[id]);
  const profiles = missing.length ? await loadProfilesForUserIds(missing) : {};
  const map = { ...profileMap, ...profiles };

  const leftUserId = bond.leftSeat?.user_id;
  const rightUserId = bond.rightSeat?.user_id;
  const guardForUser = (uid) =>
    String(uid) === String(bond.userA) ? Number(bond.guardA ?? 0) : Number(bond.guardB ?? 0);
  const leftGuard = guardForUser(leftUserId);
  const rightGuard = guardForUser(rightUserId);

  const bondExp = Number(bond.relationshipExp ?? bond.guardPoints ?? 0) || 0;
  const cpHeartLevel = isCpBondType(bond.bondType) ? cpHeartLevelFromExp(bondExp) : null;
  const bestieBowLevel = isBestieBondType(bond.bondType) ? bestieBowLevelFromExp(bondExp) : null;
  const displayLevel = cpHeartLevel ?? bestieBowLevel ?? (Number(bond.level ?? 1) || 1);

  return {
    ...bond,
    leftUser: {
      id: leftUserId,
      nickname: bond.leftSeat?.nickname ?? map[leftUserId]?.display_name ?? "Guest",
      avatarUrl: bond.leftSeat?.avatar_url ?? map[leftUserId]?.avatar_url ?? null,
    },
    rightUser: {
      id: rightUserId,
      nickname: bond.rightSeat?.nickname ?? map[rightUserId]?.display_name ?? "Guest",
      avatarUrl: bond.rightSeat?.avatar_url ?? map[rightUserId]?.avatar_url ?? null,
    },
    days: daysTogether(bond.startedAt),
    cpHeartLevel,
    bestieBowLevel,
    displayLevel,
    level: displayLevel,
    title: bondLevelTitle(bond.bondType, displayLevel),
    meta: bondMeta(bond.bondType),
    leftGuard: Number(leftGuard ?? 0),
    rightGuard: Number(rightGuard ?? 0),
  };
}
