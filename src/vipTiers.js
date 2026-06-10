export const VIP_TIERS = [
  { level: 1, tier: "silver", label: "VIP 1" },
  { level: 2, tier: "silver-spike", label: "VIP 2" },
  { level: 3, tier: "silver-sun", label: "VIP 3" },
  { level: 4, tier: "silver-rank", label: "VIP 4" },
  { level: 5, tier: "silver-royal", label: "VIP 5" },
  { level: 6, tier: "gold", label: "VIP 6" },
  { level: 7, tier: "gold-spike", label: "VIP 7" },
  { level: 8, tier: "gold-rank", label: "VIP 8" },
  { level: 9, tier: "gold-wings", label: "VIP 9" },
  { level: 10, tier: "gold-royal", label: "VIP 10" },
];

export function vipTierFromLevel(level) {
  const n = Math.max(0, Math.floor(Number(level) || 0));
  if (n <= 0) return null;
  return VIP_TIERS[Math.min(n, VIP_TIERS.length) - 1] ?? VIP_TIERS[VIP_TIERS.length - 1];
}
