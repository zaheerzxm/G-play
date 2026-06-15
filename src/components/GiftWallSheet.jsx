import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { loadGiftWall, loadReceivedGifts } from "../giftTransactions.js";
import { giftWallBadgeProgress } from "../giftWallBadges.js";
import { giftIconFor } from "../gplayAssets.js";
import { charmTierFromTotal, charmTierProgress } from "../charmTiers.js";
import { formatCompactNumber } from "../formatCompact.js";
import { supabase } from "../supabase.js";
import AvatarImg from "./AvatarImg.jsx";

function starRow(count) {
  const n = Math.min(3, Math.max(0, count));
  return Array.from({ length: 3 }, (_, i) => (
    <span key={i} className={i < n ? "gift-wall-page-star gift-wall-page-star--on" : "gift-wall-page-star"}>★</span>
  ));
}

function giftTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GiftWallSheet({
  userId,
  profile,
  onClose,
  onSendGift,
  fullPage = true,
  elevated = false,
}) {
  const [tab, setTab] = useState("wall");
  const [stats, setStats] = useState({ gifts: [], totalGifts: 0, totalStars: 0 });
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);

  const charm = profile?.charm ?? 0;
  const charmMeta = charmTierFromTotal(charm);
  const charmProg = charmTierProgress(charm);
  const displayName = profile?.display_name ?? "User";
  const initial = displayName.charAt(0).toUpperCase();
  const badges = giftWallBadgeProgress(stats);
  const unlockedBadges = badges.filter((b) => b.unlocked).length;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    let active = true;
    const reload = () => Promise.all([loadGiftWall(userId), loadReceivedGifts(userId)])
      .then(([wall, recv]) => {
        if (!active) return;
        setStats(wall);
        setReceived(recv);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    reload();

    if (!supabase) {
      return () => {
        active = false;
      };
    }

    const channel = supabase
      .channel(`gift-wall-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gift_transactions", filter: `recipient_id=eq.${userId}` },
        () => reload(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gift_transactions", filter: `sender_id=eq.${userId}` },
        () => reload(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
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
          <span style={{ width: `${charmProg.pct}%` }} />
        </div>
        <p className="gift-wall-page-charm-hint">
          {formatCompactNumber(charm)}
          {charmProg.next ? ` / ${formatCompactNumber(charmProg.ceiling)}` : ""} Charm · {charmMeta?.label ?? "Rising"}
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
                    {g.top_sender?.avatar_url ? (
                      <img src={g.top_sender.avatar_url} alt="" className="gift-wall-page-card-sender" title={g.top_sender.display_name} />
                    ) : g.top_sender?.display_name ? (
                      <span className="gift-wall-page-card-sender gift-wall-page-card-sender--fallback" title={g.top_sender.display_name}>
                        {(g.top_sender.display_name || "?").charAt(0)}
                      </span>
                    ) : null}
                    <span className="gift-wall-page-card-art">
                      {icon ? <img src={icon} alt="" /> : g.gift_emoji}
                    </span>
                    <span className="gift-wall-page-card-name">{g.gift_name}</span>
                    <span className="gift-wall-page-card-qty">x{g.quantity}</span>
                    {g.last_sent_at && (
                      <span className="gift-wall-page-card-time">{giftTime(g.last_sent_at)}</span>
                    )}
                    <span className="gift-wall-page-card-stars">{starRow(g.stars)}</span>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {!loading && tab === "badge" && (
        <>
          <p className="gift-wall-page-badge-summary">
            {unlockedBadges} / {badges.length} badges unlocked
          </p>
          <div className="gift-wall-page-badge-grid">
            {badges.map((badge) => (
              <article
                key={badge.id}
                className={`gift-wall-page-badge-card ${badge.unlocked ? "gift-wall-page-badge-card--on" : ""}`}
              >
                <span className="gift-wall-page-badge-emoji" aria-hidden>{badge.emoji}</span>
                <strong>{badge.name}</strong>
                <small>
                  {badge.unlocked
                    ? "Unlocked"
                    : `${badge.minUnique} gifts · ${badge.minTotal} total`}
                </small>
                {!badge.unlocked && (
                  <span className="gift-wall-page-badge-progress">
                    <span style={{ width: `${badge.progressPct}%` }} />
                  </span>
                )}
              </article>
            ))}
          </div>
        </>
      )}

      {!loading && tab === "received" && (
        <ul className="gift-wall-page-received">
          {received.length === 0 && <li className="gift-wall-page-empty">No gift history yet</li>}
          {received.map((row) => (
            <li key={row.id} className="gift-wall-page-received-row">
              <span className="gift-wall-page-received-emoji">{row.gift_emoji}</span>
              <span>
                <strong>{row.sender?.display_name ?? "Someone"} → {row.recipient?.display_name ?? displayName}</strong>
                <small>{row.gift_name} x{row.quantity} · {giftTime(row.created_at)}</small>
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

  if (!fullPage) {
    return (
      <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()}>{content}</div>
      </div>
    );
  }

  const backdropClass = `gplay-mobile-shell-backdrop${elevated ? " gplay-mobile-shell-backdrop--profile-child" : ""}`;

  const sheet = (
    <div className={backdropClass} onClick={onClose}>
      <div className="gplay-mobile-shell gift-wall-shell" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
