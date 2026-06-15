import { useState } from "react";
import { createPortal } from "react-dom";

const PROMOS = [
  {
    key: "pk-king",
    title: "PK King VS Queen",
    dates: "Join the battle — crown the champion",
    tiles: ["👑 King", "👸 Queen", "⚔️ VS", "🎁 Prizes"],
  },
];

export default function PromoModal({ onClose, onCheckNow }) {
  const [index, setIndex] = useState(0);
  const promo = PROMOS[index] ?? PROMOS[0];

  const modal = (
    <div className="promo-modal-backdrop" onClick={onClose}>
      <div className="promo-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="promo-modal-close" onClick={onClose} aria-label="Dismiss">×</button>
        <h2 className="promo-modal-title">{promo.title}</h2>
        <p className="promo-modal-dates">{promo.dates}</p>
        <div className="promo-modal-tiles">
          {promo.tiles.map((t) => (
            <span key={t} className="promo-modal-tile">{t}</span>
          ))}
        </div>
        <button type="button" className="promo-modal-cta" onClick={() => onCheckNow?.(promo.key)}>
          CHECK NOW
        </button>
        {PROMOS.length > 1 && (
          <div className="promo-modal-dots">
            {PROMOS.map((p, i) => (
              <button
                key={p.key}
                type="button"
                className={i === index ? "promo-modal-dot promo-modal-dot--active" : "promo-modal-dot"}
                onClick={() => setIndex(i)}
                aria-label={`Promo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}
