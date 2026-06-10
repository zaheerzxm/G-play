import { supabase } from "./supabase.js";

export async function joinWaitingQueue(roomId, userId, nickname) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("room_waiting").upsert({
    room_id: roomId,
    user_id: userId,
    nickname,
  });
  if (error) throw error;
}

export async function leaveWaitingQueue(roomId, userId) {
  if (!supabase) return;
  await supabase.from("room_waiting").delete().eq("room_id", roomId).eq("user_id", userId);
}

export async function loadWaitingQueue(roomId) {
  if (!supabase || !roomId) return [];
  const { data, error } = await supabase
    .from("room_waiting")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at");
  if (error) return [];
  return data ?? [];
}
