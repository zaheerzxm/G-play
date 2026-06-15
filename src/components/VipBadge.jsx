import { vipTierFromLevel } from "../vipTiers.js";

function VipBadgeIcon({ tier, minimal = false }) {
  if (minimal) {
    return (
      <svg className="vip-badge-svg" viewBox="0 0 96 96" aria-hidden focusable="false">
        <path className="vip-badge-outer" d="M48 6 82 25v41L48 90 14 66V25L48 6Z" />
        <path className="vip-badge-inner" d="M48 20 70 32v26L48 74 26 58V32L48 20Z" />
        <path className="vip-badge-star" d="M48 28l6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2 6-13Z" />
      </svg>
    );
  }

  const withSpikes = ["silver-spike", "silver-sun", "silver-royal", "gold-spike", "gold-rank", "gold-wings", "gold-royal"].includes(tier);
  const withWings = ["gold-wings", "gold-royal"].includes(tier);
  const withRank = ["silver-rank", "silver-royal", "gold-rank", "gold-wings", "gold-royal"].includes(tier);
  const withMiniStars = ["silver-sun", "silver-royal", "gold-spike", "gold-wings", "gold-royal"].includes(tier);
  const withHalo = ["silver-sun", "silver-royal", "gold-rank", "gold-wings", "gold-royal"].includes(tier);

  return (
    <svg className="vip-badge-svg" viewBox="0 0 96 96" aria-hidden focusable="false">
      {withHalo && <circle className="vip-badge-halo" cx="48" cy="48" r="39" />}
      {withWings && (
        <g className="vip-badge-wings">
          <path d="M23 58C12 58 6 49 5 37c12 2 22 9 28 20-3 1-6 1-10 1Z" />
          <path d="M73 58c11 0 17-9 18-21-12 2-22 9-28 20 3 1 6 1 10 1Z" />
          <path d="M25 69C15 70 9 65 7 57c10 0 19 3 26 11-2 1-5 1-8 1Z" />
          <path d="M71 69c10 1 16-4 18-12-10 0-19 3-26 11 2 1 5 1 8 1Z" />
        </g>
      )}
      {withSpikes && (
        <g className="vip-badge-spikes">
          <path d="M48 4l5 14H43L48 4Z" />
          <path d="M79 20l-4 14-7-7 11-7Z" />
          <path d="M17 20l11 7-7 7-4-14Z" />
          <path d="M88 52l-13 6v-10l13 4Z" />
          <path d="M8 52l13-4v10L8 52Z" />
        </g>
      )}
      <path className="vip-badge-shadow" d="M48 8 80 26v38L48 86 16 64V26L48 8Z" />
      <path className="vip-badge-outer" d="M48 6 82 25v41L48 90 14 66V25L48 6Z" />
      <path className="vip-badge-inner" d="M48 20 70 32v26L48 74 26 58V32L48 20Z" />
      {withRank && (
        <g className="vip-badge-rank">
          <path d="M31 62h34v7H31z" />
          <path d="M36 53h24v7H36z" />
        </g>
      )}
      {withMiniStars && (
        <g className="vip-badge-mini-stars">
          <path d="M30 36l3 6 7 1-5 4 1 7-6-3-6 3 1-7-5-4 7-1 3-6Z" />
          <path d="M66 36l3 6 7 1-5 4 1 7-6-3-6 3 1-7-5-4 7-1 3-6Z" />
        </g>
      )}
      <path className="vip-badge-star" d="M48 28l6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2 6-13Z" />
      <path className="vip-badge-star-hi" d="M48 33l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-7Z" />
    </svg>
  );
}

export default function VipBadge({ level, compact = false, className = "" }) {
  const tier = vipTierFromLevel(level);
  if (!tier) return null;

  return (
    <span
      className={[
        "vip-badge",
        `vip-badge--${tier.tier}`,
        "vip-badge--corner-lv",
        compact ? "vip-badge--compact" : "",
        className,
      ].filter(Boolean).join(" ")}
      title={tier.label}
      aria-label={tier.label}
    >
      <VipBadgeIcon tier={tier.tier} minimal={compact} />
      <span className="vip-badge-lv">{tier.level}</span>
    </span>
  );
}
