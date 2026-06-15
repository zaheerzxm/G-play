import { useEffect, useState } from "react";
import CoinIcon from "../CoinIcon.jsx";
import { IconClan, ModuleIcon } from "../NavIcons.jsx";
import {
  CREATE_CLAN_COST,
  applyToClan,
  createClan,
  loadClanByCode,
  loadMyClan,
} from "../../clans.js";
import { formatCompactNumber } from "../../formatCompact.js";

export default function ClanLanding({
  userId,
  coins,
  charmLevel,
  initialClanCode = "",
  onCoinsChange,
  onJoined,
  onToast,
}) {
  const [mode, setMode] = useState(initialClanCode ? "search" : "home");
  const [clanName, setClanName] = useState("");
  const [searchCode, setSearchCode] = useState(initialClanCode);
  const [searchResult, setSearchResult] = useState(null);
  const [applyMsg, setApplyMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = String(initialClanCode ?? "").trim();
    if (!code) return undefined;
    let cancelled = false;
    setMode("search");
    setSearchCode(code);
    setBusy(true);
    setError(null);
    setSearchResult(null);
    loadClanByCode(code)
      .then((clan) => {
        if (cancelled) return;
        if (!clan) setError("No clan found with that ID");
        else setSearchResult(clan);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Search failed");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialClanCode]);

  async function handleCreate(e) {
    e.preventDefault();
    if (busy) return;
    if ((coins ?? 0) < CREATE_CLAN_COST) {
      setError(`Need ${formatCompactNumber(CREATE_CLAN_COST)} gold to create a clan`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const clan = await createClan({
        userId,
        name: clanName,
        onCoinsDeducted: onCoinsChange,
      });
      onToast?.(`Clan "${clan.name}" created! ID: ${clan.clan_code}`);
      onJoined?.(clan);
    } catch (err) {
      setError(err?.message ?? "Could not create clan");
    } finally {
      setBusy(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSearchResult(null);
    try {
      const clan = await loadClanByCode(searchCode);
      if (!clan) setError("No clan found with that ID");
      else setSearchResult(clan);
    } catch (err) {
      setError(err?.message ?? "Search failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleApply(clan) {
    if (busy || !clan) return;
    if (charmLevel < Number(clan.min_charm_level ?? 0)) {
      setError(`Charm level ${clan.min_charm_level} required`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await applyToClan(clan.id, userId, applyMsg);
      if (result.joined) {
        onToast?.(`Joined ${clan.name}!`);
        const joined = await loadMyClan(userId);
        onJoined?.(joined ?? undefined);
      } else {
        onToast?.("Application sent — wait for approval");
      }
    } catch (err) {
      setError(err?.message ?? "Could not apply");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="clan-landing">
      {mode === "home" && (
        <>
          <div className="clan-landing-hero">
            <ModuleIcon Icon={IconClan} className="clan-landing-icon" variant="clan" />
            <h3>Join a Clan</h3>
            <p>Team up, complete daily missions, and grow your clan treasury.</p>
          </div>
          <div className="clan-landing-actions">
            <button type="button" className="clan-landing-btn clan-landing-btn--primary" onClick={() => setMode("create")}>
              Create Clan
              <small>
                <CoinIcon size="sm" /> {formatCompactNumber(CREATE_CLAN_COST)}
              </small>
            </button>
            <button type="button" className="clan-landing-btn" onClick={() => setMode("search")}>
              Search by Clan ID
            </button>
          </div>
        </>
      )}

      {mode === "create" && (
        <form className="clan-landing-form" onSubmit={handleCreate}>
          <button type="button" className="clan-landing-back" onClick={() => setMode("home")}>← Back</button>
          <h3>Create Clan</h3>
          <p className="hub-sheet-hint">
            Costs <CoinIcon size="sm" /> {formatCompactNumber(CREATE_CLAN_COST)} gold. You have {formatCompactNumber(coins ?? 0)}.
          </p>
          <label className="clan-field">
            <span>Clan name</span>
            <input
              type="text"
              value={clanName}
              onChange={(e) => setClanName(e.target.value)}
              placeholder="Enter clan name"
              maxLength={24}
              required
            />
          </label>
          <button type="submit" className="primary-btn" disabled={busy || clanName.trim().length < 2}>
            {busy ? "Creating…" : "Create Clan"}
          </button>
        </form>
      )}

      {mode === "search" && (
        <div className="clan-landing-form">
          <button type="button" className="clan-landing-back" onClick={() => { setMode("home"); setSearchResult(null); }}>← Back</button>
          <h3>Search Clan</h3>
          <form onSubmit={handleSearch}>
            <label className="clan-field">
              <span>Clan ID</span>
              <input
                type="text"
                inputMode="numeric"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="e.g. 123456"
              />
            </label>
            <button type="submit" className="primary-btn" disabled={busy || !searchCode.trim()}>
              {busy ? "Searching…" : "Search"}
            </button>
          </form>

          {searchResult && (
            <div className="clan-search-result">
              <div className="clan-search-result-head">
                <strong>{searchResult.name}</strong>
                <span className="clan-level-badge">Lv.{searchResult.level ?? 1}</span>
              </div>
              <p className="hub-sheet-hint">ID: {searchResult.clan_code}</p>
              {searchResult.intro && <p>{searchResult.intro}</p>}
              <p className="clan-search-meta">
                {searchResult.join_mode === "open" ? "Free to join" : "Application required"}
                {searchResult.min_charm_level > 0 && ` · Charm Lv.${searchResult.min_charm_level}+`}
              </p>
              {searchResult.join_mode !== "open" && (
                <label className="clan-field">
                  <span>Message (optional)</span>
                  <input
                    type="text"
                    value={applyMsg}
                    onChange={(e) => setApplyMsg(e.target.value)}
                    placeholder="Introduce yourself"
                    maxLength={120}
                  />
                </label>
              )}
              <button
                type="button"
                className="primary-btn"
                disabled={busy || !searchResult.accept_applications && searchResult.join_mode !== "open"}
                onClick={() => handleApply(searchResult)}
              >
                {searchResult.join_mode === "open" ? "Join Clan" : "Apply to Join"}
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="banner error">{error}</p>}
    </div>
  );
}
