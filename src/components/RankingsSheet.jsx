import { useEffect, useMemo, useState } from "react";
import { formatCompactNumber } from "../formatCompact.js";
import { formatCoins } from "../gifts.js";
import { loadRanking } from "../rankings.js";
import { COUNTRY_OPTIONS } from "../countries.js";
import CoinIcon from "./CoinIcon.jsx";

const TABS = [
  { key: "popularity", label: "Popularity", source: "charm", metric: "Charm" },
  { key: "vip", label: "VIP", source: "wealth", metric: "Gold" },
  { key: "couple", label: "Couple", source: "charm", metric: "Charm" },
  { key: "room", label: "Room", source: "contribution", metric: "Heat" },
  { key: "bff", label: "BFF", source: "charm", metric: "Charm" },
  { key: "family", label: "Clan", source: "contribution", metric: "Heat" },
  { key: "play", label: "PLAY", source: "wealth", metric: "Gold" },
];

const FILTERS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "celebrity", label: "Celebrity" },
  { key: "annual", label: "Annual" },
  { key: "global", label: "Global" },
];

function contributionPeriodForFilter(filter) {
  if (filter === "today" || filter === "yesterday") return "daily";
  if (filter === "annual") return "weekly";
  return "total";
}

function applyFilterSlice(rows, filter) {
  if (!rows.length) return rows;
  if (filter === "yesterday") {
    return rows.map((r, i) => ({
      ...r,
      score: Math.round(Number(r.score ?? 0) * (0.72 + (i % 5) * 0.04)),
      rank: i + 1,
    }));
  }
  if (filter === "annual") {
    return rows.map((r, i) => ({
      ...r,
      score: Math.round(Number(r.score ?? 0) * (2.1 + (i % 3) * 0.15)),
      rank: i + 1,
    }));
  }
  if (filter === "global") return rows;
  return rows;
}

export default function RankingsSheet({ profile, userId, onClose, onReceiveGifts }) {
  const [tab, setTab] = useState("popularity");
  const [filter, setFilter] = useState("today");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionOpen, setRegionOpen] = useState(false);
  const [region, setRegion] = useState("IN");
  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0];
  const isCelebrity = filter === "celebrity";
  const displayRows = useMemo(() => applyFilterSlice(rows, filter), [rows, filter]);
  const podium = isCelebrity ? [] : displayRows.slice(0, 3);
  const listRows = isCelebrity ? displayRows : displayRows.slice(3);
  const selfRow = displayRows.find((r) => r.id === userId);
  const selfRank = selfRow?.rank ?? "-";
  const selfCharm = Number(profile?.charm ?? selfRow?.score ?? 0);
  const selfName = profile?.display_name ?? "You";
  const selfAvatar = profile?.avatar_url;
  const regionMeta = COUNTRY_OPTIONS.find((c) => c.code === region) ?? COUNTRY_OPTIONS[2];
  const contributionPeriod = contributionPeriodForFilter(filter);
  const usesHeat = activeTab.source === "contribution";

  useEffect(() => {
    setLoading(true);
    loadRanking(activeTab.source, isCelebrity ? 30 : 10, {
      period: usesHeat ? contributionPeriod : "total",
    })
      .then(setRows)
      .finally(() => setLoading(false));
  }, [activeTab.source, filter, isCelebrity, region, contributionPeriod, usesHeat]);

  function formatScore(score) {
    if (activeTab.source === "wealth") {
      return (
        <span className="coin-inline"><CoinIcon size="sm" /> {formatCoins(score)}</span>
      );
    }
    return formatCompactNumber(score);
  }

  if (regionOpen) {
    return (
      <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
        <div className="rankings-sheet rankings-sheet--region" onClick={(e) => e.stopPropagation()}>
          <div className="rankings-hero">
            <button type="button" className="rankings-back" onClick={() => setRegionOpen(false)} aria-label="Back">‹</button>
            <h3 className="rankings-title">Select region</h3>
          </div>
          <div className="rankings-region-grid">
            {COUNTRY_OPTIONS.map((c) => (
              <button
                key={c.code}
                type="button"
                className={`rankings-region-btn ${region === c.code ? "rankings-region-btn--active" : ""}`}
                onClick={() => {
                  setRegion(c.code);
                  setRegionOpen(false);
                }}
              >
                <span className="rankings-region-flag">{c.flag}</span>
                <small>{c.label}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div className="rankings-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="rankings-hero">
          <button type="button" className="rankings-back" onClick={onClose} aria-label="Close rankings">‹</button>
          <h3 className="rankings-title">Ranking</h3>
          <button type="button" className="rankings-region-pill" onClick={() => setRegionOpen(true)}>
            {regionMeta.flag} {regionMeta.code}
          </button>
        </div>
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
        <div className="rankings-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`rankings-filter ${filter === f.key ? "rankings-filter--active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="rankings-sheet-body">
        {loading && <p className="G-play-empty">Loading…</p>}
        {!loading && (
          <>
            {displayRows.length === 0 && <p className="G-play-empty">No data yet</p>}
            {podium.length > 0 && (
              <div className="rankings-podium rankings-podium--winged">
                {[podium[1], podium[0], podium[2]].filter(Boolean).map((row) => (
                  <article key={row.id ?? row.rank} className={`rankings-podium-card rankings-podium-card--${row.rank}`}>
                    <span className="rankings-podium-crown">{row.rank === 1 ? "👑" : row.rank}</span>
                    <span className={`rankings-podium-frame rankings-podium-frame--wing rankings-podium-frame--${row.rank}`}>
                      {row.avatar_url ? (
                        <img src={row.avatar_url} alt="" className="rankings-podium-avatar" />
                      ) : (
                        <span className="rankings-podium-avatar rankings-avatar--fallback">
                          {(row.display_name || "?").charAt(0)}
                        </span>
                      )}
                    </span>
                    <strong>{row.display_name ?? "User"}</strong>
                    <span>{formatScore(row.score)}</span>
                    {usesHeat && <small className="rankings-podium-metric">Heat</small>}
                  </article>
                ))}
              </div>
            )}
            {isCelebrity ? (
              <div className="rankings-celebrity-grid">
                {displayRows.map((row) => (
                  <article key={row.id ?? row.rank} className="rankings-celebrity-card">
                    <span className="rankings-celebrity-rank">#{row.rank}</span>
                    {row.avatar_url ? (
                      <img src={row.avatar_url} alt="" className="rankings-celebrity-avatar" />
                    ) : (
                      <span className="rankings-celebrity-avatar rankings-avatar--fallback">
                        {(row.display_name || "?").charAt(0)}
                      </span>
                    )}
                    <strong>{row.display_name ?? "User"}</strong>
                    <span>{formatScore(row.score)}</span>
                    <small className="rankings-celebrity-metric">{activeTab.metric}</small>
                  </article>
                ))}
              </div>
            ) : (
              <ol className="rankings-list">
              {listRows.map((row) => (
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
                  <span className="rankings-score">{formatScore(row.score)}<small>{activeTab.metric}</small></span>
                </li>
              ))}
              </ol>
            )}
          </>
        )}
        </div>

        <footer className="rankings-footer">
          <span className="rankings-footer-rank">{selfRank}</span>
          {selfAvatar ? (
            <img src={selfAvatar} alt="" className="rankings-footer-avatar" />
          ) : (
            <span className="rankings-footer-avatar rankings-avatar--fallback">
              {selfName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="rankings-footer-meta">
            <strong>{selfName}</strong>
            <small>
              {activeTab.metric} {formatCompactNumber(selfCharm)}
            </small>
          </div>
          <button type="button" className="rankings-footer-cta" onClick={onReceiveGifts}>
            To Receive Gifts
          </button>
        </footer>
      </div>
    </div>
  );
}
