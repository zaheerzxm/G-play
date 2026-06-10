import CharmBadge from "./CharmBadge.jsx";
import VipBadge from "./VipBadge.jsx";
import { effectiveVipLevel, isAutoVipTitle } from "../vipStatus.js";

export default function UserBadges({ profile, compact = false, showLevel = true }) {
  if (!profile) return null;
  const level = profile.user_level ?? 1;
  const vip = effectiveVipLevel(profile);
  const title = profile.title?.trim();
  const showTitle = title && !(isAutoVipTitle(title) && vip > 0);

  return (
    <span className={`user-badges ${compact ? "user-badges--chat" : ""}`}>
      <CharmBadge charm={profile.charm} compact={compact} className={compact ? "charm-badge--chat" : ""} />
      {showLevel && (
        <span className="user-badge user-badge--level" title={`Level ${level}`}>
          Lv.{level}
        </span>
      )}
      <VipBadge level={vip} compact={compact} className={compact ? "vip-badge--chat" : ""} />
      {showTitle && (
        <span
          className={`user-badge user-badge--title${vip > 0 ? " vip-title-glow" : ""}`}
          data-vip-title={title}
        >
          {title}
        </span>
      )}
    </span>
  );
}
