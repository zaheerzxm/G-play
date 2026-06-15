/** Collectible gift-wall badges unlocked by received gift stats. */

export const GIFT_WALL_BADGE_DEFS = [
  { id: "first_gift", name: "First Gift", emoji: "🎁", minTotal: 1, minUnique: 1 },
  { id: "collector", name: "Collector", emoji: "💝", minTotal: 10, minUnique: 3 },
  { id: "generous_fans", name: "Fan Favorite", emoji: "⭐", minTotal: 50, minUnique: 8 },
  { id: "star_receiver", name: "Star Receiver", emoji: "🌟", minTotal: 100, minUnique: 12 },
  { id: "gift_wall", name: "Gift Wall", emoji: "🏆", minTotal: 250, minUnique: 20 },
  { id: "legend", name: "Gift Legend", emoji: "👑", minTotal: 500, minUnique: 30 },
];

export function giftWallBadgeProgress(stats = {}) {
  const totalGifts = Number(stats.totalGifts ?? 0);
  const uniqueGifts = Array.isArray(stats.gifts) ? stats.gifts.length : 0;

  return GIFT_WALL_BADGE_DEFS.map((badge) => {
    const totalOk = totalGifts >= badge.minTotal;
    const uniqueOk = uniqueGifts >= badge.minUnique;
    const unlocked = totalOk && uniqueOk;
    const totalPct = Math.min(100, Math.round((totalGifts / badge.minTotal) * 100));
    const uniquePct = Math.min(100, Math.round((uniqueGifts / badge.minUnique) * 100));
    return {
      ...badge,
      unlocked,
      progressPct: Math.min(totalPct, uniquePct),
    };
  });
}
