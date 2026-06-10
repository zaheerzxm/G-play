import { supabase } from "./supabase.js";
import { creditGiftReward, loadProfilesForUserIds } from "./profile.js";

const RP_MSG = /🧧 \[rp:(\d+)\] red packet (\d+) gold \((\d+) envelopes\)/;
const RP_MSG_RAIN = /🧧 \[rp:(\d+)\] red packet rain (\d+) gold \((\d+) drops\)/;
const RP_MSG_LEGACY = /🧧 \[rp:(\d+)\] red packet (\d+) gold \((\d+) claims\)/;

export const RED_PACKET_MIN_COINS = 10;
export const RED_PACKET_ANIM_MS = 18_000;
/** @deprecated use RED_PACKET_ANIM_MS */
export const RED_PACKET_RAIN_MS = RED_PACKET_ANIM_MS;

/** Share of the pool that goes to grabbers = grabbed envelopes / total envelopes. */
export function grabbedPoolAmount(totalCoins, grabCounts, envelopeCount) {
  const total = Math.max(0, Math.floor(Number(totalCoins) || 0));
  const envelopes = Math.max(1, Math.floor(Number(envelopeCount) || 0));
  const totalGrabs = [...grabCounts.values()].reduce((sum, count) => sum + count, 0);
  if (!total || !totalGrabs) return 0;
  return Math.floor((total * totalGrabs) / envelopes);
}

/**
 * Split the grabbed portion of the pool among grabbers by grab count.
 * Unclaimed envelopes are not paid out and are not refunded.
 */
export function distributeRedPacketPool(totalCoins, grabCounts, envelopeCount) {
  const distributable = grabbedPoolAmount(totalCoins, grabCounts, envelopeCount);
  if (!distributable) return new Map();

  const entries = [...grabCounts.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));

  if (!entries.length) return new Map();

  const totalGrabs = entries.reduce((sum, [, count]) => sum + count, 0);
  const payouts = new Map();
  let assigned = 0;

  entries.forEach(([userId, grabs], index) => {
    const share = index === entries.length - 1
      ? distributable - assigned
      : Math.floor((distributable * grabs) / totalGrabs);
    assigned += share;
    if (share > 0) payouts.set(userId, share);
  });

  balancePayoutTotal(payouts, distributable);
  return payouts;
}

/** Random envelope count derived from total coins — kept low so people can actually grab them. */
export function packetCountForAmount(totalCoins) {
  const amount = Math.max(RED_PACKET_MIN_COINS, Math.floor(Number(totalCoins) || 0));
  let min;
  let max;
  if (amount < 100) {
    min = 4;
    max = 8;
  } else if (amount < 500) {
    min = 6;
    max = 12;
  } else {
    min = 10;
    max = 18;
  }
  max = Math.max(min, Math.min(max, amount));
  return min + Math.floor(Math.random() * (max - min + 1));
}

function balancePayoutTotal(payouts, total) {
  let sum = 0;
  for (const coins of payouts.values()) sum += coins;
  const diff = total - sum;
  if (!diff) return;
  const top = [...payouts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top) payouts.set(top[0], top[1] + diff);
}

export function parseRedPacketMessage(message) {
  let m = message?.match(RP_MSG);
  if (m) {
    return {
      packetId: Number(m[1]),
      totalCoins: Number(m[2]),
      envelopeCount: Number(m[3]),
    };
  }
  m = message?.match(RP_MSG_RAIN);
  if (m) {
    return {
      packetId: Number(m[1]),
      totalCoins: Number(m[2]),
      envelopeCount: Number(m[3]),
    };
  }
  m = message?.match(RP_MSG_LEGACY);
  if (!m) return null;
  return {
    packetId: Number(m[1]),
    totalCoins: Number(m[2]),
    envelopeCount: Number(m[3]),
  };
}

export function formatRedPacketMessage(packetId, totalCoins, envelopeCount) {
  return `🧧 [rp:${packetId}] red packet ${totalCoins} gold (${envelopeCount} envelopes)`;
}

export function formatRedPacketResultsMessage(leaders) {
  if (!leaders?.length) return null;
  const labels = ["🥇", "🥈", "🥉", "4.", "5."];
  const parts = leaders.map((row, i) => {
    const tag = labels[i] ?? `${row.rank}.`;
    return `${tag} ${row.name} +${row.coins} gold (${row.grabs} grabs)`;
  });
  return `🧧 Top grabbers — ${parts.join(" · ")}`;
}

export async function loadRedPacketDrops(packetId) {
  if (!supabase || !packetId) return [];
  const { data, error } = await supabase
    .from("red_packet_drops")
    .select("drop_index, coin_value, claimed_by")
    .eq("packet_id", packetId)
    .order("drop_index");
  if (error) throw error;
  return data ?? [];
}

function countGrabsByUser(drops) {
  const grabCounts = new Map();
  for (const drop of drops) {
    if (!drop.claimed_by) continue;
    grabCounts.set(drop.claimed_by, (grabCounts.get(drop.claimed_by) ?? 0) + 1);
  }
  return grabCounts;
}

function payoutsFromDrops(drops) {
  const payouts = new Map();
  for (const drop of drops) {
    if (!drop.claimed_by) continue;
    const coins = Number(drop.coin_value ?? 0);
    if (coins <= 0) continue;
    payouts.set(drop.claimed_by, (payouts.get(drop.claimed_by) ?? 0) + coins);
  }
  return payouts;
}

async function loadPacketMeta(packetId) {
  if (!supabase || !packetId) return null;
  const { data, error } = await supabase
    .from("red_packets")
    .select("total_coins, claims_left")
    .eq("id", packetId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function computePayoutMap(totalCoins, drops) {
  const grabCounts = countGrabsByUser(drops);
  if (!grabCounts.size) return { payoutMap: new Map(), grabCounts };
  const payoutMap = distributeRedPacketPool(
    Number(totalCoins ?? 0),
    grabCounts,
    drops.length,
  );
  return { payoutMap, grabCounts };
}

async function writePayoutsToDrops(packetId, drops, payouts) {
  if (!supabase) return;
  const tasks = [];
  for (const [userId, totalCoins] of payouts) {
    const userDrops = drops
      .filter((d) => d.claimed_by === userId)
      .sort((a, b) => a.drop_index - b.drop_index);
    if (!userDrops.length) continue;
    let assigned = 0;
    userDrops.forEach((drop, index) => {
      const share = index === userDrops.length - 1
        ? totalCoins - assigned
        : Math.max(1, Math.floor(totalCoins / userDrops.length));
      assigned += share;
      tasks.push(
        supabase
          .from("red_packet_drops")
          .update({ coin_value: share })
          .eq("packet_id", packetId)
          .eq("drop_index", drop.drop_index),
      );
    });
  }
  const results = await Promise.all(tasks);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

async function buildLeaderboardRows(payoutMap, grabCounts, limit = 5) {
  const ranked = [...payoutMap.entries()]
    .map(([userId, coins]) => ({
      userId,
      coins,
      grabs: grabCounts.get(userId) ?? 0,
    }))
    .sort((a, b) => b.coins - a.coins || b.grabs - a.grabs)
    .slice(0, limit);
  if (!ranked.length) return [];

  const profiles = await loadProfilesForUserIds(ranked.map((row) => row.userId));
  return ranked.map((row, index) => ({
    rank: index + 1,
    userId: row.userId,
    coins: row.coins,
    grabs: row.grabs,
    name: profiles[row.userId]?.display_name ?? "Guest",
    avatarUrl: profiles[row.userId]?.avatar_url ?? null,
  }));
}

/** Top grabbers for a finished red packet (by payout after settlement). */
export async function loadRedPacketLeaderboard(packetId, limit = 5) {
  const [drops, packet] = await Promise.all([
    loadRedPacketDrops(packetId),
    loadPacketMeta(packetId),
  ]);
  const { payoutMap, grabCounts } = computePayoutMap(packet?.total_coins, drops);
  if (!payoutMap.size) return [];
  return buildLeaderboardRows(payoutMap, grabCounts, limit);
}

export async function createRedPacketRain({ roomId, senderId, totalCoins, dropCount }) {
  if (!supabase) throw new Error("Supabase is not configured");
  const total = Math.max(RED_PACKET_MIN_COINS, Math.floor(Number(totalCoins) || 0));
  const envelopes = dropCount != null
    ? Math.min(total, Math.max(1, Math.floor(Number(dropCount))))
    : packetCountForAmount(total);
  if (total < envelopes) throw new Error(`Need at least ${envelopes} coins`);

  const { data: packet, error: packetErr } = await supabase
    .from("red_packets")
    .insert({
      room_id: roomId,
      sender_id: senderId,
      total_coins: total,
      claims_left: envelopes,
    })
    .select()
    .single();
  if (packetErr) {
    throw new Error(packetErr.message || "Could not create red packet");
  }

  const rows = Array.from({ length: envelopes }, (_, drop_index) => ({
    packet_id: packet.id,
    drop_index,
    coin_value: 1,
  }));

  const { error: dropsErr } = await supabase.from("red_packet_drops").insert(rows);
  if (dropsErr) {
    await supabase.from("red_packets").delete().eq("id", packet.id);
    throw new Error(
      dropsErr.message
      || "Could not create envelopes — ask admin to run supabase/RUN-THIS.sql",
    );
  }

  return { packet, envelopeCount: envelopes };
}

/** Mark an envelope grabbed — coins paid out when the round settles. */
export async function claimRedPacketDrop(packetId, dropIndex, userId) {
  if (!supabase || !packetId || !userId) throw new Error("Invalid claim");
  const idx = Math.floor(Number(dropIndex));
  if (idx < 0) throw new Error("Invalid drop");

  const { data: drop, error: claimErr } = await supabase
    .from("red_packet_drops")
    .update({
      claimed_by: userId,
      claimed_at: new Date().toISOString(),
    })
    .eq("packet_id", packetId)
    .eq("drop_index", idx)
    .is("claimed_by", null)
    .select("drop_index")
    .maybeSingle();

  if (claimErr) throw claimErr;
  if (!drop) throw new Error("Too slow — already grabbed");

  const { data: packet } = await supabase
    .from("red_packets")
    .select("claims_left")
    .eq("id", packetId)
    .maybeSingle();

  if (packet) {
    const left = Math.max(0, Number(packet.claims_left ?? 0) - 1);
    await supabase.from("red_packets").update({ claims_left: left }).eq("id", packetId);
  }

  return 1;
}

/**
 * End round: pay grabbers their share. Unclaimed coins are not refunded.
 * claims_left = -1 means already settled.
 */
export async function settleRedPacketRain(packetId) {
  if (!supabase || !packetId) return { refund: 0, payouts: {}, alreadySettled: true };

  const { data: locked } = await supabase
    .from("red_packets")
    .update({ claims_left: -1 })
    .eq("id", packetId)
    .gte("claims_left", 0)
    .select("*")
    .maybeSingle();

  if (!locked) {
    const [drops, packet] = await Promise.all([
      loadRedPacketDrops(packetId),
      loadPacketMeta(packetId),
    ]);
    const { payoutMap, grabCounts } = computePayoutMap(packet?.total_coins, drops);
    const leaders = payoutMap.size
      ? await buildLeaderboardRows(payoutMap, grabCounts, 5)
      : [];
    return {
      refund: 0,
      payouts: Object.fromEntries(payoutMap),
      leaders,
      alreadySettled: true,
    };
  }

  const drops = await loadRedPacketDrops(packetId);
  const { payoutMap, grabCounts } = computePayoutMap(locked.total_coins, drops);

  if (!grabCounts.size) {
    return { refund: 0, payouts: {}, leaders: [], alreadySettled: false };
  }

  await writePayoutsToDrops(packetId, drops, payoutMap);

  for (const [uid, coins] of payoutMap) {
    if (coins > 0) await creditGiftReward(uid, coins);
  }

  const leaders = await buildLeaderboardRows(payoutMap, grabCounts, 5);
  return {
    refund: 0,
    payouts: Object.fromEntries(payoutMap),
    leaders,
    alreadySettled: false,
  };
}

/** Legacy single-tap claim — kept for old chat messages. */
export async function claimRedPacket(packetId, userId) {
  if (!supabase || !packetId || !userId) throw new Error("Invalid claim");

  const drops = await loadRedPacketDrops(packetId);
  if (drops.length) {
    const open = drops.find((d) => !d.claimed_by);
    if (!open) throw new Error("All envelopes grabbed");
    await claimRedPacketDrop(packetId, open.drop_index, userId);
    return 0;
  }

  const { data: packet, error: fetchErr } = await supabase
    .from("red_packets")
    .select("*")
    .eq("id", packetId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!packet) throw new Error("Red packet expired");
  if (packet.claims_left <= 0) throw new Error("All claims taken");

  const { data: existing } = await supabase
    .from("red_packet_claims")
    .select("id")
    .eq("packet_id", packetId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) throw new Error("You already claimed this packet");

  const share = Math.max(1, Math.floor(Number(packet.total_coins) / Number(packet.claims_left)));
  const newClaimsLeft = Number(packet.claims_left) - 1;

  const { error: claimErr } = await supabase.from("red_packet_claims").insert({
    packet_id: packetId,
    user_id: userId,
    coins: share,
  });
  if (claimErr) throw claimErr;

  await supabase.from("red_packets").update({ claims_left: newClaimsLeft }).eq("id", packetId);
  await creditGiftReward(userId, share);
  return share;
}
