import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { emitAck } from "../../lib/socket.js";
import WordleBoard from "./WordleBoard.jsx";
import WordleKeyboard from "./WordleKeyboard.jsx";
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
  userName,
  gameState,
  canHost,
  spectator = false,
  onStartNextRound,
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [shake, setShake] = useState(false);
  const [livePlayers, setLivePlayers] = useState([]);

  const phase = gameState?.phase ?? "waiting";
  const maxAttempts = gameState?.maxAttempts ?? 6;
  const myGuesses = gameState?.myGuesses ?? [];
  const myFinished = gameState?.myFinished ?? false;
  const celebrate = myGuesses.at(-1)?.result?.every((r) => r === "correct");

  useEffect(() => {
    if (phase === "playing" || phase === "countdown") {
      setDraft("");
      setError(null);
    }
  }, [phase, gameState?.roundNumber]);

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

  const keyStates = useMemo(() => {
    const map = {};
    for (const g of myGuesses) {
      g.guess.split("").forEach((ch, i) => {
        const r = g.result[i];
        const prev = map[ch];
        if (r === "correct" || (r === "present" && prev !== "correct")) map[ch] = r;
        if (r === "absent" && !prev) map[ch] = r;
      });
    }
    return map;
  }, [myGuesses]);

  const submitGuess = useCallback(async () => {
    const word = draft.trim().toLowerCase();
    if (word.length !== 5 || busy || myFinished || spectator || phase !== "playing") return;
    setBusy(true);
    setError(null);
    const res = await emitAck("sendWordleGuess", { roomId, userId, guess: word });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Invalid word");
      setShake(true);
      setTimeout(() => setShake(false), 450);
      return;
    }
    setDraft("");
    if (gameState?.gameId) {
      insertWordleGuess({
        gameId: gameState.gameId,
        userId,
        guess: word,
        result: res.result,
      });
    }
  }, [draft, busy, myFinished, spectator, phase, roomId, userId, gameState?.gameId]);

  const onKey = useCallback(
    (key) => {
      if (spectator || myFinished || phase !== "playing" || busy) return;
      if (key === "⌫") {
        setDraft((d) => d.slice(0, -1));
        return;
      }
      if (key === "ENTER") {
        submitGuess();
        return;
      }
      if (draft.length < 5 && /^[A-Z]$/.test(key)) {
        setDraft((d) => `${d}${key.toLowerCase()}`);
      }
    },
    [spectator, myFinished, phase, busy, draft, submitGuess],
  );

  useEffect(() => {
    if (spectator || myFinished || phase !== "playing") return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitGuess();
      } else if (e.key === "Backspace") {
        setDraft((d) => d.slice(0, -1));
      } else if (/^[a-zA-Z]$/.test(e.key) && draft.length < 5) {
        setDraft((d) => `${d}${e.key.toLowerCase()}`);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [spectator, myFinished, phase, draft, submitGuess]);

  const ranked = livePlayers.length ? livePlayers : gameState?.players ?? [];

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
          {phase === "playing" && gameState?.endsAt && (
            <RoundTimer endsAt={gameState.endsAt} />
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
                currentGuess={phase === "playing" && !myFinished ? draft : ""}
                maxAttempts={maxAttempts}
                shake={shake}
                celebrate={celebrate}
              />
              {error && <p className="wordle-error">{error}</p>}
              {phase === "playing" && !myFinished && (
                <WordleKeyboard onKey={onKey} keyStates={keyStates} disabled={busy} />
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

function RoundTimer({ endsAt }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [endsAt]);
  const m = Math.floor(left / 60);
  const s = left % 60;
  return (
    <span className="wordle-round-timer">
      {m}:{String(s).padStart(2, "0")}
    </span>
  );
}
