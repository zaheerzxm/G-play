import { supabase } from "./supabase.js";
import { liveMiniGames } from "./games/catalog.js";

const LOCAL_KEY = "gplay.gameStats";

function emptyRow() {
  return { wins: 0, played: 0, winRate: 0 };
}

function withRate(wins, played) {
  const w = Math.max(0, Number(wins) || 0);
  const p = Math.max(0, Number(played) || 0);
  return { wins: w, played: p, winRate: p > 0 ? Math.round((w / p) * 100) : 0 };
}

function readLocalGameStats(userId) {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(`${LOCAL_KEY}.${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Load per-game win stats for Stats sheet (Wordle from DB + local cache for others). */
export async function loadUserGameStats(userId) {
  const local = readLocalGameStats(userId);
  const stats = {};

  for (const game of liveMiniGames()) {
    stats[game.id] = withRate(local[game.id]?.wins, local[game.id]?.played);
  }

  if (supabase && userId) {
    const { data } = await supabase
      .from("wordle_player_stats")
      .select("games_won, games_played")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      stats.wordle = withRate(data.games_won, data.games_played);
    }
  }

  return stats;
}

export function recordLocalGameResult(userId, gameId, won) {
  if (!userId || !gameId) return;
  const local = readLocalGameStats(userId);
  const cur = local[gameId] ?? emptyRow();
  const played = Number(cur.played ?? 0) + 1;
  const wins = Number(cur.wins ?? 0) + (won ? 1 : 0);
  local[gameId] = withRate(wins, played);
  try {
    localStorage.setItem(`${LOCAL_KEY}.${userId}`, JSON.stringify(local));
  } catch {
    /* ignore quota */
  }
}
