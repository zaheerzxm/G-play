import { supabase } from "./supabase.js";
import { findGift } from "./gifts.js";
import { loadProfilesForUserIds } from "./profile.js";

export async function logGiftTransaction({
  senderId,
  recipientId,
  roomId = null,
  gift,
  quantity = 1,
  cost = 0,
  charm = 0,
}) {
  if (!supabase || !senderId || !recipientId || !gift) return null;

  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const totalCost = Math.max(0, Math.floor(Number(cost) || 0));
  const giftId = String(gift.id ?? "").trim() || `gift-${Date.now()}`;
  const catalog = findGift(giftId);
  const giftName = String(gift.name ?? catalog?.name ?? "Gift").trim() || "Gift";
  const giftEmoji = gift.emoji ?? catalog?.emoji ?? "🎁";

  const { data, error } = await supabase
    .from("gift_transactions")
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      room_id: roomId,
      gift_id: giftId,
      gift_name: giftName,
      gift_emoji: giftEmoji,
      quantity: qty,
      cost: totalCost,
      charm: Math.max(0, Math.floor(Number(charm) || 0)),
    })
    .select()
    .single();

  if (error) {
    console.warn("gift_transactions insert failed", error.message);
    return null;
  }
  return data;
}

function starsForCost(cost) {
  if (cost >= 5000) return 5;
  if (cost >= 1000) return 4;
  if (cost >= 300) return 3;
  if (cost >= 50) return 2;
  return 1;
}

export async function loadGiftWall(userId) {
  if (!supabase || !userId) return { gifts: [], totalGifts: 0, totalStars: 0 };

  const { data, error } = await supabase
    .from("gift_transactions")
    .select("gift_id, gift_name, gift_emoji, quantity, cost, sender_id, created_at")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return { gifts: [], totalGifts: 0, totalStars: 0 };

  const senderIds = [...new Set((data ?? []).map((r) => r.sender_id).filter(Boolean))];
  const senderProfiles = senderIds.length ? await loadProfilesForUserIds(senderIds) : {};

  const map = {};
  let totalGifts = 0;
  let totalStars = 0;

  for (const row of data ?? []) {
    const key = row.gift_id;
    const qty = Number(row.quantity ?? 1);
    totalGifts += qty;
    const stars = starsForCost(Number(row.cost ?? 0) / qty);
    totalStars += stars * qty;

    if (!map[key]) {
      map[key] = {
        gift_id: row.gift_id,
        gift_name: row.gift_name,
        gift_emoji: row.gift_emoji,
        quantity: 0,
        stars,
        catalog: findGift(row.gift_id),
        top_sender: senderProfiles[row.sender_id] ?? null,
        last_sent_at: row.created_at,
      };
    }
    map[key].quantity += qty;
    if (row.created_at && (!map[key].last_sent_at || row.created_at > map[key].last_sent_at)) {
      map[key].last_sent_at = row.created_at;
      if (row.sender_id) {
        map[key].top_sender = senderProfiles[row.sender_id] ?? map[key].top_sender;
      }
    } else if (!map[key].top_sender && row.sender_id) {
      map[key].top_sender = senderProfiles[row.sender_id] ?? null;
    }
  }

  const gifts = Object.values(map).sort((a, b) => b.quantity - a.quantity);
  return { gifts, totalGifts, totalStars };
}

export async function loadReceivedGifts(userId, limit = 30) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from("gift_transactions")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  const ids = new Set();
  for (const row of data ?? []) {
    if (row.sender_id) ids.add(row.sender_id);
    if (row.recipient_id) ids.add(row.recipient_id);
  }
  const profiles = await loadProfilesForUserIds([...ids]);

  return (data ?? []).map((row) => {
    const catalog = findGift(row.gift_id);
    return {
      ...row,
      gift_name: row.gift_name || catalog?.name || "Gift",
      gift_emoji: row.gift_emoji || catalog?.emoji || "🎁",
      quantity: Math.max(1, Number(row.quantity) || 1),
      sender: profiles[row.sender_id] ?? null,
      recipient: profiles[row.recipient_id] ?? null,
    };
  });
}

/** Recent gifts exchanged between two users (Love Home feed). */
export async function loadGiftsBetweenUsers(userA, userB, limit = 20) {
  if (!supabase || !userA || !userB) return [];

  const { data, error } = await supabase
    .from("gift_transactions")
    .select("*")
    .or(
      `and(sender_id.eq.${userA},recipient_id.eq.${userB}),and(sender_id.eq.${userB},recipient_id.eq.${userA})`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  const ids = new Set();
  for (const row of data ?? []) {
    ids.add(row.sender_id);
    ids.add(row.recipient_id);
  }
  const profiles = await loadProfilesForUserIds([...ids]);

  return (data ?? []).map((row) => ({
    ...row,
    sender: profiles[row.sender_id] ?? null,
    recipient: profiles[row.recipient_id] ?? null,
  }));
}
