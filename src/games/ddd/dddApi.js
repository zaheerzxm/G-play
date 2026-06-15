import { supabase } from "../../supabase.js";

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

export async function fetchActiveDDDGame(roomId) {
  const sb = requireClient();
  const { data, error } = await sb.rpc("get_active_ddd_game", { p_room_id: roomId });
  if (error) throw error;
  return data ?? null;
}

export async function fetchDDDPublicState(gameId) {
  const sb = requireClient();
  const { data, error } = await sb.rpc("get_ddd_public_state", { p_game_id: gameId });
  if (error) throw error;
  return data;
}

export async function createDDDGame(roomId) {
  const sb = requireClient();
  const { data, error } = await sb.rpc("create_ddd_game", { p_room_id: roomId });
  if (error) throw error;
  return data;
}

export async function joinDDDGame(gameId, { nickname, avatarUrl, seatNumber }) {
  const sb = requireClient();
  const { error } = await sb.rpc("join_ddd_game", {
    p_game_id: gameId,
    p_nickname: nickname,
    p_avatar_url: avatarUrl ?? null,
    p_seat_number: seatNumber ?? null,
  });
  if (error) throw error;
}

export async function leaveDDDGame(gameId) {
  const sb = requireClient();
  const { error } = await sb.rpc("leave_ddd_game", { p_game_id: gameId });
  if (error) throw error;
}

export async function startDDDGame(gameId) {
  const sb = requireClient();
  const { error } = await sb.rpc("start_ddd_game", { p_game_id: gameId });
  if (error) throw error;
}

export async function endDDDGame(gameId) {
  const sb = requireClient();
  const { error } = await sb.rpc("end_ddd_game", { p_game_id: gameId });
  if (error) throw error;
}

export async function endActiveDDDGameForRoom(roomId) {
  const sb = requireClient();
  const { data, error } = await sb.rpc("end_active_ddd_game_for_room", { p_room_id: roomId });
  if (error) throw error;
  return data ?? null;
}

export async function submitDDDTurn(gameId, picks) {
  const sb = requireClient();
  const { data, error } = await sb.rpc("submit_ddd_turn", {
    p_game_id: gameId,
    p_dil_user_id: picks.dilUserId ?? null,
    p_dimaag_user_id: picks.dimaagUserId ?? null,
    p_dustbin_user_id: picks.dustbinUserId ?? null,
    p_dil_name: picks.dilName ?? null,
    p_dimaag_name: picks.dimaagName ?? null,
    p_dustbin_name: picks.dustbinName ?? null,
  });
  if (error) throw error;
  return data;
}

export async function advanceDDDPhaseIfDue(gameId) {
  const sb = requireClient();
  const { error } = await sb.rpc("advance_ddd_phase_if_due", { p_game_id: gameId });
  if (error) throw error;
}

export async function startDDDNextRound(gameId) {
  const sb = requireClient();
  const { error } = await sb.rpc("start_ddd_next_round", { p_game_id: gameId });
  if (error) throw error;
}

export async function addDDDReaction(gameId, turnId, reactionType) {
  const sb = requireClient();
  const { error } = await sb.rpc("add_ddd_reaction", {
    p_game_id: gameId,
    p_turn_id: turnId,
    p_reaction_type: reactionType,
  });
  if (error) throw error;
}
