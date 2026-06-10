import { supabase } from "./supabase.js";
import { GIFT_CATALOG } from "./gifts.js";

const STARTER = GIFT_CATALOG.filter((g) => g.inventory && g.starterQty);

export async function loadGiftInventory(userId) {
  if (!supabase || !userId) return {};
  const { data } = await supabase
    .from("gift_inventory")
    .select("gift_id, quantity, expires_at")
    .eq("user_id", userId);
  const map = {};
  for (const row of data ?? []) {
    if (row.quantity > 0) map[row.gift_id] = row;
  }
  return map;
}

async function userHasInventoryHistory(userId) {
  const { count } = await supabase
    .from("gift_inventory")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return (count ?? 0) > 0;
}

export async function ensureStarterInventory(userId) {
  if (!supabase || !userId) return {};

  const existing = await loadGiftInventory(userId);
  if (Object.keys(existing).length) return existing;

  // Only grant starter pack once per account (even after items are used up).
  if (await userHasInventoryHistory(userId)) return existing;

  const rows = STARTER.map((g) => ({
    user_id: userId,
    gift_id: g.id,
    quantity: g.starterQty,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  }));
  await supabase.from("gift_inventory").insert(rows);
  return loadGiftInventory(userId);
}

export async function addGiftToInventory(userId, giftId, qty = 1, expiresDays = 7) {
  if (!supabase || !userId || !giftId) throw new Error("Not configured");
  const amount = Math.max(1, Math.floor(Number(qty) || 1));
  const expires_at = new Date(Date.now() + expiresDays * 86400000).toISOString();

  const { data } = await supabase
    .from("gift_inventory")
    .select("quantity")
    .eq("user_id", userId)
    .eq("gift_id", giftId)
    .maybeSingle();

  const have = Number(data?.quantity ?? 0);
  const quantity = have + amount;

  if (data) {
    await supabase
      .from("gift_inventory")
      .update({ quantity, expires_at })
      .eq("user_id", userId)
      .eq("gift_id", giftId);
  } else {
    await supabase.from("gift_inventory").insert({
      user_id: userId,
      gift_id: giftId,
      quantity: amount,
      expires_at,
    });
  }

  return quantity;
}

export async function consumeInventoryGift(userId, giftId, qty = 1) {
  if (!supabase || !userId) throw new Error("Not configured");
  const amount = Math.max(1, Math.floor(Number(qty) || 1));

  const { data } = await supabase
    .from("gift_inventory")
    .select("quantity")
    .eq("user_id", userId)
    .eq("gift_id", giftId)
    .maybeSingle();
  const have = Number(data?.quantity ?? 0);
  if (have < amount) throw new Error("Not enough in package");

  const quantity = have - amount;
  await supabase
    .from("gift_inventory")
    .update({ quantity: Math.max(0, quantity) })
    .eq("user_id", userId)
    .eq("gift_id", giftId);

  return quantity;
}
