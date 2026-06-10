import { formatCompactNumber } from "../formatCompact.js";
import { COIN_PACKS, formatCoins } from "../gifts.js";
import { loadMyPendingCoinRequest, requestCoinPurchase } from "../purchaseRequests.js";
import CoinIcon from "./CoinIcon.jsx";
import { useEffect, useState } from "react";

export default function CoinShopSheet({ userId, coins, isSuperAdmin, onToast, onClose }) {
  const [pending, setPending] = useState(null);
  const [busyPack, setBusyPack] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadMyPendingCoinRequest(userId)
      .then((row) => {
        if (!cancelled) setPending(row);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleRequest(pack) {
    if (isSuperAdmin) {
      onToast?.("Super admin already has unlimited test coins");
      return;
    }
    if (pending) {
      onToast?.("You already have a pending coin request");
      return;
    }
    setBusyPack(pack.id);
    try {
      const row = await requestCoinPurchase(userId, pack.id);
      setPending(row);
      onToast?.("Coin request sent to super admin");
    } catch (e) {
      onToast?.(e.message ?? "Could not request coins");
    } finally {
      setBusyPack(null);
    }
  }

  return (
    <div className="buy-gold-page">
      <header className="buy-gold-header">
        <button type="button" className="sheet-back" onClick={onClose} aria-label="Back">‹</button>
        <h1>Buy Gold</h1>
      </header>

      <div className="buy-gold-balance">
        <span>Balance:</span>
        <span className="buy-gold-balance-val">
          {formatCoins(coins, isSuperAdmin)} <CoinIcon size="lg" />
        </span>
      </div>

      <div className="buy-gold-grid">
        {COIN_PACKS.map((pack) => (
          <button
            key={pack.id}
            type="button"
            className={`buy-gold-card ${pack.giftBroadcast ? "buy-gold-card--featured" : ""}`}
            aria-label={`${pack.coins} gold ${pack.price}`}
            disabled={Boolean(busyPack) || Boolean(pending)}
            onClick={() => handleRequest(pack)}
          >
            {pack.giftBroadcast && <span className="buy-gold-banner">Gift Broadcast</span>}
            <span className="buy-gold-coins-art" aria-hidden>🪙</span>
            <span className="buy-gold-amount">{formatCompactNumber(pack.coins)} Gold</span>
            <span className="buy-gold-price">{pack.price}</span>
            {busyPack === pack.id && <span className="buy-gold-pending">Sending…</span>}
            {pending?.pack_id === pack.id && <span className="buy-gold-pending">Pending</span>}
          </button>
        ))}
      </div>

      <footer className="buy-gold-legal">
        <p>1. If recharge fails, contact support with your payment receipt.</p>
        <p>2. Private trading of coins or accounts is prohibited.</p>
        <p>3. Users under 18 must have parental consent to recharge.</p>
      </footer>
    </div>
  );
}
