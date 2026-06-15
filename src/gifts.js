import { formatCompactNumber } from "./formatCompact.js";
import { ROSE_LOTTIE_SRC } from "./lottieGift.js";
import { supabase } from "./supabase.js";

const ROSE_GIFT_FX = { fx: "rose-lottie", lottie: ROSE_LOTTIE_SRC };

export const STARTING_COINS = 500;
export const ROOM_CREATE_COST = 2_000;
export const SUPER_ADMIN_COINS = 999_999_999;

export const GIFT_CATEGORIES = ["Package", "Gift", "Special", "Member", "VIP"];

function g(id, emoji, name, cost, category, extra = {}) {
  const charm = extra.charm ?? Math.max(1, Math.floor(cost * 0.1));
  return { id, emoji, name, cost, category, charm, fx: extra.fx ?? "fly", ...extra };
}

/** G-play-style gift catalog */
export const GIFT_CATALOG = [
  { id: "pkg_rose", emoji: "🌹", name: "Rose", cost: 0, charm: 5, category: "Package", inventory: true, starterQty: 5, ...ROSE_GIFT_FX },
  { id: "pkg_heart", emoji: "❤️", name: "Heart", cost: 0, charm: 8, category: "Package", inventory: true, starterQty: 3, fx: "fly" },
  { id: "pkg_kiss", emoji: "💋", name: "Kiss", cost: 0, charm: 10, category: "Package", inventory: true, starterQty: 2, fx: "pop" },
  g("beer", "🍺", "Beer", 50, "Gift"),
  g("rose", "🌹", "Rose", 10, "Gift", ROSE_GIFT_FX),
  g("coffee", "☕", "Coffee", 20, "Gift"),
  g("lollipop", "🍭", "Lollipop", 30, "Gift"),
  g("heart", "❤️", "Heart", 50, "Gift", { fx: "pop" }),
  g("lipstick", "💄", "Lipstick", 80, "Gift", { badge: "hot", fx: "pop" }),
  g("star", "⭐", "Star", 100, "Gift"),
  g("diamond", "💎", "Diamond", 199, "Gift"),
  g("crown", "👑", "Crown", 500, "Gift", { premiumFx: "crown" }),
  g("love_u", "💕", "Love U", 520, "Gift", { fx: "pop", badge: "hot", premiumFx: "hearts" }),
  g("firework", "🎆", "Firework", 888, "Gift", { fx: "burst", premiumFx: "firework" }),
  g("rocket", "🚀", "Rocket", 1000, "Gift", { fx: "rocket", badge: "hot", premiumFx: "rocket" }),
  g("car", "🏎️", "Luxury Car", 999, "Gift", { fx: "rocket", premiumFx: "car" }),
  g("ring", "💍", "Ring", 1314, "Gift", { badge: "new", premiumFx: "ring" }),
  g("castle", "🏰", "Dream Castle", 2999, "Gift", { fx: "burst", badge: "hot", premiumFx: "castle" }),
  g("yacht", "🛥️", "Yacht", 4999, "Gift", { fx: "rocket", premiumFx: "yacht" }),
  g("galaxy", "🌌", "Galaxy", 5999, "Gift", { badge: "new", fx: "burst", premiumFx: "galaxy" }),
  g("dragon", "🐉", "Dragon", 9999, "Gift", { fx: "rocket", premiumFx: "dragon" }),
  g("palace", "🏯", "Palace", 19999, "Gift", { fx: "burst", premiumFx: "palace" }),
  g("supercar", "🏎️", "Super Car", 40000, "Gift", { fx: "rocket", badge: "hot", premiumFx: "supercar" }),
  g("universe", "🪐", "Universe", 49999, "Gift", { fx: "burst", badge: "vip", premiumFx: "universe" }),
  g("sp_love", "💕", "Love U", 520, "Special", { fx: "pop", badge: "hot", premiumFx: "hearts" }),
  g("sp_firework", "🎆", "Firework", 888, "Special", { fx: "burst", premiumFx: "firework" }),
  g("sp_ring", "💍", "Ring", 1314, "Special", { badge: "new", premiumFx: "ring" }),
  g("sp_yacht", "🛥️", "Yacht", 4999, "Special", { fx: "rocket", premiumFx: "yacht" }),
  g("sp_castle", "🏰", "Castle", 29999, "Special", { fx: "burst", premiumFx: "castle" }),
  g("member_mic", "🎤", "Mic Boost", 200, "Member"),
  g("member_frame", "🖼️", "Gold Frame", 500, "Member", { premiumFx: "frame" }),
  g("member_badge", "🏅", "Member Badge", 300, "Member"),
  g("vip_dragon", "🐉", "Dragon", 9999, "VIP", { vipRequired: 1, badge: "vip", fx: "rocket", premiumFx: "dragon" }),
  g("vip_palace", "🏯", "Palace", 19999, "VIP", { vipRequired: 2, badge: "vip", fx: "burst", premiumFx: "palace" }),
  g("vip_universe", "🪐", "Universe", 49999, "VIP", { vipRequired: 3, badge: "vip", fx: "burst", premiumFx: "universe" }),
];

export const GIFTS = GIFT_CATALOG.filter((x) => x.category === "Gift");

/** Package inventory entries granted from the daily chest (mirrors paid gift value). */
export const CHEST_REWARD_GIFTS = GIFTS.map((base) => ({
  id: `chest_${base.id}`,
  emoji: base.emoji,
  name: base.name,
  cost: 0,
  charm: base.charm ?? Math.max(1, Math.floor(base.cost * 0.1)),
  category: "Package",
  inventory: true,
  chestValue: base.cost,
  fx: base.fx ?? "fly",
  lottie: base.lottie,
  badge: base.badge,
  premiumFx: base.premiumFx,
}));

GIFT_CATALOG.push(...CHEST_REWARD_GIFTS);

const GIFT_CATEGORY_IDS = {
  Gift: ["beer", "rose", "coffee", "lollipop", "heart", "lipstick", "star", "diamond"],
  Special: ["crown", "love_u", "firework", "rocket", "car", "ring", "castle", "yacht", "galaxy", "supercar"],
  Member: ["member_mic", "member_frame", "member_badge"],
  VIP: ["vip_dragon", "vip_palace", "vip_universe"],
};

export const CHEST_RARITY_TIERS = [
  { id: "common", label: "Common", maxValue: 20, weight: 90 },
  { id: "uncommon", label: "Uncommon", maxValue: 80, weight: 9 },
  { id: "rare", label: "Rare", maxValue: 100, weight: 0.95 },
  { id: "legendary", label: "Legendary", maxValue: Infinity, weight: 0.05 },
];

const CHEST_STARTER_IDS = ["pkg_rose", "pkg_heart", "pkg_kiss"];

function chestGiftsInRange(minVal, maxVal) {
  return CHEST_REWARD_GIFTS.filter((g) => {
    const v = Number(g.chestValue ?? 0);
    return v >= minVal && v <= maxVal;
  });
}

function pickChestGift(pool) {
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function chestGiftReward(gift) {
  const rarity = gift.chestValue != null
    ? chestRarityForValue(gift.chestValue)
    : chestRarityForValue(0);
  return {
    type: "gift",
    giftId: gift.id,
    gift,
    quantity: 1,
    rarity: rarity.id,
    rarityLabel: rarity.label,
  };
}

export const COIN_PACKS = [
  { id: "pack_300", coins: 300, price: "$0.49" },
  { id: "pack_600", coins: 600, price: "$0.99" },
  { id: "pack_1800", coins: 1800, price: "$2.99" },
  { id: "pack_3000", coins: 3000, price: "$4.99" },
  { id: "pack_10000", coins: 10000, price: "$12.99" },
  { id: "pack_50000", coins: 50000, price: "$59.99", giftBroadcast: true },
];

export const GIFT_REWARD_MIN = 1;
export const GIFT_REWARD_MAX_RATIO = 0.8;
export const GIFT_LUCKY_REWARD_ODDS = 200;
export const GIFT_LUCKY_REWARD_MULTIPLIER = 3;

export function giftsByCategory(category) {
  if (category !== "Package" && GIFT_CATEGORY_IDS[category]) {
    return GIFT_CATEGORY_IDS[category]
      .map((id) => GIFT_CATALOG.find((g) => g.id === id))
      .filter(Boolean);
  }
  return GIFT_CATALOG.filter((g) => g.category === category);
}

export function findGift(id) {
  return GIFT_CATALOG.find((g) => g.id === id) ?? null;
}

export function chestRarityForValue(value) {
  const cost = Math.max(0, Number(value) || 0);
  let prevMax = -1;
  for (const tier of CHEST_RARITY_TIERS) {
    if (cost <= tier.maxValue) return tier;
    prevMax = tier.maxValue;
  }
  return CHEST_RARITY_TIERS[CHEST_RARITY_TIERS.length - 1];
}

/** Roll daily chest: ~90% low (10–20), heavy gifts are extremely rare. */
export function rollDailyChestReward() {
  const roll = Math.random() * 100;

  if (roll < 90) {
    if (Math.random() < 0.55) {
      return { type: "coins", coins: 10 + Math.floor(Math.random() * 11) };
    }
    const pool = [
      ...CHEST_STARTER_IDS.map((id) => findGift(id)).filter(Boolean),
      ...chestGiftsInRange(10, 20),
    ];
    const gift = pickChestGift(pool);
    if (gift) return chestGiftReward(gift);
    return { type: "coins", coins: 10 + Math.floor(Math.random() * 11) };
  }

  if (roll < 99) {
    if (Math.random() < 0.6) {
      return { type: "coins", coins: 21 + Math.floor(Math.random() * 30) };
    }
    const gift = pickChestGift(chestGiftsInRange(21, 80));
    if (gift) return chestGiftReward(gift);
    return { type: "coins", coins: 21 + Math.floor(Math.random() * 30) };
  }

  if (roll < 99.95) {
    const gift = pickChestGift(chestGiftsInRange(81, 100));
    if (gift) return chestGiftReward(gift);
    return { type: "coins", coins: 80 + Math.floor(Math.random() * 21) };
  }

  const gift = pickChestGift(chestGiftsInRange(101, Infinity));
  if (gift) return chestGiftReward(gift);
  return { type: "coins", coins: 50 + Math.floor(Math.random() * 51) };
}

export function findGiftByName(name) {
  const base = String(name ?? "")
    .replace(/\s+x\d+$/i, "")
    .trim()
    .toLowerCase();
  if (!base) return null;
  return GIFT_CATALOG.find((g) => g.name.toLowerCase() === base) ?? null;
}

export function giftFxForName(giftName, reward = 0) {
  const gift = findGiftByName(giftName);
  if (gift?.fx) return gift.fx;
  const low = String(giftName ?? "").toLowerCase();
  if (low.includes("rocket")) return "rocket";
  if (reward >= 500) return "burst";
  return "fly";
}

export function giftRewardRange(giftCost) {
  const max = Math.max(GIFT_REWARD_MIN, Math.floor(giftCost * GIFT_REWARD_MAX_RATIO));
  return { min: GIFT_REWARD_MIN, max };
}

export function giftQuantityFromName(giftName) {
  const match = String(giftName ?? "").match(/\sx(\d+)$/i);
  return match ? Math.max(1, Number(match[1]) || 1) : 1;
}

export function maxGiftRewardForName(giftName) {
  const gift = findGiftByName(giftName);
  if (!gift?.cost) return 0;
  const qty = giftQuantityFromName(giftName);
  const { max } = giftRewardRange(gift.cost);
  return max * qty;
}

export function clampGiftReward(giftName, reward) {
  const max = maxGiftRewardForName(giftName);
  const value = Math.max(0, Math.floor(Number(reward) || 0));
  if (!max) return 0;
  return Math.min(value, max);
}

/** Block users from typing/pasting fake system gift lines into chat. */
export function looksLikeGiftSystemMessage(message) {
  const main = String(message ?? "").trim().split("\n")[0]?.trim() ?? "";
  return /— won \d+ gold(?: Lucky x\d+!)?$/.test(main);
}

export function rollGiftReward(giftCost) {
  const cost = Math.max(0, Number(giftCost) || 0);
  if (cost <= 0) return 0;
  const { min, max } = giftRewardRange(cost);
  if (max <= min) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Roll destiny rewards for a bundle send — sync, no I/O. */
export function rollGiftRewardsTotal(giftCost, quantity = 1) {
  const count = Math.max(1, Math.floor(Number(quantity) || 1));
  const cost = Math.max(0, Number(giftCost) || 0);
  if (cost <= 0) return 0;
  const { min, max } = giftRewardRange(cost);
  if (count <= 1000) {
    let total = 0;
    for (let i = 0; i < count; i += 1) total += rollGiftReward(cost);
    return total;
  }

  const spread = max - min + 1;
  const mean = ((min + max) / 2) * count;
  const variance = ((spread * spread - 1) / 12) * count;
  const stdDev = Math.sqrt(Math.max(0, variance));
  const u1 = Math.max(Number.EPSILON, Math.random());
  const u2 = Math.random();
  const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const rolled = Math.round(mean + normal * stdDev);
  return Math.max(min * count, Math.min(max * count, rolled));
}

export function rollGiftRewardResult(giftCost, quantity = 1) {
  const count = Math.max(1, Math.floor(Number(quantity) || 1));
  const cost = Math.max(0, Number(giftCost) || 0);
  if (cost <= 0) return { total: 0, lucky: false };
  if (Math.floor(Math.random() * GIFT_LUCKY_REWARD_ODDS) === 0) {
    return {
      total: cost * count * GIFT_LUCKY_REWARD_MULTIPLIER,
      lucky: true,
      multiplier: GIFT_LUCKY_REWARD_MULTIPLIER,
    };
  }
  return { total: rollGiftRewardsTotal(cost, count), lucky: false };
}

/** Prefer server roll when `roll_gift_reward` RPC is deployed; falls back to client roll. */
export async function rollGiftRewardResultAsync(giftCost, quantity = 1) {
  const count = Math.max(1, Math.floor(Number(quantity) || 1));
  const cost = Math.max(0, Math.floor(Number(giftCost) || 0));
  if (cost <= 0) return { total: 0, lucky: false };

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("roll_gift_reward", {
        p_unit_cost: cost,
        p_quantity: count,
      });
      if (!error && data && typeof data === "object") {
        return {
          total: Math.max(0, Math.floor(Number(data.total) || 0)),
          lucky: Boolean(data.lucky),
          multiplier: data.multiplier ? Number(data.multiplier) : undefined,
        };
      }
    } catch {
      /* use client roll */
    }
  }

  return rollGiftRewardResult(cost, count);
}

/** Coins charged per unit when sending (package inventory = free). */
export function giftSendUnitCost(gift, fromInventory = false) {
  if (fromInventory) return 0;
  return Math.max(0, Number(gift.cost) || 0);
}

/** Basis for destiny-pool reward rolls — never pay out on free/package sends. */
export function giftRewardUnitCost(gift, fromInventory = false) {
  if (fromInventory) return 0;
  return Math.max(0, Number(gift.cost) || 0);
}

export function giftPaysRewards(gift, fromInventory = false) {
  return giftRewardUnitCost(gift, fromInventory) > 0;
}

export function formatCoins(n, isSuperAdmin = false) {
  if (isSuperAdmin) return "∞";
  return formatCompactNumber(n);
}

export function roomShieldEmoji(level) {
  const lv = Number(level) || 1;
  if (lv >= 10) return "👑";
  if (lv >= 7) return "⭐";
  if (lv >= 4) return "🔰";
  return "🛡️";
}

export function formatGiftMessage({
  senderName,
  emoji,
  giftName,
  recipientName,
  reward,
  quantity = 1,
  charm = 0,
  lucky = false,
  luckyMultiplier = GIFT_LUCKY_REWARD_MULTIPLIER,
}) {
  const qty = quantity > 1 ? ` x${quantity}` : "";
  const safeReward = lucky
    ? Math.max(0, Math.floor(Number(reward) || 0))
    : clampGiftReward(`${giftName}${qty}`, reward);
  const luckyText = lucky ? ` Lucky x${luckyMultiplier}!` : "";
  let text = `${senderName} sent ${emoji} ${giftName}${qty} to ${recipientName} — won ${safeReward} gold${luckyText}`;
  const charmLine = formatCharmSystemMessage(recipientName, charm);
  if (charmLine) text += `\n${charmLine}`;
  return text;
}

/** WePlay-style charm line after gifting. */
export function formatCharmSystemMessage(recipientName, charmAmount) {
  const n = Math.floor(Number(charmAmount) || 0);
  if (n <= 0) return null;
  return `Receiver's Charm +${formatCompactNumber(n)} (${recipientName})`;
}

export function looksLikeCharmSystemMessage(message) {
  return /^Receiver's Charm \+[\d.]+[kmbt]?/i.test(String(message ?? "").trim());
}

export function splitGiftMessage(message) {
  const lines = String(message ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return { main: "", charm: null };
  const charm = lines.slice(1).find((line) => looksLikeCharmSystemMessage(line)) ?? null;
  return { main: lines[0], charm };
}

/** Hide legacy separate System charm lines that follow the same gift event. */
export function isOrphanCharmMessage(msg, prevMsg) {
  if (!msg?.message || !looksLikeCharmSystemMessage(msg.message)) return false;
  if (!prevMsg?.message) return false;
  if (prevMsg.message.includes("— won ") && splitGiftMessage(prevMsg.message).charm) return true;
  const charmRecipient = msg.message.match(/\(([^)]+)\)\s*$/)?.[1]?.trim();
  const giftRecipient = prevMsg.message.split("\n")[0]?.match(/to (.+?) — won /)?.[1]?.trim();
  return Boolean(charmRecipient && giftRecipient && charmRecipient === giftRecipient);
}
