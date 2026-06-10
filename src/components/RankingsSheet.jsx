import { useEffect, useState } from "react";
import { formatCompactNumber } from "../formatCompact.js";
import { formatCoins } from "../gifts.js";
import { loadRanking } from "../rankings.js";
import CoinIcon from "./CoinIcon.jsx";

const TABS = [
  { key: "charm", label: "Charm" },
  { key: "wealth", label: "Wealth" },
  { key: "contribution", label: "Gifts" },
];

export default function RankingsSheet({ onClose }) {
  const [tab, setTab] = useState("charm");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadRanking(tab, 50)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div className="rankings-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 className="rankings-title">Global Ranking</h3>
        <div className="rankings-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`rankings-tab ${tab === t.key ? "rankings-tab--active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {loading && <p className="G-play-empty">Loading…</p>}
        {!loading && (
          <ol className="rankings-list">
            {rows.length === 0 && <p className="G-play-empty">No data yet</p>}
            {rows.map((row) => (
              <li key={row.id ?? row.rank} className="rankings-row">
                <span className="rankings-rank">{row.rank}</span>
                {row.avatar_url ? (
                  <img src={row.avatar_url} alt="" className="rankings-avatar" />
                ) : (
                  <span className="rankings-avatar rankings-avatar--fallback">
                    {(row.display_name || "?").charAt(0)}
                  </span>
                )}
                <span className="rankings-name">{row.display_name ?? "User"}</span>
                <span className="rankings-score">
                  {tab === "wealth" ? (
                    <span className="coin-inline"><CoinIcon size="sm" /> {formatCoins(row.score)}</span>
                  ) : (
                    formatCompactNumber(row.score)
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}
        <button type="button" className="primary-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
