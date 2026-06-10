import { supabase } from "./supabase.js";
import { isMutualFriend } from "./social.js";

const RING_TIMEOUT_MS = 45_000;

export function dmCallRoomName(userIdA, userIdB) {
  return ["dm", ...[userIdA, userIdB].sort()].join("-");
}

function isRinging(row) {
  if (!row || row.status !== "ringing") return false;
  const age = Date.now() - new Date(row.created_at).getTime();
  return age < RING_TIMEOUT_MS;
}

export async function startDmCall(callerId, calleeId) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!callerId || !calleeId || callerId === calleeId) {
    throw new Error("Invalid call target");
  }

  const friends = await isMutualFriend(callerId, calleeId);
  if (!friends) throw new Error("Add each other as friends to call");

  await supabase
    .from("dm_calls")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("caller_id", callerId)
    .eq("status", "ringing");

  const roomName = dmCallRoomName(callerId, calleeId);
  const { data, error } = await supabase
    .from("dm_calls")
    .insert({
      caller_id: callerId,
      callee_id: calleeId,
      room_name: roomName,
      status: "ringing",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function answerDmCall(callId, userId) {
  if (!supabase) throw new Error("Supabase is not configured");
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("dm_calls")
    .update({ status: "active", answered_at: now })
    .eq("id", callId)
    .eq("callee_id", userId)
    .eq("status", "ringing")
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Call is no longer available");
  return data;
}

export async function rejectDmCall(callId, userId) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("dm_calls")
    .update({ status: "rejected", ended_at: new Date().toISOString() })
    .eq("id", callId)
    .eq("callee_id", userId)
    .eq("status", "ringing")
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cancelDmCall(callId, userId) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("dm_calls")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", callId)
    .eq("caller_id", userId)
    .eq("status", "ringing")
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function endDmCall(callId, userId) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data: existing, error: readError } = await supabase
    .from("dm_calls")
    .select("*")
    .eq("id", callId)
    .maybeSingle();

  if (readError) throw readError;
  if (!existing) throw new Error("Call not found");
  if (existing.caller_id !== userId && existing.callee_id !== userId) {
    throw new Error("Not your call");
  }
  if (!["ringing", "active"].includes(existing.status)) return existing;

  const { data, error } = await supabase
    .from("dm_calls")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", callId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markDmCallMissed(callId) {
  if (!supabase) return null;
  const { data } = await supabase
    .from("dm_calls")
    .update({ status: "missed", ended_at: new Date().toISOString() })
    .eq("id", callId)
    .eq("status", "ringing")
    .select()
    .maybeSingle();
  return data;
}

export async function loadPendingIncomingCall(userId) {
  if (!supabase || !userId) return null;
  const since = new Date(Date.now() - RING_TIMEOUT_MS).toISOString();
  const { data, error } = await supabase
    .from("dm_calls")
    .select("*")
    .eq("callee_id", userId)
    .eq("status", "ringing")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return isRinging(data) ? data : null;
}

export async function loadActiveCall(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("dm_calls")
    .select("*")
    .eq("status", "active")
    .or(`caller_id.eq.${userId},callee_id.eq.${userId}`)
    .order("answered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
}

/** @returns {() => void} unsubscribe */
export function subscribeDmCalls(userId, { onChange }) {
  if (!supabase || !userId) return () => {};

  const channel = supabase
    .channel(`dm-calls-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "dm_calls" },
      (payload) => {
        const row = payload.new;
        if (row.callee_id === userId || row.caller_id === userId) onChange?.(row);
      },
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "dm_calls" },
      (payload) => {
        const row = payload.new;
        if (row.callee_id === userId || row.caller_id === userId) onChange?.(row);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export { RING_TIMEOUT_MS };
