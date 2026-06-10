import { useEffect, useState } from "react";
import {
  claimDailyChest,
  dailyChestStates,
  ensureDailyTasks,
} from "../gamification.js";
import { GPLAY_ASSETS } from "../gplayAssets.js";

export default function DailyTaskSheet({ userId, isSeated, onClose, onReward }) {
  const [tasks, setTasks] = useState(null);
  const [claimingIndex, setClaimingIndex] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return undefined;
    const refresh = () => ensureDailyTasks(userId).then(setTasks).catch(() => {});
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [userId]);

  const seatMinutes = Number(tasks?.watch_minutes ?? 0);
  const chests = dailyChestStates(seatMinutes, tasks?.chests_claimed ?? 0);

  async function handleClaim(index) {
    setClaimingIndex(index);
    setError(null);
    try {
      const reward = await claimDailyChest(userId, index);
      onReward?.(reward);
      const updated = await ensureDailyTasks(userId);
      setTasks(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setClaimingIndex(null);
    }
  }

  return (
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div className="daily-task-sheet daily-task-sheet--chests" onClick={(e) => e.stopPropagation()}>
        <div className="daily-task-head">
          <h3 className="daily-task-title">Daily Task</h3>
          <button type="button" className="daily-task-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <p className="daily-task-hint">
          Sit in a voice room seat to unlock treasure chests — small rewards most of the time
        </p>
        <p className="daily-task-seat-time">
          Seat time today: <strong>{seatMinutes} min</strong>
          {!isSeated && <span className="daily-task-seat-warn"> · take a seat to keep earning</span>}
        </p>

        <div className="daily-chest-grid">
          {chests.map((chest) => {
            const busy = claimingIndex === chest.index;
            let action = null;
            if (chest.claimed) {
              action = <span className="daily-chest-status daily-chest-status--claimed">Claimed</span>;
            } else if (chest.unlocked) {
              action = (
                <button
                  type="button"
                  className="daily-chest-claim"
                  disabled={busy}
                  onClick={() => handleClaim(chest.index)}
                >
                  {busy ? "…" : "Claim"}
                </button>
              );
            } else {
              action = (
                <span className="daily-chest-status daily-chest-status--locked">
                  {chest.minutesLeft}m left
                </span>
              );
            }

            return (
              <div
                key={chest.index}
                className={`daily-chest-card ${chest.unlocked ? "daily-chest-card--ready" : ""} ${chest.claimed ? "daily-chest-card--claimed" : ""}`}
              >
                <div className="daily-chest-icon-wrap">
                  <img src={GPLAY_ASSETS.iconChest} alt="" className="daily-chest-icon" />
                  {chest.unlocked && !chest.claimed && <span className="daily-chest-glow" aria-hidden />}
                </div>
                <span className="daily-chest-time">{chest.unlockMinutes} min</span>
                {action}
              </div>
            );
          })}
        </div>

        {error && <p className="banner error">{error}</p>}
        <p className="daily-task-foot">
          Chests reset daily · big gifts are extremely rare
        </p>
      </div>
    </div>
  );
}
