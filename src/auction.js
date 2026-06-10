import { creditGiftReward } from "./profile.js";
import { supabase } from "./supabase.js";
import { deductWalletCoins, fetchWalletCoins } from "./wallet.js";

export async function loadAuction(roomId) {
  if (!supabase || !roomId) return null;
  const { data } = await supabase
    .from("room_auctions")
    .select("*")
    .eq("room_id", roomId)
    .maybeSingle();
  return data;
}

export async function startAuction(roomId, { seatNumber = 2, minBid = 50, durationSec = 60 } = {}) {
  if (!supabase || !roomId) throw new Error("Room not found");

  const endsAt = new Date(Date.now() + durationSec * 1000).toISOString();
  const row = {
    room_id: roomId,
    seat_number: seatNumber,
    min_bid: minBid,
    current_bid: 0,
    high_bidder_id: null,
    high_bidder_name: null,
    status: "active",
    started_at: new Date().toISOString(),
    ends_at: endsAt,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("room_auctions")
    .upsert(row, { onConflict: "room_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function placeBid({
  roomId,
  userId,
  displayName,
  bidAmount,
  isSuperAdmin = false,
  onBalanceChange,
}) {
  if (!supabase) throw new Error("Not configured");

  const auction = await loadAuction(roomId);
  if (!auction || auction.status !== "active") throw new Error("No active auction");
  if (auction.ends_at && new Date(auction.ends_at) < new Date()) {
    throw new Error("Auction ended");
  }

  const bid = Math.floor(Number(bidAmount));
  const minRequired = Math.max(Number(auction.min_bid), Number(auction.current_bid) + 10);
  if (!bid || bid < minRequired) {
    throw new Error(`Minimum bid is ${minRequired} gold`);
  }

  if (!isSuperAdmin) {
    const balance = await fetchWalletCoins(userId);
    if (balance == null || balance < bid) throw new Error("Not enough coins");
  }

  if (auction.high_bidder_id && Number(auction.current_bid) > 0) {
    await creditGiftReward(auction.high_bidder_id, Number(auction.current_bid));
  }

  let newBalance = null;
  if (!isSuperAdmin) {
    newBalance = await deductWalletCoins(userId, bid);
    onBalanceChange?.(newBalance);
  }

  const { data, error } = await supabase
    .from("room_auctions")
    .update({
      current_bid: bid,
      high_bidder_id: userId,
      high_bidder_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("room_id", roomId)
    .select()
    .single();

  if (error) throw error;
  return { auction: data, newBalance };
}

export async function settleAuction(roomId) {
  if (!supabase || !roomId) return null;

  const auction = await loadAuction(roomId);
  if (!auction || auction.status !== "active") return auction;

  const { data: updated, error } = await supabase
    .from("room_auctions")
    .update({ status: "settled", updated_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .select()
    .single();

  if (error) throw error;

  if (updated?.high_bidder_id) {
    await supabase
      .from("seats")
      .update({ user_id: null, nickname: null })
      .eq("room_id", roomId)
      .eq("seat_number", updated.seat_number);

    await supabase
      .from("seats")
      .update({
        user_id: updated.high_bidder_id,
        nickname: updated.high_bidder_name,
      })
      .eq("room_id", roomId)
      .eq("seat_number", updated.seat_number);
  }

  return updated;
}
