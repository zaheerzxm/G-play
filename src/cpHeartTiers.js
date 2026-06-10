import { formatCompactNumber } from "./formatCompact.js";

/** CP heart tiers (Hearts on Fire) — level 6 is top. Based on relationship EXP. */
export const CP_HEART_TIERS = [
  { level: 1, label: "Heart 1", min: 1_000, max: 3_000 },
  { level: 2, label: "Heart 2", min: 3_000, max: 10_000 },
  { level: 3, label: "Heart 3", min: 10_000, max: 30_000 },
  { level: 4, label: "Heart 4", min: 30_000, max: 100_000 },
  { level: 5, label: "Heart 5", min: 100_000, max: 200_000 },
  { level: 6, label: "Heart 6", min: 200_000, max: null },
];

export function cpHeartLevelFromExp(exp) {
  const value = Number(exp) || 0;
  let level = 1;
  for (const row of CP_HEART_TIERS) {
    if (value >= row.min) level = row.level;
  }
  return level;
}

export function cpHeartIconSrc(level) {
  const n = Math.max(1, Math.min(6, Math.floor(Number(level) || 1)));
  return `${import.meta.env.BASE_URL}charm/heart-${String(n).padStart(2, "0")}.png`;
}

export function formatCpHeartTierRange(row) {
  if (!row) return "";
  if (row.max != null) {
    return `${formatCompactNumber(row.min)}–${formatCompactNumber(row.max)}`;
  }
  return `${formatCompactNumber(row.min)}+`;
}
