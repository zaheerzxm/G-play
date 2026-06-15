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

export const CLAN_TREASURY_SPEND_DENIED = "Only clan leaders can spend clan treasury";

export function canSpendClanTreasury(role, isSuperAdmin = false) {
  if (isSuperAdmin) return true;
  return role === "leader" || role === "deputy" || role === "admin";
}

function missingStoreGacha(error) {
  const msg = String(error?.message ?? error ?? "");
  return /clan_store|clan_gacha|purchase_clan_store|pull_clan_gacha|does not exist|schema cache/i.test(msg);
}

export async function loadClanStorePurchases(userId, clanId) {
  if (!supabase || !userId || !clanId) return new Set();
  const { data, error } = await supabase
    .from("clan_store_purchases")
    .select("item_id")
    .eq("user_id", userId)
    .eq("clan_id", clanId);
  if (error) {
    if (missingStoreGacha(error)) return new Set();
    throw error;
  }
  return new Set((data ?? []).map((row) => row.item_id));
}

export async function purchaseClanStoreItem(clanId, itemId, userId) {
  if (!supabase || !clanId || !itemId) throw clanEconomyMissingError();
  const { data, error } = await supabase.rpc("purchase_clan_store_item", {
    p_clan_id: clanId,
    p_item_id: itemId,
  });
  if (error) {
    if (missingEconomyTable(error) || missingStoreGacha(error)) throw clanEconomyMissingError();
    throw error;
  }
  const result = data ?? {};
  if (result.reward?.type === "clan_item" && userId) {
    const { addShopItemToInventory } = await import("./userShopInventory.js");
    addShopItemToInventory(userId, {
      id: result.reward.item_id,
      name: result.reward.name,
      emoji: result.reward.emoji,
      type: "clan_item",
      category: "Clan",
      source: "clan_store",
    });
  }
  return result;
}

export async function pullClanGacha(clanId, count, userId) {
  if (!supabase || !clanId) throw clanEconomyMissingError();
  const pullCount = count === 10 ? 10 : 1;
  const { data, error } = await supabase.rpc("pull_clan_gacha", {
    p_clan_id: clanId,
    p_count: pullCount,
  });
  if (error) {
    if (missingEconomyTable(error) || missingStoreGacha(error)) throw clanEconomyMissingError();
    throw error;
  }
  const result = data ?? {};
  if (userId && Array.isArray(result.rewards)) {
    const { addShopItemToInventory } = await import("./userShopInventory.js");
    for (const reward of result.rewards) {
      if (reward?.type === "clan_item") {
        addShopItemToInventory(userId, {
          id: reward.item_id,
          name: reward.name,
          emoji: reward.emoji,
          type: "clan_item",
          category: "Clan",
          source: "clan_gacha",
        });
      }
    }
  }
  return result;
}

function rewardSummary(reward) {
  if (!reward) return "Reward";
  if (reward.type === "coins") return `${reward.amount} coins`;
  if (reward.type === "gift") return `${reward.quantity}× ${reward.gift_id?.replace("pkg_", "") ?? "gift"}`;
  if (reward.type === "clan_item") return reward.name ?? reward.item_id;
  return "Reward";
}

export function formatGachaRewards(rewards) {
  return (rewards ?? []).map(rewardSummary);
}
