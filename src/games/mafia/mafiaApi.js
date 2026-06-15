import { supabase } from "../../supabase.js";

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

export async function fetchActiveMafiaGame(roomId) {
  const sb = requireClient();
  const { data, error } = await sb.rpc("get_active_mafia_game", { p_room_id: roomId });
  if (error) throw error;
  return data ?? null;
}

export async function fetchPublicState(gameId) {
  const sb = requireClient();
  const { data, error } = await sb.rpc("get_mafia_public_state", { p_game_id: gameId });
  if (error) throw error;
  return data;
}

export async function fetchPrivateState(gameId) {
  const sb = requireClient();
  const { data, error } = await sb.rpc("get_my_mafia_private_state", { p_game_id: gameId });
  if (error) throw error;
  return data ?? {};
}

export async function fetchGameReveal(gameId) {
  const sb = requireClient();
  const { data, error } = await sb.rpc("get_mafia_game_reveal", { p_game_id: gameId });
  if (error) throw error;
  return data;
}

export async function createMafiaGame(roomId, settings = {}) {
  const sb = requireClient();
  const { data, error } = await sb.rpc("create_mafia_game", {
    p_room_id: roomId,
    p_day_seconds: settings.daySeconds ?? 90,
    p_voting_seconds: settings.votingSeconds ?? 10,
    p_night_seconds: settings.nightSeconds ?? 45,
    p_reveal_on_death: settings.revealOnDeath ?? false,
    p_allow_dead_chat: settings.allowDeadChat ?? true,
    p_nickname: settings.nickname ?? "Host",
  });
  if (error) throw error;
  return data;
}

export async function joinMafiaGame(gameId, { nickname, avatarUrl, seatNumber }) {
  const sb = requireClient();
  const { error } = await sb.rpc("join_mafia_game", {
    p_game_id: gameId,
    p_nickname: nickname,
    p_avatar_url: avatarUrl ?? null,
    p_seat_number: seatNumber ?? null,
  });
  if (error) throw error;
}

export async function leaveMafiaGame(gameId) {
  const sb = requireClient();
  const { error } = await sb.rpc("leave_mafia_game", { p_game_id: gameId });
  if (error) throw error;
}

export async function setMafiaReady(gameId, ready = true) {
  const sb = requireClient();
  const { error } = await sb.rpc("set_mafia_ready", { p_game_id: gameId, p_ready: ready });
  if (error) throw error;
}

export async function startMafiaGame(gameId) {
  const sb = requireClient();
  const { error } = await sb.rpc("start_mafia_game", { p_game_id: gameId });
  if (error) throw error;
}

export async function endMafiaGame(gameId) {
  const sb = requireClient();
  const { error } = await sb.rpc("end_mafia_game", { p_game_id: gameId });
  if (error) throw error;
}

/** Stop any active Mafia lobby/game in this room (host, room owner, or admin). */
export async function endActiveMafiaGameForRoom(roomId) {
  const sb = requireClient();
  const { data, error } = await sb.rpc("end_active_mafia_game_for_room", { p_room_id: roomId });
  if (error) throw error;
  return data ?? null;
}

export async function kickMafiaPlayer(gameId, targetUserId) {
  const sb = requireClient();
  const { error } = await sb.rpc("kick_mafia_player", {
    p_game_id: gameId,
    p_target_user_id: targetUserId,
  });
  if (error) throw error;
}

export async function submitMafiaKill(gameId, targetUserId) {
  const sb = requireClient();
  const { error } = await sb.rpc("submit_mafia_action", {
    p_game_id: gameId,
    p_target_user_id: targetUserId,
  });
  if (error) throw error;
}

export async function submitDoctorSave(gameId, targetUserId) {
  const sb = requireClient();
  const { error } = await sb.rpc("submit_doctor_action", {
    p_game_id: gameId,
    p_target_user_id: targetUserId,
  });
  if (error) throw error;
}

export async function submitDetectiveCheck(gameId, targetUserId) {
  const sb = requireClient();
  const { error } = await sb.rpc("submit_detective_action", {
    p_game_id: gameId,
    p_target_user_id: targetUserId,
  });
  if (error) throw error;
}

export async function submitDayVote(gameId, targetUserId) {
  const sb = requireClient();
  const { error } = await sb.rpc("submit_day_vote", {
    p_game_id: gameId,
    p_target_user_id: targetUserId,
  });
  if (error) throw error;
}

export async function advanceMafiaPhaseIfDue(gameId) {
  const sb = requireClient();
  const { error } = await sb.rpc("advance_mafia_phase_if_due", { p_game_id: gameId });
  if (error) throw error;
}
