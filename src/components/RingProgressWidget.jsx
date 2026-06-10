import { ringMeta } from "../church.js";

/** WePlay-style floating ring progress (bottom-right in voice room) */
export default function RingProgressWidget({ pct, level, ringKey = "floral", onClick }) {
  const ring = ringMeta(ringKey);
  const display = Math.round(Math.min(100, Math.max(0, pct ?? 0)));

  return (
    <button type="button" className="ring-progress-widget" onClick={onClick} title="Relationship progress">
      <span className="ring-progress-widget-icon">{ring.emoji}</span>
      <span className="ring-progress-widget-bar">
        <span className="ring-progress-widget-fill" style={{ width: `${display}%` }} />
      </span>
      <span className="ring-progress-widget-pct">{display}%</span>
      {level > 0 && <span className="ring-progress-widget-lv">LV.{level}</span>}
    </button>
  );
}
