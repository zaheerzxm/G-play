import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WordleBoard from "./WordleBoard.jsx";
import {
  ensureWordleGameRecord,
  finishWordleGameRecord,
  insertWordleGuess,
  subscribeWordlePlayers,
  syncWordlePlayerRow,
} from "./wordlePersistence.js";

const RANK_EMOJI = ["🥇", "🥈", "🥉"];

function CountdownOverlay({ value }) {
  if (value == null || value < 0) return null;
  const label = value === 0 ? "GO!" : String(value);
  return (
    <motion.div
      className="wordle-countdown-overlay"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      key={label}
    >
      <span className="wordle-countdown-num">{label}</span>
    </motion.div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="wordle-confetti" aria-hidden>
      {pieces.map((i) => (
        <motion.span
          key={i}
          className="wordle-confetti-piece"
          initial={{ y: -20, x: `${(i % 12) * 8 + 4}%`, opacity: 1, rotate: 0 }}
          animate={{ y: "120%", rotate: 360 + i * 20, opacity: 0 }}
          transition={{ duration: 1.8 + (i % 5) * 0.1, ease: "easeOut" }}
          style={{ background: `hsl(${(i * 37) % 360} 85% 60%)` }}
        />
      ))}
    </div>
  );
}

export default function WordBattleGame({
  roomId,
  userId,
  gameState,
  canHost,
  spectator = false,
  draftGuess = "",
  onStartNextRound,
}) {
  const [livePlayers, setLivePlayers] = useState([]);
  const [shakeRow, setShakeRow] = useState(false);
  const prevGuessCountRef = useRef(0);
  const shakeLenRef = useRef(0);

  const phase = gameState?.phase ?? "waiting";
  const maxAttempts = gameState?.maxAttempts ?? 6;
  const myGuesses = gameState?.myGuesses ?? [];

  useEffect(() => {
    shakeLenRef.current = 0;
    prevGuessCountRef.current = 0;
  }, [gameState?.roundNumber, phase]);
  const myFinished = gameState?.myFinished ?? false;
  const celebrate = myGuesses.at(-1)?.result?.every((r) => r === "correct");

  useEffect(() => {
    if (!gameState?.gameId) return undefined;
    return subscribeWordlePlayers(gameState.gameId, () => {});
  }, [gameState?.gameId]);

  useEffect(() => {
    if (!gameState?.gameId || !roomId) return;
    if (phase === "playing" && gameState.roundNumber === 1) {
      ensureWordleGameRecord({
        gameId: gameState.gameId,
        roomId,
        hostId: gameState.hostUserId,
        roundNumber: gameState.roundNumber,
        status: "active",
      });
    }
    if (phase === "roundEnd" || phase === "finished") {
      finishWordleGameRecord({
        gameId: gameState.gameId,
        status: phase === "finished" ? "finished" : "round_end",
        secretWord: gameState.secretWord,
      });
    }
  }, [phase, gameState?.gameId, gameState?.roundNumber, gameState?.secretWord, roomId, gameState?.hostUserId]);

  useEffect(() => {
    const players = gameState?.players ?? [];
    setLivePlayers(players);
    if (!gameState?.gameId) return;
    for (const p of players) {
      syncWordlePlayerRow({
        gameId: gameState.gameId,
        userId: p.userId,
        nickname: p.userName,
        attemptsUsed: p.attemptsUsed,
        solved: p.solved,
        solveTimeMs: p.solveTimeMs,
        score: p.roundScore ?? 0,
        rank: p.rank,
      });
    }
  }, [gameState?.players, gameState?.gameId]);

  useEffect(() => {
    if (!gameState?.gameId || myGuesses.length <= prevGuessCountRef.current) {
      prevGuessCountRef.current = myGuesses.length;
      return;
    }
    const latest = myGuesses[myGuesses.length - 1];
    if (latest?.guess && latest?.result) {
      insertWordleGuess({
        gameId: gameState.gameId,
        userId,
        guess: latest.guess,
        result: latest.result,
      });
    }
    prevGuessCountRef.current = myGuesses.length;
  }, [myGuesses, gameState?.gameId, userId]);

  useEffect(() => {
    if (myGuesses.length <= shakeLenRef.current) return undefined;
    shakeLenRef.current = myGuesses.length;
    const latest = myGuesses[myGuesses.length - 1];
    if (latest?.result && !latest.result.some((r) => r === "correct" || r === "present")) {
      setShakeRow(true);
      const t = setTimeout(() => setShakeRow(false), 450);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [myGuesses]);

  const ranked = livePlayers.length ? livePlayers : gameState?.players ?? [];
  const previewGuess =
    phase === "playing" && !myFinished && !spectator ? draftGuess : "";

  return (
    <div className={`wordle-game ${spectator ? "wordle-game--spectator" : ""}`}>
      <AnimatePresence>
        {phase === "countdown" && gameState?.countdown != null && (
          <CountdownOverlay value={gameState.countdown} />
        )}
      </AnimatePresence>

      {(phase === "roundEnd" || celebrate) && <Confetti />}

      <header className="wordle-game-header">
        <h2>🎯 Word Battle</h2>
        <div className="wordle-game-meta">
          <span>Round {gameState?.roundNumber ?? 1}</span>
          {phase === "playing" && (
            <span className="wordle-round-rule">First to solve wins</span>
          )}
        </div>
      </header>

      <div className="wordle-game-body">
        <div className="wordle-game-main">
          {spectator ? (
            <p className="wordle-spectator-msg">Watching live — join the lobby for the next round.</p>
          ) : (
            <>
              <WordleBoard
                guesses={myGuesses}
                currentGuess={previewGuess}
                maxAttempts={maxAttempts}
                shake={shakeRow}
                celebrate={celebrate}
              />
              {phase === "playing" && !myFinished && (
                <p className="wordle-chat-hint">Type a 5-letter word in the bar below and send</p>
              )}
              {myFinished && phase === "playing" && (
                <p className="wordle-done-hint">You&apos;re done — watch the leaderboard!</p>
              )}
            </>
          )}

          {phase === "roundEnd" && gameState?.secretWord && (
            <motion.p
              className="wordle-reveal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Word: <strong>{gameState.secretWord.toUpperCase()}</strong>
            </motion.p>
          )}

          {canHost && (phase === "roundEnd" || phase === "finished") && (
            <button type="button" className="game-btn game-btn--primary wordle-next-btn" onClick={onStartNextRound}>
              Start next round
            </button>
          )}
        </div>

        <motion.aside
          className="wordle-live-rank"
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
        >
          <h3>Live rankings</h3>
          <ul className="wordle-rank-list">
            {ranked.map((p, i) => {
              const medal = p.rank && p.rank <= 3 ? RANK_EMOJI[p.rank - 1] : `#${i + 1}`;
              const status = p.solved
                ? `Solved in ${p.attemptsUsed}`
                : p.finished
                  ? "Out of tries"
                  : `${p.attemptsUsed}/${maxAttempts}`;
              return (
                <motion.li
                  key={p.userId}
                  className={p.userId === userId ? "wordle-rank-row--me" : ""}
                  layout
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <span className="wordle-rank-medal">{medal}</span>
                  <span className="wordle-rank-name">{p.userName}</span>
                  <span className="wordle-rank-status">{status}</span>
                </motion.li>
              );
            })}
          </ul>
        </motion.aside>
      </div>
    </div>
  );
}
