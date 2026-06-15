import { motion } from "framer-motion";

function badge(emoji, title, entry) {
  if (!entry || entry === null) return null;
  return (
    <motion.div
      className="ddd-summary-badge"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span>{emoji}</span>
      <div>
        <small>{title}</small>
        <strong>{entry.nickname || "—"} — {entry.count ?? 0}</strong>
      </div>
    </motion.div>
  );
}

function nick(players, uid) {
  const p = players?.find((x) => String(x.user_id) === String(uid));
  return p?.nickname ?? "Player";
}

export default function DDDRoundSummary({ summary, roundNumber, players, canManage, onNextRound, onEnd }) {
  if (!summary) return null;

  return (
    <div className="ddd-round-summary">
      <h2>Round {roundNumber} Summary</h2>
      <div className="ddd-summary-badges">
        {badge("❤️", "Most Dil", summary.mostDil)}
        {badge("🧠", "Most Dimaag", summary.mostDimaag)}
        {badge("🗑️", "Most Dustbin", summary.mostDustbin)}
        {badge("🔥", "Most Targeted", summary.mostTargeted)}
      </div>

      {summary.turns?.length > 0 && (
        <ul className="ddd-summary-turns">
          {summary.turns.map((t) => (
            <li key={t.id}>
              <strong>{nick(players, t.actor_user_id)}</strong>
              <span>❤️ {t.dil_name}</span>
              <span>🧠 {t.dimaag_name}</span>
              <span>🗑️ {t.dustbin_name}</span>
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <div className="ddd-host-actions">
          <button type="button" className="game-btn game-btn--primary game-btn--wide" onClick={onNextRound}>
            Start next round
          </button>
          <button type="button" className="game-btn game-btn--ghost game-btn--wide" onClick={onEnd}>
            End game
          </button>
        </div>
      )}
    </div>
  );
}
