import { liveMiniGames, marketedComingMiniGames } from "./games/catalog.js";

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
  jackaroo: "linear-gradient(145deg, #0d9488, #5eead4)",
  spy: "linear-gradient(145deg, #1e3a8a, #60a5fa)",
  tricksters: "linear-gradient(145deg, #b45309, #fbbf24)",
  "hide-seek": "linear-gradient(145deg, #0369a1, #38bdf8)",
  "space-werewolf": "linear-gradient(145deg, #312e81, #818cf8)",
  "oh-my-card": "linear-gradient(145deg, #be123c, #fb7185)",
  "mic-grab": "linear-gradient(145deg, #c026d3, #f0abfc)",
  "crazy-alpaca": "linear-gradient(145deg, #65a30d, #bef264)",
};

/** WePlay-style lobby titles not yet wired to in-room mini games. */
export const LOBBY_ONLY_GAMES = [
  {
    id: "spy",
    name: "Who's the Spy",
    emoji: "🕵️",
    players: "4-8",
  },
  {
    id: "tricksters",
    name: "Trickster's Cafe",
    emoji: "☕",
    players: "4-8",
  },
  {
    id: "hide-seek",
    name: "Hide And Seek",
    emoji: "🙈",
    players: "4-10",
  },
  {
    id: "space-werewolf",
    name: "Space Werewolf",
    emoji: "🌙",
    players: "6-12",
  },
  {
    id: "oh-my-card",
    name: "Oh My Card",
    emoji: "🃏",
    players: "3-8",
  },
  {
    id: "mic-grab",
    name: "Mic Grab",
    emoji: "🎤",
    players: "2+",
  },
  {
    id: "crazy-alpaca",
    name: "Crazy Alpaca",
    emoji: "🦙",
    players: "2-6",
  },
];

function toLiveLobbyTile(game) {
  const tags = { mafia: "HOT", wordle: "NEW", ddd: "GIFT" };
  return {
    id: game.id,
    name: game.name,
    emoji: game.emoji,
    artUrl: null,
    players: game.players,
    gradient: GAME_GRADIENTS[game.id] ?? "linear-gradient(145deg, #6366f1, #8b5cf6)",
    tag: tags[game.id] ?? "LIVE",
    comingSoon: false,
  };
}

function toComingLobbyTile(game) {
  return {
    id: game.id,
    name: game.name,
    emoji: game.emoji,
    artUrl: null,
    players: game.players,
    gradient: GAME_GRADIENTS[game.id] ?? "linear-gradient(145deg, #64748b, #94a3b8)",
    tag: "SOON",
    comingSoon: true,
  };
}

const live = liveMiniGames();
const featured = live.find((g) => g.id === "mafia") ?? live[0] ?? null;

/** Featured home tile — first-class in-room game. */
export const LOBBY_FEATURED_GAME = featured ? toLiveLobbyTile(featured) : null;

/** 2-column grid of remaining live in-room games. */
export const LOBBY_GAMES_GRID = featured
  ? live.filter((g) => g.id !== featured.id).map(toLiveLobbyTile)
  : live.map(toLiveLobbyTile);

/** Coming-soon tiles — marketed catalog stubs + WePlay lobby-only titles. */
export const LOBBY_COMING_GAMES_GRID = [
  ...marketedComingMiniGames().map(toComingLobbyTile),
  ...LOBBY_ONLY_GAMES.map(toComingLobbyTile),
];

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
