import { formatCompactNumber } from "../formatCompact.js";
import { bestieBowIconSrc } from "../bestieBowTiers.js";
import { cpHeartIconSrc } from "../cpHeartTiers.js";
import AvatarImg from "./AvatarImg.jsx";
import { BondIcon, bondIconType } from "./BondIcon.jsx";
import {
  bondDisplayLevel,
  bondMeta,
  daysTogether,
  isBestieBondType,
  isCpBondType,
} from "../relationships.js";

export default function RelationshipBondCard({ bond, onClose, onOpenIntimateSpace }) {
  if (!bond) return null;

  const meta = bondMeta(bond.bondType);
  const displayLevel =
    bond.displayLevel ?? bond.bestieBowLevel ?? bond.cpHeartLevel ?? bondDisplayLevel(bond);
  const days = daysTogether(bond.startedAt);
  const leftInitial = (bond.leftUser?.nickname ?? "?").charAt(0).toUpperCase();
  const rightInitial = (bond.rightUser?.nickname ?? "?").charAt(0).toUpperCase();
  const title = bond.title ?? `${meta.label} LV${displayLevel}`;
  const isCp = isCpBondType(bond.bondType);
  const isBestie = isBestieBondType(bond.bondType);
  const cpLevel = bond.cpHeartLevel ?? (isCp ? displayLevel : null);
  const bestieLevel = bond.bestieBowLevel ?? (isBestie ? displayLevel : null);
  const becomeLabel =
    bond.bondType === "bro"
      ? "Become Bro"
      : bond.bondType === "sis"
        ? "Become Sis"
        : bond.bondType === "confidant"
          ? "Become Confidant"
          : bond.bondType === "cp" || bond.bondType === "wedding"
            ? "Be together"
            : meta.label;

  return (
    <div className="profile-card-backdrop" onClick={onClose}>
      <div
        className={`relationship-bond-card relationship-bond-card--ornate relationship-bond-card--${meta.popupClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relationship-bond-card-frame" aria-hidden />
        <div className="relationship-bond-card-banner">{title}</div>
        <div className="relationship-bond-card-body">
          <div className="relationship-bond-card-users">
            <div className="relationship-bond-card-user">
              <AvatarImg
                src={bond.leftUser?.avatarUrl}
                fallback={leftInitial}
                className="relationship-bond-card-avatar relationship-bond-card-avatar--fallback"
                imgClassName="relationship-bond-card-avatar"
              />
              <span className="relationship-bond-card-name">{bond.leftUser?.nickname ?? "Guest"}</span>
            </div>
            <div className="relationship-bond-card-center">
              {cpLevel ? (
                <img
                  src={cpHeartIconSrc(cpLevel)}
                  alt=""
                  className="relationship-bond-card-tier-icon relationship-bond-card-tier-icon--heart"
                  draggable={false}
                />
              ) : bestieLevel ? (
                <img
                  src={bestieBowIconSrc(bestieLevel)}
                  alt=""
                  className="relationship-bond-card-tier-icon relationship-bond-card-tier-icon--bow"
                  draggable={false}
                />
              ) : (
                <BondIcon type={bondIconType(bond.bondType)} className="relationship-bond-card-icon-svg" />
              )}
              <span className="relationship-bond-card-become">{becomeLabel}</span>
              {(bond.bondType === "cp" || bond.bondType === "wedding") && (
                <span className="relationship-bond-card-rings" aria-hidden>💍💍</span>
              )}
            </div>
            <div className="relationship-bond-card-user">
              <AvatarImg
                src={bond.rightUser?.avatarUrl}
                fallback={rightInitial}
                className="relationship-bond-card-avatar relationship-bond-card-avatar--fallback"
                imgClassName="relationship-bond-card-avatar"
              />
              <span className="relationship-bond-card-name">{bond.rightUser?.nickname ?? "Guest"}</span>
            </div>
          </div>
          <p className="relationship-bond-card-days">
            Be together <strong>{days}</strong> day{days === 1 ? "" : "s"}
          </p>
          {(bond.leftGuard > 0 || bond.rightGuard > 0) && (
            <p className="relationship-bond-card-guard">
              🛡️ {bond.leftUser?.nickname}: {formatCompactNumber(bond.leftGuard)} ·{" "}
              {bond.rightUser?.nickname}: {formatCompactNumber(bond.rightGuard)}
            </p>
          )}
          {onOpenIntimateSpace && (
            <button type="button" className="relationship-bond-card-intimate" onClick={onOpenIntimateSpace}>
              Open Intimate Space
            </button>
          )}
        </div>
        <button type="button" className="relationship-bond-card-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
    </div>
  );
}
