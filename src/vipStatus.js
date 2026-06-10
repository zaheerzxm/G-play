export const VIP_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const VIP_LEVEL_THRESHOLDS = [
  0,
  10_000,
  35_000,
  80_000,
  150_000,
  250_000,
  400_000,
  650_000,
  1_000_000,
  1_500_000,
];

export function vipLevelFromPoints(points) {
  const total = Math.max(0, Math.floor(Number(points) || 0));
  let level = 1;
  for (let i = 0; i < VIP_LEVEL_THRESHOLDS.length; i += 1) {
    if (total >= VIP_LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return Math.max(1, Math.min(10, level));
}

export function isAutoVipTitle(title) {
  return /^VIP\s*\d+$/i.test(String(title ?? "").trim());
}

export function earnedVipLevel(profile) {
  if (!profile) return 0;
  return Math.max(
    Number(profile.vip_level ?? 0),
    vipLevelFromPoints(profile.vip_points ?? 0),
  );
}

export function isVipActive(profile) {
  if (!profile) return false;
  if (profile.is_super_admin) return earnedVipLevel(profile) > 0;
  if (Number(profile.vip_level ?? 0) <= 0) return false;
  const expiresAt = profile.vip_expires_at ? new Date(profile.vip_expires_at).getTime() : 0;
  return Boolean(expiresAt && !Number.isNaN(expiresAt) && expiresAt > Date.now());
}

/** Active VIP level for badges, gifts, and gold name glaze. */
export function effectiveVipLevel(profile) {
  if (!profile) return 0;
  if (profile.is_super_admin) {
    return Math.min(10, Math.max(earnedVipLevel(profile), 1));
  }
  return isVipActive(profile) ? Number(profile.vip_level ?? 0) : 0;
}

export function nextVipLevelProgress(points) {
  const total = Math.max(0, Math.floor(Number(points) || 0));
  const level = vipLevelFromPoints(total);
  if (level >= 10) return { level, current: total, next: null, progress: 1 };
  const currentFloor = VIP_LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = VIP_LEVEL_THRESHOLDS[level] ?? currentFloor;
  const span = Math.max(1, next - currentFloor);
  return {
    level,
    current: total,
    next,
    progress: Math.max(0, Math.min(1, (total - currentFloor) / span)),
  };
}
