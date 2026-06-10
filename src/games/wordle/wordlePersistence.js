import { supabase } from "../../supabase.js";

export async function ensureWordleGameRecord({ gameId, roomId, hostId, roundNumber, secretWord, status }) {
  if (!supabase || !gameId || !roomId) return null;
  const { data, error } = await supabase
    .from("wordle_games")
    .upsert(
      {
        id: gameId,
        room_id: roomId,
        host_id: hostId ?? null,
        secret_word: secretWord ?? "",
        status: status ?? "active",
        round_number: roundNumber ?? 1,
        started_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("id")
    .single();
  if (error) console.warn("wordle_games upsert", error.message);
  return data?.id ?? gameId;
}

export async function syncWordlePlayerRow({
  gameId,
  userId,
  nickname,
  attemptsUsed,
  solved,
  solveTimeMs,
  score,
  rank,
}) {
  if (!supabase || !gameId || !userId) return;
  const { error } = await supabase.from("wordle_players").upsert(
    {
      game_id: gameId,
      user_id: userId,
      nickname: nickname ?? null,
      attempts_used: attemptsUsed ?? 0,
      solved: Boolean(solved),
      solve_time_ms: solveTimeMs ?? null,
      score: score ?? 0,
      rank: rank ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "game_id,user_id" },
  );
  if (error) console.warn("wordle_players upsert", error.message);
}

export async function insertWordleGuess({ gameId, userId, guess, result }) {
  if (!supabase || !gameId || !userId) return;
  const { error } = await supabase.from("wordle_guesses").insert({
    game_id: gameId,
    user_id: userId,
    guess,
    result,
  });
  if (error) console.warn("wordle_guesses insert", error.message);
}

export async function finishWordleGameRecord({ gameId, status, secretWord }) {
  if (!supabase || !gameId) return;
  const { error } = await supabase
    .from("wordle_games")
    .update({
      status: status ?? "finished",
      secret_word: secretWord ?? undefined,
      ended_at: new Date().toISOString(),
    })
    .eq("id", gameId);
  if (error) console.warn("wordle_games finish", error.message);
}

export async function bumpWordleStats({ userId, wonRound, wonGame, attemptsUsed, solveTimeMs, solved }) {
  if (!supabase || !userId) return;
  const { data: row } = await supabase
    .from("wordle_player_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const gamesPlayed = (row?.games_played ?? 0) + (wonGame ? 0 : 0);
  const next = {
    user_id: userId,
    games_played: (row?.games_played ?? 0) + (wonGame ? 1 : 0),
    games_won: (row?.games_won ?? 0) + (wonGame ? 1 : 0),
    rounds_won: (row?.rounds_won ?? 0) + (wonRound ? 1 : 0),
    current_streak: wonRound ? (row?.current_streak ?? 0) + 1 : 0,
    best_streak: Math.max(row?.best_streak ?? 0, wonRound ? (row?.current_streak ?? 0) + 1 : 0),
    total_attempts: (row?.total_attempts ?? 0) + (attemptsUsed ?? 0),
    total_solve_ms: (row?.total_solve_ms ?? 0) + (solveTimeMs ?? 0),
    rounds_solved: (row?.rounds_solved ?? 0) + (solved ? 1 : 0),
    updated_at: new Date().toISOString(),
  };

  if (!wonGame && !row) next.games_played = 1;

  const { error } = await supabase.from("wordle_player_stats").upsert(next, { onConflict: "user_id" });
  if (error) console.warn("wordle_player_stats", error.message);
}

export function subscribeWordlePlayers(gameId, onChange) {
  if (!supabase || !gameId) return () => {};
  const channel = supabase
    .channel(`wordle-players:${gameId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "wordle_players", filter: `game_id=eq.${gameId}` },
      (payload) => onChange?.(payload),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function fetchWordleLeaderboard(scope = "all", roomId = null, limit = 20) {
  if (!supabase) return [];
  if (scope === "room" && roomId) {
    const { data: games } = await supabase
      .from("wordle_games")
      .select("id")
      .eq("room_id", roomId)
      .order("started_at", { ascending: false })
      .limit(30);
    const ids = (games ?? []).map((g) => g.id);
    if (!ids.length) return [];
    const { data } = await supabase
      .from("wordle_players")
      .select("user_id, nickname, score, rank, solved, attempts_used")
      .in("game_id", ids)
      .order("score", { ascending: false })
      .limit(limit);
    return data ?? [];
  }

  if (scope === "daily") {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("wordle_player_stats")
      .select("user_id, games_won, rounds_won, current_streak, best_streak")
      .gte("updated_at", since.toISOString())
      .order("rounds_won", { ascending: false })
      .limit(limit);
    return data ?? [];
  }

  const { data } = await supabase
    .from("wordle_player_stats")
    .select("user_id, games_won, rounds_won, best_streak, games_played")
    .order("games_won", { ascending: false })
    .limit(limit);
  return data ?? [];
}
