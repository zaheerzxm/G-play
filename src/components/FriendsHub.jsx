import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  acceptFriendRequest,
  loadMutualFriends,
  loadPendingFriendRequests,
  rejectFriendRequest,
} from "../social.js";
import AvatarImg from "./AvatarImg.jsx";
import { IconChats } from "./NavIcons.jsx";
import PersonalChat from "./PersonalChat.jsx";
import UserFullProfileSheet from "./UserFullProfileSheet.jsx";
import VipDisplayName from "./VipDisplayName.jsx";

export default function FriendsHub({
  userId,
  displayName,
  coins = 0,
  isSuperAdmin = false,
  onCoinsChange,
  onJoinRoom,
  onJoinClan,
  onClose,
  initialTab = "friends",
}) {
  const [tab, setTab] = useState(initialTab);
  const [mutual, setMutual] = useState([]);
  const [requests, setRequests] = useState([]);
  const [chatFriend, setChatFriend] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const [friends, pending] = await Promise.all([
      loadMutualFriends(userId),
      loadPendingFriendRequests(userId),
    ]);
    setMutual(friends);
    setRequests(pending);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId || chatFriend) return undefined;
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [userId, chatFriend, refresh]);

  useEffect(() => {
    if (requests.length > 0 && initialTab === "requests") {
      setTab("requests");
    }
  }, [requests.length, initialTab]);

  if (chatFriend) {
    return (
      <PersonalChat
        userId={userId}
        displayName={displayName}
        friend={chatFriend}
        coins={coins}
        isSuperAdmin={isSuperAdmin}
        onCoinsChange={onCoinsChange}
        onJoinRoom={onJoinRoom}
        onJoinClan={onJoinClan}
        onClose={() => {
          setChatFriend(null);
          refresh();
        }}
      />
    );
  }

  function openChat(friend) {
    setChatFriend(friend);
  }

  async function handleAccept(requester) {
    if (!requester?.id || busyId) return;
    setBusyId(requester.id);
    try {
      await acceptFriendRequest(userId, requester.id);
      await refresh();
      setTab("friends");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(requester) {
    if (!requester?.id || busyId) return;
    setBusyId(requester.id);
    try {
      await rejectFriendRequest(userId, requester.id);
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  function FriendRow({ user, showChat = true }) {
    return (
      <li className="friends-hub-row">
        <button
          type="button"
          className="friends-hub-row-profile"
          onClick={() => setProfileUser(user)}
          aria-label={`${user.display_name} profile`}
        >
          <AvatarImg
            src={user.avatar_url}
            fallback={user.display_name || "?"}
            className="friends-hub-avatar friends-hub-avatar--fallback"
            imgClassName="friends-hub-avatar"
          />
        </button>
        <button type="button" className="friends-hub-row-name" onClick={() => openChat(user)}>
          <VipDisplayName name={user.display_name} profile={user} variant="light" />
        </button>
        {showChat && (
          <button type="button" className="friends-hub-row-chat" onClick={() => openChat(user)} aria-label="Chat">
            <IconChats />
          </button>
        )}
      </li>
    );
  }

  const hub = (
    <div className="gplay-mobile-shell-backdrop gplay-mobile-shell-backdrop--friends">
      <div className="gplay-mobile-shell friends-hub friends-hub--ref">
        <header className="friends-hub-header friends-hub-header--ref">
          <h2>People</h2>
          <button type="button" className="friends-hub-close friends-hub-close--ref" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="friends-hub-tabs">
          <button
            type="button"
            className={`friends-hub-tab ${tab === "friends" ? "friends-hub-tab--active" : ""}`}
            onClick={() => setTab("friends")}
          >
            Friends ({mutual.length})
          </button>
          <button
            type="button"
            className={`friends-hub-tab ${tab === "requests" ? "friends-hub-tab--active" : ""}`}
            onClick={() => setTab("requests")}
          >
            Requests{requests.length > 0 ? ` (${requests.length})` : ""}
          </button>
        </div>

        <div className="friends-hub-scroll">
          {tab === "friends" && (
            <ul className="friends-hub-list">
              {mutual.length === 0 && (
                <li className="friends-hub-empty">Friends appear here after you accept a request</li>
              )}
              {mutual.map((u) => (
                <FriendRow key={u.id} user={u} />
              ))}
            </ul>
          )}

          {tab === "requests" && (
            <ul className="friends-hub-list">
              {requests.length === 0 && (
                <li className="friends-hub-empty">No friend requests right now</li>
              )}
              {requests.map((u) => (
                <li key={u.id} className="friends-hub-request">
                  <button
                    type="button"
                    className="friends-hub-row-profile"
                    onClick={() => setProfileUser(u)}
                    aria-label={`${u.display_name} profile`}
                  >
                    <AvatarImg
                      src={u.avatar_url}
                      fallback={u.display_name || "?"}
                      className="friends-hub-avatar friends-hub-avatar--fallback"
                      imgClassName="friends-hub-avatar"
                    />
                  </button>
                  <div className="friends-hub-request-meta">
                    <VipDisplayName name={u.display_name} profile={u} variant="light" className="friends-hub-request-name" />
                    <span className="friends-hub-request-hint">wants to be your friend</span>
                  </div>
                  <div className="friends-hub-request-actions">
                    <button
                      type="button"
                      className="friends-hub-request-accept"
                      disabled={busyId === u.id}
                      onClick={() => handleAccept(u)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="friends-hub-request-reject"
                      disabled={busyId === u.id}
                      onClick={() => handleReject(u)}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {hub}
      {profileUser && (
        <UserFullProfileSheet
          seat={{
            user_id: profileUser.id,
            display_name: profileUser.display_name,
            avatar_url: profileUser.avatar_url,
            user_code: profileUser.user_code,
          }}
          profile={profileUser}
          viewerId={userId}
          viewerName={displayName}
          onClose={() => setProfileUser(null)}
          onMessage={() => {
            const friend = profileUser;
            setProfileUser(null);
            openChat(friend);
          }}
        />
      )}
    </>,
    document.body,
  );
}
