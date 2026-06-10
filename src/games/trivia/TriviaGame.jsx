import { useEffect, useMemo, useState } from "react";
import { emitAck } from "../../lib/socket.js";

function Countdown({ endsAt }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.ceil(((endsAt ?? 0) - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [endsAt]);
  return <span className="game-timer">{left}s</span>;
}

export default function TriviaGame({ roomId, userId, gameState }) {
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const phase = gameState?.phase ?? "question";
  const question = gameState?.question;
  const myAnswer = gameState?.answers?.[userId];
  const locked = picked !== null || myAnswer !== undefined || phase !== "question";

  useEffect(() => {
    if (gameState?.answers?.[userId] !== undefined) {
      setPicked(gameState.answers[userId]);
    }
  }, [gameState?.answers, userId]);

  useEffect(() => {
    if (phase === "question" && gameState?.questionIndex !== undefined) {
      setPicked(null);
      setError(null);
    }
  }, [phase, gameState?.questionIndex]);

  const leaderboard = useMemo(() => {
    const scores = gameState?.scores ?? {};
    return (gameState?.players ?? [])
      .map((p) => ({ ...p, score: scores[p.userId] ?? 0 }))
      .sort((a, b) => b.score - a.score);
  }, [gameState]);

  async function pickOption(index) {
    if (locked || busy) return;
    setBusy(true);
    setError(null);
    const res = await emitAck("sendTriviaAnswer", { roomId, userId, answerIndex: index });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not submit");
      return;
    }
    setPicked(index);
  }

  if (phase === "finished") {
    return (
      <div className="game-room-panel">
        <header className="game-room-panel-header">
          <h2>Trivia results</h2>
        </header>
        <ol className="game-leaderboard">
          {leaderboard.map((row, i) => (
            <li key={row.userId} className={row.userId === userId ? "game-leaderboard--me" : ""}>
              <span>#{i + 1}</span>
              <strong>{row.userName}</strong>
              <em>{row.score}</em>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="game-room-panel">
      <header className="game-room-panel-header">
        <h2>Trivia Battle</h2>
        <div className="game-room-panel-meta">
          Q{(gameState?.questionIndex ?? 0) + 1}/{gameState?.totalQuestions ?? "?"}
          {phase === "question" && gameState?.endsAt && <Countdown endsAt={gameState.endsAt} />}
        </div>
      </header>

      {question && (
        <div className="trivia-question">
          <p className="trivia-question-text">{question.text}</p>
          <div className="trivia-options">
            {question.options.map((opt, i) => {
              let cls = "trivia-option";
              if (picked === i || myAnswer === i) cls += " trivia-option--picked";
              if (phase === "reveal" && i === question.correctIndex) cls += " trivia-option--correct";
              if (phase === "reveal" && (picked === i || myAnswer === i) && i !== question.correctIndex) {
                cls += " trivia-option--wrong";
              }
              return (
                <button key={opt} type="button" className={cls} disabled={locked || busy} onClick={() => pickOption(i)}>
                  {opt}
                </button>
              );
            })}
          </div>
          {phase === "reveal" && <p className="trivia-reveal">Correct answer highlighted</p>}
          {error && <p className="banner error">{error}</p>}
        </div>
      )}

      <div className="game-score-chips">
        {leaderboard.slice(0, 4).map((row) => (
          <span key={row.userId} className="game-score-chip">
            {row.userName}: {row.score}
          </span>
        ))}
      </div>
    </div>
  );
}
