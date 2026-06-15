export const DDD_MIN_PLAYERS = 3;
export const DDD_MAX_PLAYERS = 12;
export const DDD_TURN_SECONDS = 60;
export const DDD_TURN_START_SECONDS = 3;
export const DDD_REVEAL_SECONDS = 2;
export const DDD_TURN_RESULT_SECONDS = 5;

export const DDD_PHASES = {
  LOBBY: "lobby",
  TURN_START: "turn_start",
  INPUT: "input",
  REVEAL_DIL: "reveal_dil",
  REVEAL_DIMAAG: "reveal_dimaag",
  REVEAL_DUSTBIN: "reveal_dustbin",
  TURN_RESULT: "turn_result",
  ROUND_END: "round_end",
  GAME_OVER: "game_over",
};

export const DDD_CATEGORIES = {
  dil: { emoji: "❤️", label: "Dil", className: "ddd-cat--dil" },
  dimaag: { emoji: "🧠", label: "Dimaag", className: "ddd-cat--dimaag" },
  dustbin: { emoji: "🗑️", label: "Dustbin", className: "ddd-cat--dustbin" },
};

export const DDD_REACTIONS = [
  { id: "heart", emoji: "❤️", label: "Heart" },
  { id: "laugh", emoji: "😂", label: "Laugh" },
  { id: "shock", emoji: "😱", label: "Shock" },
  { id: "fire", emoji: "🔥", label: "Fire" },
];
