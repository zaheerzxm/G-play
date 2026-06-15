import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { isMutualFriend } from "../social.js";
import { bondMeta, loadBondBetween } from "../relationships.js";
import ProfileBadgeRow from "./ProfileBadgeRow.jsx";
import AvatarImg from "./AvatarImg.jsx";
import UserFullProfileSheet from "./UserFullProfileSheet.jsx";
import VipDisplayName from "./VipDisplayName.jsx";

const CP_TYPES = new Set(["cp", "wedding", "choti_ghar_wali", "badi_ghar_wali"]);

function IconGift() {
  return (
    <svg className="user-profile-weplay-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="8" width="16" height="12" rx="2" fill="currentColor" opacity="0.95" />
      <rect x="3" y="5" width="18" height="4" rx="1.5" fill="currentColor" />
      <path d="M12 5V20M8.5 5C8.5 3.5 10 2.5 12 2.5S15.5 3.5 15.5 5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconWalkie() {
  return (
    <svg className="user-profile-weplay-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="7" y="3" width="10" height="16" rx="3" fill="currentColor" />
      <circle cx="12" cy="17.5" r="1.2" fill="#fff" opacity="0.9" />
      <path d="M5 9v4M19 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function UserProfileCard({
  seat,
  profile,
  viewerId,
  viewerProfile,
  viewerName,
  onClose,
  onSendGift,
  onMessage,
  onChangeUser,
  onBlockUser,
  onKickFromRoom,
  onLeaveSeat,
  onInvite,
  canKick,
  canBlockUser,
  canModerate = false,
  seatMuted = false,
  onToggleSeatMute,
  onBondChange,
  onToast,
  guardRefreshToken = 0,
  coins = 0,
  isSuperAdmin = false,
  onCoinsChange,
  onWalkieStart,
  onWalkieEnd,
  walkieActive = false,
  walkieDisabled = false,
  onLiftUp,
  onOpenIntimateSpace,
  onOpenLoveHome,
  onOpenGiftWall,
  onOpenSettings,
}) {
  const [mutual, setMutual] = useState(false);
  const [pair, setPair] = useState(null);
  const [fullOpen, setFullOpen] = useState(false);

  useEffect(() => {
    if (!viewerId || !seat?.user_id) return;
    isMutualFriend(viewerId, seat.user_id).then(setMutual);
  }, [viewerId, seat?.user_id]);

  useEffect(() => {
    if (!viewerId || !seat?.user_id || viewerId === seat.user_id) {
      setPair(null);
      return;
    }
    loadBondBetween(viewerId, seat.user_id, viewerId).then(setPair);
  }, [viewerId, seat?.user_id, guardRefreshToken]);

  if (!seat) return null;

  const isSelf = viewerId === seat.user_id;
  const merged = { ...profile, ...seat, charm: profile?.charm ?? 0 };
  const avatarSrc = seat.avatar_url || profile?.avatar_url || null;
  const displayName = seat.nickname || profile?.display_name || "Guest";
  const initial = displayName.charAt(0).toUpperCase();
  const activeBond = pair?.status === "active" && pair?.bondType;
  const showCpPill = !isSelf && activeBond && CP_TYPES.has(pair.bondType);
  const showModBar = canModerate && !isSelf;

  async function copyId(e) {
    e.stopPropagation();
    const code = seat.user_code || profile?.user_code;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      onToast?.("ID copied");
    } catch {
      /* ok */
    }
  }

  function openFull(e) {
    e?.stopPropagation?.();
    setFullOpen(true);
  }

  async function startWalkie(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* ok */
    }
    await onWalkieStart?.();
  }

  async function stopWalkie(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ok */
    }
    await onWalkieEnd?.();
  }

  const quickCard = !fullOpen ? (
    <div className="profile-card-backdrop user-profile-weplay-backdrop" onClick={onClose}>
      <div className="user-profile-weplay" onClick={(e) => e.stopPropagation()}>
        <div className="user-profile-weplay-hero">
          <button type="button" className="user-profile-weplay-close" onClick={onClose} aria-label="Close">
            ···
          </button>
          {showCpPill && (
            <button type="button" className="user-profile-weplay-cp" onClick={() => onOpenIntimateSpace?.(pair)}>
              His/Her {bondMeta(pair.bondType).label}
            </button>
          )}
        </div>

        <div className="user-profile-weplay-body">
          <div className="user-profile-weplay-row">
            <button type="button" className="user-profile-weplay-avatar-btn" onClick={openFull}>
              <span className="user-profile-weplay-avatar-wrap">
                <AvatarImg
                  src={avatarSrc}
                  fallback={initial}
                  className="user-profile-weplay-avatar user-profile-weplay-avatar--fallback"
                  imgClassName="user-profile-weplay-avatar"
                />
              </span>
            </button>
            <div className="user-profile-weplay-info">
              <button type="button" className="user-profile-weplay-name" onClick={openFull}>
                <VipDisplayName name={displayName} profile={merged} variant="light" />
              </button>
              <ProfileBadgeRow profile={merged} />
              {(seat.user_code || profile?.user_code) && (
                <button type="button" className="user-profile-weplay-id" onClick={copyId}>
                  ID: {seat.user_code || profile.user_code}
                  <span className="user-profile-weplay-copy" aria-hidden>
                    ⧉
                  </span>
                </button>
              )}
            </div>
          </div>

          {!isSelf && (
            <div className="user-profile-weplay-actions">
              {onWalkieStart && onWalkieEnd ? (
                <button
                  type="button"
                  className={`user-profile-weplay-action user-profile-weplay-action--walkie ${walkieActive ? "user-profile-weplay-action--active" : ""}`}
                  disabled={walkieDisabled}
                  onPointerDown={startWalkie}
                  onPointerUp={stopWalkie}
                  onPointerCancel={stopWalkie}
                  onLostPointerCapture={(e) => {
                    if (walkieActive) stopWalkie(e);
                  }}
                  title="Hold to talk"
                >
                  <IconWalkie />
                </button>
              ) : (
                <button
                  type="button"
                  className="user-profile-weplay-action user-profile-weplay-action--walkie"
                  title={mutual ? "Message" : "Add friend"}
                  onClick={mutual ? onMessage : openFull}
                >
                  <IconWalkie />
                </button>
              )}
              {onSendGift && (
                <button type="button" className="user-profile-weplay-action user-profile-weplay-action--gift" onClick={onSendGift} title="Gift">
                  <IconGift />
                </button>
              )}
            </div>
          )}

          {isSelf && (
            <div className="user-profile-weplay-self">
              {canModerate && onToggleSeatMute && (
                <button type="button" className="user-profile-weplay-self-btn" onClick={onToggleSeatMute}>
                  {seatMuted ? "Unmute Seat" : "Mute Seat"}
                </button>
              )}
              {onInvite && (
                <button type="button" className="user-profile-weplay-self-btn user-profile-weplay-self-btn--primary" onClick={onInvite}>
                  Invite
                </button>
              )}
              {onLeaveSeat && (
                <button type="button" className="user-profile-weplay-self-btn user-profile-weplay-self-btn--leave" onClick={onLeaveSeat}>
                  Leave seat
                </button>
              )}
            </div>
          )}

          {showModBar && (
            <div className="user-profile-weplay-modbar">
              {onToggleSeatMute && (
                <button type="button" onClick={onToggleSeatMute}>
                  {seatMuted ? "Unmute" : "Mute"}
                </button>
              )}
              {onLiftUp && (
                <button type="button" onClick={onLiftUp}>
                  Lift Up
                </button>
              )}
              {canKick && onKickFromRoom && (
                <button type="button" className="user-profile-mod-kick" onClick={onKickFromRoom}>
                  Kick
                </button>
              )}
              {canKick && onChangeUser && (
                <button type="button" onClick={onChangeUser}>
                  Change User
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {quickCard && createPortal(quickCard, document.body)}
      {fullOpen && (
        <UserFullProfileSheet
          seat={seat}
          profile={profile}
          viewerId={viewerId}
          viewerProfile={viewerProfile}
          viewerName={viewerName}
          onClose={() => setFullOpen(false)}
          onSendGift={() => {
            setFullOpen(false);
            onSendGift?.();
          }}
          onMessage={() => {
            setFullOpen(false);
            onMessage?.();
          }}
          onBlockUser={onBlockUser}
          canBlockUser={canBlockUser}
          onBondChange={onBondChange}
          onToast={onToast}
          guardRefreshToken={guardRefreshToken}
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onCoinsChange={onCoinsChange}
          onOpenIntimateSpace={(bond) => {
            setFullOpen(false);
            onOpenIntimateSpace?.(bond ?? pair);
          }}
          onOpenLoveHome={() => {
            setFullOpen(false);
            onOpenLoveHome?.();
          }}
          onOpenGiftWall={() => {
            setFullOpen(false);
            onOpenGiftWall?.();
          }}
          onOpenSettings={onOpenSettings}
        />
      )}
    </>
  );
}
