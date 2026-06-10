import { useState } from "react";
import { formatCompactNumber } from "../formatCompact.js";
import { COIN_PACKS, formatCoins } from "../gifts.js";
import { WEDDING_RING_TYPES } from "../church.js";
import CoinIcon from "./CoinIcon.jsx";

const RING_SHOP = WEDDING_RING_TYPES.map((r, i) => ({
  ...r,
  cost: [520, 1314, 2999, 4999, 9999, 13140][i] ?? 1314,
}));

const FRAME_SHOP = [
  { key: "gold", label: "Gold Frame", emoji: "🖼️", cost: 500 },
  { key: "diamond", label: "Diamond Frame", emoji: "💎", cost: 2000 },
  { key: "crown", label: "Crown Frame", emoji: "👑", cost: 5000 },
];

const TABS = ["Coins", "Rings", "Frames"];

export default function ShopSheet({ coins, isSuperAdmin, onClose, onToast }) {
  const [tab, setTab] = useState("Coins");

  function buyItem(label, cost) {
    if (!isSuperAdmin && coins < cost) {
      onToast?.(`Need ${cost} coins`);
      return;
    }
    onToast?.(`${label} purchased! Equip from profile.`);
  }

  return (
    <div className="profile-card-backdrop" onClick={onClose}>
      <div className="hub-sheet shop-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="hub-sheet-header">
          <button type="button" className="hub-sheet-back" onClick={onClose}>←</button>
          <h2>🏪 Shop</h2>
          <span className="shop-balance coin-inline"><CoinIcon size="sm" /> {formatCoins(coins, isSuperAdmin)}</span>
        </header>

        <div className="shop-tabs">
          {TABS.map((t) => (
            <button key={t} type="button" className={tab === t ? "shop-tab--active" : ""} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {tab === "Coins" && (
          <div className="coin-shop-grid shop-grid">
            {COIN_PACKS.map((pack) => (
              <button key={pack.id} type="button" className="coin-shop-pack shop-pack-btn" onClick={() => onToast?.("Coin top-ups via admin wallet / payment")}>
                <span className="coin-shop-pack-coins coin-inline"><CoinIcon size="sm" /> {formatCompactNumber(pack.coins)}</span>
                {pack.bonus && <span className="coin-shop-pack-bonus">{pack.bonus}</span>}
                <span className="coin-shop-pack-price">{pack.price}</span>
              </button>
            ))}
          </div>
        )}

        {tab === "Rings" && (
          <div className="shop-grid shop-grid--rings">
            {RING_SHOP.map((ring) => (
              <button key={ring.key} type="button" className="shop-ring-card" onClick={() => buyItem(ring.label, ring.cost)}>
                <span className="shop-ring-emoji">{ring.emoji}</span>
                <strong>{ring.label}</strong>
                <span className="shop-ring-cost coin-inline"><CoinIcon size="sm" /> {formatCompactNumber(ring.cost)}</span>
              </button>
            ))}
          </div>
        )}

        {tab === "Frames" && (
          <div className="shop-grid shop-grid--rings">
            {FRAME_SHOP.map((f) => (
              <button key={f.key} type="button" className="shop-ring-card" onClick={() => buyItem(f.label, f.cost)}>
                <span className="shop-ring-emoji">{f.emoji}</span>
                <strong>{f.label}</strong>
                <span className="shop-ring-cost coin-inline"><CoinIcon size="sm" /> {formatCompactNumber(f.cost)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
