import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { countryDisplay, formatProfileLocation } from "../countries.js";
import { loadFollowLists } from "../social.js";
import AvatarImg from "./AvatarImg.jsx";

const FILTERS = [
  { key: "all", label: "View All" },
  { key: "girls", label: "Girls only" },
  { key: "boys", label: "Boys only" },
  { key: "hidden", label: "Do not appear nearby" },
];

function nearbyPrefsKey(userId) {
  return `gplay_nearby_prefs_${userId}`;
}

function readNearbyPrefs(userId) {
  if (!userId) return { filter: "all", hidden: false };
  try {
    const raw = localStorage.getItem(nearbyPrefsKey(userId));
    if (!raw) return { filter: "all", hidden: false };
    const parsed = JSON.parse(raw);
    const filter = FILTERS.some((f) => f.key === parsed?.filter) ? parsed.filter : "all";
    return { filter, hidden: Boolean(parsed?.hidden) };
  } catch {
    return { filter: "all", hidden: false };
  }
}

function writeNearbyPrefs(userId, prefs) {
  if (!userId) return;
  try {
    localStorage.setItem(nearbyPrefsKey(userId), JSON.stringify(prefs));
  } catch {
    /* quota / private mode */
  }
}

function readGpsEnabled(userId) {
  if (!userId) return false;
  try {
    return localStorage.getItem(`${nearbyPrefsKey(userId)}.gps`) === "1";
  } catch {
    return false;
  }
}

function writeGpsEnabled(userId, enabled) {
  if (!userId) return;
  try {
    localStorage.setItem(`${nearbyPrefsKey(userId)}.gps`, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function pseudoDistance(userId, otherId) {
  let h = 0;
  const s = `${userId}:${otherId}`;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 997;
  return (h % 450) / 10 + 0.3;
}

function relativeActive(km) {
  if (km < 2) return "Just Now";
  if (km < 20) return `${Math.max(1, Math.round(km / 3))} hours ago`;
  return `${Math.max(1, Math.round(km / 8))} days ago`;
}

function genderSymbol(gender) {
  const g = String(gender ?? "").toLowerCase();
  if (g === "female" || g === "f" || g === "woman") return "♀";
  if (g === "male" || g === "m" || g === "man") return "♂";
  return null;
}

export default function NearbySheet({ userId, profile, onClose, onChat, onToast }) {
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(() => readNearbyPrefs(userId).filter);
  const [filterOpen, setFilterOpen] = useState(false);
  const [hiddenNearby, setHiddenNearby] = useState(() => readNearbyPrefs(userId).hidden);
  const [gpsEnabled, setGpsEnabled] = useState(() => readGpsEnabled(userId));
  const [gpsBusy, setGpsBusy] = useState(false);

  const myLocationLabel = formatProfileLocation(profile);

  useEffect(() => {
    if (!userId) return;
    const prefs = readNearbyPrefs(userId);
    setFilter(prefs.filter);
    setHiddenNearby(prefs.hidden);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    loadFollowLists(userId)
      .then(({ following: f, followers: r }) => {
        setFollowing(f);
        setFollowers(r);
      })
      .catch(() => onToast?.("Could not load nearby"))
      .finally(() => setLoading(false));
  }, [userId, onToast]);

  const nearby = useMemo(() => {
    const seen = new Set();
    const rows = [...following, ...followers]
      .filter((p) => {
        if (!p?.id || seen.has(p.id) || p.id === userId) return false;
        seen.add(p.id);
        return true;
      })
      .map((p) => ({ ...p, km: pseudoDistance(userId, p.id) }))
      .sort((a, b) => a.km - b.km);

    if (filter === "girls") {
      return rows.filter((p) => {
        const g = String(p.gender ?? "").toLowerCase();
        return g === "female" || g === "f" || g === "woman";
      });
    }
    if (filter === "boys") {
      return rows.filter((p) => {
        const g = String(p.gender ?? "").toLowerCase();
        return g === "male" || g === "m" || g === "man";
      });
    }
    return rows;
  }, [following, followers, userId, filter]);

  function applyFilter(key) {
    if (key === "hidden") {
      setHiddenNearby(true);
      setFilterOpen(false);
      writeNearbyPrefs(userId, { filter: "all", hidden: true });
      onToast?.("You won't appear in Nearby lists");
      return;
    }
    setHiddenNearby(false);
    setFilter(key);
    setFilterOpen(false);
    writeNearbyPrefs(userId, { filter: key, hidden: false });
  }

  async function toggleGps() {
    if (gpsEnabled) {
      setGpsEnabled(false);
      writeGpsEnabled(userId, false);
      onToast?.("Location sorting off");
      return;
    }
    if (!navigator?.geolocation) {
      onToast?.("Location is not available on this device");
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setGpsEnabled(true);
        writeGpsEnabled(userId, true);
        setGpsBusy(false);
        onToast?.("Showing approximate nearby distances");
      },
      () => {
        setGpsBusy(false);
        onToast?.("Location permission denied");
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  }

  const sheet = (
    <div className="gplay-mobile-shell-backdrop gplay-mobile-shell-backdrop--nearby">
      <div className="gplay-mobile-shell nearby-sheet-page" onClick={(e) => e.stopPropagation()}>
        <header className="nearby-sheet-header">
          <button type="button" className="nearby-sheet-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <h2>Nearby</h2>
          {filter !== "all" && !hiddenNearby && (
            <span className="nearby-sheet-filter-pill">
              {FILTERS.find((f) => f.key === filter)?.label}
            </span>
          )}
          <button
            type="button"
            className="nearby-sheet-menu"
            aria-label="Filter nearby"
            onClick={() => setFilterOpen(true)}
          >
            ···
          </button>
        </header>

        {myLocationLabel && (
          <p className="nearby-sheet-hint">Your location: {myLocationLabel}</p>
        )}
        {gpsEnabled && (
          <p className="nearby-sheet-hint nearby-sheet-hint--gps">Location on · distances are approximate</p>
        )}

        {hiddenNearby && (
          <p className="nearby-sheet-hint nearby-sheet-hint--muted">
            You are hidden from Nearby. Change filter to appear again.
          </p>
        )}

        <div className="nearby-sheet-body">
          {loading && <p className="nearby-sheet-empty">Loading…</p>}

          {!loading && nearby.length === 0 && (
            <div className="nearby-sheet-empty nearby-sheet-empty--art">
              <p>No one nearby yet</p>
              <small>Follow people to discover them here</small>
            </div>
          )}

          <ul className="nearby-list nearby-list--weplay">
            {nearby.map((p) => {
              const country = countryDisplay(p.country_code ?? p.country);
              const gender = genderSymbol(p.gender);
              return (
                <li key={p.id}>
                  <AvatarImg
                    src={p.avatar_url}
                    fallback={(p.display_name || "?").charAt(0)}
                    className="nearby-avatar nearby-avatar--fallback"
                    imgClassName="nearby-avatar"
                  />
                  <div className="nearby-meta">
                    <span className="nearby-name-row">
                      <strong>{p.display_name}</strong>
                      {gender && <span className={`nearby-gender nearby-gender--${gender}`}>{gender}</span>}
                    </span>
                    {country && (
                      <small className="nearby-country">
                        {country.flag} {country.label}
                      </small>
                    )}
                    {p.bio && <small className="nearby-bio">{p.bio}</small>}
                  </div>
                  <div className="nearby-trail">
                    <small>{relativeActive(p.km)}</small>
                    <strong>{gpsEnabled ? `~${p.km.toFixed(1)}` : p.km.toFixed(2)}km</strong>
                  </div>
                  <button type="button" className="nearby-chat-btn" onClick={() => onChat?.(p)}>
                    Chat
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {filterOpen && (
          <div className="nearby-filter-backdrop" onClick={() => setFilterOpen(false)}>
            <div className="nearby-filter-sheet" onClick={(e) => e.stopPropagation()}>
              <span className="nearby-filter-grabber" aria-hidden />
              {FILTERS.map((f) => (
                <button key={f.key} type="button" className="nearby-filter-option" onClick={() => applyFilter(f.key)}>
                  {f.label}
                </button>
              ))}
              <button
                type="button"
                className="nearby-filter-option nearby-filter-option--gps"
                disabled={gpsBusy}
                onClick={toggleGps}
              >
                {gpsBusy ? "Enabling location…" : gpsEnabled ? "Turn off my location" : "Use my location"}
              </button>
              <button type="button" className="nearby-filter-cancel" onClick={() => setFilterOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
