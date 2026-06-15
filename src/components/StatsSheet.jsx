import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { liveMiniGames } from "../games/catalog.js";
import { loadUserGameStats } from "../gameStats.js";

export default function StatsSheet({ userId, onClose }) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const games = liveMiniGames();

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadUserGameStats(userId)
      .then((rows) => {
        if (active) setStats(rows);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const totals = games.reduce(
    (acc, g) => {
      const s = stats[g.id] ?? { wins: 0, played: 0, winRate: 0 };
      acc.wins += s.wins;
      acc.played += s.played;
      return acc;
    },
    { wins: 0, played: 0 },
  );
  const overallRate = totals.played > 0 ? Math.round((totals.wins / totals.played) * 100) : 0;

  const sheet = (
    <div className="gplay-mobile-shell-backdrop" onClick={onClose}>
      <div className="gplay-mobile-shell stats-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="stats-sheet-header">
          <button type="button" className="stats-sheet-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <h2>Stats</h2>
          <span className="stats-sheet-header-spacer" aria-hidden />
        </header>

        <div className="stats-sheet-summary">
          <div>
            <strong>{totals.wins}</strong>
            <small>Wins</small>
          </div>
          <div>
            <strong>{totals.played}</strong>
            <small>Played</small>
          </div>
          <div>
            <strong>{overallRate}%</strong>
            <small>Win rate</small>
          </div>
        </div>

        {loading && <p className="stats-sheet-note">Loading game history…</p>}
        <table className="stats-sheet-table">
          <thead>
            <tr>
              <th>Game</th>
              <th>Wins</th>
              <th>Played</th>
              <th>Win rate</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => {
              const s = stats[g.id] ?? { wins: 0, played: 0, winRate: 0 };
              return (
                <tr key={g.id}>
                  <td>
                    {g.emoji} {g.name}
                  </td>
                  <td>{s.wins}</td>
                  <td>{s.played}</td>
                  <td>{s.winRate}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="stats-sheet-note">Word Battle syncs from your account. Other games update as you play in rooms.</p>
      </div>
    </div>
  );
  return createPortal(sheet, document.body);
}
