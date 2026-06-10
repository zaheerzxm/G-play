export default function GplayHubRow({
  onlineCount = 0,
  onRanking,
  onDailyTasks,
  onOnlineFriends,
}) {
  return (
    <div className="gplay-hub-row">
      <button type="button" className="gplay-hub-item gplay-hub-item--ranking" onClick={onRanking}>
        <span className="gplay-hub-icon" aria-hidden>👑</span>
        <span className="gplay-hub-label">Ranking</span>
      </button>
      <button type="button" className="gplay-hub-item gplay-hub-item--tasks" onClick={onDailyTasks}>
        <span className="gplay-hub-icon" aria-hidden>📋</span>
        <span className="gplay-hub-label">Tasks</span>
      </button>
      <button type="button" className="gplay-hub-item gplay-hub-item--friends" onClick={onOnlineFriends}>
        <span className="gplay-hub-icon" aria-hidden>
          🐱
          {onlineCount > 0 && <em className="gplay-hub-dot" />}
        </span>
        <span className="gplay-hub-label">Online Friend</span>
      </button>
    </div>
  );
}
