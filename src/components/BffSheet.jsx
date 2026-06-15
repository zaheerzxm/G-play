import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { bestieBowLevelFromExp } from "../bestieBowTiers.js";
import { bondMeta, daysTogether, loadActiveBondsForUser, partnerUserId } from "../relationships.js";
import { loadProfilesForUserIds } from "../profile.js";
import AvatarImg from "./AvatarImg.jsx";

const CP_TYPES = new Set(["cp", "wedding", "choti_ghar_wali", "badi_ghar_wali"]);
const BFF_TYPES = new Set(["bff", "bestie", "bro", "sis"]);
const DEFAULT_BFF_SLOTS = 3;

export default function BffSheet({
  targetId,
  targetName,
  viewerId,
  isSelf = false,
  elevated = false,
  onClose,
  onOpenFriends,
  onOpenIntimateSpace,
  onToast,
}) {
  const [bonds, setBonds] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    loadActiveBondsForUser(targetId)
      .then(async (rows) => {
        const filtered = rows.filter((b) => BFF_TYPES.has(b.bondType) || !CP_TYPES.has(b.bondType));
        const bffOnly = filtered.filter((b) => BFF_TYPES.has(b.bondType));
        const list = bffOnly.length ? bffOnly : filtered.filter((b) => !CP_TYPES.has(b.bondType));
        const ids = list.map((b) => partnerUserId(b, targetId)).filter(Boolean);
        const profiles = ids.length ? await loadProfilesForUserIds(ids) : {};
        return list.map((b) => {
          const oid = partnerUserId(b, targetId);
          const p = profiles[oid];
          return {
            ...b,
            otherUserId: oid,
            otherName: p?.display_name ?? "Friend",
            otherAvatar: p?.avatar_url ?? null,
          };
        });
      })
      .then(setBonds)
      .catch(() => setBonds([]))
      .finally(() => setLoading(false));
  }, [targetId]);

  const slotsUsed = bonds.length;
  const slotsTotal = DEFAULT_BFF_SLOTS;

  function handleManageSlots() {
    if (onOpenFriends) {
      onOpenFriends();
      onClose?.();
      return;
    }
    onToast?.("Invite friends from the Me tab · 3 BFF slots by default (up to 99)");
  }

  const sheet = (
    <div
      className={`gplay-mobile-shell-backdrop${elevated ? " gplay-mobile-shell-backdrop--profile-child" : ""}`}
      onClick={onClose}
    >
      <div className="gplay-mobile-shell weplay-bff-page" onClick={(e) => e.stopPropagation()}>
        <header className="weplay-subpage-header">
          <button type="button" className="weplay-subpage-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <h1>
            BFF <span className="weplay-bff-heart">❤️</span> {bonds.length || ""}
          </h1>
          <span className="weplay-subpage-header-spacer" aria-hidden />
        </header>

        <div className="weplay-bff-page-scroll">
          {isSelf && (
            <p className="weplay-bff-slots-line">
              Slots <strong>{slotsUsed}/{slotsTotal}</strong>
            </p>
          )}

          {loading && <p className="weplay-subpage-empty">Loading…</p>}
          {!loading && bonds.length === 0 && (
            <p className="weplay-subpage-empty">No BFF bonds yet</p>
          )}

          <div className="weplay-bff-grid weplay-bff-grid--page">
            {bonds.map((b) => {
              const meta = bondMeta(b.bondType);
              const bowLevel = bestieBowLevelFromExp(b.relationshipExp ?? 0);
              return (
                <button
                  key={b.otherUserId}
                  type="button"
                  className={`weplay-bff-card-ref weplay-bff-card-ref--page weplay-bff-card-ref--${meta.popupClass} weplay-bff-card-ref--clickable`}
                  onClick={() => onOpenIntimateSpace?.(b)}
                >
                  <span className="weplay-bff-card-ref-lv">LV{bowLevel}</span>
                  <span className="weplay-bff-card-ref-type" aria-hidden>{meta.emoji}</span>
                  <span className="weplay-bff-card-ref-token" aria-hidden>✈</span>
                  <AvatarImg
                    src={b.otherAvatar}
                    fallback={b.otherName || "?"}
                    className="weplay-bff-card-ref-avatar weplay-bff-card-ref-avatar--fallback weplay-bff-card-ref-avatar--page"
                    imgClassName="weplay-bff-card-ref-avatar weplay-bff-card-ref-avatar--page"
                  />
                  <span className="weplay-bff-card-ref-name">{b.otherName}</span>
                  <small className="weplay-bff-card-ref-days">Together {daysTogether(b.startedAt)} days</small>
                </button>
              );
            })}
          </div>
        </div>

        {isSelf && (
          <footer className="weplay-subpage-footer">
            <button
              type="button"
              className="weplay-subpage-footer-btn weplay-subpage-footer-btn--pink"
              onClick={handleManageSlots}
            >
              Invite friends
            </button>
          </footer>
        )}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
