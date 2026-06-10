import { useEffect, useState } from "react";
import { loadGiftWall, loadReceivedGifts } from "../giftTransactions.js";
import { giftIconFor } from "../gplayAssets.js";
import { charmTierFromTotal } from "../charmTiers.js";
import { formatCompactNumber } from "../formatCompact.js";
import AvatarImg from "./AvatarImg.jsx";

function starRow(count) {
  const n = Math.min(3, Math.max(0, count));
  return Array.from({ length: 3 }, (_, i) => (
    <span key={i} className={i < n ? "gift-wall-page-star gift-wall-page-star--on" : "gift-wall-page-star"}>★</span>
  ));
}

export default function GiftWallSheet({ userId, profile, onClose, onSendGift, fullPage = true }) {
  const [tab, setTab] = useState("wall");
  const [stats, setStats] = useState({ gifts: [], totalGifts: 0, totalStars: 0 });
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);

  const charm = profile?.charm ?? 0;
  const charmMeta = charmTierFromTotal(charm);
  const displayName = profile?.display_name ?? "User";
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([loadGiftWall(userId), loadReceivedGifts(userId)])
      .then(([wall, recv]) => {
        setStats(wall);
        setReceived(recv);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const content = (
    <div className={`gift-wall-page ${fullPage ? "gift-wall-page--full" : ""}`}>
      <header className="gift-wall-page-header">
        <button type="button" className="gift-wall-page-back" onClick={onClose} aria-label="Back">‹</button>
        <h1>Gift</h1>
        <button type="button" className="gift-wall-page-help" aria-label="Help">?</button>
      </header>

      <div className="gift-wall-page-user">
        <AvatarImg
          src={profile?.avatar_url}
          fallback={initial}
          className="gift-wall-page-avatar gift-wall-page-avatar--fallback"
          imgClassName="gift-wall-page-avatar"
        />
        <strong>{displayName}</strong>
        <button type="button" className="gift-wall-page-history" onClick={() => setTab("received")}>
          History
        </button>
      </div>

      <div className="gift-wall-page-summary">
        <div className="gift-wall-page-summary-stats">
          <span><strong>{formatCompactNumber(stats.totalGifts)}</strong> / {formatCompactNumber(Math.max(stats.totalGifts, stats.totalGifts + 20))} Gift</span>
          <span><strong>{formatCompactNumber(stats.totalStars)}</strong> / {formatCompactNumber(Math.max(stats.totalStars, stats.totalStars + 50))} Star</span>
        </div>
        <div className="gift-wall-page-summary-badge">{charmMeta?.level ?? 1}</div>
        <div className="gift-wall-page-charm-bar">
          <span style={{ width: `${Math.min(100, (charm % 1000) / 10)}%` }} />
        </div>
        <p className="gift-wall-page-charm-hint">
          {formatCompactNumber(charm)} Charm · {charmMeta?.label ?? "Rising"}
        </p>
      </div>

      <div className="gift-wall-page-tabs">
        <button
          type="button"
          className={`gift-wall-page-tab ${tab === "wall" ? "gift-wall-page-tab--active" : ""}`}
          onClick={() => setTab("wall")}
        >
          Gift Wall
        </button>
        <button
          type="button"
          className={`gift-wall-page-tab ${tab === "badge" ? "gift-wall-page-tab--active" : ""}`}
          onClick={() => setTab("badge")}
        >
          Gift Badge
        </button>
        <button
          type="button"
          className={`gift-wall-page-tab ${tab === "received" ? "gift-wall-page-tab--active" : ""}`}
          onClick={() => setTab("received")}
        >
          Received
        </button>
      </div>

      {loading && <p className="gift-wall-page-empty">Loading…</p>}

      {!loading && tab === "wall" && (
        <>
          {stats.gifts.length === 0 ? (
            <p className="gift-wall-page-empty">No gifts received yet</p>
          ) : (
            <div className="gift-wall-page-grid">
              {stats.gifts.map((g) => {
                const icon = giftIconFor(g.gift_id);
                return (
                  <article key={g.gift_id} className="gift-wall-page-card">
                    {profile?.avatar_url && (
                      <img src={profile.avatar_url} alt="" className="gift-wall-page-card-sender" />
                    )}
                    <span className="gift-wall-page-card-art">
                      {icon ? <img src={icon} alt="" /> : g.gift_emoji}
                    </span>
                    <span className="gift-wall-page-card-name">{g.gift_name}</span>
                    <span className="gift-wall-page-card-qty">x{g.quantity}</span>
                    <span className="gift-wall-page-card-stars">{starRow(g.stars)}</span>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {!loading && tab === "badge" && (
        <p className="gift-wall-page-empty">Gift badges unlock as you collect more gifts.</p>
      )}

      {!loading && tab === "received" && (
        <ul className="gift-wall-page-received">
          {received.length === 0 && <li className="gift-wall-page-empty">No gift history yet</li>}
          {received.map((row) => (
            <li key={row.id} className="gift-wall-page-received-row">
              <span className="gift-wall-page-received-emoji">{row.gift_emoji}</span>
              <span>
                <strong>{row.sender?.display_name ?? "Someone"}</strong>
                <small>{row.gift_name} x{row.quantity}</small>
              </span>
            </li>
          ))}
        </ul>
      )}

      {onSendGift && (
        <button type="button" className="gift-wall-page-send" onClick={onSendGift}>
          Send Gift
        </button>
      )}
    </div>
  );

  if (fullPage) return content;

  return (
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{content}</div>
    </div>
  );
}
