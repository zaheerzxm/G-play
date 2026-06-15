import { motion } from "framer-motion";
import AvatarImg from "../../components/AvatarImg.jsx";

export default function DDDPlayerList({ players, userId, highlightUserId }) {
  if (!players?.length) {
    return <p className="game-lobby-joined-feed-empty">Waiting for players…</p>;
  }

  return (
    <ul className="ddd-player-list">
      {players.map((p, i) => {
        const isMe = String(p.user_id) === String(userId);
        const isHighlight = highlightUserId && String(p.user_id) === String(highlightUserId);
        return (
          <motion.li
            key={p.user_id}
            className={`ddd-player-item ${isMe ? "ddd-player-item--me" : ""} ${isHighlight ? "ddd-player-item--turn" : ""}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
          >
            <AvatarImg
              src={p.avatar_url}
              fallback={p.nickname || "?"}
              className="ddd-player-avatar ddd-player-avatar--fallback"
              imgClassName="ddd-player-avatar"
            />
            <span className="ddd-player-name">{p.nickname}{isMe ? " (you)" : ""}</span>
          </motion.li>
        );
      })}
    </ul>
  );
}
