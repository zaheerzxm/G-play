import { useEffect, useState } from "react";
import { bestieBowIconSrc } from "../bestieBowTiers.js";
import { cpHeartIconSrc } from "../cpHeartTiers.js";
import { seatBondMidpoint } from "../giftFx.js";
import { bondMeta, isBestieBondType, isCpBondType } from "../relationships.js";
import { BondIcon, bondIconType } from "./BondIcon.jsx";

export default function SeatBondLayer({ bonds, pairSignals = [], onBondTap }) {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    function measure() {
      const bondPositions = (bonds ?? [])
        .map((bond) => {
          const mid = seatBondMidpoint(bond.seatA, bond.seatB);
          if (!mid) return null;
          return { id: bond.id, mid, bond, kind: "bond" };
        })
        .filter(Boolean);

      const pairPositions = (pairSignals ?? [])
        .map((pair) => {
          const mid = seatBondMidpoint(pair.seatA, pair.seatB);
          if (!mid) return null;
          return { id: pair.id, mid, pair, kind: "partner" };
        })
        .filter(Boolean);

      setPositions([...bondPositions, ...pairPositions]);
    }

    measure();
    const t = setTimeout(measure, 80);
    const t2 = setTimeout(measure, 320);
    window.addEventListener("resize", measure);

    const stageEl = document.querySelector(".seats-stage");
    const observer = stageEl && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(measure)
      : null;
    observer?.observe(stageEl);

    return () => {
      clearTimeout(t);
      clearTimeout(t2);
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [bonds, pairSignals]);

  return (
    <div className="seat-bond-layer" aria-hidden={positions.length === 0}>
      {positions.map(({ id, mid, bond, pair, kind }) => {
        if (kind === "partner") {
          return (
            <span
              key={id}
              className="seat-partner-pair-signal"
              style={{ left: `${mid.x}px`, top: `${mid.y}px` }}
              aria-hidden
            />
          );
        }

        const meta = bondMeta(bond.bondType);
        const isCp = isCpBondType(bond.bondType);
        const isBestie = isBestieBondType(bond.bondType);
        const cpLevel = bond.cpHeartLevel ?? 1;
        const bestieLevel = bond.bestieBowLevel ?? 1;
        const iconType = bondIconType(bond.bondType);

        if (isCp) {
          const heartSrc = cpHeartIconSrc(cpLevel);
          return (
            <button
              key={id}
              type="button"
              className={`seat-cp-heart seat-cp-heart--lv${cpLevel}`}
              style={{ left: `${mid.x}px`, top: `${mid.y}px` }}
              title={`${meta.label} · tap for details`}
              aria-label={`${meta.label} bond`}
              onClick={(e) => {
                e.stopPropagation();
                onBondTap?.(bond);
              }}
            >
              <img src={heartSrc} alt="" className="seat-cp-heart-icon" draggable={false} />
            </button>
          );
        }

        if (isBestie) {
          const bowSrc = bestieBowIconSrc(bestieLevel);
          return (
            <button
              key={id}
              type="button"
              className={`seat-bestie-bow seat-bestie-bow--lv${bestieLevel}`}
              style={{ left: `${mid.x}px`, top: `${mid.y}px` }}
              title={`${meta.label} · tap for details`}
              aria-label={`${meta.label} bond`}
              onClick={(e) => {
                e.stopPropagation();
                onBondTap?.(bond);
              }}
            >
              <img src={bowSrc} alt="" className="seat-bestie-bow-icon" draggable={false} />
            </button>
          );
        }

        return (
          <button
            key={id}
            type="button"
            className={`seat-bond seat-bond--${meta.popupClass}`}
            style={{ left: `${mid.x}px`, top: `${mid.y}px` }}
            title={`${meta.label} LV${bond.level ?? 1} · tap for details`}
            aria-label={`${meta.label} bond`}
            onClick={(e) => {
              e.stopPropagation();
              onBondTap?.(bond);
            }}
          >
            <span className="seat-bond-glow" aria-hidden />
            <BondIcon type={iconType} className="seat-bond-icon-svg" />
          </button>
        );
      })}
    </div>
  );
}
