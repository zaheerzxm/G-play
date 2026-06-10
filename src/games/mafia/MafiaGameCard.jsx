/** Re-export catalog entry helper for Mafia game card metadata */
import { liveMiniGames } from "../catalog.js";

export function getMafiaGameCard() {
  return liveMiniGames().find((g) => g.id === "mafia") ?? null;
}

export default function MafiaGameCard({ onSelect, picked }) {
  const card = getMafiaGameCard();
  if (!card) return null;
  return (
    <button
      type="button"
      className={`game-card ${picked ? "game-card--picked" : ""}`}
      onClick={() => onSelect?.(card.id)}
    >
      <span className="game-card-emoji">{card.emoji}</span>
      <strong>{card.name}</strong>
      <small>{card.description}</small>
      <em>{card.players} players</em>
    </button>
  );
}
