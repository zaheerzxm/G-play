export default function GameResults({
  gameType,
  leaderboard = [],
  userId,
  canHost,
  onReplay,
  onDone,
}) {
  const title =
    gameType === "trivia"
      ? "Trivia results"
      : gameType === "wordle"
        ? "Word Battle results"
        : "Draw & Guess results";
  const winner = leaderboard[0];

  return (
    <div className="game-room-panel game-results">
      <header className="game-room-panel-header game-room-panel-header--compact">
        <h2>{title}</h2>
        {winner && (
          <p className="game-results-winner">
            Winner: <strong>{winner.userName}</strong> ({winner.score} pts)
          </p>
        )}
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
      <div className="game-results-actions">
        {canHost && (
          <button type="button" className="game-btn game-btn--primary" onClick={onReplay}>
            Play again
          </button>
        )}
        <button type="button" className="game-btn game-btn--ghost" onClick={onDone}>
          {canHost ? "End & leave lobby" : "Back"}
        </button>
      </div>
    </div>
  );
}
