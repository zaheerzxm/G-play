import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { loadOnlineMutualFriends } from "../social.js";
import AvatarImg from "./AvatarImg.jsx";
import { IconChats } from "./NavIcons.jsx";
import PersonalChat from "./PersonalChat.jsx";
import UserFullProfileSheet from "./UserFullProfileSheet.jsx";
import VipDisplayName from "./VipDisplayName.jsx";

export default function OnlineFriendsSheet({
  userId,
  displayName,
  coins = 0,
  isSuperAdmin = false,
  onCoinsChange,
  onJoinRoom,
  onJoinClan,
  onClose,
}) {
  const [online, setOnline] = useState([]);
  const [chatFriend, setChatFriend] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const rows = await loadOnlineMutualFriends(userId);
      setOnline(rows);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId || chatFriend) return undefined;
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [userId, chatFriend, refresh]);

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

  const sheet = (
    <div className="gplay-mobile-shell-backdrop gplay-mobile-shell-backdrop--friends gplay-mobile-shell-backdrop--online">
      <div className="gplay-mobile-shell friends-hub friends-hub--ref friends-hub--online">
        <header className="friends-hub-header friends-hub-header--ref">
          <h2>Online</h2>
          <button type="button" className="friends-hub-close friends-hub-close--ref" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="friends-hub-scroll">
          {loading && online.length === 0 && (
            <p className="friends-hub-empty">Checking who&apos;s online…</p>
          )}
          {!loading && online.length === 0 && (
            <p className="friends-hub-empty">No mutual friends online right now</p>
          )}
          <ul className="friends-hub-list">
            {online.map((user) => (
              <li key={user.id} className="friends-hub-row">
                <button
                  type="button"
                  className="friends-hub-row-profile"
                  onClick={() => setProfileUser(user)}
                  aria-label={`${user.display_name} profile`}
                >
                  <AvatarImg
                    src={user.avatar_url}
                    fallback={user.display_name || "?"}
                    className="friends-hub-avatar friends-hub-avatar--fallback friends-hub-avatar--online"
                    imgClassName="friends-hub-avatar"
                  />
                  <span className="friends-hub-online-dot" aria-hidden />
                </button>
                <button type="button" className="friends-hub-row-name" onClick={() => setChatFriend(user)}>
                  <VipDisplayName name={user.display_name} profile={user} variant="light" />
                  {user.in_voice_room && user.room_name && (
                    <small className="friends-hub-row-room">In {user.room_name}</small>
                  )}
                  {!user.in_voice_room && (
                    <small className="friends-hub-row-room friends-hub-row-room--online">Online</small>
                  )}
                </button>
                {user.in_voice_room && user.room_code && onJoinRoom ? (
                  <button
                    type="button"
                    className="friends-hub-row-join"
                    onClick={() => onJoinRoom(user.room_code)}
                    aria-label={`Join ${user.display_name} in room`}
                  >
                    Join
                  </button>
                ) : (
                  <button
                    type="button"
                    className="friends-hub-row-chat"
                    onClick={() => setChatFriend(user)}
                    aria-label="Chat"
                  >
                    <IconChats />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {sheet}
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
            setChatFriend(friend);
          }}
        />
      )}
    </>,
    document.body,
  );
}
