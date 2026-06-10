/** Bestie bow tiers — same EXP scale as CP hearts; level 6 is top. */
export const BESTIE_BOW_TIERS = [
  { level: 1, label: "Bow 1", min: 1_000, max: 3_000 },
  { level: 2, label: "Bow 2", min: 3_000, max: 10_000 },
  { level: 3, label: "Bow 3", min: 10_000, max: 30_000 },
  { level: 4, label: "Bow 4", min: 30_000, max: 100_000 },
  { level: 5, label: "Bow 5", min: 100_000, max: 200_000 },
  { level: 6, label: "Bow 6", min: 200_000, max: null },
];

export function bestieBowLevelFromExp(exp) {
  const value = Number(exp) || 0;
  let level = 1;
  for (const row of BESTIE_BOW_TIERS) {
    if (value >= row.min) level = row.level;
  }
  return level;
}

export function bestieBowIconSrc(level) {
  const n = Math.max(1, Math.min(6, Math.floor(Number(level) || 1)));
  return `${import.meta.env.BASE_URL}charm/bestie-${String(n).padStart(2, "0")}.png`;
}
