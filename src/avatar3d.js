import { supabase } from "./supabase.js";

export const DEFAULT_AVATAR_3D = {
  skin: "#e8b796",
  hair: "#9b7edb",
  hairStyle: "short",
  outfit: "#f8fafc",
  pants: "#c4a574",
  shoes: "#fff",
  gender: "neutral",
};

export const AVATAR_3D_PRESETS = {
  male: {
    skin: "#e8b796",
    hair: "#2d2d2d",
    hairStyle: "short",
    outfit: "#38bdf8",
    pants: "#1e3a5f",
    shoes: "#f8fafc",
    gender: "male",
  },
  female: {
    skin: "#f5d0b5",
    hair: "#9b7edb",
    hairStyle: "long",
    outfit: "#fbcfe8",
    pants: "#78716c",
    shoes: "#fff",
    gender: "female",
  },
  neutral: DEFAULT_AVATAR_3D,
};

function storageKey(userId) {
  return `gplay_avatar3d_${userId}`;
}

function genderPreset(profile) {
  const g = String(profile?.gender ?? "").trim().toLowerCase();
  if (["male", "m", "man", "boy"].includes(g)) return AVATAR_3D_PRESETS.male;
  if (["female", "f", "woman", "girl"].includes(g)) return AVATAR_3D_PRESETS.female;
  return AVATAR_3D_PRESETS.neutral;
}

export function loadAvatar3d(userId, profile) {
  const preset = genderPreset(profile);
  if (profile?.avatar_3d && typeof profile.avatar_3d === "object") {
    return { ...preset, ...profile.avatar_3d };
  }
  if (!userId) return { ...preset };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return { ...preset, ...JSON.parse(raw) };
  } catch {
    /* ok */
  }
  return { ...preset };
}

export async function saveAvatar3d(userId, config) {
  if (!userId) return config;
  const merged = { ...DEFAULT_AVATAR_3D, ...config };
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(merged));
  } catch {
    /* ok */
  }
  if (supabase) {
    await supabase.from("profiles").update({ avatar_3d: merged }).eq("id", userId);
  }
  return merged;
}
