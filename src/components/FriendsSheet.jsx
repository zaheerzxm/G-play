import { useEffect, useState } from "react";
import { loadFollowLists } from "../social.js";

export default function FriendsSheet({ userId, onClose }) {
  const [tab, setTab] = useState("following");
  const [lists, setLists] = useState({ following: [], followers: [] });

  useEffect(() => {
    if (!userId) return;
    loadFollowLists(userId).then(setLists);
  }, [userId]);

  const rows = tab === "following" ? lists.following : lists.followers;

  return (
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div className="friends-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 className="friends-title">Friends</h3>
        <div className="friends-tabs">
          <button type="button" className={tab === "following" ? "friends-tab--active" : ""} onClick={() => setTab("following")}>
            Friends ({lists.following.length})
          </button>
          <button type="button" className={tab === "followers" ? "friends-tab--active" : ""} onClick={() => setTab("followers")}>
            Added you ({lists.followers.length})
          </button>
        </div>
        <ul className="friends-list">
          {rows.length === 0 && <li className="friends-empty">No users yet</li>}
          {rows.map((u) => (
            <li key={u.id} className="friends-item">
              {u.avatar_url ? <img src={u.avatar_url} alt="" /> : <span>{u.display_name?.charAt(0)}</span>}
              <span>{u.display_name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
