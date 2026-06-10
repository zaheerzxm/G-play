import { supabase } from "./supabase.js";
import { VIP_WEEK_MS, vipLevelFromPoints } from "./vipStatus.js";

const VIP_REQUEST_SELECT = `
  id,
  user_id,
  requested_level,
  status,
  created_at,
  decided_at,
  profiles:user_id (
    id,
    display_name,
    avatar_url,
    user_code,
    vip_level,
    vip_points,
    vip_expires_at
  )
`;

function missingVipRequestsTable(error) {
  return /vip_requests|relation .* does not exist|schema cache/i.test(error?.message ?? "");
}

export async function loadMyVipRequest(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("vip_requests")
    .select("id, requested_level, status, created_at, decided_at")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (missingVipRequestsTable(error)) return null;
    throw error;
  }
  return data ?? null;
}

export async function requestVip(userId) {
  if (!supabase || !userId) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("vip_requests")
    .upsert(
      {
        user_id: userId,
        requested_level: 1,
        status: "pending",
        decided_by: null,
        decided_at: null,
      },
      { onConflict: "user_id" },
    )
    .select("id, requested_level, status, created_at")
    .single();
  if (error) {
    if (missingVipRequestsTable(error)) {
      throw new Error("VIP requests table is missing. Run supabase/vip-requests-migration.sql in Supabase.");
    }
    throw error;
  }
  return data;
}

export async function loadPendingVipRequests() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("vip_requests")
    .select(VIP_REQUEST_SELECT)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) {
    if (missingVipRequestsTable(error)) return [];
    throw error;
  }
  return data ?? [];
}

export async function decideVipRequest({ requestId, userId, level, adminId, approve }) {
  if (!supabase) throw new Error("Supabase is not configured");
  const status = approve ? "approved" : "rejected";
  const patch = {
    status,
    decided_by: adminId,
    decided_at: new Date().toISOString(),
  };

  if (approve) {
    const { data: profile, error: readProfileError } = await supabase
      .from("profiles")
      .select("vip_level, vip_points, vip_expires_at")
      .eq("id", userId)
      .maybeSingle();
    if (readProfileError) throw readProfileError;

    const earnedLevel = Math.max(
      Number(profile?.vip_level ?? 0),
      vipLevelFromPoints(profile?.vip_points ?? 0),
      Math.max(1, Math.floor(Number(level) || 1)),
    );
    const now = Date.now();
    const currentExpiry = profile?.vip_expires_at ? new Date(profile.vip_expires_at).getTime() : 0;
    const start = currentExpiry > now ? currentExpiry : now;
    const expiresAt = new Date(start + VIP_WEEK_MS).toISOString();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ vip_level: earnedLevel, title: `VIP ${earnedLevel}`, vip_expires_at: expiresAt })
      .eq("id", userId);
    if (profileError) throw profileError;
  }

  const { data, error } = await supabase
    .from("vip_requests")
    .update(patch)
    .eq("id", requestId)
    .select(VIP_REQUEST_SELECT)
    .single();
  if (error) throw error;
  return data;
}
