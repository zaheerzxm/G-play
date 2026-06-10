import { motion } from "framer-motion";
import { ROLE_META } from "./constants.js";

export default function MafiaGameOver({ reveal, userId, onPlayAgain, canHost }) {
  const winner = reveal?.winner_team;
  const players = reveal?.players ?? [];

  return (
    <motion.div
      className="mafia-game-over"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mafia-confetti" aria-hidden />
      <h2>{winner === "mafia" ? "🎭 Mafia wins!" : "🏘️ Village wins!"}</h2>
      <ul className="mafia-reveal-list">
        {players.map((p) => {
          const meta = ROLE_META[p.role] ?? {};
          return (
            <li key={p.user_id} className={p.user_id === userId ? "mafia-reveal-row--me" : ""}>
              <span>{meta.emoji}</span>
              <strong>{p.nickname}</strong>
              <em>{meta.label ?? p.role}</em>
              {!p.is_alive && <span className="mafia-reveal-dead">💀</span>}
            </li>
          );
        })}
      </ul>
      {canHost && (
        <button type="button" className="game-btn game-btn--primary game-btn--wide" onClick={onPlayAgain}>
          Play again
        </button>
      )}
    </motion.div>
  );
}
