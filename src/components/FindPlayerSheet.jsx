import { useState } from "react";
import { lookupProfileByCode, loadProfilesForUserIds } from "../profile.js";
import { followUser, isFollowingUser, isMutualFriend } from "../social.js";
import UserProfileCard from "./UserProfileCard.jsx";

export default function FindPlayerSheet({ userId, viewerName, onClose, onMessage, onToast }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [mutual, setMutual] = useState(false);

  async function handleSearch() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      onToast?.("Enter a valid player ID");
      return;
    }
    setBusy(true);
    setFound(null);
    setProfileData(null);
    setProfileOpen(false);
    try {
      const row = await lookupProfileByCode(trimmed);
      if (!row) {
        onToast?.("No player found with that ID");
        return;
      }
      if (row.id === userId) {
        onToast?.("That is your own ID");
        return;
      }
      setFound(row);
      const [profiles, isFollow, isMutual] = await Promise.all([
        loadProfilesForUserIds([row.id]),
        isFollowingUser(userId, row.id),
        isMutualFriend(userId, row.id),
      ]);
      setProfileData(profiles[row.id] ?? row);
      setFollowing(isFollow);
      setMutual(isMutual);
    } catch (e) {
      onToast?.(e.message ?? "Search failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddFriend() {
    if (!found?.id || following) return;
    setBusy(true);
    try {
      await followUser(userId, found.id);
      setFollowing(true);
      const nowMutual = await isMutualFriend(userId, found.id);
      setMutual(nowMutual);
      onToast?.(nowMutual ? "You are now friends!" : "Friend request sent");
    } catch (e) {
      onToast?.(e.message ?? "Could not add friend");
    } finally {
      setBusy(false);
    }
  }

  const seat = found ? { user_id: found.id, display_name: found.display_name } : null;

  return (
    <div className="find-player-page">
      <header className="find-player-header">
        <button type="button" className="sheet-back" onClick={onClose} aria-label="Back">‹</button>
        <h1>Find player</h1>
      </header>

      <div className="find-player-search">
        <input
          type="text"
          placeholder="Paste player ID"
          maxLength={12}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button type="button" disabled={busy || code.trim().length < 4} onClick={handleSearch}>
          {busy ? "…" : "Search"}
        </button>
      </div>

      {found && (
        <div className="find-player-result">
          <button type="button" className="find-player-card" onClick={() => setProfileOpen(true)}>
            {found.avatar_url ? (
              <img src={found.avatar_url} alt="" className="find-player-avatar" />
            ) : (
              <span className="find-player-avatar find-player-avatar--fallback">
                {(found.display_name || "?").charAt(0)}
              </span>
            )}
            <span>
              <strong>{found.display_name}</strong>
              <small>ID: {found.user_code}</small>
            </span>
          </button>
          <div className="find-player-actions">
            {!mutual && (
              <button type="button" disabled={busy || following} onClick={handleAddFriend}>
                {following ? "Request sent" : "Add friend"}
              </button>
            )}
            {mutual && <span className="find-player-friends">Friends</span>}
            <button
              type="button"
              onClick={() => onMessage?.(found)}
            >
              Message
            </button>
          </div>
        </div>
      )}

      {profileOpen && profileData && seat && (
        <UserProfileCard
          seat={seat}
          profile={profileData}
          viewerId={userId}
          viewerName={viewerName}
          onClose={() => setProfileOpen(false)}
          onMessage={() => {
            onMessage?.(found);
            onClose();
          }}
          onToast={onToast}
        />
      )}
    </div>
  );
}
