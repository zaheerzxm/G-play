/** In-room mini games catalog (lobby games removed). */
export const MINI_GAMES = [
  {
    id: "trivia",
    name: "Trivia Battle",
    emoji: "🧠",
    description: "Fast quiz with 4 choices. Highest score wins.",
    players: "2+",
    live: true,
  },
  {
    id: "draw",
    name: "Draw & Guess",
    emoji: "🎨",
    description: "One draws, others guess the word.",
    players: "2+",
    live: true,
  },
  {
    id: "wordle",
    name: "Word Battle",
    emoji: "🎯",
    description: "Multiplayer Wordle — same word, first to solve wins.",
    players: "2+",
    live: true,
  },
  {
    id: "mafia",
    name: "Mafia",
    emoji: "🕵️",
    description: "Social deduction on voice — find the Mafia before it's too late.",
    players: "5-12",
    live: true,
  },
  {
    id: "ddd",
    name: "DDD",
    emoji: "💖",
    description: "Dil, Dimaag, Dustbin — assign heart, brain & trash each turn.",
    players: "3-12",
    live: true,
  },
  {
    id: "uno",
    name: "UNO",
    emoji: "🃏",
    description: "Coming soon",
    players: "2-4",
    live: false,
  },
  {
    id: "ludo",
    name: "Ludo",
    emoji: "🎲",
    description: "Coming soon",
    players: "2-4",
    live: false,
  },
];

export function liveMiniGames() {
  return MINI_GAMES.filter((g) => g.live);
}

export function comingMiniGames() {
  return MINI_GAMES.filter((g) => !g.live);
}

export function getGameById(id) {
  return MINI_GAMES.find((g) => g.id === id) ?? null;
}
