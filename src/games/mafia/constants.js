export const MAFIA_MIN_PLAYERS = 5;
export const MAFIA_MAX_PLAYERS = 12;

export const MAFIA_PHASES = {
  LOBBY: "lobby",
  ROLE_REVEAL: "role_reveal",
  NIGHT: "night",
  NIGHT_RESULT: "night_result",
  DAY: "day",
  VOTING: "voting",
  GAME_OVER: "game_over",
};

export const ROLE_META = {
  mafia: { label: "Mafia", emoji: "🎭", cardClass: "mafia-role-card--mafia" },
  doctor: { label: "Doctor", emoji: "💉", cardClass: "mafia-role-card--doctor" },
  detective: { label: "Detective", emoji: "🔍", cardClass: "mafia-role-card--detective" },
  villager: { label: "Villager", emoji: "🏘️", cardClass: "mafia-role-card--villager" },
};

export const PHASE_LABELS = {
  lobby: "Lobby",
  role_reveal: "Role reveal",
  night: "Night",
  night_result: "Night result",
  day: "Day discussion",
  voting: "Voting",
  game_over: "Game over",
};
