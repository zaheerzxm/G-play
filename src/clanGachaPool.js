/** Clan Gacha — single and 10-pull costs in clan_coins. */
export const CLAN_GACHA_SINGLE_COST = 500;
export const CLAN_GACHA_TEN_COST = 4500;

export const CLAN_GACHA_POOL_PREVIEW = [
  { label: "Coins", emoji: "🪙", weight: "55%" },
  { label: "Rose", emoji: "🌹", weight: "25%" },
  { label: "Heart", emoji: "💖", weight: "12%" },
  { label: "Clan Frame", emoji: "🖼️", weight: "6%" },
  { label: "Jackpot", emoji: "✨", weight: "2%" },
];

export function clanGachaPullCost(count) {
  if (count === 10) return CLAN_GACHA_TEN_COST;
  return CLAN_GACHA_SINGLE_COST * Math.max(1, count);
}
