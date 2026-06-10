import { createPortal } from "react-dom";
import { roomExpPercent } from "../gamification.js";
import { formatCompactNumber } from "../formatCompact.js";
import { roomTagLabel } from "../roomTags.js";
import AvatarImg from "./AvatarImg.jsx";

function truncateName(name, max = 8) {
  const s = String(name ?? "");
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export default function RoomProfileSheet({
  room,
  owner,
  admins = [],
  stats,
  onlineCount,
  isSaved = false,
  isFollowing = false,
  saveBusy = false,
  isOwner = false,
  onShowOnline,
  onShowMembers,
  onClose,
  canEdit = false,
  onSettings,
  onShare,
  onJoin,
  onFollow,
}) {
  const announcement =
    room.announcement?.trim() ||
    "Welcome to our voice room! Be kind and have fun.";
  const roomLevel = Number(room.room_level ?? 1);
  const roomExp = Number(room.room_exp ?? 0);
  const expPct = roomExpPercent(roomExp, roomLevel);
  const tagLabel = roomTagLabel(room.room_tag ?? room.tag ?? "friends");
  const modeLabel = (room.room_mode || "normal").replace(/^\w/, (c) => c.toUpperCase());
  const isAdvanced = modeLabel !== "Normal" || roomLevel >= 3;
  const avatarSrc = owner?.avatar_url || null;
  const avatarFallback = (room.name || "R").charAt(0).toUpperCase();

  async function copyRoomId() {
    if (!room.room_code) return;
    try {
      await navigator.clipboard.writeText(room.room_code);
    } catch {
      /* ok */
    }
  }

  const adminCells = [];
  if (owner) {
    adminCells.push({ ...owner, role: "Owner" });
  }
  for (const a of admins) {
    adminCells.push({ ...a, role: "Admin" });
  }

  const sheet = (
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div className="weplay-room-profile" onClick={(e) => e.stopPropagation()}>
        <div className="weplay-room-profile-card">
          <div className="weplay-room-profile-top">
            <AvatarImg
              src={avatarSrc}
              fallback={avatarFallback}
              className="weplay-room-profile-avatar weplay-room-profile-avatar--fallback"
              imgClassName="weplay-room-profile-avatar"
            />
            <div className="weplay-room-profile-actions">
              {canEdit && (
                <button type="button" className="weplay-room-profile-icon-btn" onClick={onSettings} aria-label="Settings">
                  ⚙
                </button>
              )}
              {onShare && (
                <button type="button" className="weplay-room-profile-icon-btn" onClick={onShare} aria-label="Share">
                  ↗
                </button>
              )}
            </div>
          </div>

          <h2 className="weplay-room-profile-name">{room.name}</h2>
          <p className="weplay-room-profile-tags">
            <span className="weplay-room-profile-tag weplay-room-profile-tag--friends">{tagLabel}</span>
            {isAdvanced && <span className="weplay-room-profile-tag weplay-room-profile-tag--muted">Advanced</span>}
            <button type="button" className="weplay-room-profile-id" onClick={copyRoomId}>
              {room.room_code} <span aria-hidden>📋</span>
            </button>
          </p>

          <div className="weplay-room-profile-level">
            <span className="weplay-room-profile-diamond">💎 {roomLevel}</span>
            <div className="weplay-room-profile-exp">
              <span className="weplay-room-profile-exp-bar">
                <span style={{ width: `${expPct}%` }} />
              </span>
              <span className="weplay-room-profile-exp-label">Exp {formatCompactNumber(roomExp)}</span>
            </div>
          </div>

          {adminCells.length > 0 && (
            <div className="weplay-room-admins-scroll" role="list">
              {adminCells.map((a) => (
                <div key={a.id} className="weplay-room-admin-cell" role="listitem">
                  <AvatarImg
                    src={a.avatar_url}
                    fallback={a.display_name || "?"}
                    className="weplay-room-admin-avatar weplay-room-admin-avatar--fallback"
                    imgClassName="weplay-room-admin-avatar"
                  />
                  <span className="weplay-room-admin-name">{truncateName(a.display_name)}</span>
                  <span className={`weplay-room-admin-role weplay-room-admin-role--${a.role.toLowerCase()}`}>
                    {a.role}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="weplay-room-profile-stats">
            <button type="button" className="weplay-room-stat weplay-room-stat--online" onClick={onShowOnline}>
              <span>Online</span>
              <strong>{onlineCount}</strong>
              <span className="weplay-room-stat-arrow">›</span>
            </button>
            <button type="button" className="weplay-room-stat weplay-room-stat--members" onClick={onShowMembers}>
              <span>Members</span>
              <strong>{stats.members}</strong>
              <span className="weplay-room-stat-arrow">›</span>
            </button>
          </div>

          <div className="weplay-room-profile-rows">
            <div className="weplay-room-profile-row">
              <span>Fans</span>
              <span>{stats.fans}</span>
            </div>
            <div className="weplay-room-profile-row">
              <span>Nation</span>
              <span>{room.nation || "Global"}</span>
            </div>
          </div>

          <div className="weplay-room-announcement">
            <p className="weplay-room-announcement-title">Announcement</p>
            <p className="weplay-room-announcement-text">{announcement}</p>
          </div>
        </div>

        {!isOwner && (
          <footer className="weplay-room-profile-footer">
            <button
              type="button"
              className={`weplay-room-join-btn ${isSaved ? "weplay-room-join-btn--joined" : ""}`}
              disabled={saveBusy}
              onClick={onJoin}
            >
              {isSaved ? "Joined" : "Join room"}
            </button>
            {!isSaved && (
              <button
                type="button"
                className={`weplay-room-follow-link ${isFollowing ? "weplay-room-follow-link--active" : ""}`}
                disabled={saveBusy}
                onClick={onFollow}
              >
                {isFollowing ? "Following" : "Follow room"}
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
