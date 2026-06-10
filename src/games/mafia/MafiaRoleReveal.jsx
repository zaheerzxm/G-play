import { motion } from "framer-motion";
import { ROLE_META } from "./constants.js";

export default function MafiaRoleReveal({ role, teammates = [] }) {
  const meta = ROLE_META[role] ?? { label: role, emoji: "❓", cardClass: "" };

  return (
    <motion.div
      className="mafia-role-reveal"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <p className="mafia-role-reveal-hint">Your secret role</p>
      <motion.div
        className={`mafia-role-card ${meta.cardClass}`}
        initial={{ rotateY: 180 }}
        animate={{ rotateY: 0 }}
        transition={{ duration: 0.55 }}
      >
        <span className="mafia-role-card-emoji">{meta.emoji}</span>
        <strong>{meta.label}</strong>
      </motion.div>
      {role === "mafia" && teammates.length > 0 && (
        <div className="mafia-mafia-team">
          <p>Your Mafia teammates:</p>
          <ul>
            {teammates.map((t) => (
              <li key={t.user_id}>{t.nickname}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
