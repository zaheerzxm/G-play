import { useEffect, useMemo, useState } from "react";
import { loadProfilesForUserIds } from "../profile.js";
import { loadActiveBondsForUser, loadCoupleBondsForUser, bondMeta, partnerUserId } from "../relationships.js";
import { loadMutualFriends } from "../social.js";
import AvatarImg from "./AvatarImg.jsx";
import { BondIcon, bondIconType } from "./BondIcon.jsx";

export default function FamilySheet({ userId, onClose, onOpenChurch, onToast }) {
  const [bonds, setBonds] = useState([]);
  const [coupleBonds, setCoupleBonds] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([loadActiveBondsForUser(userId), loadCoupleBondsForUser(userId), loadMutualFriends(userId)])
      .then(async ([rows, coupleRows, mutual]) => {
        const enriched = await Promise.all(
          rows.map(async (b) => {
            const pid = partnerUserId(b, userId);
            const profiles = await loadProfilesForUserIds([userId, pid]);
            return { ...b, myProfile: profiles[userId], partnerProfile: profiles[pid] };
          }),
        );
        const enrichedCouples = await Promise.all(
          coupleRows.map(async (b) => {
            const pid = partnerUserId(b, userId);
            const profiles = await loadProfilesForUserIds([userId, pid]);
            return { ...b, myProfile: profiles[userId], partnerProfile: profiles[pid] };
          }),
        );
        setBonds(enriched);
        setCoupleBonds(enrichedCouples);
        setFriends(mutual);
      })
      .catch(() => onToast?.("Could not load family"))
      .finally(() => setLoading(false));
  }, [userId, onToast]);

  const cpBond = useMemo(() => coupleBonds[0] ?? null, [coupleBonds]);
  const otherCoupleBonds = useMemo(() => coupleBonds.slice(1), [coupleBonds]);
  const otherBonds = useMemo(
    () => bonds.filter((b) => b.bondType !== "cp" && b.bondType !== "wedding"),
    [bonds],
  );

  return (
    <div className="profile-card-backdrop" onClick={onClose}>
      <div className="hub-sheet family-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="hub-sheet-header">
          <button type="button" className="hub-sheet-back" onClick={onClose}>←</button>
          <h2>👨‍👩‍👧 Family</h2>
        </header>

        {loading && <p className="hub-sheet-hint">Loading…</p>}

        {!loading && cpBond && (
          <section className="family-cp-card">
            <h3>{coupleBonds.length > 1 ? `Couples (${coupleBonds.length})` : "Couple"}</h3>
            <div className="family-cp-row">
              <AvatarImg src={cpBond.myProfile?.avatar_url} fallback="Y" className="family-avatar" imgClassName="family-avatar" />
              <BondIcon type={bondIconType(cpBond.bondType)} className="family-bond-icon" />
              <AvatarImg
                src={cpBond.partnerProfile?.avatar_url}
                fallback={(cpBond.partnerProfile?.display_name || "?").charAt(0)}
                className="family-avatar"
                imgClassName="family-avatar"
              />
            </div>
            <p>{cpBond.partnerProfile?.display_name ?? "Partner"} · {bondMeta(cpBond.bondType).label}</p>
            {otherCoupleBonds.length > 0 && (
              <ul className="family-bond-list">
                {otherCoupleBonds.map((b) => (
                  <li key={b.id ?? `${b.userA}-${b.userB}`}>
                    <AvatarImg
                      src={b.partnerProfile?.avatar_url}
                      fallback={(b.partnerProfile?.display_name || "?").charAt(0)}
                      className="family-avatar family-avatar--sm"
                      imgClassName="family-avatar family-avatar--sm"
                    />
                    <span>{b.partnerProfile?.display_name ?? "Guest"}</span>
                    <em>{bondMeta(b.bondType).label}</em>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {!loading && otherBonds.length > 0 && (
          <section className="family-section">
            <h3>Bonds</h3>
            <ul className="family-bond-list">
              {otherBonds.map((b) => (
                <li key={b.id ?? `${b.userA}-${b.userB}`}>
                  <AvatarImg
                    src={b.partnerProfile?.avatar_url}
                    fallback={(b.partnerProfile?.display_name || "?").charAt(0)}
                    className="family-avatar family-avatar--sm"
                    imgClassName="family-avatar family-avatar--sm"
                  />
                  <span>{b.partnerProfile?.display_name ?? "Guest"}</span>
                  <em>{bondMeta(b.bondType).label}</em>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!loading && (
          <section className="family-section">
            <h3>Mutual friends ({friends.length})</h3>
            <ul className="family-friend-list">
              {friends.slice(0, 12).map((f) => (
                <li key={f.id}>
                  <AvatarImg src={f.avatar_url} fallback={(f.display_name || "?").charAt(0)} className="family-avatar family-avatar--sm" imgClassName="family-avatar family-avatar--sm" />
                  <span>{f.display_name}</span>
                </li>
              ))}
              {friends.length === 0 && <li className="family-empty">Add mutual friends to grow your family</li>}
            </ul>
          </section>
        )}

        <button type="button" className="primary-btn family-church-btn" onClick={() => { onClose(); onOpenChurch?.(); }}>
          ⛪ Church — propose or wedding
        </button>
      </div>
    </div>
  );
}
