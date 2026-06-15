import { useEffect, useMemo, useState } from "react";
import BlockedUsersSheet from "./BlockedUsersSheet.jsx";
import CharmLevelsSheet from "./CharmLevelsSheet.jsx";
import UserBadges from "./UserBadges.jsx";
import {
  IconBadge,
  IconBlocked,
  IconCharm,
  IconEdit,
  IconHelp,
  IconHome,
  IconInvite,
  IconMoments,
  IconShop,
  IconShow,
  IconStats,
  IconVip,
  IconVisitors,
} from "./NavIcons.jsx";
import { formatProfileLocation } from "../countries.js";
import { effectiveVipLevel } from "../vipStatus.js";
import { currentUserLevelExp, nextUserLevelExp, userLevelPercent } from "../userLevels.js";
import { formatCompactNumber } from "../formatCompact.js";
import VipDisplayName from "./VipDisplayName.jsx";
import { countNewVisitors } from "../visitors.js";
import { loadPendingVipRequests } from "../vipRequests.js";
import { loadPendingCoinPurchaseRequests } from "../purchaseRequests.js";
import { SPOTLIGHT_FEED_NAME } from "../moments.js";

const ME_SHORTCUTS = [
  { key: "vip", Icon: IconVip, label: "VIP", badge: "Flash Sale" },
  { key: "shop", Icon: IconShop, label: "Shop" },
  { key: "show", Icon: IconShow, label: "PLAY Show", badge: "Free" },
  { key: "home", Icon: IconHome, label: "My Home" },
];

const ME_MENU_GROUPS = [
  [
    { key: "moments", Icon: IconMoments, label: SPOTLIGHT_FEED_NAME },
    { key: "stats", Icon: IconStats, label: "Stats" },
    { key: "visitors", Icon: IconVisitors, label: "Visitors", hintKey: "visitors" },
  ],
  [
    { key: "invite", Icon: IconInvite, label: "Invite Friends" },
    { key: "badge", Icon: IconBadge, label: "Badge" },
    { key: "contributions", Icon: IconStats, label: "Contributions" },
  ],
  [
    { key: "language", Icon: IconHelp, label: "Language", hintKey: "language" },
    { key: "parental", Icon: IconCharm, label: "Parental control mode" },
    { key: "privacy", Icon: IconBlocked, label: "Privacy" },
    { key: "help", Icon: IconHelp, label: "Help Center" },
    { key: "security", Icon: IconBlocked, label: "Security Center" },
  ],
  [
    { key: "edit", Icon: IconEdit, label: "Edit Profile" },
    { key: "charm", Icon: IconCharm, label: "Charm Levels" },
    { key: "blocked", Icon: IconBlocked, label: "Blocked users" },
  ],
];

const ADMIN_MENU_ITEM = { key: "admin", Icon: IconHelp, label: "Admin panel", hintKey: "adminPending" };

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
  onOpenInventory,
  onOpenVip,
  onOpenMyHome,
  onOpenPlayShow,
  onOpenInvite,
  onOpenVisitors,
  onOpenPlayerCard,
  onEditProfile,
  onOpenAdminPanel,
  onOpenContributions,
  onOpenLanguage,
  onOpenParental,
  onOpenPrivacy,
  onOpenHelpCenter,
  onOpenStats,
  onOpenSecurity,
  isSuperAdmin = false,
  onToast,
}) {
  const [charmOpen, setCharmOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [adminPendingCount, setAdminPendingCount] = useState(0);

  const newVisitors = useMemo(() => countNewVisitors(userId), [userId]);
  const menuGroups = useMemo(() => {
    const groups = ME_MENU_GROUPS.map((g) => [...g]);
    if (isSuperAdmin) groups.push([ADMIN_MENU_ITEM]);
    return groups;
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) return undefined;
    let cancelled = false;
    async function load() {
      try {
        const [vipRows, coinRows] = await Promise.all([
          loadPendingVipRequests(),
          loadPendingCoinPurchaseRequests(),
        ]);
        if (!cancelled) setAdminPendingCount(vipRows.length + coinRows.length);
      } catch {
        if (!cancelled) setAdminPendingCount(0);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  const level = profile.user_level ?? 1;
  const exp = Number(profile.user_exp ?? 0);
  const pct = userLevelPercent(exp, level);
  const curFloor = currentUserLevelExp(level);
  const nextTotal = nextUserLevelExp(level);
  const inLevel = Math.max(0, exp - curFloor);
  const levelSpan = nextTotal ? nextTotal - curFloor : 0;
  const isVip = effectiveVipLevel(profile) > 0;
  const locationLabel = formatProfileLocation(profile);

  function handleShortcut(key) {
    if (key === "vip") onOpenVip?.();
    else if (key === "shop") onOpenShop?.();
    else if (key === "show") onOpenPlayShow?.();
    else if (key === "home") onOpenMyHome?.();
    else onToast?.(`${ME_SHORTCUTS.find((s) => s.key === key)?.label ?? key} opened`);
  }

  const languageLabel = useMemo(() => {
    try {
      return localStorage.getItem("gplay.language") || "English";
    } catch {
      return "English";
    }
  }, []);

  function handleMenu(key) {
    if (key === "moments") onOpenMoments?.();
    else if (key === "stats") onOpenStats?.();
    else if (key === "badge") onOpenRankings?.();
    else if (key === "contributions") onOpenContributions?.();
    else if (key === "visitors") onOpenVisitors?.();
    else if (key === "invite") onOpenInvite?.();
    else if (key === "edit") onEditProfile?.();
    else if (key === "charm") setCharmOpen(true);
    else if (key === "blocked") setBlockedOpen(true);
    else if (key === "language") onOpenLanguage?.();
    else if (key === "parental") onOpenParental?.();
    else if (key === "privacy") onOpenPrivacy?.();
    else if (key === "help") onOpenHelpCenter?.();
    else if (key === "security") onOpenSecurity?.();
    else if (key === "admin") onOpenAdminPanel?.();
  }

  return (
    <div className="me-page me-page--clean">
      <button
        type="button"
        className={`me-hero me-hero--clean${isVip ? " me-hero--vip" : ""}`}
        onClick={onOpenPlayerCard}
      >
        <div
          className="me-hero-cover"
          style={profile.avatar_url ? { backgroundImage: `url(${profile.avatar_url})` } : undefined}
          aria-hidden
        />
        <div className="me-hero-avatar-wrap">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="me-hero-avatar" />
          ) : (
            <span className="me-hero-avatar me-hero-avatar--fallback">{initialFor(profile)}</span>
          )}
        </div>
        <div className="me-hero-body">
          <VipDisplayName
            as="p"
            name={profile.display_name}
            profile={profile}
            variant="light"
            className="me-hero-name"
          />
          {locationLabel && <p className="me-hero-location">{locationLabel}</p>}
          <div className="me-level-row">
            <span className="me-level-label">Lv.{level}</span>
            <span className="me-level-bar">
              <span className="me-level-fill" style={{ width: `${pct}%` }} />
            </span>
            {levelSpan > 0 && (
              <small className="me-level-fraction">
                {formatCompactNumber(Math.min(inLevel, levelSpan))}/{formatCompactNumber(levelSpan)}
              </small>
            )}
          </div>
        </div>
        <span className="me-hero-chevron" aria-hidden>›</span>
      </button>

      <div className="me-shortcuts me-shortcuts--clean">
        {ME_SHORTCUTS.map((item) => (
          <button key={item.key} type="button" className="me-shortcut" onClick={() => handleShortcut(item.key)}>
            <span className="me-shortcut-icon">
              <item.Icon />
            </span>
            <span>{item.label}</span>
            {item.badge && <em>{item.badge}</em>}
          </button>
        ))}
      </div>

      <ul className="me-menu-list me-menu-list--clean">
        {menuGroups.map((group, gi) => (
          <li key={`group-${gi}`} className="me-menu-group">
            <ul>
              {group.map((item) => (
                <li key={item.key}>
                  <button type="button" onClick={() => handleMenu(item.key)}>
                    <span className="me-menu-icon">
                      <item.Icon />
                    </span>
                    <span className="me-menu-label">{item.label}</span>
                    {item.hintKey === "visitors" && newVisitors > 0 && (
                      <span className="me-menu-hint me-menu-hint--accent">New Visitors {newVisitors}</span>
                    )}
                    {item.hintKey === "language" && (
                      <span className="me-menu-hint">{languageLabel}</span>
                    )}
                    {item.hintKey === "adminPending" && adminPendingCount > 0 && (
                      <span className="me-menu-hint">{adminPendingCount} pending</span>
                    )}
                    <span className="me-menu-chevron">›</span>
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {myRooms.length > 0 && (
        <section className="me-rooms-section me-rooms-section--clean">
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
