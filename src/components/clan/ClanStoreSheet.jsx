import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CLAN_STORE_CATALOG } from "../../clanStoreCatalog.js";
import {
  canSpendClanTreasury,
  CLAN_TREASURY_SPEND_DENIED,
  loadClanStorePurchases,
  purchaseClanStoreItem,
} from "../../clanEconomy.js";
import { formatCompactNumber } from "../../formatCompact.js";

export default function ClanStoreSheet({
  clan,
  userId,
  myRole,
  isSuperAdmin = false,
  onClose,
  onToast,
  onCoinsChange,
  onPurchased,
}) {
  const [ownedIds, setOwnedIds] = useState(() => new Set());
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const canSpend = canSpendClanTreasury(myRole, isSuperAdmin);
  const clanCoins = clan?.clan_coins ?? 0;

  const refreshOwned = useCallback(async () => {
    if (!userId || !clan?.id) {
      setOwnedIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const ids = await loadClanStorePurchases(userId, clan.id);
      setOwnedIds(ids);
    } catch {
      setOwnedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [userId, clan?.id]);

  useEffect(() => {
    refreshOwned();
  }, [refreshOwned]);

  async function handlePurchase(item) {
    if (!userId || !clan?.id || busyId) return;
    if (!canSpend) {
      onToast?.(CLAN_TREASURY_SPEND_DENIED);
      return;
    }
    if (item.oneTime && ownedIds.has(item.id)) {
      onToast?.("Already purchased");
      return;
    }
    if (clanCoins < item.price) {
      onToast?.("Not enough clan coins");
      return;
    }
    setBusyId(item.id);
    try {
      const result = await purchaseClanStoreItem(clan.id, item.id, userId);
      if (result?.new_balance != null) {
        onCoinsChange?.(Number(result.new_balance));
      }
      await refreshOwned();
      await onPurchased?.();
      const reward = result?.reward;
      let label = item.name;
      if (reward?.type === "gift") {
        label = `${reward.quantity}× ${item.name}`;
      }
      onToast?.(`Purchased ${label}!`);
    } catch (err) {
      onToast?.(err?.message ?? "Could not purchase");
    } finally {
      setBusyId(null);
    }
  }

  const sheet = (
    <div className="profile-card-backdrop" onClick={onClose}>
      <div className="hub-sheet clan-store-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="hub-sheet-header">
          <button type="button" className="hub-sheet-back" onClick={onClose}>
            ←
          </button>
          <h2>Clan Store</h2>
          <span />
        </header>

        <div className="clan-store-treasury">
          <span>Treasury</span>
          <strong>{formatCompactNumber(clanCoins)} clan coins</strong>
        </div>

        {!canSpend && (
          <p className="clan-spend-blocked">{CLAN_TREASURY_SPEND_DENIED}</p>
        )}

        {loading ? (
          <p className="clan-store-hint">Loading…</p>
        ) : (
          <div className="clan-store-grid">
            {CLAN_STORE_CATALOG.map((item) => {
              const owned = item.oneTime && ownedIds.has(item.id);
              const affordable = clanCoins >= item.price;
              const disabled = !canSpend || owned || !affordable || busyId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`clan-store-card${owned ? " clan-store-card--owned" : ""}`}
                  disabled={disabled}
                  onClick={() => handlePurchase(item)}
                >
                  <span className="clan-store-card-emoji" aria-hidden>
                    {item.emoji}
                  </span>
                  <strong>{item.name}</strong>
                  <small>{item.hint}</small>
                  <em>{owned ? "Owned" : `${formatCompactNumber(item.price)} coins`}</em>
                </button>
              );
            })}
          </div>
        )}

        <p className="clan-store-hint">Purchases spend shared clan treasury coins.</p>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
