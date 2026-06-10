import { supabase } from "./supabase.js";
import { vipLevelFromPoints } from "./vipStatus.js";

export async function addVipActivity(userId, points) {
  if (!supabase || !userId) return null;
  const delta = Math.max(0, Math.floor(Number(points) || 0));
  if (!delta) return null;

  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("vip_points, vip_level, vip_expires_at")
    .eq("id", userId)
    .maybeSingle();
  if (readError) throw readError;

  const vipPoints = Number(profile?.vip_points ?? 0) + delta;
  const earnedLevel = Math.max(Number(profile?.vip_level ?? 0), vipLevelFromPoints(vipPoints));
  const { data, error } = await supabase
    .from("profiles")
    .update({ vip_points: vipPoints, vip_level: earnedLevel })
    .eq("id", userId)
    .select("vip_points, vip_level, vip_expires_at")
    .single();
  if (error) throw error;
  return data;
}
