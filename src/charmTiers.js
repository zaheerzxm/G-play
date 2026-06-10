import { formatCompactNumber } from "./formatCompact.js";

/** G-play charm levels — 5 gold gift value = 1 charm (receiver) */
export const GOLD_PER_CHARM = 5;

export const CHARM_TIERS = [
  { level: 1, tier: "star", label: "Star 1", min: 1_000 },
  { level: 2, tier: "star", label: "Star 2", min: 4_000 },
  { level: 3, tier: "star", label: "Star 3", min: 12_000 },
  { level: 4, tier: "diamond", label: "Diamond 1", min: 30_000 },
  { level: 5, tier: "diamond", label: "Diamond 2", min: 80_000 },
  { level: 6, tier: "diamond", label: "Diamond 3", min: 160_000 },
  { level: 7, tier: "crown", label: "Crown 7", min: 300_000 },
  { level: 8, tier: "crown", label: "Crown 8", min: 500_000 },
  { level: 9, tier: "crown", label: "Crown 9", min: 1_000_000 },
  { level: 10, tier: "crown-red", label: "Crown 10", min: 2_000_000 },
  { level: 11, tier: "crown-red", label: "Crown 11", min: 3_500_000 },
  { level: 12, tier: "crown-red", label: "Crown 12", min: 6_000_000 },
  { level: 13, tier: "crown-purple", label: "Crown 13", min: 8_500_000 },
  { level: 14, tier: "crown-purple", label: "Crown 14", min: 12_000_000 },
  { level: 15, tier: "crown-purple", label: "Crown 15", min: 16_000_000 },
  { level: 16, tier: "crown-star", label: "Crown 16", min: 26_000_000 },
  { level: 17, tier: "crown-star", label: "Crown 17", min: 48_000_000 },
  { level: 18, tier: "crown-star", label: "Crown 18", min: 86_000_000 },
  { level: 19, tier: "crown-star", label: "Crown 19", min: 120_000_000 },
  { level: 20, tier: "crown-star", label: "Crown 20", min: 240_000_000 },
  { level: 21, tier: "crown-star", label: "Crown 21", min: 360_000_000 },
];

export function charmTierFromTotal(charm) {
  const value = Number(charm) || 0;
  let current = null;
  for (const row of CHARM_TIERS) {
    if (value >= row.min) current = row;
  }
  return current;
}

/** Public asset path for a charm tier icon (star / diamond / crown sprites). */
export function charmTierIconSrc(tier) {
  if (!tier?.level) return null;
  const n = String(tier.level).padStart(2, "0");
  if (tier.level <= 3) return `${import.meta.env.BASE_URL}charm/star-${n}.png`;
  if (tier.level <= 6) return `${import.meta.env.BASE_URL}charm/diamond-${n}.png`;
  return `${import.meta.env.BASE_URL}charm/crown-${n}.png`;
}

/** Charm earned from gift gold value (5 gold = 1 charm). */
export function charmForGift(gift, quantity = 1) {
  const goldValue = Math.max(gift.cost ?? 0, 0) * quantity;
  if (goldValue <= 0) return 0;
  return Math.max(1, Math.floor(goldValue / GOLD_PER_CHARM));
}

export function formatCharmThreshold(min) {
  return formatCompactNumber(min);
}
