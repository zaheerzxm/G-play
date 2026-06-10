import AvatarImg from "../../components/AvatarImg.jsx";

export default function MafiaPlayerList({
  players,
  userId,
  selectable,
  onSelect,
  selectedId,
  showReady,
  canKick,
  onKick,
}) {
  return (
    <ul className="mafia-player-list">
      {players.map((p) => {
        const isMe = String(p.user_id) === String(userId);
        const dead = p.is_alive === false;
        return (
          <li
            key={p.user_id}
            className={`mafia-player-row ${isMe ? "mafia-player-row--me" : ""} ${dead ? "mafia-player-row--dead" : ""} ${selectable ? "mafia-player-row--selectable" : ""} ${selectedId === p.user_id ? "mafia-player-row--selected" : ""}`}
          >
            <button
              type="button"
              className="mafia-player-btn"
              disabled={!selectable || dead}
              onClick={() => selectable && !dead && onSelect?.(p.user_id)}
            >
              <span className="mafia-player-avatar">
                {p.avatar_url ? (
                  <AvatarImg src={p.avatar_url} fallback={p.nickname?.[0] ?? "?"} />
                ) : (
                  <span>{p.nickname?.[0]?.toUpperCase() ?? "?"}</span>
                )}
                {dead && <span className="mafia-player-dead-badge">💀</span>}
              </span>
              <span className="mafia-player-name">{p.nickname}</span>
              {showReady && (
                <span className={`mafia-player-ready ${p.is_ready ? "mafia-player-ready--on" : ""}`}>
                  {p.is_ready ? "Ready" : "…"}
                </span>
              )}
            </button>
            {canKick && !isMe && (
              <button type="button" className="mafia-kick-btn" onClick={() => onKick?.(p.user_id)}>
                Kick
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
