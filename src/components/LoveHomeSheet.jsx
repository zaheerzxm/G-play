import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { loadGiftsBetweenUsers } from "../giftTransactions.js";
import { ringMeta } from "../church.js";
import { bondMeta, daysTogether, partnerUserId } from "../relationships.js";
import { loadProfilesForUserIds } from "../profile.js";
import { formatCompactNumber } from "../formatCompact.js";
import { loadAvatar3d } from "../avatar3d.js";
import AvatarImg from "./AvatarImg.jsx";
import { Avatar3dCouple } from "./Avatar3dFigure.jsx";
import { IconGift, IconHeart, IconHelp, UiIcon } from "./NavIcons.jsx";

function formatGiftTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function LoveHomeSheet({ userId, bond, ownerProfile, elevated = false, onClose, onSendGift }) {
  const [partner, setPartner] = useState(null);
  const [owner, setOwner] = useState(ownerProfile ?? null);
  const [gifts, setGifts] = useState([]);

  useEffect(() => {
    if (!bond || !userId) return;
    const pid = partnerUserId(bond, userId);
    const ids = [pid, userId].filter(Boolean);
    loadProfilesForUserIds(ids).then((map) => {
      setPartner(map[pid] ?? null);
      if (!ownerProfile) setOwner(map[userId] ?? null);
    });
    loadGiftsBetweenUsers(userId, pid, 20).then(setGifts);
  }, [bond, userId, ownerProfile]);

  if (!bond) return null;

  const meta = bondMeta(bond.bondType);
  const days = daysTogether(bond.startedAt);
  const ring = ringMeta(bond.weddingRing ?? "floral");
  const partnerName = partner?.display_name ?? "Partner";
  const ownerName = owner?.display_name ?? "You";
  const lovePts = formatCompactNumber(bond.relationshipExp ?? 0);
  const blessingPts = formatCompactNumber(Math.floor((bond.relationshipExp ?? 0) / 36));
  const coverSrc = owner?.avatar_url || partner?.avatar_url || null;
  const owner3d = loadAvatar3d(userId, owner);
  const partner3d = loadAvatar3d(partner?.id, partner);
  const isMarried = bond.bondType === "wedding" || bond.bondType === "cp";

  const sheet = (
    <div
      className={`gplay-mobile-shell-backdrop gplay-mobile-shell-backdrop--love-home${elevated ? " gplay-mobile-shell-backdrop--profile-child" : ""}`}
    >
      <div className="gplay-mobile-shell love-home-page love-home-page--ref" onClick={(e) => e.stopPropagation()}>
        <header className="weplay-subpage-header weplay-subpage-header--help love-home-header">
          <button type="button" className="weplay-subpage-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <h1>Love Home</h1>
          <button type="button" className="weplay-subpage-help" aria-label="Help">
            <UiIcon Icon={IconHelp} />
          </button>
        </header>

        <div className="love-home-page-scroll">
          <div className="love-home-cover">
            {coverSrc ? (
              <img src={coverSrc} alt="" className="love-home-cover-img" />
            ) : (
              <div className="love-home-cover-fallback" />
            )}
            <div className="love-home-cover-overlay">
              {isMarried ? (
                <div className="love-home-3d-couple">
                  <Avatar3dCouple configA={owner3d} configB={partner3d} size="lg" />
                </div>
              ) : (
                <div className="love-home-couple-float">
                  <AvatarImg
                    src={owner?.avatar_url}
                    fallback={ownerName.charAt(0).toUpperCase()}
                    className="love-home-avatar love-home-avatar--fallback love-home-avatar--lg"
                    imgClassName="love-home-avatar love-home-avatar--lg"
                  />
                  <span className="love-home-ring-icon">{ring.emoji}</span>
                  <AvatarImg
                    src={partner?.avatar_url}
                    fallback={partnerName.charAt(0).toUpperCase()}
                    className="love-home-avatar love-home-avatar--fallback love-home-avatar--lg"
                    imgClassName="love-home-avatar love-home-avatar--lg"
                  />
                </div>
              )}
              <p className="love-home-married love-home-married--overlay">
                We have been {meta.label.toLowerCase()} for <strong>{days}</strong> day{days === 1 ? "" : "s"}
              </p>
            </div>
            <div className="love-home-stats-float">
              <div className="love-home-stat-pill">
                <UiIcon Icon={IconHeart} /> Love <strong>{lovePts}</strong>
              </div>
              <div className="love-home-stat-pill">
                <UiIcon Icon={IconGift} /> Blessing <strong>{blessingPts}</strong>
              </div>
            </div>
          </div>

          <section className="love-home-section love-home-section--page">
            <h3>
              Rings Posted <UiIcon Icon={IconHelp} className="love-home-section-help" />
            </h3>
            <div className="love-home-rings-row">
              <div className="love-home-ring-card">{ring.emoji}</div>
              <div className="love-home-ring-card love-home-ring-card--alt">{ring.emoji}</div>
            </div>
            <p className="love-home-ring-name">{ring.label}</p>
          </section>

          <section className="love-home-section love-home-section--page">
            <h3>
              Recent gifts <UiIcon Icon={IconHelp} className="love-home-section-help" />
            </h3>
            <ul className="love-home-gifts love-home-gifts--page">
              {gifts.length === 0 && (
                <li className="love-home-gift love-home-gift--empty">No gifts yet — send one to celebrate</li>
              )}
              {gifts.map((g) => {
                const senderName =
                  g.sender_id === userId ? ownerName : g.sender?.display_name ?? "Guest";
                return (
                  <li key={g.id} className="love-home-gift love-home-gift--page">
                    <AvatarImg
                      src={g.sender?.avatar_url}
                      fallback={senderName.charAt(0).toUpperCase()}
                      className="love-home-gift-avatar love-home-gift-avatar--fallback"
                      imgClassName="love-home-gift-avatar"
                    />
                    <div className="love-home-gift-meta">
                      <strong>{senderName}</strong>
                      <small>{formatGiftTime(g.created_at)}</small>
                    </div>
                    <span className="love-home-gift-side">
                      <span className="love-home-gift-emoji">{g.gift_emoji ?? "🎁"}</span>
                      {g.gift_name} x{g.quantity}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {onSendGift && (
          <footer className="weplay-subpage-footer">
            <button type="button" className="weplay-footer-btn weplay-footer-btn--gift weplay-footer-btn--full" onClick={onSendGift}>
              <UiIcon Icon={IconGift} /> Send Gift
            </button>
          </footer>
        )}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
