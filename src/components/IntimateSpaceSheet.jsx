import { useEffect, useState } from "react";
import { formatCompactNumber } from "../formatCompact.js";
import { bestieBowIconSrc, bestieBowLevelFromExp } from "../bestieBowTiers.js";
import { cpHeartIconSrc, cpHeartLevelFromExp } from "../cpHeartTiers.js";
import {
  bondMeta,
  daysTogether,
  isBestieBondType,
  isCpBondType,
  partnerUserId,
  relationshipLevelProgress,
  GUARD_PROPOSE_CP,
} from "../relationships.js";
import { loadProfilesForUserIds } from "../profile.js";
import AvatarImg from "./AvatarImg.jsx";
import { BondIcon, bondIconType } from "./BondIcon.jsx";

const TOKEN_UNLOCK_LEVELS = [1, 2, 3, 4, 5];
const SLOT_UNLOCK_LEVELS = [1, 2, 3];

export default function IntimateSpaceSheet({
  userId,
  bond,
  onClose,
  onOpenLoveHome,
  onCancelBond,
  onToast,
}) {
  const [partner, setPartner] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [declaration, setDeclaration] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!bond || !userId) return;
    const pid = partnerUserId(bond, userId);
    loadProfilesForUserIds([userId, pid]).then((map) => {
      setMyProfile(map[userId] ?? null);
      setPartner(map[pid] ?? null);
    });
    const saved = localStorage.getItem(`intimate-decl-${bond.id ?? `${bond.userA}-${bond.userB}`}`);
    if (saved) setDeclaration(saved);
  }, [bond, userId]);

  if (!bond) return null;

  const meta = bondMeta(bond.bondType);
  const progress = relationshipLevelProgress(bond.relationshipExp ?? 0);
  const bondExp = bond.relationshipExp ?? 0;
  const cpHeartLevel = isCpBondType(bond.bondType) ? cpHeartLevelFromExp(bondExp) : null;
  const bestieBowLevel = isBestieBondType(bond.bondType) ? bestieBowLevelFromExp(bondExp) : null;
  const displayLevel = cpHeartLevel ?? bestieBowLevel ?? progress.level;
  const days = daysTogether(bond.startedAt);
  const partnerName = partner?.display_name ?? "Partner";
  const partnerInitial = partnerName.charAt(0).toUpperCase();
  const myInitial = (myProfile?.display_name || "Y").charAt(0).toUpperCase();
  const declKey = `intimate-decl-${bond.id ?? `${bond.userA}-${bond.userB}`}`;

  async function handleCancel() {
    if (!window.confirm(`Cancel your ${meta.label} bond with ${partnerName}?`)) return;
    setBusy(true);
    try {
      await onCancelBond?.();
      onToast?.("Relationship ended");
      onClose?.();
    } catch (err) {
      onToast?.(err?.message ?? "Could not cancel");
    } finally {
      setBusy(false);
      setMenuOpen(false);
    }
  }

  function handleRules() {
    setMenuOpen(false);
    setRulesOpen(true);
  }

  function handleEditDeclaration() {
    setMenuOpen(false);
    const next = window.prompt("Your relationship declaration:", declaration || "");
    if (next == null) return;
    setDeclaration(next.trim());
    localStorage.setItem(declKey, next.trim());
    onToast?.("Declaration saved");
  }

  return (
    <div className="profile-card-backdrop intimate-space-backdrop" onClick={onClose}>
      <div className="intimate-space" onClick={(e) => e.stopPropagation()}>
        <header className="intimate-space-header">
          <button type="button" className="intimate-space-back" onClick={onClose} aria-label="Back">
            ←
          </button>
          <h2>Intimate Space</h2>
          <button type="button" className="intimate-space-menu-btn" onClick={() => setMenuOpen((v) => !v)}>
            ⋮
          </button>
          {menuOpen && (
            <div className="intimate-space-menu">
              <button type="button" onClick={handleRules}>Rules</button>
              <button type="button" onClick={handleEditDeclaration}>Edit declaration</button>
              <button type="button" disabled={busy} onClick={handleCancel}>
                Cancel relationship
              </button>
            </div>
          )}
        </header>

        {rulesOpen && (
          <div className="intimate-space-rules">
            <p><strong>{meta.label} rules</strong></p>
            <ul>
              <li>Mutual friends required for guard and gifts</li>
              <li>Guard {formatCompactNumber(GUARD_PROPOSE_CP)} to propose CP at Church</li>
              <li>Intimacy grows from gifts and time together</li>
              <li>Unlock photos and tokens as your level rises</li>
            </ul>
            <button type="button" onClick={() => setRulesOpen(false)}>Got it</button>
          </div>
        )}

        <div className={`intimate-space-hero intimate-space-hero--${meta.popupClass}`}>
          <div className="intimate-space-partners">
            <AvatarImg
              src={myProfile?.avatar_url}
              fallback={myInitial}
              className="intimate-space-avatar intimate-space-avatar--fallback"
              imgClassName="intimate-space-avatar"
            />
            <div className="intimate-space-center">
              {cpHeartLevel ? (
                <img
                  src={cpHeartIconSrc(cpHeartLevel)}
                  alt=""
                  className="intimate-space-cp-heart"
                  draggable={false}
                />
              ) : bestieBowLevel ? (
                <img
                  src={bestieBowIconSrc(bestieBowLevel)}
                  alt=""
                  className="intimate-space-bestie-bow"
                  draggable={false}
                />
              ) : (
                <BondIcon type={bondIconType(bond.bondType)} className="intimate-space-bond-icon" />
              )}
              <span className="intimate-space-bond-label">
                {meta.label} LV.{displayLevel}
              </span>
            </div>
            <AvatarImg
              src={partner?.avatar_url}
              fallback={partnerInitial}
              className="intimate-space-avatar intimate-space-avatar--fallback"
              imgClassName="intimate-space-avatar"
            />
          </div>
          <p className="intimate-space-days">Together {days} day{days === 1 ? "" : "s"}</p>
          {declaration && <p className="intimate-space-declaration">&ldquo;{declaration}&rdquo;</p>}
        </div>

        <div className="intimate-space-xp">
          <div className="intimate-space-xp-bar">
            <span style={{ width: `${progress.pct}%` }} />
          </div>
          <p className="intimate-space-xp-label">
            {formatCompactNumber(progress.value)} / {formatCompactNumber(progress.next)} intimacy
          </p>
        </div>

        <section className="intimate-space-section">
          <h3>Exclusive Relationship</h3>
          <div className="intimate-space-slots">
            {SLOT_UNLOCK_LEVELS.map((needLv, i) => {
              const unlocked = progress.level >= needLv;
              return (
                <div key={needLv} className={`intimate-space-slot ${unlocked ? "intimate-space-slot--open" : "intimate-space-slot--locked"}`}>
                  {unlocked ? <span>📷</span> : <span>🔒</span>}
                  <small>{unlocked ? `Photo ${i + 1}` : `LV.${needLv}`}</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="intimate-space-section">
          <h3>{meta.label} Token Wall</h3>
          <div className="intimate-space-tokens">
            {["🎀", "💍", "🌸", "✈️", "🛡️"].map((tok, i) => {
              const needLv = TOKEN_UNLOCK_LEVELS[i];
              const unlocked = progress.level >= needLv;
              return (
                <span key={tok} className={`intimate-space-token ${unlocked ? "intimate-space-token--open" : "intimate-space-token--locked"}`} title={unlocked ? "Unlocked" : `Reach LV.${needLv}`}>
                  {unlocked ? tok : "🔒"}
                </span>
              );
            })}
          </div>
        </section>

        {(bond.bondType === "cp" || bond.bondType === "wedding") && onOpenLoveHome && (
          <button type="button" className="primary-btn intimate-space-love-btn" onClick={onOpenLoveHome}>
            💒 Open Love Home
          </button>
        )}
      </div>
    </div>
  );
}
