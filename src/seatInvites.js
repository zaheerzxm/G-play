import { supabase } from "./supabase.js";
import { leaveWaitingQueue } from "./waitingQueue.js";

/** Must stay in sync with accept_seat_invite RPC freshness window. */
const INVITE_TTL_MS = 30_000;

function inviteFreshSince() {
  return new Date(Date.now() - INVITE_TTL_MS).toISOString();
}

export async function sendSeatInvite({ roomId, seatNumber, inviteeId, inviterId, inviterName }) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("seat_invites").upsert(
    {
      room_id: roomId,
      seat_number: seatNumber,
      invitee_id: inviteeId,
      inviter_id: inviterId,
      inviter_name: inviterName,
      status: "pending",
      created_at: new Date().toISOString(),
    },
    { onConflict: "room_id,invitee_id" },
  );
  if (error) throw error;
}

export async function loadPendingSeatInvite(roomId, inviteeId) {
  if (!supabase || !roomId || !inviteeId) return null;
  const { data, error } = await supabase
    .from("seat_invites")
    .select("*")
    .eq("room_id", roomId)
    .eq("invitee_id", inviteeId)
    .eq("status", "pending")
    .gte("created_at", inviteFreshSince())
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function loadPendingInvitesForRoom(roomId) {
  if (!supabase || !roomId) return {};
  const { data, error } = await supabase
    .from("seat_invites")
    .select("invitee_id, seat_number, inviter_name, created_at")
    .eq("room_id", roomId)
    .eq("status", "pending")
    .gte("created_at", inviteFreshSince());
  if (error) return {};
  const map = {};
  for (const row of data ?? []) {
    map[row.invitee_id] = row;
  }
  return map;
}

export async function rejectSeatInvite(roomId, inviteeId) {
  if (!supabase) return;
  await supabase
    .from("seat_invites")
    .update({ status: "rejected" })
    .eq("room_id", roomId)
    .eq("invitee_id", inviteeId)
    .eq("status", "pending");
}

export async function cancelSeatInvite(roomId, inviteeId) {
  if (!supabase) return;
  await supabase
    .from("seat_invites")
    .delete()
    .eq("room_id", roomId)
    .eq("invitee_id", inviteeId)
    .eq("status", "pending");
}

async function acceptSeatInviteViaRpc({ roomId, seatNumber, inviteeId, displayName }) {
  const { data, error } = await supabase.rpc("accept_seat_invite", {
    p_room_id: roomId,
    p_invitee_id: inviteeId,
    p_display_name: displayName,
    p_seat_number: seatNumber ?? null,
  });
  if (error) throw error;
  const seat = Number(data?.seat_number ?? data?.seatNumber ?? seatNumber);
  if (!seat) throw new Error("Seat was just taken by someone else");
  return { seatNumber: seat };
}

export async function acceptSeatInvite({ roomId, seatNumber, inviteeId, displayName }) {
  if (!supabase) throw new Error("Supabase is not configured");

  try {
    const accepted = await acceptSeatInviteViaRpc({ roomId, seatNumber, inviteeId, displayName });
    await leaveWaitingQueue(roomId, inviteeId).catch(() => {});
    return accepted;
  } catch (rpcError) {
    if (!/accept_seat_invite|function .* does not exist/i.test(rpcError?.message ?? "")) {
      throw rpcError;
    }
  }

  const { data: invite, error: inviteError } = await supabase
    .from("seat_invites")
    .select("room_id, invitee_id, seat_number")
    .eq("room_id", roomId)
    .eq("invitee_id", inviteeId)
    .eq("status", "pending")
    .gte("created_at", inviteFreshSince())
    .maybeSingle();
  if (inviteError) throw inviteError;
  if (!invite) throw new Error("Invite expired");
  const invitedSeatNumber = Number(invite.seat_number || seatNumber);

  const { data: seat, error: seatError } = await supabase
    .from("seats")
    .select("user_id, is_locked, mic_on")
    .eq("room_id", roomId)
    .eq("seat_number", invitedSeatNumber)
    .maybeSingle();
  if (seatError) throw seatError;
  if (!seat) throw new Error("Seat not found");
  if (seat.is_locked) throw new Error("This seat is locked");
  if (seat.user_id && seat.user_id !== inviteeId) throw new Error("Seat was just taken");

  const { data: priorSeat } = await supabase
    .from("seats")
    .select("mic_on")
    .eq("room_id", roomId)
    .eq("user_id", inviteeId)
    .maybeSingle();
  const keepMicOn = priorSeat?.mic_on !== false;

  await supabase
    .from("seats")
    .update({ user_id: null, nickname: null, updated_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("user_id", inviteeId);

  const { data, error: updateError } = await supabase
    .from("seats")
    .update({
      user_id: inviteeId,
      nickname: displayName,
      mic_on: keepMicOn,
      updated_at: new Date().toISOString(),
    })
    .eq("room_id", roomId)
    .eq("seat_number", invitedSeatNumber)
    .is("user_id", null)
    .select("seat_number");
  if (updateError) throw updateError;
  if (!data?.length) throw new Error("Seat was just taken by someone else");

  await supabase
    .from("seat_invites")
    .update({ status: "accepted" })
    .eq("room_id", roomId)
    .eq("invitee_id", inviteeId)
    .eq("status", "pending");

  await leaveWaitingQueue(roomId, inviteeId).catch(() => {});
  return { seatNumber: invitedSeatNumber };
}
