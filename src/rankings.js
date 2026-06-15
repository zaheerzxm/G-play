import { supabase } from "./supabase.js";
import { loadProfilesForUserIds } from "./profile.js";

export async function loadCharmRanking(limit = 50) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, charm, user_level, vip_level")
    .order("charm", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []).map((row, index) => ({
    ...row,
    score: Number(row.charm ?? 0),
    rank: index + 1,
  }));
}

export async function loadWealthRanking(limit = 50) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("wallets")
    .select("user_id, coins")
    .order("coins", { ascending: false })
    .limit(limit);

  if (error) return [];
  const ids = (data ?? []).map((r) => r.user_id);
  const profiles = await loadProfilesForUserIds(ids);

  return (data ?? []).map((row, index) => ({
    ...profiles[row.user_id],
    id: row.user_id,
    score: Number(row.coins ?? 0),
    rank: index + 1,
  }));
}

export async function loadContributionRanking(limit = 50, period = "total") {
  if (!supabase) return [];

  if (period === "daily" || period === "weekly") {
    const since = new Date();
    if (period === "daily") {
      since.setHours(0, 0, 0, 0);
    } else {
      since.setDate(since.getDate() - 7);
    }

    const { data: logRows, error: logError } = await supabase
      .from("room_contribution_log")
      .select("user_id, amount")
      .gte("created_at", since.toISOString());

    if (logError || !logRows?.length) return [];

    const totals = {};
    for (const row of logRows) {
      totals[row.user_id] = (totals[row.user_id] ?? 0) + Number(row.amount ?? 0);
    }

    const sorted = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const profiles = await loadProfilesForUserIds(sorted.map(([id]) => id));

    return sorted.map(([userId, amount], index) => ({
      ...profiles[userId],
      id: userId,
      score: amount,
      rank: index + 1,
    }));
  }

  const { data, error } = await supabase
    .from("room_contributions")
    .select("user_id, amount");

  if (error) return [];

  const totals = {};
  for (const row of data ?? []) {
    totals[row.user_id] = (totals[row.user_id] ?? 0) + Number(row.amount ?? 0);
  }

  const sorted = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const profiles = await loadProfilesForUserIds(sorted.map(([id]) => id));

  return sorted.map(([userId, amount], index) => ({
    ...profiles[userId],
    id: userId,
    score: amount,
    rank: index + 1,
  }));
}

export async function loadRanking(tab = "charm", limit = 50, { period = "total" } = {}) {
  if (tab === "wealth") return loadWealthRanking(limit);
  if (tab === "contribution") return loadContributionRanking(limit, period);
  return loadCharmRanking(limit);
}
