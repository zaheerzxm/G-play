import { supabase } from "./supabase.js";

const USER_LEVELS = [
  { level: 1, exp: 0 },
  { level: 2, exp: 500 },
  { level: 3, exp: 2000 },
  { level: 4, exp: 8000 },
  { level: 5, exp: 20000 },
  { level: 6, exp: 50000 },
  { level: 7, exp: 120000 },
  { level: 8, exp: 300000 },
  { level: 9, exp: 600000 },
  { level: 10, exp: 1000000 },
];

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

export function userLevelPercent(exp, level) {
  const cur = USER_LEVELS.find((r) => r.level === level)?.exp ?? 0;
  const next = nextUserLevelExp(level);
  if (!next) return 100;
  return Math.min(100, ((Number(exp) - cur) / (next - cur)) * 100);
}

export async function addUserExp(userId, amount) {
  if (!supabase || !userId || !amount) return;
  const { data } = await supabase.from("profiles").select("user_exp").eq("id", userId).maybeSingle();
  const user_exp = Number(data?.user_exp ?? 0) + amount;
  const user_level = userLevelFromExp(user_exp);
  await supabase.from("profiles").update({ user_exp, user_level }).eq("id", userId);
  return { user_exp, user_level };
}
