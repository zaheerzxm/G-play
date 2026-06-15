import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatCompactNumber } from "../formatCompact.js";
import { loadAvatar3d } from "../avatar3d.js";
import {
  GUARD_PROPOSE_CP,
  loadBondBetween,
  loadPrimaryCoupleBond,
  partnerUserId,
  proposeBond,
} from "../relationships.js";
import { loadMutualFriends } from "../social.js";
import { loadProfilesForUserIds } from "../profile.js";
import AvatarImg from "./AvatarImg.jsx";
import Avatar3dFigure from "./Avatar3dFigure.jsx";
import { IconHeart, IconHelp, UiIcon } from "./NavIcons.jsx";
import VipDisplayName from "./VipDisplayName.jsx";

export default function MyHomeSheet({
  userId,
  profile,
  onClose,
  onOpenLoveHome,
  onOpenGuard,
  onOpenChurch,
  onToast,
}) {
  const [coupleBond, setCoupleBond] = useState(null);
  const [partner, setPartner] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const myAvatar3d = loadAvatar3d(userId, profile);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([loadPrimaryCoupleBond(userId), loadMutualFriends(userId)])
      .then(async ([bond, friends]) => {
        setCoupleBond(bond);
        if (bond) {
          const pid = partnerUserId(bond, userId);
          const map = await loadProfilesForUserIds([pid]);
          setPartner(map[pid] ?? null);
        } else {
          setPartner(null);
        }
        const withGuard = await Promise.all(
          friends.slice(0, 12).map(async (f) => {
            const pair = await loadBondBetween(userId, f.id, userId);
            return { friend: f, guard: pair?.guardMine ?? 0 };
          }),
        );
        withGuard.sort((a, b) => b.guard - a.guard);
        setSuggestions(withGuard);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  async function handlePropose(friend) {
    try {
      await proposeBond(userId, friend.id, "cp");
      onToast?.("CP proposal sent!");
    } catch (e) {
      onToast?.(e?.message ?? "Could not propose — need 3000 guard pts & mutual friends");
      onOpenChurch?.();
    }
  }

  const sheet = (
    <div className="gplay-mobile-shell-backdrop" onClick={onClose}>
      <div className="gplay-mobile-shell my-home-page" onClick={(e) => e.stopPropagation()}>
        <header className="weplay-subpage-header weplay-subpage-header--help my-home-header">
          <button type="button" className="weplay-subpage-back my-home-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <h1>My Home</h1>
          <button type="button" className="weplay-subpage-help my-home-help" aria-label="Help">
            <UiIcon Icon={IconHelp} />
          </button>
        </header>

        <div className="my-home-scroll">
        <div className="my-home-hero">
          <div className="my-home-stars" aria-hidden />
          <div className="my-home-cp-rings">
            <button
              type="button"
              className="my-home-cp-slot my-home-cp-slot--me"
              onClick={coupleBond ? onOpenLoveHome : undefined}
            >
              <div className="my-home-cp-avatar-wrap">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="my-home-cp-photo" />
                ) : (
                  <Avatar3dFigure config={myAvatar3d} size="cp" />
                )}
              </div>
              <span>{profile?.display_name ?? "You"}</span>
            </button>
            <span className="my-home-cp-pulse" aria-hidden>
              <UiIcon Icon={IconHeart} />
            </span>
            <button
              type="button"
              className="my-home-cp-slot my-home-cp-slot--partner"
              onClick={coupleBond ? onOpenLoveHome : undefined}
            >
              <div className="my-home-cp-avatar-wrap">
                {partner ? (
                  partner.avatar_url ? (
                    <img src={partner.avatar_url} alt="" className="my-home-cp-photo" />
                  ) : (
                    <Avatar3dFigure config={loadAvatar3d(partner.id, partner)} size="cp" />
                  )
                ) : (
                  <span className="my-home-cp-empty">?</span>
                )}
              </div>
              <span>{partner?.display_name ?? "CP"}</span>
            </button>
          </div>
          <p className="my-home-cp-hint">
            The person must be your friend and you need {formatCompactNumber(GUARD_PROPOSE_CP)} Guard Pts to propose
          </p>
        </div>

        <section className="my-home-suggest">
          <h2>People you may like</h2>
          <p className="my-home-suggest-sub">Gain more Guard through &apos;Protect&apos; and &apos;Send Gift&apos;</p>
          {loading && <p className="weplay-subpage-empty">Loading…</p>}
          <ul className="my-home-suggest-list">
            {suggestions.map(({ friend, guard }) => {
              const canPropose = guard >= GUARD_PROPOSE_CP;
              return (
                <li key={friend.id} className="my-home-suggest-row">
                  <AvatarImg
                    src={friend.avatar_url}
                    fallback={friend.display_name || "?"}
                    className="my-home-suggest-avatar"
                    imgClassName="my-home-suggest-avatar"
                  />
                  <div className="my-home-suggest-meta">
                    <VipDisplayName name={friend.display_name} profile={friend} variant="light" />
                    <span className="my-home-suggest-guard">Guard: {formatCompactNumber(guard)}</span>
                  </div>
                  <button
                    type="button"
                    className={`my-home-suggest-btn${canPropose ? "" : " my-home-suggest-btn--protect"}`}
                    onClick={() => (canPropose ? handlePropose(friend) : onOpenGuard?.(friend))}
                  >
                    {canPropose ? "Propose" : "Protect"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
