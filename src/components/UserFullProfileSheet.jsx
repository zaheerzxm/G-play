import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { loadGiftWall } from "../giftTransactions.js";
import { loadProfilesForUserIds, loadSavedRooms } from "../profile.js";
import { isFollowingUser, followUser, isMutualFriend } from "../social.js";
import {
  GUARD_PROPOSE_CP,
  PROTECT_COIN_OPTIONS,
  bondMeta,
  loadActiveBondsForUser,
  loadBondBetween,
  loadCpSlotInfo,
  partnerUserId,
  proposeBond,
  protectUser,
  relationshipLevelProgress,
  respondBondProposal,
} from "../relationships.js";
import { bestieBowLevelFromExp } from "../bestieBowTiers.js";
import { charmTierFromTotal } from "../charmTiers.js";
import { formatCompactNumber } from "../formatCompact.js";
import AvatarImg from "./AvatarImg.jsx";
import ProfileBadgeRow from "./ProfileBadgeRow.jsx";

const PROPOSE_BOND_TYPES = [
  "cp",
  "bro",
  "sis",
  "bff",
  "apprentice",
  "son",
  "daughter",
  "choti_ghar_wali",
  "badi_ghar_wali",
];

const CP_TYPES = new Set(["cp", "wedding", "choti_ghar_wali", "badi_ghar_wali"]);

export default function UserFullProfileSheet({
  seat,
  profile,
  viewerId,
  viewerProfile,
  viewerName,
  onClose,
  onSendGift,
  onMessage,
  onBlockUser,
  canBlockUser,
  onBondChange,
  onToast,
  guardRefreshToken = 0,
  coins = 0,
  isSuperAdmin = false,
  onCoinsChange,
  onOpenIntimateSpace,
  onOpenLoveHome,
  onOpenGiftWall,
  onOpenSettings,
}) {
  const [following, setFollowing] = useState(false);
  const [mutual, setMutual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pair, setPair] = useState(null);
  const [bondBusy, setBondBusy] = useState(false);
  const [viewerCpSlots, setViewerCpSlots] = useState(null);
  const [targetCpSlots, setTargetCpSlots] = useState(null);
  const [giftStats, setGiftStats] = useState({ totalGifts: 0, totalStars: 0 });
  const [bffBonds, setBffBonds] = useState([]);
  const [savedRooms, setSavedRooms] = useState([]);
  const [guardOpen, setGuardOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const targetId = seat?.user_id;
  const isSelf = viewerId === targetId;
  const merged = { ...profile, ...seat, charm: profile?.charm ?? 0 };
  const avatarSrc = seat?.avatar_url || profile?.avatar_url || null;
  const displayName = seat?.nickname || profile?.display_name || "Guest";
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!viewerId || !targetId) return;
    isFollowingUser(viewerId, targetId).then(setFollowing);
    isMutualFriend(viewerId, targetId).then(setMutual);
  }, [viewerId, targetId]);

  useEffect(() => {
    if (!viewerId || !targetId || isSelf) {
      setPair(null);
      return;
    }
    loadBondBetween(viewerId, targetId, viewerId).then(setPair);
  }, [viewerId, targetId, isSelf, guardRefreshToken]);

  useEffect(() => {
    if (!viewerId || !targetId || isSelf) {
      setViewerCpSlots(null);
      setTargetCpSlots(null);
      return;
    }
    Promise.all([loadCpSlotInfo(viewerId), loadCpSlotInfo(targetId)]).then(([mine, theirs]) => {
      setViewerCpSlots(mine);
      setTargetCpSlots(theirs);
    });
  }, [viewerId, targetId, isSelf, guardRefreshToken]);

  useEffect(() => {
    if (!targetId) return;
    loadGiftWall(targetId).then(setGiftStats).catch(() => {});
    loadActiveBondsForUser(targetId)
      .then(async (rows) => {
        const filtered = rows.filter((b) => !CP_TYPES.has(b.bondType));
        const ids = filtered.map((b) => partnerUserId(b, targetId)).filter(Boolean);
        const profiles = ids.length ? await loadProfilesForUserIds(ids) : [];
        const byId = Object.fromEntries(profiles.map((p) => [p.id, p]));
        return filtered.map((b) => {
          const oid = partnerUserId(b, targetId);
          const p = byId[oid];
          return {
            ...b,
            otherUserId: oid,
            otherName: p?.display_name ?? "Friend",
            otherAvatar: p?.avatar_url ?? null,
          };
        });
      })
      .then(setBffBonds)
      .catch(() => {});
    if (isSelf) {
      loadSavedRooms(targetId).then(setSavedRooms).catch(() => {});
    }
  }, [targetId, isSelf]);

  if (!seat) return null;

  const theirName = displayName;
  const guardMine = pair?.guardMine ?? 0;
  const guardTheirs = pair?.guardTheirs ?? 0;
  const activeBond = pair?.status === "active" && pair?.bondType;
  const pending = pair?.status === "pending";
  const pendingFromThem = pending && pair?.proposedBy && pair.proposedBy !== viewerId;
  const pendingFromMe = pending && pair?.proposedBy === viewerId;
  const canProposeCp =
    mutual &&
    !activeBond &&
    !pending &&
    guardMine >= GUARD_PROPOSE_CP &&
    (viewerCpSlots?.remaining ?? 0) > 0 &&
    (targetCpSlots?.remaining ?? 0) > 0 &&
    viewerCpSlots?.hasGender &&
    targetCpSlots?.hasGender;
  const canProposeBondType = (type) => {
    if (!mutual || activeBond || pending) return false;
    const meta = bondMeta(type);
    if (guardMine < meta.minGuard) return false;
    if (type === "cp" || type === "choti_ghar_wali" || type === "badi_ghar_wali") return canProposeCp;
    return true;
  };
  const proposeBondOptions = PROPOSE_BOND_TYPES.filter(canProposeBondType);
  const guardProgress = Math.min(100, (guardMine / GUARD_PROPOSE_CP) * 100);
  const relProgress = pair?.relationshipExp != null ? relationshipLevelProgress(pair.relationshipExp) : null;
  const signature = profile?.title?.trim() || profile?.bio?.trim() || "No signature yet";
  const charmLine = charmTierFromTotal(merged.charm ?? 0);

  async function copyId() {
    const code = seat.user_code || profile?.user_code;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      onToast?.("ID copied");
    } catch {
      /* ok */
    }
  }

  async function handleAddFriend() {
    if (!viewerId || !targetId || busy || mutual || following) return;
    setBusy(true);
    try {
      await followUser(viewerId, targetId);
      setFollowing(true);
      onToast?.("Request sent");
    } catch (err) {
      onToast?.(err?.message ?? "Could not send request");
    } finally {
      setBusy(false);
    }
  }

  async function handleProtect(amount) {
    if (!viewerId || !targetId || bondBusy || (!isSuperAdmin && coins < amount)) return;
    setBondBusy(true);
    try {
      const result = await protectUser(viewerId, targetId, amount);
      setPair(await loadBondBetween(viewerId, targetId, viewerId));
      onBondChange?.();
      if (!isSuperAdmin && onCoinsChange) onCoinsChange(coins - amount);
      onToast?.(`Protected 🛡️ +${formatCompactNumber(amount)}`);
    } catch (err) {
      onToast?.(err?.message ?? "Protect failed");
    } finally {
      setBondBusy(false);
    }
  }

  async function handlePropose(type) {
    if (!viewerId || !targetId || bondBusy) return;
    setBondBusy(true);
    try {
      const updated = await proposeBond(viewerId, targetId, type);
      setPair(updated);
      onBondChange?.();
      onToast?.(`${bondMeta(type).label} proposal sent`);
    } catch (err) {
      onToast?.(err?.message ?? "Could not propose");
    } finally {
      setBondBusy(false);
    }
  }

  async function handleRespond(accept) {
    if (!viewerId || !targetId || bondBusy) return;
    setBondBusy(true);
    try {
      const updated = await respondBondProposal(viewerId, targetId, accept);
      setPair(updated);
      onBondChange?.();
      onToast?.(accept ? "Bond accepted!" : "Proposal declined");
    } catch (err) {
      onToast?.(err?.message ?? "Could not respond");
    } finally {
      setBondBusy(false);
    }
  }

  function handleBack(e) {
    e.stopPropagation();
    e.preventDefault();
    onClose();
  }

  const sheet = (
    <div className="profile-card-backdrop weplay-full-profile-backdrop" onClick={handleBack}>
      <div className="weplay-full-profile" onClick={(e) => e.stopPropagation()}>
        <div className="weplay-full-profile-hero">
          <header className="weplay-full-profile-nav">
            <button type="button" className="weplay-full-profile-back" onClick={handleBack} aria-label="Back">
              ‹
            </button>
            <div className="weplay-full-profile-nav-right">
              {!isSelf && canBlockUser && onBlockUser && (
                <button
                  type="button"
                  className="weplay-full-profile-more"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="More"
                >
                  ···
                </button>
              )}
              {isSelf && onOpenSettings && (
                <button type="button" className="weplay-full-profile-settings" onClick={onOpenSettings} aria-label="Settings">
                  ⚙
                </button>
              )}
            </div>
          </header>
          {menuOpen && canBlockUser && onBlockUser && (
            <div className="weplay-full-profile-menu">
              <button type="button" onClick={onBlockUser}>
                Block user
              </button>
            </div>
          )}
          {activeBond && CP_TYPES.has(pair.bondType) && (
            <button type="button" className="weplay-full-profile-cp-pill" onClick={onOpenLoveHome}>
              {bondMeta(pair.bondType).emoji} His/Her {bondMeta(pair.bondType).label}
            </button>
          )}
        </div>

        <div className="weplay-full-profile-identity">
          <div className="weplay-full-profile-head">
            <span className="weplay-full-profile-avatar-wrap">
              <AvatarImg
                src={avatarSrc}
                fallback={initial}
                className="weplay-full-profile-avatar weplay-full-profile-avatar--fallback"
                imgClassName="weplay-full-profile-avatar"
              />
            </span>
            <div className="weplay-full-profile-head-text">
              <h1 className="weplay-full-profile-name">{displayName}</h1>
              <ProfileBadgeRow profile={merged} />
            </div>
          </div>
          {activeBond && (
            <div className="weplay-full-profile-bonds">
              <span className="weplay-bond-tag weplay-bond-tag--shared">
                {bondMeta(pair.bondType).emoji} {bondMeta(pair.bondType).label}
              </span>
            </div>
          )}
          {(seat.user_code || profile?.user_code) && (
            <button type="button" className="weplay-full-profile-id" onClick={copyId}>
              ID: {seat.user_code || profile.user_code} <span aria-hidden>📋</span>
            </button>
          )}
        </div>

        <div className="weplay-full-profile-scroll">
          <section className="weplay-profile-section">
            <button type="button" className="weplay-profile-section-head" disabled>
              <span>Spotlight</span>
              <span className="weplay-profile-section-meta">0</span>
            </button>
            <p className="weplay-profile-empty-row">No moments yet</p>
          </section>

          <section className="weplay-profile-section">
            <button
              type="button"
              className="weplay-profile-section-head"
              onClick={(e) => {
                e.stopPropagation();
                onOpenGiftWall?.();
              }}
              disabled={!onOpenGiftWall}
            >
              <span>Gift Wall</span>
              <span className="weplay-profile-section-chevron">›</span>
            </button>
            <button
              type="button"
              className="weplay-gift-wall-card"
              onClick={(e) => {
                e.stopPropagation();
                onOpenGiftWall?.();
              }}
              disabled={!onOpenGiftWall}
            >
              <span className="weplay-gift-wall-stat">
                <strong>{formatCompactNumber(giftStats.totalGifts)}</strong>
                <small>Gift</small>
              </span>
              <span className="weplay-gift-wall-stat">
                <strong>{formatCompactNumber(giftStats.totalStars)}</strong>
                <small>Star</small>
              </span>
            </button>
          </section>

          <section className="weplay-profile-section">
            <div className="weplay-profile-section-head weplay-profile-section-head--static">
              <span>Signature</span>
            </div>
            <p className="weplay-profile-signature">{signature}</p>
          </section>

          {bffBonds.length > 0 && (
            <section className="weplay-profile-section">
              <div className="weplay-profile-section-head weplay-profile-section-head--static">
                <span>BFF ❤️ {bffBonds.length}</span>
              </div>
              <div className="weplay-bff-row">
                {bffBonds.slice(0, 6).map((b) => {
                  const meta = bondMeta(b.bondType);
                  const bowLevel = bestieBowLevelFromExp(b.relationshipExp ?? 0);
                  return (
                    <div key={b.otherUserId} className={`weplay-bff-card weplay-bff-card--${meta.popupClass}`}>
                      <span className="weplay-bff-lv">LV{bowLevel}</span>
                      <span className="weplay-bff-emoji">{meta.emoji}</span>
                      <AvatarImg
                        src={b.otherAvatar}
                        fallback={b.otherName || "?"}
                        className="weplay-bff-avatar weplay-bff-avatar--fallback"
                        imgClassName="weplay-bff-avatar"
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {!isSelf && mutual && (
            <section className="weplay-profile-section">
              <button
                type="button"
                className="weplay-profile-section-head"
                onClick={() => setGuardOpen((v) => !v)}
              >
                <span>Guard</span>
                <span className="weplay-profile-section-meta">🛡️ {formatCompactNumber(guardMine)}</span>
              </button>
              {guardOpen && (
                <div className="weplay-guard-detail">
                  <p className="weplay-guard-hint">
                    Your guard toward {theirName}: {formatCompactNumber(guardMine)} · Their guard toward you:{" "}
                    {formatCompactNumber(guardTheirs)}
                  </p>
                  {!activeBond && (
                    <>
                      <div className="weplay-guard-bar">
                        <span style={{ width: `${guardProgress}%` }} />
                      </div>
                      <div className="weplay-guard-protect">
                        {PROTECT_COIN_OPTIONS.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            className="weplay-guard-protect-btn"
                            disabled={bondBusy || (!isSuperAdmin && coins < amt)}
                            onClick={() => handleProtect(amt)}
                          >
                            🛡️ {amt}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {activeBond && relProgress && (
                    <p className="weplay-guard-hint">
                      {bondMeta(pair.bondType).label} LV{relProgress.level} · {formatCompactNumber(relProgress.value)} XP
                    </p>
                  )}
                  {pendingFromThem && (
                    <div className="weplay-bond-actions">
                      <p>
                        {bondMeta(pair.proposedBondType ?? "cp").emoji} wants to be your{" "}
                        {bondMeta(pair.proposedBondType ?? "cp").label}
                      </p>
                      <button type="button" onClick={() => handleRespond(true)} disabled={bondBusy}>
                        Accept
                      </button>
                      <button type="button" onClick={() => handleRespond(false)} disabled={bondBusy}>
                        Decline
                      </button>
                    </div>
                  )}
                  {proposeBondOptions.length > 0 && (
                    <div className="weplay-bond-pills">
                      {proposeBondOptions.map((type) => {
                        const meta = bondMeta(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            className="weplay-bond-pill"
                            disabled={bondBusy}
                            onClick={() => handlePropose(type)}
                          >
                            {meta.emoji} {meta.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {activeBond && onOpenIntimateSpace && (
                    <div className="weplay-bond-links">
                      <button type="button" onClick={onOpenIntimateSpace}>
                        💞 Intimate Space
                      </button>
                      {CP_TYPES.has(pair.bondType) && onOpenLoveHome && (
                        <button type="button" onClick={onOpenLoveHome}>
                          💒 Love Home
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {isSelf && savedRooms.length > 0 && (
            <section className="weplay-profile-section">
              <div className="weplay-profile-section-head weplay-profile-section-head--static">
                <span>Advanced Voice Room</span>
                <span className="weplay-profile-section-chevron">›</span>
              </div>
              <div className="weplay-rooms-row">
                {savedRooms.slice(0, 4).map((r) => (
                  <div key={r.id} className="weplay-room-thumb" title={r.name}>
                    {(r.name || "R").charAt(0)}
                  </div>
                ))}
                {savedRooms.length > 4 && (
                  <div className="weplay-room-thumb weplay-room-thumb--more">+{savedRooms.length - 4}</div>
                )}
              </div>
            </section>
          )}

          <section className="weplay-profile-section">
            <div className="weplay-profile-section-head weplay-profile-section-head--static">
              <span>Stats</span>
              <span className="weplay-profile-section-chevron">›</span>
            </div>
            <p className="weplay-stats-line">
              {formatCompactNumber(merged.charm ?? 0)} charm
              {charmLine ? ` · ${charmLine.label}` : ""}
            </p>
          </section>

        </div>

        {!isSelf && (
          <footer className="weplay-full-profile-footer">
            <button
              type="button"
              className={`weplay-footer-btn weplay-footer-btn--add ${following && !mutual ? "weplay-footer-btn--sent" : ""}`}
              disabled={busy || mutual || following}
              onClick={handleAddFriend}
            >
              {mutual ? "✓ Friends" : following ? "Request sent" : "+ Add"}
            </button>
            {mutual && onMessage && (
              <button type="button" className="weplay-footer-btn weplay-footer-btn--chat" onClick={onMessage}>
                Chat
              </button>
            )}
            {onSendGift && (
              <button type="button" className="weplay-footer-btn weplay-footer-btn--gift" onClick={onSendGift}>
                Send Gift
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
