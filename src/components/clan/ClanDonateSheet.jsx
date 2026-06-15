import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CLAN_DONATE_MAX,
  CLAN_DONATE_MIN,
  CLAN_DONATE_PRESETS,
  donateToClan,
} from "../../clanEconomy.js";
import { formatCompactNumber } from "../../formatCompact.js";
import { formatCoins } from "../../gifts.js";
import CoinIcon from "../CoinIcon.jsx";

export default function ClanDonateSheet({
  clan,
  userId,
  coins,
  isSuperAdmin,
  onClose,
  onToast,
  onCoinsChange,
  onDonated,
}) {
  const [amount, setAmount] = useState(CLAN_DONATE_PRESETS[0]);
  const [busy, setBusy] = useState(false);

  async function handleDonate() {
    if (!userId || !clan?.id || busy) return;
    const value = Math.floor(Number(amount) || 0);
    if (value < CLAN_DONATE_MIN) {
      onToast?.(`Minimum donation is ${CLAN_DONATE_MIN} coins`);
      return;
    }
    if (!isSuperAdmin && coins < value) {
      onToast?.("Not enough coins");
      return;
    }
    setBusy(true);
    try {
      const result = await donateToClan(clan.id, value);
      if (result?.new_balance != null) {
        onCoinsChange?.(Number(result.new_balance));
      }
      onDonated?.({
        fund: Number(result.fund ?? clan.fund ?? 0),
        clan_coins: Number(result.clan_coins ?? clan.clan_coins ?? 0),
        weekly_donation: Number(result.weekly_donation ?? 0),
        total_donation: Number(result.total_donation ?? 0),
      });
      onToast?.(`Donated ${formatCompactNumber(value)} coins to clan treasury`);
      onClose?.();
    } catch (err) {
      onToast?.(err?.message ?? "Could not donate");
    } finally {
      setBusy(false);
    }
  }

  const sheet = (
    <div className="profile-card-backdrop" onClick={onClose}>
      <div className="hub-sheet clan-donate-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="hub-sheet-header">
          <button type="button" className="hub-sheet-back" onClick={onClose}>
            ←
          </button>
          <h2>Donate to Clan</h2>
          <span />
        </header>

        <div className="clan-donate-body">
          <p className="clan-donate-lead">
            Donations add to <strong>Fund</strong> (lifetime) and <strong>Clan Coins</strong> (spendable
            treasury).
          </p>

          <div className="clan-donate-balance">
            <span>Your balance</span>
            <strong className="coin-inline">
              <CoinIcon size="sm" /> {formatCoins(coins, isSuperAdmin)}
            </strong>
          </div>

          <div className="clan-donate-presets">
            {CLAN_DONATE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={amount === preset ? "clan-donate-preset--active" : ""}
                onClick={() => setAmount(preset)}
              >
                {formatCompactNumber(preset)}
              </button>
            ))}
          </div>

          <label className="clan-donate-custom">
            <span>Custom amount</span>
            <input
              type="number"
              min={CLAN_DONATE_MIN}
              max={CLAN_DONATE_MAX}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <button type="button" className="clan-donate-submit" disabled={busy} onClick={handleDonate}>
            {busy ? "Donating…" : "Donate"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
