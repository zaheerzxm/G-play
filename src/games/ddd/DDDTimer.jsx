import { motion } from "framer-motion";

export default function DDDTimer({ secondsLeft, warning, label }) {
  if (secondsLeft == null) return null;

  return (
    <div className={`ddd-timer ${warning ? "ddd-timer--warn" : ""}`}>
      {label && <span className="ddd-timer-label">{label}</span>}
      <motion.span
        className="ddd-timer-value"
        animate={warning ? { scale: [1, 1.15, 1] } : { scale: 1 }}
        transition={warning ? { repeat: Infinity, duration: 0.8 } : {}}
      >
        {secondsLeft}s
      </motion.span>
    </div>
  );
}
