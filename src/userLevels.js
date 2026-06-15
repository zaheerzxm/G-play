import { supabase } from "./supabase.js";

export const MAX_USER_LEVEL = 200;

function buildUserLevels(maxLevel = MAX_USER_LEVEL) {
  const rows = [{ level: 1, exp: 0 }];
  let total = 0;
  for (let level = 2; level <= maxLevel; level += 1) {
    const increment = Math.floor(350 + (level - 2) * 28 + Math.pow(level / 12, 2) * 45);
    total += increment;
    rows.push({ level, exp: total });
  }
  return rows;
}

const USER_LEVELS = buildUserLevels();

export function userLevelFromExp(exp) {
  const value = Number(exp) || 0;
  let level = 1;
  for (const row of USER_LEVELS) {
    if (value >= row.exp) level = row.level;
  }
  return level;
}

export function nextUserLevelExp(level) {
  return USER_LEVELS.find((r) => r.level === level + 1)?.exp ?? null;
}

export function currentUserLevelExp(level) {
  return USER_LEVELS.find((r) => r.level === level)?.exp ?? 0;
}

export function userLevelPercent(exp, level) {
  const cur = currentUserLevelExp(level);
  const next = nextUserLevelExp(level);
  if (!next) return 100;
  return Math.min(100, ((Number(exp) - cur) / (next - cur)) * 100);
}

export async function addUserExp(userId, amount) {
  if (!supabase || !userId || !amount) return;
  const delta = Math.floor(Number(amount));
  if (delta <= 0) return;
  const { data } = await supabase.from("profiles").select("user_exp").eq("id", userId).maybeSingle();
  const user_exp = Number(data?.user_exp ?? 0) + delta;
  const user_level = userLevelFromExp(user_exp);
  await supabase.from("profiles").update({ user_exp, user_level }).eq("id", userId);
  return { user_exp, user_level };
}
