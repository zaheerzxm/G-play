import { useCallback, useEffect, useState } from "react";
import {
  acceptFriendRequest,
  loadMutualFriends,
  loadPendingFriendRequests,
  rejectFriendRequest,
} from "../social.js";
import AvatarImg from "./AvatarImg.jsx";
import PersonalChat from "./PersonalChat.jsx";

export default function FriendsHub({ userId, displayName, onJoinRoom, onClose, initialTab = "friends" }) {
  const [tab, setTab] = useState(initialTab);
  const [mutual, setMutual] = useState([]);
  const [requests, setRequests] = useState([]);
  const [chatFriend, setChatFriend] = useState(null);
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
        onJoinRoom={onJoinRoom}
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
      <li className="friends-item">
        <AvatarImg
          src={user.avatar_url}
          fallback={user.display_name || "?"}
          className="friends-item-avatar friends-item-avatar--fallback"
          imgClassName="friends-item-avatar"
        />
        <span className="friends-item-name">{user.display_name}</span>
        {showChat && (
          <button type="button" className="friends-item-chat" onClick={() => openChat(user)}>
            💬
          </button>
        )}
      </li>
    );
  }

  return (
    <div className="friends-hub">
      <header className="friends-hub-header">
        <h2>People</h2>
        <button type="button" className="friends-hub-close" onClick={onClose}>
          ✕
        </button>
      </header>

      <div className="friends-tabs">
        <button
          type="button"
          className={tab === "friends" ? "friends-tab--active" : ""}
          onClick={() => setTab("friends")}
        >
          Friends ({mutual.length})
        </button>
        <button
          type="button"
          className={tab === "requests" ? "friends-tab--active" : ""}
          onClick={() => setTab("requests")}
        >
          Requests{requests.length > 0 ? ` (${requests.length})` : ""}
        </button>
      </div>

      <div className="friends-hub-body">
        {tab === "friends" && (
          <ul className="friends-list">
            {mutual.length === 0 && (
              <li className="friends-empty">Friends appear here after you accept a request</li>
            )}
            {mutual.map((u) => (
              <FriendRow key={u.id} user={u} />
            ))}
          </ul>
        )}

        {tab === "requests" && (
          <ul className="friends-list friends-list--requests">
            {requests.length === 0 && (
              <li className="friends-empty">No friend requests right now</li>
            )}
            {requests.map((u) => (
              <li key={u.id} className="friends-request-row">
                <AvatarImg
                  src={u.avatar_url}
                  fallback={u.display_name || "?"}
                  className="friends-item-avatar friends-item-avatar--fallback"
                  imgClassName="friends-item-avatar"
                />
                <div className="friends-request-meta">
                  <span className="friends-item-name">{u.display_name}</span>
                  <span className="friends-request-hint">wants to be your friend</span>
                </div>
                <div className="friends-request-actions">
                  <button
                    type="button"
                    className="friends-request-accept"
                    disabled={busyId === u.id}
                    onClick={() => handleAccept(u)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="friends-request-reject"
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
  );
}
