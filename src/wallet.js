import { supabase } from "./supabase.js";

export function walletUserId(userId) {
  return String(userId);
}

export async function fetchWalletCoins(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("wallets")
    .select("coins")
    .eq("user_id", walletUserId(userId))
    .maybeSingle();
  if (error) throw error;
  return data ? Number(data.coins) : null;
}

/** Live wallet balance — call returned function to unsubscribe */
export function subscribeWallet(userId, onCoins) {
  if (!supabase || !userId) return () => {};

  const wid = walletUserId(userId);
  const channel = supabase
    .channel(`wallet-${wid}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "wallets",
        filter: `user_id=eq.${wid}`,
      },
      (payload) => {
        const coins = Number(payload.new?.coins);
        if (!Number.isNaN(coins)) onCoins(coins);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "wallets",
        filter: `user_id=eq.${wid}`,
      },
      (payload) => {
        const coins = Number(payload.new?.coins);
        if (!Number.isNaN(coins)) onCoins(coins);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function deductWalletCoins(userId, amount) {
  if (!supabase) throw new Error("Supabase is not configured");
  const cost = Math.max(0, Math.floor(Number(amount)));
  if (!cost) return fetchWalletCoins(userId);

  const wid = walletUserId(userId);
  const { data: wallet, error: readError } = await supabase
    .from("wallets")
    .select("coins")
    .eq("user_id", wid)
    .maybeSingle();
  if (readError) throw readError;

  const current = Number(wallet?.coins ?? 0);
  if (current < cost) throw new Error("Not enough coins");

  const newBalance = current - cost;
  const { error: writeError } = await supabase
    .from("wallets")
    .update({ coins: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", wid);
  if (writeError) throw writeError;
  return newBalance;
}
