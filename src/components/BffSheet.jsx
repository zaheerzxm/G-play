import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BFF_UNLOCK_COIN_COST } from "../bffSlots.js";
import { bestieBowLevelFromExp } from "../bestieBowTiers.js";
import {
  bondMeta,
  daysTogether,
  loadActiveBondsForUser,
  loadBffLockedBonds,
  loadBffSlotInfo,
  partnerUserId,
  unlockBffBond,
} from "../relationships.js";
import { loadProfilesForUserIds } from "../profile.js";
import AvatarImg from "./AvatarImg.jsx";

const CP_TYPES = new Set(["cp", "wedding", "choti_ghar_wali", "badi_ghar_wali"]);
const BFF_TYPES = new Set(["bff", "bestie", "bro", "sis"]);

export default function BffSheet({
  targetId,
  viewerId,
  isSelf = false,
  elevated = false,
  onClose,
  onOpenFriends,
  onOpenIntimateSpace,
  onToast,
  onCoinsChange,
}) {
  const [tab, setTab] = useState("mine");
  const [bonds, setBonds] = useState([]);
  const [lockedBonds, setLockedBonds] = useState([]);
  const [slotInfo, setSlotInfo] = useState({ used: 0, limit: 3, base: 3, purchased: 0 });
  const [loading, setLoading] = useState(true);
  const [lockedLoading, setLockedLoading] = useState(false);
  const [unlockBusyId, setUnlockBusyId] = useState(null);

  const showUnlockTab = isSelf && viewerId === targetId;

  const refreshActive = useCallback(async () => {
    if (!targetId) return;
    const rows = await loadActiveBondsForUser(targetId);
    const filtered = rows.filter((b) => BFF_TYPES.has(b.bondType) || !CP_TYPES.has(b.bondType));
    const bffOnly = filtered.filter((b) => BFF_TYPES.has(b.bondType));
    const list = bffOnly.length ? bffOnly : filtered.filter((b) => !CP_TYPES.has(b.bondType));
    const ids = list.map((b) => partnerUserId(b, targetId)).filter(Boolean);
    const profiles = ids.length ? await loadProfilesForUserIds(ids) : {};
    setBonds(
      list.map((b) => {
        const oid = partnerUserId(b, targetId);
        const p = profiles[oid];
        return {
          ...b,
          otherUserId: oid,
          otherName: p?.display_name ?? "Friend",
          otherAvatar: p?.avatar_url ?? null,
        };
      }),
    );
  }, [targetId]);

  const refreshLocked = useCallback(async () => {
    if (!showUnlockTab || !targetId) {
      setLockedBonds([]);
      return;
    }
    setLockedLoading(true);
    try {
      setLockedBonds(await loadBffLockedBonds(targetId));
    } catch {
      setLockedBonds([]);
    } finally {
      setLockedLoading(false);
    }
  }, [showUnlockTab, targetId]);

  const refreshSlots = useCallback(async () => {
    if (!showUnlockTab || !targetId) return;
    try {
      setSlotInfo(await loadBffSlotInfo(targetId));
    } catch {
      setSlotInfo({ used: bonds.length, limit: 3, base: 3, purchased: 0 });
    }
  }, [showUnlockTab, targetId, bonds.length]);

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    refreshActive()
      .catch(() => setBonds([]))
      .finally(() => setLoading(false));
  }, [targetId, refreshActive]);

  useEffect(() => {
    refreshLocked();
  }, [refreshLocked]);

  useEffect(() => {
    refreshSlots();
  }, [refreshSlots, bonds.length]);

  async function handleUnlock(partnerId) {
    if (!targetId || !partnerId || unlockBusyId) return;
    setUnlockBusyId(partnerId);
    try {
      const result = await unlockBffBond(targetId, partnerId);
      if (result?.new_balance != null) {
        onCoinsChange?.(Number(result.new_balance));
      }
      await Promise.all([refreshActive(), refreshLocked(), refreshSlots()]);
      onToast?.(`BFF unlocked · ${BFF_UNLOCK_COIN_COST} coins`);
    } catch (err) {
      const msg = err?.message ?? "";
      if (msg.includes("partner_slot_full")) {
        onToast?.("Partner has no BFF slot available");
      } else {
        onToast?.(msg || "Could not unlock BFF");
      }
    } finally {
      setUnlockBusyId(null);
    }
  }

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

        {showUnlockTab && (
          <div className="weplay-bff-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "mine"}
              className={`weplay-bff-tab ${tab === "mine" ? "weplay-bff-tab--active" : ""}`}
              onClick={() => setTab("mine")}
            >
              My BFFs
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "unlock"}
              className={`weplay-bff-tab ${tab === "unlock" ? "weplay-bff-tab--active" : ""}`}
              onClick={() => setTab("unlock")}
            >
              To Unlock
              {lockedBonds.length > 0 && (
                <span className="weplay-bff-tab-badge">{lockedBonds.length}</span>
              )}
            </button>
          </div>
        )}

        <div className="weplay-bff-page-scroll">
          {showUnlockTab && (
            <p className="weplay-bff-slots-line">
              Slots <strong>{slotInfo.used}/{slotInfo.limit}</strong>
            </p>
          )}

          {tab === "mine" && (
            <>
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
                      <small className="weplay-bff-card-ref-days">
                        Together {daysTogether(b.startedAt)} days
                      </small>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {tab === "unlock" && showUnlockTab && (
            <>
              {lockedLoading && <p className="weplay-subpage-empty">Loading…</p>}
              {!lockedLoading && lockedBonds.length === 0 && (
                <p className="weplay-subpage-empty">No bonds waiting to unlock</p>
              )}
              <ul className="weplay-bff-unlock-list">
                {lockedBonds.map((row) => {
                  const meta = bondMeta(row.bondType);
                  const busy = unlockBusyId === row.partnerId;
                  return (
                    <li key={row.id} className="weplay-bff-unlock-row">
                      <AvatarImg
                        src={row.partnerAvatar}
                        fallback={row.partnerName || "?"}
                        className="weplay-bff-unlock-avatar weplay-bff-unlock-avatar--fallback"
                        imgClassName="weplay-bff-unlock-avatar"
                      />
                      <div className="weplay-bff-unlock-meta">
                        <strong>{row.partnerName}</strong>
                        <small>
                          {meta.emoji} {meta.label} · {BFF_UNLOCK_COIN_COST} coins
                        </small>
                      </div>
                      <button
                        type="button"
                        className="weplay-bff-unlock-btn"
                        disabled={busy}
                        onClick={() => handleUnlock(row.partnerId)}
                      >
                        {busy ? "…" : "Unlock"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {isSelf && tab === "mine" && (
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
