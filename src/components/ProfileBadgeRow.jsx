import CharmBadge from "./CharmBadge.jsx";
import { formatCompactNumber } from "../formatCompact.js";
import VipBadge from "./VipBadge.jsx";
import { effectiveVipLevel, isAutoVipTitle } from "../vipStatus.js";

function genderSymbol(gender) {
  const g = String(gender ?? "").trim().toLowerCase();
  if (["male", "m", "man", "boy"].includes(g)) return "♂";
  if (["female", "f", "woman", "girl"].includes(g)) return "♀";
  return "";
}

/** WePlay-style pills for white profile surfaces (readable contrast). */
export default function ProfileBadgeRow({ profile, compact = false }) {
  if (!profile) return null;
  const level = profile.user_level ?? 1;
  const title = profile.title?.trim();
  const g = genderSymbol(profile.gender);
  const charm = Number(profile.charm ?? 0);
  const vip = effectiveVipLevel(profile);
  const showTitle = title && !(isAutoVipTitle(title) && vip > 0);

  return (
    <div className={`profile-badge-row ${compact ? "profile-badge-row--compact" : ""}`}>
      <span className="profile-pill profile-pill--level" title={`Level ${level}`}>
        {g && <span className="profile-pill-gender">{g}</span>}
        Lv.{level}
      </span>
      <span className="profile-charm-stat" title={`${formatCompactNumber(charm)} charm`}>
        <CharmBadge charm={charm} className="charm-badge--profile" />
        <span>{formatCompactNumber(charm)}</span>
      </span>
      <VipBadge level={vip} className="vip-badge--profile" />
      {showTitle && (
        <span
          className={`profile-pill profile-pill--club${vip > 0 ? " vip-title-glow" : ""}`}
          data-vip-title={title}
        >
          {title}
        </span>
      )}
    </div>
  );
}
