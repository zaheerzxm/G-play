/** Clan Store catalog — prices in clan_coins (treasury spend). */
export const CLAN_STORE_CATALOG = [
  {
    id: "clan_store_badge_honor",
    name: "Honor Badge",
    emoji: "🏅",
    price: 500,
    rewardType: "clan_item",
    oneTime: true,
    hint: "Clan cosmetic",
  },
  {
    id: "clan_store_badge_unity",
    name: "Unity Badge",
    emoji: "🤝",
    price: 400,
    rewardType: "clan_item",
    oneTime: true,
    hint: "Clan cosmetic",
  },
  {
    id: "clan_store_frame",
    name: "Clan Frame",
    emoji: "🖼️",
    price: 1200,
    rewardType: "clan_item",
    oneTime: true,
    hint: "Profile frame",
  },
  {
    id: "clan_store_flag",
    name: "Clan Flag",
    emoji: "🚩",
    price: 800,
    rewardType: "clan_item",
    oneTime: true,
    hint: "Clan banner",
  },
  {
    id: "clan_store_gift_rose",
    name: "Rose Pack",
    emoji: "🌹",
    price: 350,
    rewardType: "gift",
    hint: "3 roses",
  },
  {
    id: "clan_store_gift_heart",
    name: "Heart Pack",
    emoji: "💖",
    price: 450,
    rewardType: "gift",
    hint: "3 hearts",
  },
  {
    id: "clan_store_boost",
    name: "Clan Boost",
    emoji: "⚡",
    price: 1000,
    rewardType: "clan_item",
    hint: "Consumable",
  },
];

export function clanStoreItemById(id) {
  return CLAN_STORE_CATALOG.find((item) => item.id === id) ?? null;
}
