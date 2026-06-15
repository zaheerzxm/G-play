import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { loadMyClan } from "../clans.js";
import { countryDisplay, formatProfileLocation } from "../countries.js";
import { loadGiftWall } from "../giftTransactions.js";
import { loadUserMoments, SPOTLIGHT_FEED_NAME } from "../moments.js";
import { loadProfilesForUserIds, loadSavedRooms } from "../profile.js";
import { isFollowingUser, followUser, isMutualFriend } from "../social.js";
import {
  bondMeta,
  loadActiveBondsForUser,
  loadBondBetween,
  loadGuardRankingForUser,
  loadPrimaryCoupleBond,
  partnerUserId,
  relationshipLevelProgress,
  respondBondProposal,
} from "../relationships.js";
import { charmTierFromTotal } from "../charmTiers.js";
import { formatCompactNumber } from "../formatCompact.js";
import AvatarImg from "./AvatarImg.jsx";
import BffPreviewCards from "./BffPreviewCards.jsx";
import BffSheet from "./BffSheet.jsx";
import GuardSheet from "./GuardSheet.jsx";
import GiftWallSheet from "./GiftWallSheet.jsx";
import LoveHomeSheet from "./LoveHomeSheet.jsx";
import MomentsFeed from "./MomentsFeed.jsx";
import { IconChats, IconClan, IconCopy, IconGift, UiIcon } from "./NavIcons.jsx";
import ProfileBadgeRow from "./ProfileBadgeRow.jsx";
import VipDisplayName from "./VipDisplayName.jsx";
import { recordVisit } from "../visitors.js";
import {
  defaultPrivacySettings,
  isPrivacyActive,
  loadPrivacySettings,
  privacyFromProfile,
} from "../privacySettings.js";

const CP_TYPES = new Set(["cp", "wedding", "choti_ghar_wali", "badi_ghar_wali"]);
const BFF_TYPES = new Set(["bff", "bestie", "bro", "sis"]);

function ProfileSectionRow({ label, meta, onClick, disabled = false, children }) {
  return (
    <section className="weplay-profile-section">
      <button
        type="button"
        className="weplay-profile-section-head"
        onClick={onClick}
        disabled={disabled || !onClick}
      >
        <span>{label}</span>
        <span className="weplay-profile-section-meta">
          {meta}
          {onClick && <span className="weplay-profile-section-chevron">›</span>}
        </span>
      </button>
      {children}
    </section>
  );
}

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
  onOpenClan,
  onOpenFriends,
  onOpenPlayShow,
  onOpenStats,
}) {
  const [following, setFollowing] = useState(false);
  const [mutual, setMutual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pair, setPair] = useState(null);
  const [bondBusy, setBondBusy] = useState(false);
  const [giftStats, setGiftStats] = useState({ totalGifts: 0, totalStars: 0 });
  const [bffBonds, setBffBonds] = useState([]);
  const [guardRanking, setGuardRanking] = useState([]);
  const [savedRooms, setSavedRooms] = useState([]);
  const [clan, setClan] = useState(null);
  const [momentCount, setMomentCount] = useState(0);
  const [momentPreviews, setMomentPreviews] = useState([]);
  const [giftWallOpen, setGiftWallOpen] = useState(false);
  const [bffOpen, setBffOpen] = useState(false);
  const [guardOpen, setGuardOpen] = useState(false);
  const [momentsOpen, setMomentsOpen] = useState(false);
  const [coupleBond, setCoupleBond] = useState(null);
  const [loveHomeOpen, setLoveHomeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [targetPrivacy, setTargetPrivacy] = useState(() => privacyFromProfile(profile));
  const [viewerPrivacy, setViewerPrivacy] = useState(() => privacyFromProfile(viewerProfile));
  const [viewerPrivacyReady, setViewerPrivacyReady] = useState(false);

  const targetId = seat?.user_id ?? profile?.id;
  const isSelf = viewerId === targetId;
  const merged = { ...profile, ...seat, charm: profile?.charm ?? 0 };
  const avatarSrc = seat?.avatar_url || profile?.avatar_url || null;
  const displayName = seat?.nickname || profile?.display_name || "Guest";
  const initial = displayName.charAt(0).toUpperCase();
  const country = countryDisplay(profile?.country ?? profile?.country_code ?? seat?.country);
  const hideLocationFromOthers = !isSelf && isPrivacyActive(targetPrivacy, "hide_location");
  const locationLabel = hideLocationFromOthers
    ? null
    : formatProfileLocation(profile ?? { country: seat?.country });
  const hideGuardFromOthers = !isSelf && isPrivacyActive(targetPrivacy, "hide_guardian_board");
  const charmLine = charmTierFromTotal(merged.charm ?? 0);

  useEffect(() => {
    if (!viewerId || !targetId) return;
    isFollowingUser(viewerId, targetId).then(setFollowing);
    isMutualFriend(viewerId, targetId).then(setMutual);
  }, [viewerId, targetId]);

  useEffect(() => {
    if (profile?.privacy_settings != null) {
      setTargetPrivacy(privacyFromProfile(profile));
      return;
    }
    if (!targetId) return;
    loadPrivacySettings(targetId)
      .then(setTargetPrivacy)
      .catch(() => setTargetPrivacy(defaultPrivacySettings()));
  }, [targetId, profile?.privacy_settings]);

  useEffect(() => {
    if (isSelf) {
      setViewerPrivacyReady(true);
      return;
    }
    if (viewerProfile?.privacy_settings != null) {
      setViewerPrivacy(privacyFromProfile(viewerProfile));
      setViewerPrivacyReady(true);
      return;
    }
    if (!viewerId) {
      setViewerPrivacyReady(true);
      return;
    }
    setViewerPrivacyReady(false);
    let cancelled = false;
    loadPrivacySettings(viewerId)
      .then((settings) => {
        if (!cancelled) setViewerPrivacy(settings);
      })
      .catch(() => {
        if (!cancelled) setViewerPrivacy(defaultPrivacySettings());
      })
      .finally(() => {
        if (!cancelled) setViewerPrivacyReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [viewerId, viewerProfile?.privacy_settings, isSelf]);

  useEffect(() => {
    if (!viewerPrivacyReady) return;
    if (!viewerId || !targetId || isSelf) return;
    if (isPrivacyActive(viewerPrivacy, "incognito_visit")) return;
    recordVisit(targetId, {
      id: viewerId,
      display_name: viewerName || viewerProfile?.display_name,
      avatar_url: viewerProfile?.avatar_url,
      country: viewerProfile?.country,
    });
  }, [
    viewerPrivacyReady,
    viewerId,
    targetId,
    isSelf,
    viewerName,
    viewerProfile?.display_name,
    viewerProfile?.avatar_url,
    viewerProfile?.country,
    viewerPrivacy.incognito_visit,
  ]);

  useEffect(() => {
    if (!viewerId || !targetId || isSelf) {
      setPair(null);
      return;
    }
    loadBondBetween(viewerId, targetId, viewerId).then(setPair);
  }, [viewerId, targetId, isSelf, guardRefreshToken]);

  useEffect(() => {
    if (!targetId) return;
    loadGiftWall(targetId).then(setGiftStats).catch(() => {});
    loadMyClan(targetId).then(setClan).catch(() => {});
    loadActiveBondsForUser(targetId)
      .then(async (rows) => {
        const filtered = rows.filter((b) => BFF_TYPES.has(b.bondType) && !CP_TYPES.has(b.bondType));
        const ids = filtered.map((b) => partnerUserId(b, targetId)).filter(Boolean);
        const profiles = ids.length ? await loadProfilesForUserIds(ids) : {};
        return filtered.map((b) => {
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
      .then(setBffBonds)
      .catch(() => {});
    loadSavedRooms(targetId).then(setSavedRooms).catch(() => {});
    loadUserMoments(targetId, 100)
      .then((rows) => {
        setMomentCount(rows.length);
        setMomentPreviews(rows.slice(0, 4));
      })
      .catch(() => {});
    loadPrimaryCoupleBond(targetId).then(setCoupleBond).catch(() => setCoupleBond(null));
  }, [targetId]);

  useEffect(() => {
    if (!targetId) return;
    if (!isSelf && isPrivacyActive(targetPrivacy, "hide_guardian_board")) {
      setGuardRanking([]);
      return;
    }
    loadGuardRankingForUser(targetId, 5)
      .then(setGuardRanking)
      .catch(() => setGuardRanking([]));
  }, [targetId, isSelf, targetPrivacy.hide_guardian_board]);

  if (!seat) return null;

  const theirName = displayName;
  const guardMine = pair?.guardMine ?? 0;
  const activeBond = pair?.status === "active" && pair?.bondType;
  const pending = pair?.status === "pending";
  const pendingFromThem = pending && pair?.proposedBy && pair.proposedBy !== viewerId;
  const relProgress = pair?.relationshipExp != null ? relationshipLevelProgress(pair.relationshipExp) : null;
  const signature = profile?.title?.trim() || profile?.bio?.trim() || "No signature yet";

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

  const profileSheet = (
    <div className="gplay-mobile-shell-backdrop gplay-mobile-shell-backdrop--profile" onClick={handleBack}>
      <div className="gplay-mobile-shell weplay-full-profile weplay-full-profile--ref weplay-full-profile--mobile" onClick={(e) => e.stopPropagation()}>
        <div className="weplay-full-profile-scroll">
          <div className="weplay-full-profile-cover-ref">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="weplay-full-profile-cover-img" />
            ) : (
              <div className="weplay-full-profile-cover-fallback">{initial}</div>
            )}
            <header className="weplay-full-profile-nav weplay-full-profile-nav--overlay">
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
          </div>

          <div className="weplay-full-profile-identity-ref">
            <VipDisplayName
              as="h1"
              name={displayName}
              profile={merged}
              variant="light"
              className="weplay-full-profile-name-ref"
            />
            <div className="weplay-identity-ref-row">
              <ProfileBadgeRow profile={merged} showFamily={!!clan} />
              {locationLabel && (
                <span className="weplay-country-ref" title={country?.label ?? locationLabel}>
                  {locationLabel}
                </span>
              )}
            </div>
            {(seat.user_code || profile?.user_code) && (
              <button type="button" className="weplay-full-profile-id-ref" onClick={copyId}>
                ID: {seat.user_code || profile.user_code} <UiIcon Icon={IconCopy} aria-hidden />
              </button>
            )}
          </div>

          <ProfileSectionRow
            label={SPOTLIGHT_FEED_NAME}
            meta={momentCount}
            onClick={() => setMomentsOpen(true)}
          >
            {momentPreviews.length > 0 && (
              <div className="weplay-moments-preview">
                {momentPreviews.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="weplay-moments-preview-thumb"
                    onClick={() => setMomentsOpen(true)}
                  >
                    {m.image_url ? (
                      <img src={m.image_url} alt="" />
                    ) : (
                      <span>{(m.content || "…").slice(0, 1)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ProfileSectionRow>

          <ProfileSectionRow
            label="Gift Wall"
            meta=""
            onClick={() => setGiftWallOpen(true)}
          >
            <button
              type="button"
              className="weplay-gift-wall-card-ref"
              onClick={(e) => {
                e.stopPropagation();
                setGiftWallOpen(true);
              }}
            >
              <span className="weplay-gift-wall-card-ref-icon" aria-hidden>🎁</span>
              <span className="weplay-gift-wall-stat-ref">
                <strong>{formatCompactNumber(giftStats.totalGifts)}</strong>
                <small>Gift</small>
              </span>
              <span className="weplay-gift-wall-stat-ref">
                <strong>{formatCompactNumber(giftStats.totalStars)}</strong>
                <small>Star</small>
              </span>
            </button>
          </ProfileSectionRow>

          <section className="weplay-profile-section">
            <div className="weplay-profile-section-head weplay-profile-section-head--static">
              <span>Signature</span>
            </div>
            <p className="weplay-profile-signature">{signature}</p>
          </section>

          <ProfileSectionRow
            label={<>BFF <span className="weplay-bff-heart">❤️</span></>}
            meta={bffBonds.length}
            onClick={() => setBffOpen(true)}
          >
            <BffPreviewCards bonds={bffBonds} max={3} />
          </ProfileSectionRow>

          {!hideGuardFromOthers && (
            <ProfileSectionRow
              label="Guard"
              meta=""
              onClick={() => setGuardOpen(true)}
            >
              {guardRanking.length > 0 && (
                <div className="weplay-guard-thumb-row">
                  {guardRanking.slice(0, 5).map((g) => (
                    <AvatarImg
                      key={g.userId}
                      src={g.profile?.avatar_url}
                      fallback={g.profile?.display_name || "?"}
                      className="weplay-guard-thumb weplay-guard-thumb--fallback"
                      imgClassName="weplay-guard-thumb"
                      title={g.profile?.display_name}
                    />
                  ))}
                </div>
              )}
            </ProfileSectionRow>
          )}

          {savedRooms.length > 0 && (
            <ProfileSectionRow
              label="Advanced Voice Room"
              meta={savedRooms.length}
              onClick={isSelf ? undefined : undefined}
            >
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
            </ProfileSectionRow>
          )}

          {coupleBond && (
            <ProfileSectionRow
              label={isSelf ? "Love Home" : `His/Her ${bondMeta(coupleBond.bondType).label}`}
              meta=""
              onClick={() => setLoveHomeOpen(true)}
            />
          )}

          {clan && (
            <ProfileSectionRow
              label="Clan"
              meta=""
              onClick={onOpenClan}
              disabled={!onOpenClan}
            >
              <div className="weplay-family-row-ref">
                <span className="weplay-family-logo-ref">
                  <UiIcon Icon={IconClan} />
                </span>
                <span className="weplay-family-name-ref">{clan.name}</span>
              </div>
            </ProfileSectionRow>
          )}

          <ProfileSectionRow
            label="Stats"
            meta={isSelf ? "Games & wins" : ""}
            onClick={isSelf ? onOpenStats : undefined}
            disabled={!isSelf || !onOpenStats}
          />

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

          {activeBond && relProgress && (
            <button
              type="button"
              className="weplay-guard-hint weplay-guard-hint--link"
              onClick={() => onOpenIntimateSpace?.(pair)}
            >
              {bondMeta(pair.bondType).label} LV{relProgress.level} · {formatCompactNumber(relProgress.value)} XP
            </button>
          )}
        </div>

        {!isSelf && (
          <footer className="weplay-full-profile-footer-ref">
            {onSendGift && (
              <button type="button" className="weplay-footer-btn-ref weplay-footer-btn-ref--gift" onClick={onSendGift}>
                <IconGift /> Send Gift
              </button>
            )}
            {mutual && onMessage ? (
              <button type="button" className="weplay-footer-btn-ref weplay-footer-btn-ref--chat" onClick={onMessage}>
                <IconChats /> Chat
              </button>
            ) : (
              <button
                type="button"
                className={`weplay-footer-btn-ref weplay-footer-btn-ref--chat ${following && !mutual ? "weplay-footer-btn-ref--muted" : ""}`}
                disabled={busy || mutual || following}
                onClick={handleAddFriend}
              >
                {mutual ? "✓ Friends" : following ? "Request sent" : "+ Add Friend"}
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );

  return createPortal(
    <>
      {profileSheet}
      {momentsOpen && (
        <MomentsFeed
          userId={viewerId}
          profileUserId={targetId}
          profileName={displayName}
          fullPage
          elevated
          onClose={() => setMomentsOpen(false)}
        />
      )}
      {giftWallOpen && (
        <GiftWallSheet
          userId={targetId}
          profile={merged}
          fullPage
          elevated
          onClose={() => setGiftWallOpen(false)}
          onSendGift={!isSelf ? onSendGift : undefined}
        />
      )}
      {bffOpen && (
        <BffSheet
          targetId={targetId}
          viewerId={viewerId}
          isSelf={isSelf}
          elevated
          onClose={() => setBffOpen(false)}
          onOpenFriends={onOpenFriends}
          onOpenIntimateSpace={(bond) => {
            setBffOpen(false);
            onOpenIntimateSpace?.(bond);
          }}
          onToast={onToast}
          onCoinsChange={isSelf ? onCoinsChange : undefined}
        />
      )}
      {guardOpen && !hideGuardFromOthers && (
        <GuardSheet
          targetId={targetId}
          targetName={theirName}
          targetProfile={merged}
          viewerId={viewerId}
          onSendGift={onSendGift}
          elevated
          onClose={() => setGuardOpen(false)}
          onToast={onToast}
          guardRefreshToken={guardRefreshToken}
        />
      )}
      {loveHomeOpen && coupleBond && (
        <LoveHomeSheet
          userId={targetId}
          bond={coupleBond}
          ownerProfile={merged}
          elevated
          onClose={() => setLoveHomeOpen(false)}
          onSendGift={!isSelf ? onSendGift : undefined}
        />
      )}
    </>,
    document.body,
  );
}
