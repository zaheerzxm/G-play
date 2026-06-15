import { motion } from "framer-motion";
import AvatarImg from "../../components/AvatarImg.jsx";
import DDDTimer from "./DDDTimer.jsx";

export default function DDDTurnHeader({ actor, phase, secondsLeft, warning, isMyTurn }) {
  if (!actor) return null;

  const compact = isMyTurn && phase === "input";
  const title = phase === "turn_start"
    ? `${actor.nickname}'s turn`
    : isMyTurn
      ? (compact ? "Your turn — pick 3 players" : "Your turn — pick Dil, Dimaag & Dustbin")
      : `${actor.nickname} is choosing…`;

  return (
    <header className={`ddd-turn-header ${compact ? "ddd-turn-header--compact" : ""}`}>
      <motion.div
        className="ddd-turn-spotlight"
        animate={{ scale: phase === "turn_start" ? [1, 1.08, 1] : 1 }}
        transition={{ repeat: phase === "turn_start" ? Infinity : 0, duration: 1.2 }}
      >
        <AvatarImg
          src={actor.avatar_url}
          fallback={actor.nickname}
          className="ddd-turn-avatar ddd-turn-avatar--fallback"
          imgClassName="ddd-turn-avatar"
        />
      </motion.div>
      <div className="ddd-turn-copy">
        <h2 className="ddd-turn-title">{title}</h2>
        <DDDTimer secondsLeft={secondsLeft} warning={warning} />
      </div>
    </header>
  );
}
