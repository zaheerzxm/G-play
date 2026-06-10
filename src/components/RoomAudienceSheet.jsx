import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { loadContributors } from "../contribution.js";
import { formatCompactNumber } from "../formatCompact.js";
import { loadRoomMembers, loadRoomSocialStats } from "../profile.js";
import AvatarImg from "./AvatarImg.jsx";
import CharmBadge from "./CharmBadge.jsx";
import UserBadges from "./UserBadges.jsx";

const TABS = [
  { key: "online", label: "Online" },
  { key: "members", label: "Members" },
  { key: "contribution", label: "Contribution" },
];

const PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "total", label: "Total" },
];

function rankIcon(rank) {
  if (rank === 1) return "👑";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return rank;
}

export default function RoomAudienceSheet({
  roomId,
  onlineUsers = [],
  memberCount = 0,
  initialTab = "contribution",
  viewerId,
  viewerProfile,
  onClose,
}) {
  const [tab, setTab] = useState(initialTab);
  const [period, setPeriod] = useState("daily");
  const [contributors, setContributors] = useState([]);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({ members: memberCount, fans: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!roomId) return undefined;
    loadRoomSocialStats(roomId).then(setStats).catch(() => {});
    return undefined;
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return undefined;
    let active = true;

    if (tab === "contribution") {
      setLoading(true);
      loadContributors(roomId, { period, limit: 30 })
        .then((rows) => {
          if (active) setContributors(rows);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else if (tab === "members") {
      setLoading(true);
      loadRoomMembers(roomId, 50)
        .then((rows) => {
          if (active) setMembers(rows);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [tab, period, roomId]);

  const membersTotal = stats.members || memberCount;

  const myContribution = useMemo(() => {
    if (!viewerId) return 0;
    const row = contributors.find((u) => String(u.user_id) === String(viewerId));
    return Number(row?.amount ?? 0);
  }, [contributors, viewerId]);

  const sheet = (
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div className="audience-sheet weplay-audience-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="audience-sheet-handle" aria-hidden />

        <div className="audience-tabs weplay-audience-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`audience-tab ${tab === t.key ? "audience-tab--active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.key === "online" && ` ${onlineUsers.length}`}
              {t.key === "members" && ` ${membersTotal}`}
            </button>
          ))}
        </div>

        {tab === "contribution" && (
          <div className="audience-periods weplay-audience-periods">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`audience-period ${period === p.key ? "audience-period--active" : ""}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <ul className="audience-list weplay-audience-list">
          {tab === "online" &&
            (onlineUsers.length ? (
              onlineUsers.map((u) => (
                <li key={u.user_id || u.nickname} className="audience-row audience-row--online weplay-audience-row">
                  <AvatarImg
                    src={u.avatar_url}
                    fallback={u.nickname || "?"}
                    className="audience-avatar-fallback"
                    imgClassName="audience-avatar-img"
                  />
                  <span className="audience-name">{u.nickname || "Guest"}</span>
                </li>
              ))
            ) : (
              <li className="audience-row audience-row--empty">No one online right now</li>
            ))}

          {tab === "members" && !loading &&
            (members.length ? (
              members.map((u) => (
                <li key={u.user_id} className="audience-row audience-row--member weplay-audience-row">
                  <AvatarImg
                    src={u.avatar_url}
                    fallback={u.display_name || "?"}
                    className="audience-avatar-fallback"
                    imgClassName="audience-avatar-img"
                  />
                  <span className="audience-name">
                    <span className="audience-name-text">{u.display_name || "Guest"}</span>
                    <CharmBadge charm={u.charm ?? 0} compact />
                    {u.is_following && <span className="audience-fan-tag">Fan</span>}
                  </span>
                </li>
              ))
            ) : (
              <li className="audience-row audience-row--empty">
                No members yet — tap Join room in the room profile
              </li>
            ))}

          {tab === "contribution" && !loading &&
            (contributors.length ? (
              contributors.map((u) => (
                <li key={u.user_id} className="audience-row audience-row--contrib weplay-audience-row">
                  <span className="audience-rank weplay-audience-rank">{rankIcon(u.rank)}</span>
                  <AvatarImg
                    src={u.avatar_url}
                    fallback={u.display_name || "?"}
                    className="audience-avatar-fallback weplay-audience-avatar"
                    imgClassName="audience-avatar-img"
                  />
                  <span className="audience-name weplay-audience-name">
                    <span className="audience-name-text">{u.display_name || "Guest"}</span>
                    <UserBadges profile={u} />
                  </span>
                  <span className="audience-gold weplay-audience-gold">{formatCompactNumber(u.amount)} Gold</span>
                </li>
              ))
            ) : (
              <li className="audience-row audience-row--empty">
                No gifts yet this {period === "total" ? "room" : period} period
              </li>
            ))}

          {loading && <li className="audience-row audience-row--empty">Loading…</li>}
        </ul>

        {tab === "contribution" && viewerId && viewerProfile && (
          <div className="weplay-audience-self">
            <AvatarImg
              src={viewerProfile.avatar_url}
              fallback={viewerProfile.display_name || "?"}
              className="weplay-audience-self-avatar weplay-audience-self-avatar--fallback"
              imgClassName="weplay-audience-self-avatar"
            />
            <div className="weplay-audience-self-info">
              <span className="weplay-audience-self-name">{viewerProfile.display_name || "You"}</span>
              <UserBadges profile={viewerProfile} />
            </div>
            <span className="weplay-audience-self-gold">{formatCompactNumber(myContribution)} Gold</span>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
