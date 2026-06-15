import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatCompactNumber } from "../formatCompact.js";
import {
  DAILY_PROTECT_POINTS,
  dailyProtectUser,
  hasDailyProtectedToday,
  loadBondBetween,
  loadGuardRankingForUser,
} from "../relationships.js";
import AvatarImg from "./AvatarImg.jsx";
import GuardAboutSheet from "./GuardAboutSheet.jsx";
import { IconHelp, UiIcon } from "./NavIcons.jsx";

export default function GuardSheet({
  targetId,
  targetName,
  targetProfile,
  viewerId,
  onSendGift,
  elevated = false,
  onClose,
  onToast,
  guardRefreshToken = 0,
}) {
  const [ranking, setRanking] = useState([]);
  const [pair, setPair] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [protectedToday, setProtectedToday] = useState(false);

  const guardMine = pair?.guardMine ?? 0;
  const isViewer = viewerId && viewerId !== targetId;

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    Promise.all([
      loadGuardRankingForUser(targetId, 20),
      isViewer ? loadBondBetween(viewerId, targetId, viewerId) : Promise.resolve(null),
    ])
      .then(([rows, bond]) => {
        setRanking(rows);
        setPair(bond);
      })
      .finally(() => setLoading(false));
  }, [targetId, viewerId, guardRefreshToken, isViewer]);

  useEffect(() => {
    if (!isViewer) return;
    setProtectedToday(hasDailyProtectedToday(viewerId, targetId));
  }, [isViewer, viewerId, targetId, guardRefreshToken, pair]);

  async function handleDailyProtect() {
    if (!isViewer || !targetId || busy || protectedToday) return;
    setBusy(true);
    try {
      await dailyProtectUser(viewerId, targetId);
      setPair(await loadBondBetween(viewerId, targetId, viewerId));
      setRanking(await loadGuardRankingForUser(targetId, 20));
      setProtectedToday(true);
      onToast?.(`Protected 🛡️ +${DAILY_PROTECT_POINTS} pts`);
    } catch (err) {
      onToast?.(err?.message ?? "Protect failed");
    } finally {
      setBusy(false);
    }
  }

  const podium = ranking.slice(0, 3);
  const rest = ranking.slice(3);
  const sheet = (
    <div
      className={`gplay-mobile-shell-backdrop${elevated ? " gplay-mobile-shell-backdrop--profile-child" : ""}`}
      onClick={onClose}
    >
      <div className="gplay-mobile-shell weplay-guard-page" onClick={(e) => e.stopPropagation()}>
        <header className="weplay-subpage-header weplay-subpage-header--help">
          <button type="button" className="weplay-subpage-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <h1>Guard</h1>
          <button
            type="button"
            className="weplay-subpage-help"
            onClick={() => setAboutOpen(true)}
            aria-label="About protection"
          >
            <UiIcon Icon={IconHelp} />
          </button>
        </header>

        <div className="weplay-guard-page-scroll">
          {isViewer && (
            <section className="weplay-guard-mine-card weplay-guard-mine-card--row">
              <AvatarImg
                src={targetProfile?.avatar_url}
                fallback={targetName || "?"}
                className="weplay-guard-mine-avatar weplay-guard-mine-avatar--fallback"
                imgClassName="weplay-guard-mine-avatar"
              />
              <div className="weplay-guard-mine-body">
                <strong>My Guard</strong>
                <span className="weplay-guard-mine-score">🌱 {formatCompactNumber(guardMine)}</span>
              </div>
              <button
                type="button"
                className="weplay-guard-protect-pill"
                disabled={busy || protectedToday}
                onClick={handleDailyProtect}
              >
                {protectedToday ? "Done" : "Protect"}
              </button>
            </section>
          )}

          <h2 className="weplay-guard-section-title">Guard Ranking</h2>

          {loading && <p className="weplay-subpage-empty">Loading…</p>}

          {!loading && podium.length > 0 && (
            <div className="weplay-guard-podium">
              {[1, 0, 2].map((idx) => {
                const row = podium[idx];
                if (!row) return <div key={idx} className="weplay-guard-podium-slot weplay-guard-podium-slot--empty" />;
                const name = row.profile?.display_name ?? "Guardian";
                return (
                  <div key={row.userId} className={`weplay-guard-podium-slot weplay-guard-podium-slot--rank${row.rank}`}>
                    <span className="weplay-guard-podium-crown" aria-hidden>
                      {row.rank === 1 ? "👑" : row.rank === 2 ? "🥈" : "🥉"}
                    </span>
                    <AvatarImg
                      src={row.profile?.avatar_url}
                      fallback={name}
                      className="weplay-guard-podium-avatar weplay-guard-podium-avatar--fallback"
                      imgClassName="weplay-guard-podium-avatar"
                    />
                    <strong>{name}</strong>
                    <small className="weplay-guard-score-pink">{formatCompactNumber(row.points)}</small>
                    <span className="weplay-guard-podium-label">Guard</span>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && ranking.length === 0 && (
            <p className="weplay-subpage-empty">No guardians yet — be the first to protect {targetName}</p>
          )}

          {rest.length > 0 && (
            <ol className="weplay-guard-list">
              {rest.map((row) => (
                <li key={row.userId} className="weplay-guard-list-row">
                  <span className="weplay-guard-list-rank">{row.rank}</span>
                  <AvatarImg
                    src={row.profile?.avatar_url}
                    fallback={row.profile?.display_name || "?"}
                    className="weplay-guard-list-avatar weplay-guard-list-avatar--fallback"
                    imgClassName="weplay-guard-list-avatar"
                  />
                  <span className="weplay-guard-list-name">{row.profile?.display_name ?? "User"}</span>
                  <span className="weplay-guard-list-score weplay-guard-score-pink">
                    {formatCompactNumber(row.points)}
                    <em>Guard</em>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {isViewer && (
          <footer className="weplay-subpage-footer">
            <button
              type="button"
              className="weplay-subpage-footer-btn weplay-subpage-footer-btn--pink"
              onClick={() => (onSendGift ? onSendGift() : onToast?.("Open gifts from chat or a voice room"))}
            >
              Send Gift
            </button>
          </footer>
        )}
      </div>

      {aboutOpen && <GuardAboutSheet onClose={() => setAboutOpen(false)} />}
    </div>
  );

  return createPortal(sheet, document.body);
}
