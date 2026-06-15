import { motion } from "framer-motion";
import AvatarImg from "../../components/AvatarImg.jsx";

function pickPlayer(players, userId, name) {
  if (!userId) return { nickname: name || "Skipped", avatar_url: null };
  const p = players?.find((x) => String(x.user_id) === String(userId));
  return p ?? { nickname: name || "Skipped", avatar_url: null };
}

export default function DDDRevealAnimation({ phase, currentTurn, players, actor }) {
  if (!currentTurn || !phase?.startsWith("reveal_")) return null;

  const category = phase.replace("reveal_", "");
  const map = {
    dil: { emoji: "❤️", label: "Dil", icon: "heart", userId: currentTurn.dil_user_id, name: currentTurn.dil_name },
    dimaag: { emoji: "🧠", label: "Dimaag", icon: "brain", userId: currentTurn.dimaag_user_id, name: currentTurn.dimaag_name },
    dustbin: { emoji: "🗑️", label: "Dustbin", icon: "bin", userId: currentTurn.dustbin_user_id, name: currentTurn.dustbin_name },
  };
  const cfg = map[category];
  if (!cfg) return null;

  const picked = pickPlayer(players, cfg.userId, cfg.name);

  return (
    <div className={`ddd-reveal ddd-reveal--${category}`}>
      <p className="ddd-reveal-actor">{actor?.nickname} chose…</p>
      <motion.div
        className={`ddd-reveal-icon ddd-reveal-icon--${cfg.icon}`}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <span className="ddd-reveal-emoji">{cfg.emoji}</span>
        <strong>{cfg.label}</strong>
      </motion.div>

      <motion.div
        className="ddd-reveal-fly"
        initial={{ y: -80, opacity: 0, scale: 0.6 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.3 }}
      >
        <AvatarImg
          src={picked.avatar_url}
          fallback={picked.nickname}
          className="ddd-reveal-avatar ddd-reveal-avatar--fallback"
          imgClassName="ddd-reveal-avatar"
        />
        <span>{picked.nickname}</span>
      </motion.div>

      {category === "dustbin" && (
        <motion.div
          className="ddd-reveal-smoke"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.2, 1.4] }}
          transition={{ duration: 1.2, delay: 0.5 }}
        />
      )}
    </div>
  );
}
