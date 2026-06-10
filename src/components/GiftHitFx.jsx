import { useEffect } from "react";
import CoinIcon from "./CoinIcon.jsx";

export default function GiftHitFx({ hits, onDone }) {
  useEffect(() => {
    if (!hits.length) return undefined;
    const timers = hits.map((h) => setTimeout(() => onDone(h.id), h.duration ?? 1200));
    return () => timers.forEach(clearTimeout);
  }, [hits, onDone]);

  if (!hits.length) return null;

  return (
    <div className="gift-hit-layer" aria-hidden>
      {hits.map((h) => (
        <div
          key={h.id}
          className={`gift-hit gift-hit--${h.fx ?? "fly"}`}
          style={{ left: `${h.x}px`, top: `${h.y}px` }}
        >
          <span className="gift-hit-ring" />
          <span className="gift-hit-ring gift-hit-ring--2" />
          <span className="gift-hit-emoji">{h.emoji}</span>
          {h.reward > 0 && (
            <span className="gift-hit-coins coin-inline">+{h.reward} <CoinIcon size="sm" /></span>
          )}
          <span className="gift-hit-spark gift-hit-spark--1" />
          <span className="gift-hit-spark gift-hit-spark--2" />
          <span className="gift-hit-spark gift-hit-spark--3" />
          <span className="gift-hit-spark gift-hit-spark--4" />
          {h.fx === "burst" && <span className="gift-hit-flash" />}
          {h.fx === "rocket" && <span className="gift-hit-smoke" />}
        </div>
      ))}
    </div>
  );
}
