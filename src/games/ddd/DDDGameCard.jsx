import { MINI_GAMES } from "../catalog.js";

export function getDDDGameCard() {
  return MINI_GAMES.find((g) => g.id === "ddd") ?? {
    id: "ddd",
    name: "DDD",
    emoji: "❤️🧠🗑️",
    description: "Dil, Dimaag, Dustbin",
  };
}

export default function DDDGameCard({ selected, onSelect, disabled }) {
  const game = getDDDGameCard();
  return (
    <button
      type="button"
      className={`game-card ${selected ? "game-card--picked" : ""}`}
      disabled={disabled}
      onClick={onSelect}
    >
      <span className="game-card-emoji">{game.emoji}</span>
      <strong>{game.name}</strong>
      <small>{game.description}</small>
    </button>
  );
}
