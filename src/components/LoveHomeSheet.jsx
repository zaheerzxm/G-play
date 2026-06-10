import { useEffect, useState } from "react";
import { loadGiftsBetweenUsers } from "../giftTransactions.js";
import { ringMeta } from "../church.js";
import { bondMeta, daysTogether, partnerUserId } from "../relationships.js";
import { loadProfilesForUserIds } from "../profile.js";
import AvatarImg from "./AvatarImg.jsx";

export default function LoveHomeSheet({ userId, bond, onClose, onSendGift }) {
  const [partner, setPartner] = useState(null);
  const [gifts, setGifts] = useState([]);

  useEffect(() => {
    if (!bond || !userId) return;
    const pid = partnerUserId(bond, userId);
    loadProfilesForUserIds([pid]).then((map) => setPartner(map[pid] ?? null));
    loadGiftsBetweenUsers(userId, pid, 15).then(setGifts);
  }, [bond, userId]);

  if (!bond) return null;

  const meta = bondMeta(bond.bondType);
  const days = daysTogether(bond.startedAt);
  const ring = ringMeta(bond.weddingRing ?? "floral");
  const partnerName = partner?.display_name ?? "Partner";

  return (
    <div className="profile-card-backdrop love-home-backdrop" onClick={onClose}>
      <div className="love-home" onClick={(e) => e.stopPropagation()}>
        <header className="love-home-header">
          <button type="button" className="love-home-back" onClick={onClose} aria-label="Back">
            ←
          </button>
          <h2>Love Home</h2>
        </header>

        <div className="love-home-hero">
          <div className="love-home-ring">{ring.emoji}</div>
          <p className="love-home-married">
            {meta.label} · married <strong>{days}</strong> day{days === 1 ? "" : "s"}
          </p>
          <p className="love-home-ring-name">{ring.label}</p>
          <div className="love-home-couple">
            <AvatarImg
              src={null}
              fallback="Y"
              className="love-home-avatar love-home-avatar--fallback"
              imgClassName="love-home-avatar"
            />
            <span className="love-home-heart">💕</span>
            <AvatarImg
              src={partner?.avatar_url}
              fallback={partnerName.charAt(0).toUpperCase()}
              className="love-home-avatar love-home-avatar--fallback"
              imgClassName="love-home-avatar"
            />
          </div>
        </div>

        <section className="love-home-section">
          <h3>Recent gifts</h3>
          <ul className="love-home-gifts">
            {gifts.length === 0 && (
              <li className="love-home-gift love-home-gift--empty">No gifts yet — send one to your partner</li>
            )}
            {gifts.map((g) => (
              <li key={g.id} className="love-home-gift">
                <span className="love-home-gift-emoji">{g.gift_emoji ?? "🎁"}</span>
                <span className="love-home-gift-text">
                  {g.sender_id === userId ? "You" : g.sender?.display_name ?? "Guest"} sent{" "}
                  {g.gift_name} x{g.quantity}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {onSendGift && (
          <button type="button" className="primary-btn love-home-gift-btn" onClick={onSendGift}>
            🎁 Send Gift
          </button>
        )}
      </div>
    </div>
  );
}
