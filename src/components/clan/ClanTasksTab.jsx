import { useEffect, useState } from "react";
import CoinIcon from "../CoinIcon.jsx";
import { CLAN_TASK_DEFS } from "../../gameTasks.js";
import {
  claimClanTask,
  clanActivenessPercent,
  clanTaskProgressValue,
  clanTaskStatus,
  loadClanTasksState,
  markClanTaskProgress,
} from "../../clans.js";

const MILESTONES = [
  { pct: 25, label: "25%", reward: "5 coins" },
  { pct: 50, label: "50%", reward: "10 coins" },
  { pct: 75, label: "75%", reward: "15 coins" },
  { pct: 100, label: "100%", reward: "25 coins" },
];

function RewardIcons({ rewards }) {
  if (!rewards) return null;
  return (
    <span className="game-task-rewards">
      {rewards.coins > 0 && (
        <span className="game-task-reward">
          <CoinIcon size="sm" /> {rewards.coins}
        </span>
      )}
      {rewards.exp > 0 && <span className="game-task-reward">EXP {rewards.exp}</span>}
    </span>
  );
}

export default function ClanTasksTab({ userId, clanId, onReward, onOpenChat, onOpenDonate, onToast }) {
  const [state, setState] = useState({ progress: {}, claimed: {} });
  const [claimingId, setClaimingId] = useState(null);

  useEffect(() => {
    if (!userId || !clanId) return;
    markClanTaskProgress(userId, clanId, "clan_checkin", 1);
    loadClanTasksState(userId, clanId).then(setState);
  }, [userId, clanId]);

  const activeness = clanActivenessPercent(state, CLAN_TASK_DEFS);

  async function handleClaim(taskId) {
    setClaimingId(taskId);
    try {
      const result = await claimClanTask(userId, clanId, taskId);
      setState(await loadClanTasksState(userId, clanId));
      onReward?.(result);
      onToast?.(`Claimed ${result.rewards?.coins ?? 0} coins!`);
    } catch (e) {
      onToast?.(e.message);
    } finally {
      setClaimingId(null);
    }
  }

  function handleGo(task) {
    if (task.id === "clan_chat") onOpenChat?.();
    else if (task.id === "clan_donate") {
      onOpenDonate?.();
    }
  }

  return (
    <div className="clan-tasks-tab">
      <div className="clan-tasks-activeness">
        <div className="game-task-activeness-label">
          <span>Today's Activeness</span>
          <strong>{activeness}%</strong>
        </div>
        <div className="game-task-activeness-bar">
          <span style={{ width: `${activeness}%` }} />
        </div>
      </div>

      <ul className="clan-milestones">
        {MILESTONES.map((m) => (
          <li key={m.pct} className={activeness >= m.pct ? "clan-milestone--done" : ""}>
            <span>{m.label}</span>
            <em>{m.reward}</em>
          </li>
        ))}
      </ul>

      <ul className="game-task-list clan-task-list">
        {CLAN_TASK_DEFS.map((task) => {
          const status = clanTaskStatus(state, task);
          const progress = clanTaskProgressValue(state, task);
          const busy = claimingId === task.id;

          let action = null;
          if (status === "claimed") {
            action = <span className="game-task-btn game-task-btn--done">Done</span>;
          } else if (status === "claimable") {
            action = (
              <button
                type="button"
                className="game-task-btn game-task-btn--claim"
                disabled={busy}
                onClick={() => handleClaim(task.id)}
              >
                {busy ? "…" : "Claim"}
              </button>
            );
          } else {
            action = (
              <button type="button" className="game-task-btn game-task-btn--go" onClick={() => handleGo(task)}>
                Go
              </button>
            );
          }

          return (
            <li key={task.id} className={`game-task-row game-task-row--${status}`}>
              <div className="game-task-row-body">
                <strong className="game-task-row-title">{task.title}</strong>
                <p className="game-task-row-desc">{task.description}</p>
                <RewardIcons rewards={task.rewards} />
                {task.goal > 1 && (
                  <span className="game-task-progress">
                    {Math.min(progress, task.goal)}/{task.goal}
                  </span>
                )}
              </div>
              {action}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
