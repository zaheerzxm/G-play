import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CoinIcon from "./CoinIcon.jsx";

const PACK_ITEMS = [
  { id: "starter", name: "Starter Pack", coins: 500, bonus: "+50 bonus", emoji: "🎁" },
  { id: "value", name: "Value Pack", coins: 1200, bonus: "Best value", emoji: "💎" },
  { id: "mega", name: "Mega Pack", coins: 5000, bonus: "VIP points", emoji: "👑" },
];

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function GiftPackSheet({ onClose, onToast }) {
  const [endsAt] = useState(() => Date.now() + 4 * 60 * 60 * 1000);
  const [countdown, setCountdown] = useState(() => formatCountdown(endsAt - Date.now()));

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(formatCountdown(endsAt - Date.now()));
    }, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  const sheet = (
    <div className="gplay-mobile-shell-backdrop" onClick={onClose}>
      <div className="gplay-mobile-shell gift-pack-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="gift-pack-header">
          <button type="button" className="gift-pack-back" onClick={onClose} aria-label="Back">‹</button>
          <h2>Gift Pack</h2>
          <span className="gift-pack-timer" aria-live="polite">{countdown}</span>
        </header>
        <p className="gift-pack-lead">Limited-time coin packs — grab before the timer ends!</p>
        <ul className="gift-pack-list">
          {PACK_ITEMS.map((pack) => (
            <li key={pack.id} className="gift-pack-row">
              <span className="gift-pack-emoji" aria-hidden>{pack.emoji}</span>
              <div className="gift-pack-meta">
                <strong>{pack.name}</strong>
                <small>{pack.bonus}</small>
              </div>
              <button
                type="button"
                className="gift-pack-buy"
                onClick={() => onToast?.(`${pack.name} — open Shop to purchase`)}
              >
                <CoinIcon size="sm" /> {pack.coins}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
  return createPortal(sheet, document.body);
}
