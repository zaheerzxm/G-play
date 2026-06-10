import { COIN_PACKS } from "./gifts.js";
import { supabase } from "./supabase.js";
import { walletUserId } from "./wallet.js";

const COIN_REQUEST_SELECT = `
  id,
  user_id,
  pack_id,
  coins,
  price_label,
  status,
  created_at,
  decided_at,
  profiles:user_id (
    id,
    display_name,
    avatar_url,
    user_code
  )
`;

function missingCoinRequestsTable(error) {
  return /coin_purchase_requests|relation .* does not exist|schema cache/i.test(error?.message ?? "");
}

export function coinPackById(packId) {
  return COIN_PACKS.find((pack) => pack.id === packId) ?? null;
}

export async function loadMyPendingCoinRequest(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("coin_purchase_requests")
    .select("id, pack_id, coins, price_label, status, created_at")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (missingCoinRequestsTable(error)) return null;
    throw error;
  }
  return data ?? null;
}

export async function requestCoinPurchase(userId, packId) {
  if (!supabase || !userId) throw new Error("Supabase is not configured");
  const pack = coinPackById(packId);
  if (!pack) throw new Error("Invalid coin pack");

  const { data, error } = await supabase
    .from("coin_purchase_requests")
    .insert({
      user_id: userId,
      pack_id: pack.id,
      coins: pack.coins,
      price_label: pack.price,
      status: "pending",
    })
    .select("id, pack_id, coins, price_label, status, created_at")
    .single();
  if (error) {
    if (missingCoinRequestsTable(error)) {
      throw new Error("Coin purchase requests table is missing. Run the VIP/purchase migration SQL in Supabase.");
    }
    throw error;
  }
  return data;
}

export async function loadPendingCoinPurchaseRequests() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("coin_purchase_requests")
    .select(COIN_REQUEST_SELECT)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) {
    if (missingCoinRequestsTable(error)) return [];
    throw error;
  }
  return data ?? [];
}

export async function decideCoinPurchaseRequest({ requestId, userId, coins, adminId, approve }) {
  if (!supabase) throw new Error("Supabase is not configured");
  const status = approve ? "approved" : "rejected";

  if (approve) {
    const wid = walletUserId(userId);
    const { data: wallet, error: readError } = await supabase
      .from("wallets")
      .select("coins")
      .eq("user_id", wid)
      .maybeSingle();
    if (readError) throw readError;

    const nextCoins = Number(wallet?.coins ?? 0) + Math.max(0, Math.floor(Number(coins) || 0));
    const writeQuery = wallet
      ? supabase.from("wallets").update({ coins: nextCoins, updated_at: new Date().toISOString() }).eq("user_id", wid)
      : supabase.from("wallets").insert({ user_id: wid, coins: nextCoins, updated_at: new Date().toISOString() });
    const { error: writeError } = await writeQuery;
    if (writeError) throw writeError;
  }

  const { data, error } = await supabase
    .from("coin_purchase_requests")
    .update({
      status,
      decided_by: adminId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select(COIN_REQUEST_SELECT)
    .single();
  if (error) throw error;
  return data;
}
