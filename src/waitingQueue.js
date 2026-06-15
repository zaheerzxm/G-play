import { supabase } from "./supabase.js";

const joinInflight = new Map();

function isAlreadyInQueueError(error) {
  return error?.code === "23505" || error?.status === 409;
}

function isUpsertForbiddenError(error) {
  return error?.code === "42501" || error?.status === 403;
}

async function joinWaitingQueueOnce(roomId, userId, nickname) {
  if (!supabase) throw new Error("Supabase is not configured");
  const row = { room_id: roomId, user_id: userId, nickname };

  const { error: upsertError } = await supabase
    .from("room_waiting")
    .upsert(row, { onConflict: "room_id,user_id" });

  if (!upsertError) return;
  if (isAlreadyInQueueError(upsertError)) return;

  // Legacy DBs may allow INSERT but not UPDATE on upsert when the row already exists.
  if (isUpsertForbiddenError(upsertError)) {
    const { error: insertError } = await supabase.from("room_waiting").insert(row);
    if (!insertError || isAlreadyInQueueError(insertError)) return;
    throw insertError;
  }

  throw upsertError;
}

export async function joinWaitingQueue(roomId, userId, nickname) {
  const key = `${roomId}:${userId}`;
  const prev = joinInflight.get(key);
  const task = (prev ?? Promise.resolve()).then(() => joinWaitingQueueOnce(roomId, userId, nickname));
  joinInflight.set(
    key,
    task.finally(() => {
      if (joinInflight.get(key) === task) joinInflight.delete(key);
    }),
  );
  return task;
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
