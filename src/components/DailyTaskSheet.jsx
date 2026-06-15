import { useEffect, useState } from "react";
import CoinIcon from "./CoinIcon.jsx";
import { IconHeart, UiIcon } from "./NavIcons.jsx";
import {
  claimClanTask,
  clanTaskProgressValue,
  clanTaskStatus,
  loadClanTasksState,
  loadMyClan,
} from "../clans.js";
import {
  CLAN_TASK_DEFS,
  CLAN_TASK_STUB,
  GROWTH_TASK_DEFS,
  activenessChestStatus,
  activenessPercent,
  claimActivenessChest,
  claimGameTask,
  dailyTasksForContext,
  growthTaskProgress,
  growthTaskStatus,
  loadGameTaskState,
  markDailyLogin,
  taskProgressValue,
  taskStatus,
} from "../gameTasks.js";

const TABS = [
  { key: "daily", label: "Daily" },
  { key: "growth", label: "Growth" },
  { key: "clan", label: "Clan" },
];

const ACTIVENESS_CHESTS = [10, 40, 70, 100];

function RewardIcons({ rewards }) {
  if (!rewards) return null;
  return (
    <span className="game-task-rewards">
      {rewards.coins > 0 && (
        <span className="game-task-reward game-task-reward--coin">
          <CoinIcon size="sm" />
          <em>x{rewards.coins}</em>
        </span>
      )}
      {rewards.hearts > 0 && (
        <span className="game-task-reward game-task-reward--heart">
          <UiIcon Icon={IconHeart} />
          <em>x{rewards.hearts}</em>
        </span>
      )}
      {rewards.exp > 0 && (
        <span className="game-task-reward game-task-reward--exp">
          <em>EXP x{rewards.exp}</em>
        </span>
      )}
    </span>
  );
}

export default function DailyTaskSheet({
  userId,
  profile,
  friendCount = 0,
  isSuperAdmin,
  context = "lobby",
  onClose,
  onReward,
  onNavigate,
}) {
  const [tab, setTab] = useState("daily");
  const [state, setState] = useState(() => loadGameTaskState(userId));
  const [clanState, setClanState] = useState({ progress: {}, claimed: {} });
  const [clanId, setClanId] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [claimingChest, setClaimingChest] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    markDailyLogin(userId);
    setState(loadGameTaskState(userId));
    loadMyClan(userId).then(async (clan) => {
      if (clan?.id) {
        setClanId(clan.id);
        setClanState(await loadClanTasksState(userId, clan.id));
      } else {
        setClanId(null);
        setClanState({ progress: {}, claimed: {} });
      }
    });
  }, [userId]);

  const dailyTasks = dailyTasksForContext(context);
  const tasksByTab = {
    daily: dailyTasks,
    growth: GROWTH_TASK_DEFS,
    clan: clanId ? CLAN_TASK_DEFS : [CLAN_TASK_STUB],
  };
  const tasks = tasksByTab[tab] ?? [];
  const activeness = activenessPercent(state, dailyTasks);
  const isClanTab = tab === "clan" && clanId;

  async function handleClaim(taskId) {
    setClaimingId(taskId);
    setError(null);
    try {
      if (isClanTab) {
        const result = await claimClanTask(userId, clanId, taskId);
        setClanState(await loadClanTasksState(userId, clanId));
        onReward?.(result);
      } else {
        const result = await claimGameTask(userId, taskId, { isSuperAdmin, growthCtx });
        setState(loadGameTaskState(userId));
        onReward?.(result);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setClaimingId(null);
    }
  }

  async function handleClaimChest(threshold) {
    setClaimingChest(threshold);
    setError(null);
    try {
      const result = await claimActivenessChest(userId, threshold, { isSuperAdmin, tasks: dailyTasks });
      setState(loadGameTaskState(userId));
      onReward?.(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setClaimingChest(null);
    }
  }

  function handleGo(task) {
    if (task.goAction) onNavigate?.(task.goAction);
  }

  const growthCtx = {
    charm: profile?.charm ?? 0,
    friendCount,
    userLevel: profile?.user_level ?? 1,
  };

  function statusFor(task) {
    if (isClanTab) return clanTaskStatus(clanState, task);
    if (tab === "growth") return growthTaskStatus(state, task, growthCtx);
    return taskStatus(state, task);
  }

  function progressFor(task) {
    if (isClanTab) return clanTaskProgressValue(clanState, task);
    if (tab === "growth") return growthTaskProgress(state, task, growthCtx);
    return taskProgressValue(state, task);
  }

  return (
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div className="daily-task-sheet daily-task-sheet--games" onClick={(e) => e.stopPropagation()}>
        <div className="game-task-header">
          <div className="game-task-header-top game-task-header-top--tabs-only">
            <div className="game-task-tabs">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={tab === t.key ? "game-task-tab--active" : ""}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="game-task-activeness">
            <div className="game-task-activeness-label">
              <span>Today's Activeness: <strong>{activeness}</strong></span>
              <span>Refresh at 00:00 GMT+5.5</span>
            </div>
            <div className="game-task-activeness-bar">
              <span style={{ width: `${activeness}%` }} />
            </div>
            <div className="game-task-chests">
              {ACTIVENESS_CHESTS.map((threshold) => {
                const chestStatus = activenessChestStatus(state, threshold, dailyTasks);
                return (
                  <button
                    key={threshold}
                    type="button"
                    className={`game-task-chest game-task-chest--btn ${chestStatus === "claimed" ? "game-task-chest--open" : ""} ${chestStatus === "claimable" ? "game-task-chest--claimable" : ""}`}
                    disabled={chestStatus !== "claimable" || claimingChest === threshold}
                    onClick={() => chestStatus === "claimable" && handleClaimChest(threshold)}
                    aria-label={`Activeness chest ${threshold}`}
                  >
                    <em aria-hidden>{chestStatus === "claimed" ? "📦" : "🎁"}</em>
                    <small>{threshold}</small>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <ul className="game-task-list">
          {tasks.map((task) => {
            const status = statusFor(task);
            const progress = progressFor(task);
            const busy = claimingId === task.id;

            let action = null;
            if (task.stub) {
              action = (
                <button type="button" className="game-task-btn game-task-btn--go" onClick={() => handleGo(task)}>
                  Go
                </button>
              );
            } else if (status === "claimed") {
              action = <span className="game-task-btn game-task-btn--done">Completed</span>;
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

        {error && <p className="banner error">{error}</p>}

        <footer className="game-task-footer">
          <span>Refresh at 00:00 GMT+5.5</span>
        </footer>
      </div>
    </div>
  );
}
