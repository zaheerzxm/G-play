import { useEffect, useState } from "react";
import { decideVipRequest, loadMyVipRequest, loadPendingVipRequests, requestVip } from "../vipRequests.js";
import { decideCoinPurchaseRequest, loadPendingCoinPurchaseRequests } from "../purchaseRequests.js";
import { VIP_TIERS } from "../vipTiers.js";
import { formatCompactNumber } from "../formatCompact.js";
import { nextVipLevelProgress } from "../vipStatus.js";
import VipBadge from "./VipBadge.jsx";
import CoinIcon from "./CoinIcon.jsx";

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
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingCoinRequests, setPendingCoinRequests] = useState([]);
  const [busy, setBusy] = useState(false);
  const vipProgress = nextVipLevelProgress(vipPoints);
  const expiresLabel = vipExpiresAt
    ? new Date(vipExpiresAt).toLocaleDateString([], { month: "short", day: "numeric" })
    : null;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (isSuperAdmin) {
          const [vipRows, coinRows] = await Promise.all([loadPendingVipRequests(), loadPendingCoinPurchaseRequests()]);
          if (!cancelled) {
            setPendingRequests(vipRows);
            setPendingCoinRequests(coinRows);
          }
        } else if (userId) {
          const row = await loadMyVipRequest(userId);
          if (!cancelled) setPendingMine(row);
        }
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

  async function handleDecision(row, approve) {
    setBusy(true);
    try {
      await decideVipRequest({
        requestId: row.id,
        userId: row.user_id,
        level: row.requested_level,
        adminId: userId,
        approve,
      });
      setPendingRequests((prev) => prev.filter((item) => item.id !== row.id));
      onToast?.(approve ? "VIP approved" : "VIP rejected");
      if (approve && row.user_id === userId) {
        onProfileUpdate?.((prev) => (prev ? { ...prev, vip_level: Math.max(1, prev.vip_level ?? 1), title: `VIP ${Math.max(1, prev.vip_level ?? 1)}` } : prev));
      }
    } catch (e) {
      onToast?.(e.message ?? "Could not update VIP request");
    } finally {
      setBusy(false);
    }
  }

  async function handleCoinDecision(row, approve) {
    setBusy(true);
    try {
      await decideCoinPurchaseRequest({
        requestId: row.id,
        userId: row.user_id,
        coins: row.coins,
        adminId: userId,
        approve,
      });
      setPendingCoinRequests((prev) => prev.filter((item) => item.id !== row.id));
      onToast?.(approve ? "Coin top-up approved" : "Coin top-up rejected");
    } catch (e) {
      onToast?.(e.message ?? "Could not update coin request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profile-card-backdrop" onClick={onClose}>
      <div className="hub-sheet vip-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="hub-sheet-header">
          <button type="button" className="hub-sheet-back" onClick={onClose}>←</button>
          <h2>💎 VIP</h2>
          {vipLevel > 0 ? <span className="vip-current">V{vipLevel}</span> : <span className="vip-current vip-current--off">Off</span>}
        </header>

        <p className="hub-sheet-hint">
          Weekly VIP is approved by super admin. Level grows from VIP activity like paid gifting.
        </p>

        {isSuperAdmin && (
          <section className="vip-admin-panel vip-status-panel">
            <h3>Lifetime VIP (Super Admin)</h3>
            <p>Your VIP badge and gold name glaze are always active — no weekly subscription needed.</p>
            <p>Display level: V{Math.max(1, vipLevel || earnedVipLevel || vipProgress.level)}</p>
          </section>
        )}

        {!isSuperAdmin && (
          <section className="vip-admin-panel vip-status-panel">
            <h3>{vipLevel > 0 ? `VIP active until ${expiresLabel || "soon"}` : "VIP inactive"}</h3>
            <p>Earned level: V{Math.max(1, earnedVipLevel || vipProgress.level)} · Points: {formatCompactNumber(vipPoints)}</p>
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

        {isSuperAdmin && (
          <section className="vip-admin-panel">
            <h3>VIP approvals</h3>
            {pendingRequests.length === 0 ? (
              <p>No pending VIP requests</p>
            ) : (
              <div className="vip-request-list">
                {pendingRequests.map((row) => (
                  <article key={row.id} className="vip-request-row">
                    {row.profiles?.avatar_url ? (
                      <img src={row.profiles.avatar_url} alt="" />
                    ) : (
                      <span>{(row.profiles?.display_name || "?").charAt(0).toUpperCase()}</span>
                    )}
                    <div>
                      <strong>{row.profiles?.display_name || "User"}</strong>
                      <small>ID: {row.profiles?.user_code || "..."}</small>
                      <small>Weekly VIP · earned V{Math.max(1, row.profiles?.vip_level ?? 1)}</small>
                    </div>
                    <button type="button" disabled={busy} onClick={() => handleDecision(row, true)}>Approve</button>
                    <button type="button" disabled={busy} className="vip-request-reject" onClick={() => handleDecision(row, false)}>Reject</button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {isSuperAdmin && (
          <section className="vip-admin-panel">
            <h3>Coin approvals</h3>
            {pendingCoinRequests.length === 0 ? (
              <p>No pending coin requests</p>
            ) : (
              <div className="vip-request-list">
                {pendingCoinRequests.map((row) => (
                  <article key={row.id} className="vip-request-row">
                    {row.profiles?.avatar_url ? (
                      <img src={row.profiles.avatar_url} alt="" />
                    ) : (
                      <span>{(row.profiles?.display_name || "?").charAt(0).toUpperCase()}</span>
                    )}
                    <div>
                      <strong>{row.profiles?.display_name || "User"}</strong>
                      <small>ID: {row.profiles?.user_code || "..."}</small>
                      <small className="coin-inline"><CoinIcon size="sm" /> {formatCompactNumber(row.coins)} · {row.price_label}</small>
                    </div>
                    <button type="button" disabled={busy} onClick={() => handleCoinDecision(row, true)}>Approve</button>
                    <button type="button" disabled={busy} className="vip-request-reject" onClick={() => handleCoinDecision(row, false)}>Reject</button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

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
  );
}
