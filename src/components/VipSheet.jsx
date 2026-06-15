import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { loadMyVipRequest, requestVip } from "../vipRequests.js";
import { VIP_TIERS } from "../vipTiers.js";
import { formatCompactNumber } from "../formatCompact.js";
import { nextVipLevelProgress } from "../vipStatus.js";
import VipBadge from "./VipBadge.jsx";
import { IconCrown, IconGem, IconGift, IconStats, IconStar, IconVoiceRoom, UiIcon } from "./NavIcons.jsx";

const VIP_PRIVILEGES = [
  { Icon: IconCrown, label: "VIP Badge" },
  { Icon: IconStar, label: "Gold Name" },
  { Icon: IconGift, label: "VIP Gifts" },
  { Icon: IconVoiceRoom, label: "Room Identity" },
  { Icon: IconStats, label: "VIP Stats" },
  { Icon: IconGem, label: "Royal Perks" },
];

function vipPerks(level) {
  if (level >= 10) return ["Royal badge", "Gold name glaze", "All VIP gifts unlocked"];
  if (level >= 7) return ["Elite badge", "Gold name glaze", "Priority room identity"];
  if (level >= 4) return ["Advanced badge", "VIP gifts unlocked", "Profile VIP stats"];
  return ["VIP badge", "Gold name glaze", "VIP gifts unlocked"];
}

export default function VipSheet({
  userId,
  vipLevel = 0,
  earnedVipLevel = vipLevel,
  vipPoints = 0,
  vipExpiresAt = null,
  isSuperAdmin = false,
  onClose,
  onProfileUpdate,
  onToast,
}) {
  const [pendingMine, setPendingMine] = useState(null);
  const [busy, setBusy] = useState(false);
  const vipProgress = nextVipLevelProgress(vipPoints);
  const displayLevel = Math.max(1, earnedVipLevel || vipProgress.level);
  const expiresLabel = vipExpiresAt
    ? new Date(vipExpiresAt).toLocaleDateString([], { month: "short", day: "numeric" })
    : null;

  useEffect(() => {
    if (isSuperAdmin || !userId) return undefined;
    let cancelled = false;
    async function load() {
      try {
        const row = await loadMyVipRequest(userId);
        if (!cancelled) setPendingMine(row);
      } catch (e) {
        if (!cancelled) onToast?.(e.message ?? "Could not load VIP requests");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, onToast, userId]);

  async function handleRequest() {
    setBusy(true);
    try {
      const row = await requestVip(userId);
      setPendingMine(row);
      onToast?.("VIP weekly request sent to super admin");
    } catch (e) {
      onToast?.(e.message ?? "Could not request VIP");
    } finally {
      setBusy(false);
    }
  }

  const sheet = (
    <div className="gplay-mobile-shell-backdrop" onClick={onClose}>
      <div className="gplay-mobile-shell vip-sheet vip-sheet--full" onClick={(e) => e.stopPropagation()}>
        <header className="vip-membership-header">
          <button type="button" className="vip-membership-back" onClick={onClose} aria-label="Back">‹</button>
          <h2>My Membership</h2>
          <span aria-hidden />
        </header>

        <div className="vip-membership-scroll">
          <section className="vip-growth-card">
            <div className="vip-growth-top">
              <VipBadge level={displayLevel} className="vip-badge--profile" />
              <div>
                <div className="vip-growth-level">V{displayLevel}</div>
                <p className="vip-growth-meta">
                  {formatCompactNumber(vipPoints)} VIP points
                  {vipProgress.next ? ` · ${formatCompactNumber(vipProgress.next)} to V${vipProgress.level + 1}` : " · Max level"}
                </p>
              </div>
            </div>
            <div className="vip-growth-bar" aria-hidden>
              <div className="vip-growth-bar-fill" style={{ width: `${Math.round(vipProgress.progress * 100)}%` }} />
            </div>
            {vipLevel > 0 && expiresLabel && (
              <p className="vip-growth-meta">Active until {expiresLabel}</p>
            )}
          </section>

          {isSuperAdmin && (
            <section className="vip-admin-panel vip-status-panel">
              <h3>Lifetime VIP (Super Admin)</h3>
              <p>Your VIP badge and gold name glaze are always active — no weekly subscription needed.</p>
              <p>Display level: V{displayLevel}</p>
            </section>
          )}

          {!isSuperAdmin && (
            <section className="vip-admin-panel vip-status-panel">
              <h3>{vipLevel > 0 ? `VIP active until ${expiresLabel || "soon"}` : "VIP inactive"}</h3>
              <p>
                VIP is a weekly membership approved by super admin. Your badge level (V{displayLevel}) grows from
                VIP activity points — not from the purchase tier.
              </p>
              <p>Earned level: V{displayLevel} · Points: {formatCompactNumber(vipPoints)}</p>
              {vipProgress.next ? (
                <p>Next level at {formatCompactNumber(vipProgress.next)} VIP points</p>
              ) : (
                <p>Max VIP level reached</p>
              )}
              <button type="button" className="vip-tier-buy" disabled={busy || Boolean(pendingMine)} onClick={handleRequest}>
                {pendingMine ? "Pending approval" : vipLevel > 0 ? "Renew 7 days" : "Request weekly VIP"}
              </button>
            </section>
          )}

          <h3 className="vip-privileges-title">Privileges</h3>
          <div className="vip-privileges-grid">
            {VIP_PRIVILEGES.map((p) => (
              <div key={p.label} className="vip-privilege-item">
                <span className="vip-privilege-icon" aria-hidden>
                  <UiIcon Icon={p.Icon} />
                </span>
                <span>{p.label}</span>
              </div>
            ))}
          </div>

          <div className="vip-tiers">
            {VIP_TIERS.map((tier) => (
              <article key={tier.level} className={`vip-tier ${earnedVipLevel >= tier.level ? "vip-tier--owned" : ""}`}>
                <VipBadge level={tier.level} className="vip-badge--profile" />
                <div>
                  <strong>{tier.label}</strong>
                  <ul>
                    {vipPerks(tier.level).map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
                {earnedVipLevel >= tier.level ? (
                  <span className="vip-tier-badge">{vipLevel >= tier.level ? "Active" : "Earned"}</span>
                ) : vipProgress.level + 1 === tier.level ? (
                  <span className="vip-tier-badge vip-tier-badge--pending">Next</span>
                ) : (
                  <span className="vip-tier-badge vip-tier-badge--pending">Locked</span>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
