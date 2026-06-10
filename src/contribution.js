import { supabase } from "./supabase.js";

export async function addContribution(roomId, userId, amount) {
  if (!supabase || !roomId || !userId || !amount) return;
  const { data } = await supabase
    .from("room_contributions")
    .select("amount")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();
  const next = Number(data?.amount ?? 0) + amount;
  await supabase.from("room_contributions").upsert(
    {
      room_id: roomId,
      user_id: userId,
      amount: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "room_id,user_id" },
  );
  await supabase.from("room_contribution_log").insert({
    room_id: roomId,
    user_id: userId,
    amount,
  });
  return next;
}

export async function loadTopContributors(roomId, limit = 3) {
  return loadContributors(roomId, { period: "total", limit });
}

export async function loadTodayTopContributors(roomId, limit = 3) {
  return loadContributors(roomId, { period: "daily", limit });
}

export async function loadContributors(roomId, { period = "total", limit = 20 } = {}) {
  if (!supabase || !roomId) return [];

  const { data, error } = await supabase.rpc("list_room_contributors", {
    p_room_id: roomId,
    p_period: period,
    p_limit: limit,
  });

  if (!error && data?.length) {
    return data.map((row, index) => ({
      id: row.user_id,
      user_id: row.user_id,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      charm: Number(row.charm ?? 0),
      amount: Number(row.amount ?? 0),
      rank: Number(row.rank ?? index + 1),
    }));
  }

  if (period !== "total") return [];

  const { data: rows, error: fallbackError } = await supabase
    .from("room_contributions")
    .select("user_id, amount, updated_at")
    .eq("room_id", roomId)
    .order("amount", { ascending: false })
    .limit(limit);

  if (fallbackError || !rows?.length) return [];

  const ids = rows.map((r) => r.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, charm")
    .in("id", ids);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((row, index) => ({
    id: row.user_id,
    user_id: row.user_id,
    ...profileMap[row.user_id],
    amount: Number(row.amount),
    rank: index + 1,
  }));
}
