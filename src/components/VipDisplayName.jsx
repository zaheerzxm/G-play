import { effectiveVipLevel } from "../vipStatus.js";

/**
 * VIP name styles:
 * - `light` — solid gold on white cards (chats, profile, Me)
 * - `chart` — white text + golden glaze (voice room seats & chat)
 * - `dark` — solid gold on dark backgrounds (legacy / non-room)
 */
export function vipNameClass(profile, variant = "dark") {
  if (effectiveVipLevel(profile) <= 0) return "";
  if (variant === "light") return "vip-name-gold";
  if (variant === "chart") return "vip-name-glow";
  return "vip-name-solid";
}

export default function VipDisplayName({
  name,
  profile,
  className = "",
  variant = "dark",
  as: Tag = "span",
  ...rest
}) {
  const display = name || "Guest";
  const vip = effectiveVipLevel(profile);

  if (!vip) {
    return (
      <Tag className={`vip-name-plain ${className}`.trim()} {...rest}>
        {display}
      </Tag>
    );
  }

  return (
    <Tag
      className={`${vipNameClass(profile, variant)} ${className}`.trim()}
      data-vip-name={display}
      {...rest}
    >
      {display}
    </Tag>
  );
}
