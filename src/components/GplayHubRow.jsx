import { IconOnlineFriends, IconRanking, IconTasks } from "./NavIcons.jsx";

const HUB_ITEMS = [
  { key: "ranking", Icon: IconRanking, label: "Ranking", onKey: "onRanking" },
  { key: "tasks", Icon: IconTasks, label: "Tasks", onKey: "onDailyTasks", notifyKey: "tasksNotify" },
  { key: "friends", Icon: IconOnlineFriends, label: "Online Friend", onKey: "onOnlineFriends", notifyKey: "onlineCount" },
];

export default function GplayHubRow({
  onlineCount = 0,
  tasksNotify = false,
  onRanking,
  onDailyTasks,
  onOnlineFriends,
}) {
  const handlers = { onRanking, onDailyTasks, onOnlineFriends };
  const notify = { tasksNotify, onlineCount };

  return (
    <div className="gplay-hub-row">
      {HUB_ITEMS.map(({ key, Icon, label, onKey, notifyKey }) => {
        const showDot = notifyKey === "tasksNotify" ? tasksNotify : notifyKey === "onlineCount" ? onlineCount > 0 : false;
        return (
          <button
            key={key}
            type="button"
            className={`gplay-hub-item gplay-hub-item--${key}`}
            onClick={handlers[onKey]}
          >
            <span className="gplay-hub-icon">
              <Icon />
              {showDot && <em className="gplay-hub-dot" aria-hidden />}
            </span>
            <span className="gplay-hub-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
