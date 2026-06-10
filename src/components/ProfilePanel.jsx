import { useState } from "react";
import BlockedUsersSheet from "./BlockedUsersSheet.jsx";
import CharmLevelsSheet from "./CharmLevelsSheet.jsx";
import UserBadges from "./UserBadges.jsx";
import { effectiveVipLevel } from "../vipStatus.js";
import { nextUserLevelExp, userLevelPercent } from "../userLevels.js";

const ME_SHORTCUTS = [
  { key: "vip", icon: "💎", label: "VIP", badge: "Sale" },
  { key: "shop", icon: "🏪", label: "Shop" },
  { key: "show", icon: "👕", label: "PLAY Show", badge: "New" },
  { key: "home", icon: "🏠", label: "My Home" },
];

const ME_MENU = [
  { key: "moments", icon: "✨", label: "Spotlight" },
  { key: "stats", icon: "🏆", label: "Stats" },
  { key: "visitors", icon: "👁", label: "Visitors", hint: "New Visitors 3" },
  { key: "invite", icon: "👤", label: "Invite Friends" },
  { key: "badge", icon: "⭐", label: "Badge" },
  { key: "edit", icon: "✏️", label: "Edit Profile" },
  { key: "charm", icon: "✨", label: "Charm Levels" },
  { key: "blocked", icon: "🚫", label: "Blocked users" },
  { key: "help", icon: "🎧", label: "Help Center" },
];

function initialFor(profile) {
  return (profile?.display_name || "?").charAt(0).toUpperCase();
}

export default function ProfilePanel({
  profile,
  userId,
  onJoinRoom,
  myRooms,
  onOpenMoments,
  onOpenRankings,
  onOpenShop,
  onOpenVip,
  onOpenMyHome,
  onOpenInvite,
  onOpenPlayerCard,
  onEditProfile,
  onToast,
}) {
  const [charmOpen, setCharmOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);

  const level = profile.user_level ?? 1;
  const exp = profile.user_exp ?? 0;
  const nextExp = nextUserLevelExp(level);
  const pct = userLevelPercent(exp, level);

  function handleShortcut(key) {
    if (key === "vip") onOpenVip?.();
    else if (key === "shop") onOpenShop?.();
    else if (key === "show") onOpenShop?.();
    else if (key === "home") onOpenMyHome?.();
    else onToast?.(`${ME_SHORTCUTS.find((s) => s.key === key)?.label ?? key} opened`);
  }

  function handleMenu(key) {
    if (key === "moments") onOpenMoments?.();
    else if (key === "stats" || key === "badge") onOpenRankings?.();
    else if (key === "invite") onOpenInvite?.();
    else if (key === "edit") onEditProfile?.();
    else if (key === "charm") setCharmOpen(true);
    else if (key === "blocked") setBlockedOpen(true);
    else onToast?.("Coming soon");
  }

  return (
    <div className="me-page">
      <button type="button" className="me-hero" onClick={onOpenPlayerCard}>
        <div className="me-hero-bg" aria-hidden />
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="me-hero-avatar" />
        ) : (
          <span className="me-hero-avatar me-hero-avatar--fallback">{initialFor(profile)}</span>
        )}
        <div className="me-hero-body">
          <p className={`me-hero-name ${effectiveVipLevel(profile) > 0 ? "vip-name-glow" : ""}`}>
            {profile.display_name}
          </p>
          <div className="me-level-row">
            <span>Lv.{level}</span>
            <span className="me-level-bar">
              <span className="me-level-fill" style={{ width: `${pct}%` }} />
            </span>
            {nextExp && <small>{exp}/{nextExp}</small>}
          </div>
          <UserBadges profile={profile} compact />
        </div>
        <span className="me-hero-chevron" aria-hidden>›</span>
      </button>

      <div className="me-shortcuts">
        {ME_SHORTCUTS.map((item) => (
          <button key={item.key} type="button" className="me-shortcut" onClick={() => handleShortcut(item.key)}>
            <span className="me-shortcut-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && <em>{item.badge}</em>}
          </button>
        ))}
      </div>

      <ul className="me-menu-list me-menu-list--clean">
        {ME_MENU.map((item) => (
          <li key={item.key}>
            <button type="button" onClick={() => handleMenu(item.key)}>
              <span className="me-menu-icon">{item.icon}</span>
              <span className="me-menu-label">{item.label}</span>
              {item.hint && <span className="me-menu-hint">{item.hint}</span>}
              <span className="me-menu-chevron">›</span>
            </button>
          </li>
        ))}
      </ul>

      {myRooms.length > 0 && (
        <section className="me-rooms-section">
          <h3>Your rooms</h3>
          <ul className="room-list">
            {myRooms.map((r) => (
              <li key={r.id}>
                <button type="button" className="room-list-btn" onClick={() => onJoinRoom(r)}>
                  <span className="room-list-name">{r.name}</span>
                  <span className="room-list-code">ID: {r.room_code}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {charmOpen && <CharmLevelsSheet onClose={() => setCharmOpen(false)} />}
      {blockedOpen && (
        <BlockedUsersSheet
          userId={userId}
          onClose={() => setBlockedOpen(false)}
          onToast={(msg) => onToast?.(msg)}
        />
      )}
    </div>
  );
}
