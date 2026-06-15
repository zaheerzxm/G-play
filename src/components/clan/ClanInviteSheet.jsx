import { useEffect, useState } from "react";
import { copyClanInvite, inviteFriendToClan } from "../../clans.js";
import { loadMutualFriends } from "../../social.js";
import AvatarImg from "../AvatarImg.jsx";

export default function ClanInviteSheet({ clan, userId, onClose, onToast }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    loadMutualFriends(userId)
      .then(setFriends)
      .catch(() => onToast?.("Could not load friends"))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleCopy() {
    try {
      await copyClanInvite(clan);
      onToast?.("Invite copied — share with friends!");
    } catch {
      onToast?.(`Clan ID: ${clan.clan_code}`);
    }
  }

  async function handleInvite(friend) {
    if (busyId) return;
    setBusyId(friend.id);
    try {
      await inviteFriendToClan(userId, friend.id, clan);
      onToast?.(`Invite sent to ${friend.display_name}`);
    } catch (err) {
      onToast?.(err?.message ?? "Could not invite");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="clan-invite-backdrop" onClick={onClose}>
      <div className="clan-invite-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="clan-invite-header">
          <button type="button" className="hub-sheet-back" onClick={onClose} aria-label="Back">←</button>
          <h3>Invite to Clan</h3>
        </header>

        <div className="clan-invite-code-card">
          <span>Clan ID</span>
          <strong>{clan.clan_code}</strong>
          <button type="button" className="primary-btn" onClick={handleCopy}>
            Copy invite
          </button>
          <p className="hub-sheet-hint">Friends can search this ID in Explore → Clan to join.</p>
        </div>

        <h4 className="clan-invite-friends-title">Invite friends</h4>
        {loading && <p className="hub-sheet-hint">Loading friends…</p>}
        <ul className="clan-invite-friends">
          {friends.map((f) => (
            <li key={f.id} className="clan-invite-friend-row">
              <AvatarImg
                src={f.avatar_url}
                fallback={f.display_name}
                className="clan-invite-avatar"
                imgClassName="clan-invite-avatar"
              />
              <span>{f.display_name}</span>
              <button
                type="button"
                className="clan-invite-send-btn"
                disabled={busyId === f.id}
                onClick={() => handleInvite(f)}
              >
                {busyId === f.id ? "…" : "Invite"}
              </button>
            </li>
          ))}
          {!loading && friends.length === 0 && (
            <li className="clan-invite-empty">Add mutual friends to invite them</li>
          )}
        </ul>
      </div>
    </div>
  );
}
