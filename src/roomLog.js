import { supabase } from "./supabase.js";

/** G-play-style system line in room chat */
export async function postSystemMessage(roomId, message) {
  if (!supabase || !roomId || !message) return null;
  const { data, error } = await supabase
    .from("messages")
    .insert({
      room_id: roomId,
      user_id: null,
      nickname: "System",
      message: `System: ${message}`,
    })
    .select()
    .single();
  if (error) return null;
  return data;
}
