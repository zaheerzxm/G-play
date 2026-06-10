import { charmTierFromTotal, charmTierIconSrc } from "../charmTiers.js";
import { formatCompactNumber } from "../formatCompact.js";

export default function CharmBadge({ charm, compact = false, className = "" }) {
  const tier = charmTierFromTotal(charm ?? 0);
  if (!tier) return null;

  const iconSrc = charmTierIconSrc(tier);

  return (
    <span
      className={[
        "charm-badge",
        `charm-badge--${tier.tier}`,
        "charm-badge--corner-lv",
        compact ? "charm-badge--compact" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={`Charm Lv.${tier.level} · ${formatCompactNumber(charm ?? 0)} total`}
      aria-label={`Charm level ${tier.level}`}
    >
      {iconSrc ? (
        <img src={iconSrc} alt="" className="charm-badge-icon" draggable={false} />
      ) : (
        <span className="charm-badge-gem" aria-hidden />
      )}
      <span className="charm-badge-lv">{tier.level}</span>
    </span>
  );
}
