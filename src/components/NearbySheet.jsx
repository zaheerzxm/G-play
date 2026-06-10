import { useEffect, useMemo, useState } from "react";
import { loadFollowLists } from "../social.js";
import AvatarImg from "./AvatarImg.jsx";

function pseudoDistance(userId, otherId) {
  let h = 0;
  const s = `${userId}:${otherId}`;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 997;
  return (h % 450) / 10 + 0.3;
}

export default function NearbySheet({ userId, onClose, onChat, onToast }) {
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return rows;
  }, [following, followers, userId]);

  return (
    <div className="profile-card-backdrop" onClick={onClose}>
      <div className="hub-sheet nearby-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="hub-sheet-header">
          <button type="button" className="hub-sheet-back" onClick={onClose}>←</button>
          <h2>📍 Nearby</h2>
        </header>
        <p className="hub-sheet-hint">People you follow or who follow you, sorted by proximity</p>

        {loading && <p className="hub-sheet-hint">Loading…</p>}

        <ul className="nearby-list">
          {nearby.map((p) => (
            <li key={p.id}>
              <AvatarImg src={p.avatar_url} fallback={(p.display_name || "?").charAt(0)} className="nearby-avatar" imgClassName="nearby-avatar" />
              <div className="nearby-meta">
                <strong>{p.display_name}</strong>
                <small>{p.km.toFixed(1)} km away</small>
              </div>
              <button type="button" className="nearby-chat-btn" onClick={() => onChat?.(p)}>Chat</button>
            </li>
          ))}
          {!loading && nearby.length === 0 && (
            <li className="nearby-empty">Follow people to see them here</li>
          )}
        </ul>
      </div>
    </div>
  );
}
