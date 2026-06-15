import { motion } from "framer-motion";
import AvatarImg from "../../components/AvatarImg.jsx";
import { DDD_CATEGORIES } from "./constants.js";

export default function DDDCategorySlot({ category, player, onClick, active }) {
  const meta = DDD_CATEGORIES[category];

  return (
    <motion.button
      type="button"
      className={`ddd-slot ${meta.className} ${active ? "ddd-slot--active" : ""} ${player ? "ddd-slot--filled" : ""}`}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      animate={active ? { boxShadow: ["0 0 0 rgba(255,255,255,0)", "0 0 24px rgba(255,255,255,0.25)", "0 0 0 rgba(255,255,255,0)"] } : {}}
      transition={{ repeat: active ? Infinity : 0, duration: 1.5 }}
    >
      <span className="ddd-slot-emoji">{meta.emoji}</span>
      <strong>{meta.label}</strong>
      {player ? (
        <div className="ddd-slot-pick">
          <AvatarImg
            src={player.avatar_url}
            fallback={player.nickname}
            className="ddd-slot-avatar ddd-slot-avatar--fallback"
            imgClassName="ddd-slot-avatar"
          />
          <span>{player.nickname}</span>
        </div>
      ) : (
        <span className="ddd-slot-empty">Tap to pick</span>
      )}
    </motion.button>
  );
}
