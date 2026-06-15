import { supabase } from "./supabase.js";
import { effectiveVipLevel } from "./vipStatus.js";

export const PRIVACY_KEYS = [
  "hide_stats",
  "hide_voice_rooms_joined",
  "hide_location",
  "do_not_recommend",
  "hide_moment_sharing",
  "incognito_visit",
  "hide_recent_gifts",
  "hide_guardian_board",
  "block_game_invites_global",
];

export const VIP_GATED_PRIVACY = {
  incognito_visit: 6,
  hide_recent_gifts: 7,
  hide_guardian_board: 8,
};

export function defaultPrivacySettings() {
  return Object.fromEntries(PRIVACY_KEYS.map((key) => [key, false]));
}

export function normalizePrivacySettings(raw) {
  const base = defaultPrivacySettings();
  if (!raw || typeof raw !== "object") return base;
  for (const key of PRIVACY_KEYS) {
    if (typeof raw[key] === "boolean") base[key] = raw[key];
  }
  return base;
}

export function privacyFromProfile(profile) {
  return normalizePrivacySettings(profile?.privacy_settings);
}

export function canEnablePrivacyToggle(key, profile) {
  const minVip = VIP_GATED_PRIVACY[key];
  if (!minVip) return true;
  return effectiveVipLevel(profile) >= minVip;
}

/** Force VIP-gated toggles off when profile does not meet required level. */
export function enforceVipPrivacyGates(settings, profile) {
  const next = { ...settings };
  for (const [key, minVip] of Object.entries(VIP_GATED_PRIVACY)) {
    if (next[key] && effectiveVipLevel(profile) < minVip) {
      next[key] = false;
    }
  }
  return next;
}

export async function loadPrivacySettings(userId) {
  if (!supabase || !userId) return defaultPrivacySettings();
  const { data, error } = await supabase
    .from("profiles")
    .select("privacy_settings, vip_level, vip_points, vip_expires_at, is_super_admin")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  const normalized = normalizePrivacySettings(data?.privacy_settings);
  return enforceVipPrivacyGates(normalized, data ?? {});
}

export async function savePrivacySettings(userId, patch, profile) {
  if (!supabase || !userId) throw new Error("Supabase is not configured");

  const current = profile ? privacyFromProfile(profile) : await loadPrivacySettings(userId);
  const next = { ...current };

  for (const [key, value] of Object.entries(patch ?? {})) {
    if (!PRIVACY_KEYS.includes(key) || typeof value !== "boolean") continue;
    if (value && !canEnablePrivacyToggle(key, profile)) {
      throw new Error(`Requires VIP ${VIP_GATED_PRIVACY[key]}`);
    }
    next[key] = value;
  }

  const gated = enforceVipPrivacyGates(next, profile ?? {});

  const { data, error } = await supabase
    .from("profiles")
    .update({ privacy_settings: gated })
    .eq("id", userId)
    .select("privacy_settings, vip_level, vip_points, vip_expires_at, is_super_admin")
    .single();

  if (error) throw error;
  return enforceVipPrivacyGates(normalizePrivacySettings(data?.privacy_settings), data ?? {});
}

export function isPrivacyActive(profileOrSettings, key) {
  const settings =
    profileOrSettings && typeof profileOrSettings.hide_location === "boolean"
      ? profileOrSettings
      : privacyFromProfile(profileOrSettings);
  return Boolean(settings[key]);
}
