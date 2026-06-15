import { useEffect, useState } from "react";
import { decideVipRequest, loadPendingVipRequests } from "../vipRequests.js";
import { decideCoinPurchaseRequest, loadPendingCoinPurchaseRequests } from "../purchaseRequests.js";
import { formatCompactNumber } from "../formatCompact.js";
import { nextVipLevelProgress } from "../vipStatus.js";
import CoinIcon from "./CoinIcon.jsx";

export default function AdminPanelSheet({
  userId,
  vipLevel = 0,
  earnedVipLevel = vipLevel,
  onClose,
  onProfileUpdate,
  onToast,
}) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingCoinRequests, setPendingCoinRequests] = useState([]);
  const [busy, setBusy] = useState(false);
  const vipProgress = nextVipLevelProgress(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [vipRows, coinRows] = await Promise.all([
          loadPendingVipRequests(),
          loadPendingCoinPurchaseRequests(),
        ]);
        if (!cancelled) {
          setPendingRequests(vipRows);
          setPendingCoinRequests(coinRows);
        }
      } catch (e) {
        if (!cancelled) onToast?.(e.message ?? "Could not load admin queue");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [onToast]);

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
        onProfileUpdate?.((prev) =>
          prev ? { ...prev, vip_level: Math.max(1, prev.vip_level ?? 1), title: `VIP ${Math.max(1, prev.vip_level ?? 1)}` } : prev,
        );
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
          <h2>Help Center</h2>
        </header>

        <p className="hub-sheet-hint">
          Super admin tools — approve VIP subscriptions and coin top-ups.
        </p>

        <section className="vip-admin-panel vip-status-panel">
          <h3>Lifetime VIP (Super Admin)</h3>
          <p>Your VIP badge and gold name glaze are always active — no weekly subscription needed.</p>
          <p>Display level: V{Math.max(1, vipLevel || earnedVipLevel || vipProgress.level)}</p>
        </section>

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
      </div>
    </div>
  );
}
