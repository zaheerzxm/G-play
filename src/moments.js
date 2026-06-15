import { supabase } from "./supabase.js";
import { loadProfilesForUserIds } from "./profile.js";

/** Display name for the social feed (Discover tab). */
export const SPOTLIGHT_FEED_NAME = "Spotlight";

const SPOTLIGHT_BUCKET = "avatars";

export async function uploadSpotlightPhoto(userId, file) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!userId || !file) throw new Error("Choose a photo first");
  if (!file.type?.startsWith("image/")) throw new Error("Photo must be an image");
  if (file.size > 8 * 1024 * 1024) throw new Error("Photo must be under 8 MB");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/spotlight-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(SPOTLIGHT_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "image/jpeg",
    upsert: true,
  });

  if (error) {
    if (/bucket/i.test(error.message ?? "")) {
      throw new Error("Photo storage is not ready. Run supabase/RUN-THIS.sql in Supabase first.");
    }
    throw error;
  }

  const { data } = supabase.storage.from(SPOTLIGHT_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

function missingCommentsTable(error) {
  return /moment_comments|relation .* does not exist|schema cache/i.test(error?.message ?? "");
}

export async function loadUserMoments(userId, limit = 40) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from("moments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];

  const profiles = await loadProfilesForUserIds([userId]);
  const author = profiles[userId] ?? null;

  const rows = (data ?? []).map((moment) => ({
    ...moment,
    author,
    comments_count: 0,
  }));
  if (rows.length) {
    const counts = await loadCommentCounts(rows.map((m) => m.id));
    return rows.map((m) => ({ ...m, comments_count: counts[m.id] ?? 0 }));
  }
  return rows;
}

export async function loadMomentsFeed(limit = 30) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("moments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];

  const userIds = [...new Set((data ?? []).map((m) => m.user_id))];
  const profiles = await loadProfilesForUserIds(userIds);

  const rows = (data ?? []).map((moment) => ({
    ...moment,
    author: profiles[moment.user_id] ?? null,
    comments_count: 0,
  }));

  if (rows.length) {
    const counts = await loadCommentCounts(rows.map((m) => m.id));
    return rows.map((m) => ({ ...m, comments_count: counts[m.id] ?? 0 }));
  }

  return rows;
}

export async function deleteMoment(userId, momentId) {
  if (!supabase || !userId || !momentId) throw new Error("Not signed in");

  const { error } = await supabase
    .from("moments")
    .delete()
    .eq("id", momentId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateMoment(userId, momentId, { content, imageUrl = null }) {
  if (!supabase || !userId || !momentId) throw new Error("Not signed in");
  const text = content?.trim();
  if (!text && !imageUrl) throw new Error("Write something or add an image");

  const { data, error } = await supabase
    .from("moments")
    .update({
      content: text || "📷",
      image_url: imageUrl,
    })
    .eq("id", momentId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function loadCommentCounts(momentIds) {
  if (!supabase || !momentIds?.length) return {};
  const { data, error } = await supabase
    .from("moment_comments")
    .select("moment_id")
    .in("moment_id", momentIds);
  if (error) {
    if (missingCommentsTable(error)) return {};
    throw error;
  }
  const counts = {};
  for (const row of data ?? []) {
    counts[row.moment_id] = (counts[row.moment_id] ?? 0) + 1;
  }
  return counts;
}

export async function loadMomentComments(momentId, limit = 40) {
  if (!supabase || !momentId) return [];
  const { data, error } = await supabase
    .from("moment_comments")
    .select("id, moment_id, user_id, content, created_at")
    .eq("moment_id", momentId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) {
    if (missingCommentsTable(error)) return [];
    throw error;
  }
  const userIds = [...new Set((data ?? []).map((r) => r.user_id))];
  const profiles = await loadProfilesForUserIds(userIds);
  return (data ?? []).map((row) => ({
    ...row,
    author: profiles[row.user_id] ?? null,
  }));
}

export async function addMomentComment(momentId, userId, content) {
  if (!supabase || !momentId || !userId) throw new Error("Not signed in");
  const text = content?.trim();
  if (!text) throw new Error("Write a comment");

  const { data, error } = await supabase
    .from("moment_comments")
    .insert({ moment_id: momentId, user_id: userId, content: text })
    .select("id, moment_id, user_id, content, created_at")
    .single();
  if (error) {
    if (missingCommentsTable(error)) {
      throw new Error("Comments are not enabled yet. Run the latest SQL migration in Supabase.");
    }
    throw error;
  }
  const profiles = await loadProfilesForUserIds([userId]);
  return { ...data, author: profiles[userId] ?? null };
}

export async function createMoment(userId, { content, imageUrl = null, poll = null }) {
  if (!supabase || !userId) throw new Error("Not signed in");
  const text = content?.trim();
  if (!text && !imageUrl && !poll) throw new Error("Write something, add an image, or create a poll");

  let body = text || (imageUrl ? "📷" : "");
  if (poll?.options?.length >= 2) {
    const payload = JSON.stringify({
      options: poll.options.filter(Boolean).slice(0, 6),
      days: poll.days ?? 1,
    });
    body = `[[poll]]${payload}[[/poll]]${body ? `\n${body}` : ""}`;
  }

  const { data, error } = await supabase
    .from("moments")
    .insert({
      user_id: userId,
      content: body || "📊 Poll",
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleMomentLike(momentId, userId) {
  if (!supabase || !momentId || !userId) return null;

  const { data: existing } = await supabase
    .from("moment_likes")
    .select("moment_id")
    .eq("moment_id", momentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("moment_likes").delete().eq("moment_id", momentId).eq("user_id", userId);
    const { data: moment } = await supabase.from("moments").select("likes_count").eq("id", momentId).maybeSingle();
    const likes = Math.max(0, Number(moment?.likes_count ?? 1) - 1);
    await supabase.from("moments").update({ likes_count: likes }).eq("id", momentId);
    return { liked: false, likes_count: likes };
  }

  await supabase.from("moment_likes").insert({ moment_id: momentId, user_id: userId });
  const { data: moment } = await supabase.from("moments").select("likes_count").eq("id", momentId).maybeSingle();
  const likes = Number(moment?.likes_count ?? 0) + 1;
  await supabase.from("moments").update({ likes_count: likes }).eq("id", momentId);
  return { liked: true, likes_count: likes };
}

export async function loadUserLikedMomentIds(userId, momentIds) {
  if (!supabase || !userId || !momentIds?.length) return new Set();
  const { data } = await supabase
    .from("moment_likes")
    .select("moment_id")
    .eq("user_id", userId)
    .in("moment_id", momentIds);
  return new Set((data ?? []).map((r) => r.moment_id));
}
