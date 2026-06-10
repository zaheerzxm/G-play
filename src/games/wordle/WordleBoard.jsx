import { motion } from "framer-motion";

const TILE_STATE = {
  correct: "wordle-tile--correct",
  present: "wordle-tile--present",
  absent: "wordle-tile--absent",
};

function Tile({ letter, state, revealDelay = 0 }) {
  const revealed = Boolean(state);
  return (
    <motion.div
      className={`wordle-tile ${revealed ? TILE_STATE[state] : ""} ${letter && !revealed ? "wordle-tile--filled" : ""}`}
      initial={false}
      animate={{
        scale: revealed ? [1, 1.06, 1] : 1,
      }}
      transition={{
        scale: { delay: revealDelay, duration: 0.28, ease: "easeOut" },
      }}
    >
      <span className="wordle-tile-letter">{letter}</span>
    </motion.div>
  );
}

function HintLegend() {
  return (
    <div className="wordle-hint-legend" aria-label="Color hint legend">
      <span className="wordle-hint-legend-item">
        <span className="wordle-hint-swatch wordle-hint-swatch--correct" aria-hidden />
        Right spot
      </span>
      <span className="wordle-hint-legend-item">
        <span className="wordle-hint-swatch wordle-hint-swatch--present" aria-hidden />
        Wrong spot
      </span>
      <span className="wordle-hint-legend-item">
        <span className="wordle-hint-swatch wordle-hint-swatch--absent" aria-hidden />
        Not in word
      </span>
    </div>
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
            letter={ch.trim() ? ch.toUpperCase() : ""}
            state={g?.result?.[j]}
            revealDelay={g ? j * 0.09 : 0}
          />
        ))}
      </motion.div>,
    );
  }

  return (
    <div className="wordle-board-wrap">
      <div className="wordle-board">{rows}</div>
      <HintLegend />
      {celebrate && <p className="wordle-board-win">Solved!</p>}
    </div>
  );
}
