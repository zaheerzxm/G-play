import AvatarImg from "./AvatarImg.jsx";
import { IconMuted } from "./NavIcons.jsx";
import VipDisplayName from "./VipDisplayName.jsx";

function formatChatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return time;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ChatListRow({
  friend,
  preview,
  unread = 0,
  timestamp,
  muted = false,
  tags = [],
  avatarSlot,
  onOpenChat,
  onOpenProfile,
}) {
  const name = friend.display_name || "Player";
  const initial = name.charAt(0).toUpperCase();
  const timeLabel = formatChatTime(timestamp);

  return (
    <div className="G-play-chat-row">
      <button
        type="button"
        className="G-play-chat-row-avatar-btn"
        onClick={() => onOpenProfile?.(friend)}
        aria-label={`${name} profile`}
      >
        {avatarSlot ?? (
          friend.avatar_url ? (
            <img src={friend.avatar_url} alt="" className="G-play-chat-avatar-img" />
          ) : (
            <span className="G-play-chat-avatar">{initial}</span>
          )
        )}
      </button>
      <button type="button" className="G-play-chat-row-body-btn" onClick={() => onOpenChat?.(friend)}>
        <span className="G-play-chat-row-body">
          <span className="G-play-chat-row-name-line">
            <VipDisplayName as="strong" name={name} profile={friend} variant="light" />
            {tags.map((tag) => (
              <span key={tag.key} className={`G-play-chat-tag G-play-chat-tag--${tag.key}`}>
                {tag.label}
              </span>
            ))}
          </span>
          <small>{preview || "Tap to chat"}</small>
        </span>
        <span className="G-play-chat-row-right">
          {timeLabel && <time className="G-play-chat-time">{timeLabel}</time>}
          {muted && (
            <span className="G-play-chat-muted" aria-label="Muted">
              <IconMuted />
            </span>
          )}
          {unread > 0 && (
            <em className="G-play-chat-unread">{unread > 99 ? "99+" : unread}</em>
          )}
        </span>
      </button>
    </div>
  );
}
