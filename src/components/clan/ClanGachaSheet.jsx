import { useState } from "react";
import { createPortal } from "react-dom";
import {
  CLAN_GACHA_POOL_PREVIEW,
  CLAN_GACHA_SINGLE_COST,
  CLAN_GACHA_TEN_COST,
} from "../../clanGachaPool.js";
import {
  canSpendClanTreasury,
  CLAN_TREASURY_SPEND_DENIED,
  formatGachaRewards,
  pullClanGacha,
} from "../../clanEconomy.js";
import { formatCompactNumber } from "../../formatCompact.js";

export default function ClanGachaSheet({
  clan,
  userId,
  myRole,
  isSuperAdmin = false,
  onClose,
  onToast,
  onCoinsChange,
  onPulled,
}) {
  const [busy, setBusy] = useState(false);
  const [lastRewards, setLastRewards] = useState(null);
  const canSpend = canSpendClanTreasury(myRole, isSuperAdmin);
  const clanCoins = clan?.clan_coins ?? 0;

  async function handlePull(count) {
    if (!userId || !clan?.id || busy) return;
    if (!canSpend) {
      onToast?.(CLAN_TREASURY_SPEND_DENIED);
      return;
    }
    const cost = count === 10 ? CLAN_GACHA_TEN_COST : CLAN_GACHA_SINGLE_COST;
    if (clanCoins < cost) {
      onToast?.("Not enough clan coins");
      return;
    }
    setBusy(true);
    setLastRewards(null);
    try {
      const result = await pullClanGacha(clan.id, count, userId);
      if (result?.new_balance != null) {
        onCoinsChange?.(Number(result.new_balance));
      }
      setLastRewards(result?.rewards ?? []);
      await onPulled?.();
      const summary = formatGachaRewards(result?.rewards).slice(0, 3).join(", ");
      const extra = (result?.rewards?.length ?? 0) > 3 ? "…" : "";
      onToast?.(`Pulled: ${summary}${extra}`);
    } catch (err) {
      onToast?.(err?.message ?? "Could not pull");
    } finally {
      setBusy(false);
    }
  }

  const sheet = (
    <div className="profile-card-backdrop" onClick={onClose}>
      <div className="hub-sheet clan-gacha-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="hub-sheet-header">
          <button type="button" className="hub-sheet-back" onClick={onClose}>
            ←
          </button>
          <h2>Clan Gacha</h2>
          <span />
        </header>

        <div className="clan-store-treasury">
          <span>Treasury</span>
          <strong>{formatCompactNumber(clanCoins)} clan coins</strong>
        </div>

        {!canSpend && (
          <p className="clan-spend-blocked">{CLAN_TREASURY_SPEND_DENIED}</p>
        )}

        <div className="clan-gacha-preview">
          <h3>Pool</h3>
          <ul>
            {CLAN_GACHA_POOL_PREVIEW.map((row) => (
              <li key={row.label}>
                <span aria-hidden>{row.emoji}</span>
                <span>{row.label}</span>
                <em>{row.weight}</em>
              </li>
            ))}
          </ul>
        </div>

        {lastRewards && lastRewards.length > 0 && (
          <div className="clan-gacha-results" aria-live="polite">
            <h3>Last pull</h3>
            <div className="clan-gacha-results-row">
              {lastRewards.map((reward, idx) => (
                <span key={`${reward.type}-${idx}`} className="clan-gacha-result-chip">
                  {reward.type === "coins" && `🪙 ${reward.amount}`}
                  {reward.type === "gift" && `🎁 ${reward.quantity}`}
                  {reward.type === "clan_item" && `${reward.emoji ?? "🎁"} ${reward.name}`}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="clan-gacha-actions">
          <button
            type="button"
            className="clan-gacha-btn"
            disabled={busy || !canSpend || clanCoins < CLAN_GACHA_SINGLE_COST}
            onClick={() => handlePull(1)}
          >
            {busy ? "Pulling…" : `Pull ×1 (${formatCompactNumber(CLAN_GACHA_SINGLE_COST)})`}
          </button>
          <button
            type="button"
            className="clan-gacha-btn clan-gacha-btn--ten"
            disabled={busy || !canSpend || clanCoins < CLAN_GACHA_TEN_COST}
            onClick={() => handlePull(10)}
          >
            {busy ? "Pulling…" : `Pull ×10 (${formatCompactNumber(CLAN_GACHA_TEN_COST)})`}
          </button>
        </div>

        <p className="clan-store-hint">Pulls spend shared clan treasury coins.</p>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
