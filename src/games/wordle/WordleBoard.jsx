import { motion } from "framer-motion";

const TILE_STATE = {
  correct: "wordle-tile--correct",
  present: "wordle-tile--present",
  absent: "wordle-tile--absent",
};

function Tile({ letter, state, flipDelay = 0, pop = false }) {
  return (
    <motion.div
      className={`wordle-tile ${state ? TILE_STATE[state] : ""} ${letter && !state ? "wordle-tile--filled" : ""}`}
      initial={false}
      animate={{
        scale: pop ? [1, 1.12, 1] : 1,
        rotateX: state ? [0, 90, 0] : 0,
      }}
      transition={{
        scale: { duration: 0.35, ease: "easeOut" },
        rotateX: { delay: flipDelay, duration: 0.45, ease: "easeInOut" },
      }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <span>{letter}</span>
    </motion.div>
  );
}

export default function WordleBoard({
  guesses = [],
  currentGuess = "",
  maxAttempts = 6,
  wordLength = 5,
  shake = false,
  celebrate = false,
}) {
  const rows = [];
  for (let i = 0; i < maxAttempts; i += 1) {
    const g = guesses[i];
    const isCurrent = i === guesses.length && currentGuess;
    const letters = g
      ? g.guess.split("")
      : isCurrent
        ? currentGuess.padEnd(wordLength, " ").split("").slice(0, wordLength)
        : Array(wordLength).fill("");

    rows.push(
      <motion.div
        key={i}
        className="wordle-row"
        animate={shake && i === guesses.length ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
      >
        {letters.map((ch, j) => (
          <Tile
            key={`${i}-${j}`}
            letter={ch.trim() ? ch : ""}
            state={g?.result?.[j]}
            flipDelay={g ? j * 0.08 : 0}
            pop={celebrate && g && g.result?.every((r) => r === "correct")}
          />
        ))}
      </motion.div>,
    );
  }

  return <div className="wordle-board">{rows}</div>;
}
