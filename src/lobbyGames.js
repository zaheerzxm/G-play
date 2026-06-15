import { liveMiniGames } from "./games/catalog.js";

/** sessionStorage key — home lobby tile → auto-select in GameLauncher */
export const PENDING_LOBBY_GAME_KEY = "gplay.pendingGameType";

const GAME_GRADIENTS = {
  trivia: "linear-gradient(135deg, #1a5fd4 0%, #0ea5e9 55%, #38bdf8 100%)",
  draw: "linear-gradient(145deg, #db2777, #f472b6)",
  wordle: "linear-gradient(145deg, #15803d, #4ade80)",
  mafia: "linear-gradient(145deg, #6d28d9, #a78bfa)",
  ddd: "linear-gradient(145deg, #ea580c, #fb923c)",
  uno: "linear-gradient(145deg, #64748b, #94a3b8)",
  ludo: "linear-gradient(145deg, #7c3aed, #c084fc)",
};

function toLobbyTile(game) {
  const tags = { mafia: "HOT", wordle: "NEW", ddd: "GIFT" };
  return {
    id: game.id,
    name: game.name,
    emoji: game.emoji,
    artUrl: null,
    players: game.players,
    gradient: GAME_GRADIENTS[game.id] ?? "linear-gradient(145deg, #6366f1, #8b5cf6)",
    tag: tags[game.id] ?? "LIVE",
  };
}

const live = liveMiniGames();
const featured = live.find((g) => g.id === "mafia") ?? live[0] ?? null;

/** Featured home tile — first-class in-room game. */
export const LOBBY_FEATURED_GAME = featured ? toLobbyTile(featured) : null;

/** 2-column grid of remaining live in-room games. */
export const LOBBY_GAMES_GRID = featured
  ? live.filter((g) => g.id !== featured.id).map(toLobbyTile)
  : live.map(toLobbyTile);

export const ROOM_PROMO_BANNERS = [
  {
    key: "gold",
    title: "Gold Tycoon",
    text: "Recharge Bonus & Surprise Rewards!",
    className: "G-play-room-banner--gold",
  },
  {
    key: "minor",
    title: "Stay safe",
    text: "G-play message to users regarding minor protection.",
    className: "G-play-room-banner--guard",
  },
  {
    key: "party",
    title: "Voice party",
    text: "Create a room and invite friends to play together.",
    className: "G-play-room-banner--party",
  },
];
