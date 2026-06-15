import { supabase } from "./supabase.js";
import { clanChestClaimKey, clanChestPeriodKey, CLAN_CHESTS } from "./clanChestCatalog.js";

export const CLAN_DONATE_MIN = 10;
export const CLAN_DONATE_MAX = 1_000_000;
export const CLAN_DONATE_PRESETS = [100, 500, 1000, 5000];

function missingEconomyTable(error) {
  const msg = String(error?.message ?? error ?? "");
  return /clan_economy|clan_chest_claims|donate_to_clan|open_clan_chest|does not exist|schema cache/i.test(msg);
}

export function clanEconomyMissingError() {
  return new Error("Clan economy is not available — run supabase/clan-economy-migration.sql");
}

export async function donateToClan(clanId, amount) {
  if (!supabase || !clanId) throw clanEconomyMissingError();
  const { data, error } = await supabase.rpc("donate_to_clan", {
    p_clan_id: clanId,
    p_amount: Math.floor(Number(amount) || 0),
  });
  if (error) {
    if (missingEconomyTable(error)) throw clanEconomyMissingError();
    throw error;
  }
  return data ?? {};
}

export async function openClanChest(clanId, chestId) {
  if (!supabase || !clanId || !chestId) throw clanEconomyMissingError();
  const { data, error } = await supabase.rpc("open_clan_chest", {
    p_clan_id: clanId,
    p_chest_id: chestId,
  });
  if (error) {
    if (missingEconomyTable(error)) throw clanEconomyMissingError();
    throw error;
  }
  return data ?? {};
}

export async function loadClanChestClaims(userId, clanId) {
  if (!supabase || !userId || !clanId) return new Set();
  const { data, error } = await supabase
    .from("clan_chest_claims")
    .select("chest_id, period_key")
    .eq("user_id", userId)
    .eq("clan_id", clanId);
  if (error) {
    if (missingEconomyTable(error)) return new Set();
    throw error;
  }
  const claimed = new Set();
  for (const row of data ?? []) {
    claimed.add(clanChestClaimKey(row.chest_id, row.period_key));
  }
  return claimed;
}

export async function loadClanTasksClaimedToday(userId, clanId) {
  if (!supabase || !userId || !clanId) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const { count, error } = await supabase
    .from("clan_task_claims")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("clan_id", clanId)
    .eq("claimed_date", today);
  if (error) return 0;
  return count ?? 0;
}

export function clanChestStatus(chest, { claimedKeys, tasksClaimedToday, clanLevel }) {
  const periodKey = clanChestPeriodKey(chest);
  const key = clanChestClaimKey(chest.id, periodKey);
  if (claimedKeys.has(key)) return "claimed";

  if (chest.requiredTasks != null && tasksClaimedToday < chest.requiredTasks) {
    return "locked";
  }
  if (chest.requiredLevel != null && (clanLevel ?? 1) < chest.requiredLevel) {
    return "locked";
  }
  return "claimable";
}

export function chestsByGroup(group) {
  return CLAN_CHESTS.filter((c) => c.group === group);
}
