import { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "../auth.js";
import { loadConversations } from "../privateChat.js";
import {
  createPersonalRoom,
  createTempPartyRoom,
  discoverRooms,
  searchRoomByCode,
  cleanupOwnedEmptyTempRooms,
  cleanupStaleTempRooms,
} from "../profile.js";
import {
  acceptFriendRequest,
  loadMutualFriends,
  loadPendingFriendRequests,
  rejectFriendRequest,
} from "../social.js";
import AvatarImg from "./AvatarImg.jsx";
import ProfilePanel from "./ProfilePanel.jsx";
import FriendsHub from "./FriendsHub.jsx";
import PersonalChat from "./PersonalChat.jsx";
import RankingsSheet from "./RankingsSheet.jsx";
import ExploreTab from "./ExploreTab.jsx";
import UserFullProfileSheet from "./UserFullProfileSheet.jsx";
import GiftWallSheet from "./GiftWallSheet.jsx";
import { BottomNavIcon } from "./NavIcons.jsx";
import ChurchSheet from "./ChurchSheet.jsx";
import FamilySheet from "./FamilySheet.jsx";
import NearbySheet from "./NearbySheet.jsx";
import ShopSheet from "./ShopSheet.jsx";
import VipSheet from "./VipSheet.jsx";
import DailyTaskSheet from "./DailyTaskSheet.jsx";
import LoveHomeSheet from "./LoveHomeSheet.jsx";
import CoinShopSheet from "./CoinShopSheet.jsx";
import RoomTagBadge from "./RoomTagBadge.jsx";
import GplayHomeHeader from "./GplayHomeHeader.jsx";
import GplayHubRow from "./GplayHubRow.jsx";
import CreateRoomSheet from "./CreateRoomSheet.jsx";
import EditProfileSheet from "./EditProfileSheet.jsx";
import FindPlayerSheet from "./FindPlayerSheet.jsx";
import { loadPrimaryCoupleBond } from "../relationships.js";
import { effectiveVipLevel } from "../vipStatus.js";
import { liveMiniGames, comingMiniGames } from "../games/catalog.js";

const LOBBY_TABS = [
  { key: "related", label: "Related" },
  { key: "all", label: "All" },
  { key: "popular", label: "Popular" },
];

const ROOM_TAGS = [
  { key: "all", label: "All" },
  { key: "friends", label: "Friends" },
  { key: "pk", label: "PK" },
  { key: "music", label: "Music" },
  { key: "video", label: "Video" },
  { key: "game", label: "Game" },
];

export default function LobbyScreen({
  profile,
  coins,
  isSuperAdmin,
  userId,
  myRooms,
  savedRooms,
  onJoinRoom,
  onCoinsChange,
  onRefreshRooms,
  onProfileUpdate,
  onSignOut,
  hasActiveRoom,
}) {
  const [tab, setTab] = useState(hasActiveRoom ? "profile" : "home");
  const [searchCode, setSearchCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [friendsInitialTab, setFriendsInitialTab] = useState("friends");
  const [pendingRequests, setPendingRequests] = useState(0);
  const [pendingRequestUsers, setPendingRequestUsers] = useState([]);
  const [chatsSubTab, setChatsSubTab] = useState("messages");
  const [requestBusyId, setRequestBusyId] = useState(null);
  const [chatFriend, setChatFriend] = useState(null);
  const [partyBusy, setPartyBusy] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [mutualFriends, setMutualFriends] = useState([]);
  const [discoverTab, setDiscoverTab] = useState("all");
  const [discoveredRooms, setDiscoveredRooms] = useState([]);
  const [rankingsOpen, setRankingsOpen] = useState(false);
  const [churchOpen, setChurchOpen] = useState(false);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [coinShopOpen, setCoinShopOpen] = useState(false);
  const [vipOpen, setVipOpen] = useState(false);
  const [dailyTasksOpen, setDailyTasksOpen] = useState(false);
  const [loveHomeOpen, setLoveHomeOpen] = useState(false);
  const [loveHomeBond, setLoveHomeBond] = useState(null);
  const [toast, setToast] = useState(null);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [selfProfileOpen, setSelfProfileOpen] = useState(false);
  const [giftWallOpen, setGiftWallOpen] = useState(false);
  const [findPlayerOpen, setFindPlayerOpen] = useState(false);
  const [roomSearchOpen, setRoomSearchOpen] = useState(false);
  const [roomTag, setRoomTag] = useState("all");
  const partyInFlightRef = useRef(false);

  useEffect(() => {
    if (!userId) return undefined;
    cleanupOwnedEmptyTempRooms(userId).catch(() => {});
    cleanupStaleTempRooms().catch(() => {});
    const sweep = setInterval(() => {
      cleanupOwnedEmptyTempRooms(userId).catch(() => {});
      cleanupStaleTempRooms().catch(() => {});
    }, 60_000);
    return () => clearInterval(sweep);
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;

    async function loadChatData() {
      const [nextConversations, nextFriends, nextPendingUsers] = await Promise.all([
        loadConversations(userId).catch(() => []),
        loadMutualFriends(userId).catch(() => []),
        loadPendingFriendRequests(userId).catch(() => []),
      ]);
      if (!active) return;
      setConversations(nextConversations);
      setMutualFriends(nextFriends);
      setPendingRequestUsers(nextPendingUsers);
      setPendingRequests(nextPendingUsers.length);
    }

    loadChatData();
    const timer = setInterval(loadChatData, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    const tag = roomTag;
    const refresh = () => {
      discoverRooms({ tab: discoverTab, tag, userId })
        .then((rows) => {
          if (active) setDiscoveredRooms(rows);
        })
        .catch(() => {});
    };
    refresh();
    const timer = setInterval(refresh, 15_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [userId, discoverTab, roomTag, myRooms, savedRooms]);

  const joinedRooms = useMemo(() => {
    const seen = new Set();
    const rooms = [...myRooms, ...savedRooms].filter((room) => {
      if (!room?.id || seen.has(room.id)) return false;
      seen.add(room.id);
      return true;
    });
    return rooms;
  }, [myRooms, savedRooms]);

  const visibleRooms = discoveredRooms.length
    ? discoveredRooms
    : joinedRooms.length
      ? joinedRooms
      : [];
  const hasUnread = conversations.some((row) => row.unread > 0);

  function openDirectChat(friend) {
    setFriendsOpen(false);
    setChatFriend(friend);
  }

  async function handleJoinRoomFromInvite(roomCode) {
    if (!roomCode) return;
    setLoading(true);
    setError(null);
    try {
      const room = await searchRoomByCode(roomCode);
      if (!room) {
        setError(`Room ${roomCode} not found`);
        return;
      }
      setFriendsOpen(false);
      setChatFriend(null);
      onJoinRoom(room);
    } catch (e) {
      setError(e.message ?? "Could not open room");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    setLoading(true);
    setError(null);
    try {
      const room = await searchRoomByCode(searchCode);
      if (!room) {
        setError("No room found with that ID");
        return;
      }
      setRoomSearchOpen(false);
      onJoinRoom(room);
    } catch (e) {
      setError(e.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    onSignOut();
  }

  async function startPartyRoom(opts = {}) {
    if (partyInFlightRef.current) return;
    partyInFlightRef.current = true;
    setPartyBusy(true);
    setError(null);
    try {
      const { room } = await createTempPartyRoom({
        userId,
        roomName: opts.roomName ?? `${profile.display_name}'s Party`,
        roomMode: opts.roomMode ?? "normal",
        backgroundKey: opts.backgroundKey ?? "golden_party",
      });
      onJoinRoom(room);
    } catch (e) {
      setError(e.message ?? "Could not create party room");
    } finally {
      partyInFlightRef.current = false;
      setPartyBusy(false);
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  async function openMyHome() {
    try {
      const bond = await loadPrimaryCoupleBond(userId);
      if (!bond) {
        showToast("No CP bond yet — visit Church to propose");
        setChurchOpen(true);
        return;
      }
      setLoveHomeBond(bond);
      setLoveHomeOpen(true);
    } catch (e) {
      showToast(e.message ?? "Could not open Love Home");
    }
  }


  async function handleCreateAdvanceRoom(roomName) {
    setPartyBusy(true);
    setError(null);
    try {
      const { room, newBalance } = await createPersonalRoom({
        userId,
        roomName,
        currentCoins: coins,
        isSuperAdmin,
      });
      onCoinsChange(newBalance);
      await onRefreshRooms();
      setCreateRoomOpen(false);
      onJoinRoom(room);
    } catch (e) {
      setError(e.message ?? "Could not create room");
    } finally {
      setPartyBusy(false);
    }
  }

  function renderRoomRow(room, index) {
    const canOpen = Boolean(room.id);
    const tag = room.room_tag ?? room.tag ?? "chats";
    return (
      <article key={room.id ?? room.room_code ?? index} className="G-play-room-row">
        <button
          type="button"
          className="G-play-room-row-btn"
          onClick={() => {
            if (canOpen) onJoinRoom(room);
            else startPartyRoom();
          }}
        >
          <span className="G-play-room-row-thumb">
            {room.cover_url ? (
              <img src={room.cover_url} alt="" />
            ) : (
              <span className="G-play-room-row-thumb-fallback">🎙️</span>
            )}
          </span>
          <span className="G-play-room-row-body">
            <strong>{room.name}</strong>
            <span className="G-play-room-row-meta">
              <RoomTagBadge tag={tag} compact />
              <span className="G-play-room-row-count">👤 {room.online_count ?? 0}</span>
            </span>
          </span>
        </button>
      </article>
    );
  }

  function openPeopleHub() {
    setFriendsInitialTab(pendingRequests > 0 ? "requests" : "friends");
    setFriendsOpen(true);
  }

  async function handleAcceptRequest(requester) {
    if (!requester?.id || requestBusyId) return;
    setRequestBusyId(requester.id);
    try {
      await acceptFriendRequest(userId, requester.id);
      const [nextFriends, nextPendingUsers] = await Promise.all([
        loadMutualFriends(userId),
        loadPendingFriendRequests(userId),
      ]);
      setMutualFriends(nextFriends);
      setPendingRequestUsers(nextPendingUsers);
      setPendingRequests(nextPendingUsers.length);
      setChatsSubTab("messages");
      showToast(`You and ${requester.display_name} are now friends`);
    } catch (e) {
      showToast(e.message ?? "Could not accept request");
    } finally {
      setRequestBusyId(null);
    }
  }

  async function handleRejectRequest(requester) {
    if (!requester?.id || requestBusyId) return;
    setRequestBusyId(requester.id);
    try {
      await rejectFriendRequest(userId, requester.id);
      const nextPendingUsers = await loadPendingFriendRequests(userId);
      setPendingRequestUsers(nextPendingUsers);
      setPendingRequests(nextPendingUsers.length);
    } catch (e) {
      showToast(e.message ?? "Could not reject request");
    } finally {
      setRequestBusyId(null);
    }
  }

  return (
    <div className="app lobby-app G-play-home">
      <div className="lobby-body G-play-home-body">
        {error && <p className="banner error">{error}</p>}
        {toast && <p className="banner success">{toast}</p>}

        {tab === "home" && (
          <div className="G-play-discover">
            <GplayHomeHeader
              profile={profile}
              coins={coins}
              isSuperAdmin={isSuperAdmin}
              onBuyCoins={() => setCoinShopOpen(true)}
              onAvatarClick={() => setTab("profile")}
            />
            <GplayHubRow
              onlineCount={mutualFriends.length}
              onRanking={() => setRankingsOpen(true)}
              onDailyTasks={() => setDailyTasksOpen(true)}
              onOnlineFriends={openPeopleHub}
            />

            <section className="G-play-section G-play-section--home-games">
              <div className="G-play-section-head">
                <h2>Games</h2>
                <button type="button" onClick={() => setTab("rooms")}>
                  Voice rooms
                </button>
              </div>
              <p className="G-play-games-hint">In a voice room, set mode to <strong>Games</strong> (room menu). Host starts — everyone joins in the game area.</p>
              <h3 className="G-play-games-subhead">Play in rooms</h3>
              <div className="G-play-games-grid">
                {liveMiniGames().map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    className="G-play-game-card G-play-game-card--live"
                    onClick={() => setTab("rooms")}
                  >
                    <span className="G-play-game-emoji">{game.emoji}</span>
                    <strong>{game.name}</strong>
                    <small>{game.players}</small>
                  </button>
                ))}
              </div>
              <h3 className="G-play-games-subhead">Coming soon</h3>
              <div className="G-play-games-grid G-play-games-grid--soon">
                {comingMiniGames().map((game) => (
                  <div key={game.id} className="G-play-game-card G-play-game-card--soon">
                    <span className="G-play-game-emoji">{game.emoji}</span>
                    <strong>{game.name}</strong>
                    <small>{game.players}</small>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === "rooms" && (
          <div className="G-play-discover G-play-discover--rooms">
            <div className="G-play-lobby-tabs">
              {LOBBY_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`G-play-lobby-tab ${discoverTab === t.key ? "G-play-lobby-tab--active" : ""}`}
                  onClick={() => setDiscoverTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
              <button type="button" className="G-play-lobby-search" aria-label="Search room" onClick={() => setRoomSearchOpen(true)}>🔍</button>
              <button type="button" className="G-play-lobby-create" aria-label="Create room" onClick={() => setCreateRoomOpen(true)} disabled={partyBusy}>+</button>
            </div>

            <div className="G-play-room-banner" role="note">
              <span aria-hidden>🛡️</span>
              <p>G-play message to users regarding minor protection.</p>
            </div>

            <div className="G-play-filter-row">
              {ROOM_TAGS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`G-play-filter-chip ${roomTag === t.key ? "G-play-filter-chip--active" : ""}`}
                  onClick={() => setRoomTag(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="G-play-room-list G-play-room-list--rows">
              {visibleRooms.map(renderRoomRow)}
              {visibleRooms.length === 0 && <p className="G-play-empty">No rooms yet — tap + to create one</p>}
            </div>
          </div>
        )}

        {tab === "explore" && (
          <ExploreTab
            userId={userId}
            displayName={profile.display_name}
            onOpenChurch={() => setChurchOpen(true)}
            onOpenFamily={() => setFamilyOpen(true)}
            onOpenNearby={() => setNearbyOpen(true)}
          />
        )}

        {tab === "chats" && (
          <div className="G-play-chats">
            <header className="G-play-tab-header G-play-tab-header--chats">
              <h2 className="G-play-tab-title">Chats</h2>
              <div className="G-play-chat-header-actions">
                <button
                  type="button"
                  className="G-play-icon-btn G-play-icon-btn--people"
                  onClick={openPeopleHub}
                  aria-label="Friends"
                >
                  <span className="G-play-people-icon" aria-hidden>👥</span>
                  {pendingRequests > 0 && (
                    <span className="G-play-action-badge">{pendingRequests > 9 ? "9+" : pendingRequests}</span>
                  )}
                </button>
                <button
                  type="button"
                  className="G-play-lobby-create G-play-chat-add"
                  onClick={() => setFindPlayerOpen(true)}
                  aria-label="Find player"
                >
                  +
                </button>
              </div>
            </header>

            <div className="G-play-chats-subtabs">
              <button
                type="button"
                className={`G-play-chats-subtab ${chatsSubTab === "messages" ? "G-play-chats-subtab--active" : ""}`}
                onClick={() => setChatsSubTab("messages")}
              >
                Messages
              </button>
              <button
                type="button"
                className={`G-play-chats-subtab ${chatsSubTab === "requests" ? "G-play-chats-subtab--active" : ""}`}
                onClick={() => setChatsSubTab("requests")}
              >
                Requests
                {pendingRequests > 0 && (
                  <span className="G-play-chats-subtab-badge">{pendingRequests > 9 ? "9+" : pendingRequests}</span>
                )}
              </button>
            </div>

            {chatsSubTab === "messages" && (
              <div className="G-play-chat-list">
                {conversations.map(({ friend, lastMessage, unread }) => (
                  <button key={friend.id} type="button" className="G-play-chat-row" onClick={() => openDirectChat(friend)}>
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt="" className="G-play-chat-avatar-img" />
                    ) : (
                      <span className="G-play-chat-avatar">{(friend.display_name || "?").charAt(0)}</span>
                    )}
                    <span className="G-play-chat-row-body">
                      <strong>{friend.display_name}</strong>
                      <small>{lastMessage?.message || "Tap to chat"}</small>
                    </span>
                    {unread > 0 && <em className="G-play-chat-unread">{unread > 99 ? "99+" : unread}</em>}
                  </button>
                ))}
                {conversations.length === 0 &&
                  mutualFriends.map((friend) => (
                    <button key={friend.id} type="button" className="G-play-chat-row" onClick={() => openDirectChat(friend)}>
                      {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt="" className="G-play-chat-avatar-img" />
                      ) : (
                        <span className="G-play-chat-avatar">{(friend.display_name || "?").charAt(0)}</span>
                      )}
                      <span className="G-play-chat-row-body">
                        <strong>{friend.display_name}</strong>
                        <small>Say hi</small>
                      </span>
                    </button>
                  ))}
                {conversations.length === 0 && mutualFriends.length === 0 && (
                  <p className="G-play-empty">No chats yet — tap + to find a player</p>
                )}
              </div>
            )}

            {chatsSubTab === "requests" && (
              <ul className="friends-list friends-list--requests G-play-chat-requests">
                {pendingRequestUsers.length === 0 && (
                  <li className="friends-empty">No friend requests right now</li>
                )}
                {pendingRequestUsers.map((u) => (
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
                        disabled={requestBusyId === u.id}
                        onClick={() => handleAcceptRequest(u)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="friends-request-reject"
                        disabled={requestBusyId === u.id}
                        onClick={() => handleRejectRequest(u)}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "profile" && (
          <div className="G-play-profile-wrap">
            <header className="G-play-profile-header G-play-profile-header--clean">
              <h2 className="G-play-tab-title">Me</h2>
              <button type="button" className="text-btn" onClick={handleSignOut}>Sign out</button>
            </header>
            <ProfilePanel
              profile={profile}
              userId={userId}
              onJoinRoom={onJoinRoom}
              myRooms={myRooms}
              onOpenMoments={() => setTab("explore")}
              onOpenRankings={() => setRankingsOpen(true)}
              onOpenShop={() => setShopOpen(true)}
              onOpenVip={() => setVipOpen(true)}
              onOpenMyHome={openMyHome}
              onOpenInvite={() => setFriendsOpen(true)}
              onOpenPlayerCard={() => setSelfProfileOpen(true)}
              onEditProfile={() => setEditProfileOpen(true)}
              onToast={showToast}
            />
          </div>
        )}
      </div>

      {friendsOpen && (
        <FriendsHub
          userId={userId}
          displayName={profile.display_name}
          onJoinRoom={handleJoinRoomFromInvite}
          initialTab={friendsInitialTab}
          onClose={() => {
            setFriendsOpen(false);
            Promise.all([loadMutualFriends(userId), loadPendingFriendRequests(userId)])
              .then(([friends, pending]) => {
                setMutualFriends(friends);
                setPendingRequestUsers(pending);
                setPendingRequests(pending.length);
              })
              .catch(() => {});
          }}
        />
      )}

      {chatFriend && (
        <PersonalChat
          userId={userId}
          displayName={profile.display_name}
          friend={chatFriend}
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onCoinsChange={onCoinsChange}
          onJoinRoom={handleJoinRoomFromInvite}
          onClose={() => setChatFriend(null)}
        />
      )}

      {rankingsOpen && <RankingsSheet onClose={() => setRankingsOpen(false)} />}

      {churchOpen && (
        <ChurchSheet
          userId={userId}
          onClose={() => setChurchOpen(false)}
          onToast={showToast}
        />
      )}

      {familyOpen && (
        <FamilySheet
          userId={userId}
          onClose={() => setFamilyOpen(false)}
          onOpenChurch={() => setChurchOpen(true)}
          onToast={showToast}
        />
      )}

      {nearbyOpen && (
        <NearbySheet
          userId={userId}
          onClose={() => setNearbyOpen(false)}
          onChat={(friend) => {
            setNearbyOpen(false);
            openDirectChat(friend);
          }}
          onToast={showToast}
        />
      )}

      {shopOpen && (
        <ShopSheet
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setShopOpen(false)}
          onToast={showToast}
        />
      )}

      {coinShopOpen && (
        <CoinShopSheet
          userId={userId}
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onToast={showToast}
          onClose={() => setCoinShopOpen(false)}
        />
      )}

      {createRoomOpen && (
        <CreateRoomSheet
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          busy={partyBusy}
          onClose={() => setCreateRoomOpen(false)}
          onCreateTemp={() => startPartyRoom().then(() => setCreateRoomOpen(false))}
          onCreateAdvance={handleCreateAdvanceRoom}
        />
      )}

      {selfProfileOpen && (
        <UserFullProfileSheet
          seat={{
            user_id: userId,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            user_code: profile.user_code,
          }}
          profile={profile}
          viewerId={userId}
          viewerProfile={profile}
          viewerName={profile.display_name}
          onClose={() => setSelfProfileOpen(false)}
          onOpenSettings={() => {
            setSelfProfileOpen(false);
            setEditProfileOpen(true);
          }}
          onOpenGiftWall={() => {
            setSelfProfileOpen(false);
            setGiftWallOpen(true);
          }}
          onOpenLoveHome={openMyHome}
          onToast={showToast}
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onCoinsChange={onCoinsChange}
        />
      )}

      {giftWallOpen && (
        <GiftWallSheet
          userId={userId}
          profile={profile}
          fullPage
          onClose={() => setGiftWallOpen(false)}
        />
      )}

      {editProfileOpen && (
        <EditProfileSheet
          profile={profile}
          userId={userId}
          onClose={() => setEditProfileOpen(false)}
          onProfileUpdate={onProfileUpdate}
          onToast={showToast}
        />
      )}

      {findPlayerOpen && (
        <FindPlayerSheet
          userId={userId}
          viewerName={profile.display_name}
          onClose={() => setFindPlayerOpen(false)}
          onMessage={(friend) => {
            setFindPlayerOpen(false);
            openDirectChat(friend);
          }}
          onToast={showToast}
        />
      )}

      {roomSearchOpen && (
        <div className="sheet-backdrop" onClick={() => setRoomSearchOpen(false)}>
          <div className="room-search-sheet" onClick={(e) => e.stopPropagation()}>
            <header className="sheet-header">
              <button type="button" className="sheet-back" onClick={() => setRoomSearchOpen(false)}>‹</button>
              <h2>Join room</h2>
            </header>
            <div className="G-play-search-row G-play-search-row--sheet">
              <input
                type="text"
                placeholder="Room ID"
                maxLength={8}
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button type="button" disabled={loading || searchCode.trim().length < 4} onClick={handleSearch}>
                {loading ? "…" : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}

      {vipOpen && (
        <VipSheet
          userId={userId}
          vipLevel={effectiveVipLevel(profile)}
          earnedVipLevel={profile.vip_level ?? 0}
          vipPoints={profile.vip_points ?? 0}
          vipExpiresAt={profile.vip_expires_at}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setVipOpen(false)}
          onProfileUpdate={onProfileUpdate}
          onToast={showToast}
        />
      )}

      {dailyTasksOpen && (
        <DailyTaskSheet
          userId={userId}
          isSeated={false}
          onClose={() => setDailyTasksOpen(false)}
          onReward={(r) => showToast(`Claimed ${r?.coins ?? 0} coins!`)}
        />
      )}

      {loveHomeOpen && loveHomeBond && (
        <LoveHomeSheet
          userId={userId}
          bond={loveHomeBond}
          onClose={() => {
            setLoveHomeOpen(false);
            setLoveHomeBond(null);
          }}
        />
      )}

      <nav className="bottom-nav G-play-bottom-nav">
        <button
          type="button"
          className={`bottom-nav-btn ${tab === "home" ? "bottom-nav-btn--active" : ""}`}
          onClick={() => setTab("home")}
        >
          <span className="bottom-nav-icon"><BottomNavIcon tab="home" active={tab === "home"} /></span>
          <span>G-play</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-btn ${tab === "rooms" ? "bottom-nav-btn--active" : ""}`}
          onClick={() => setTab("rooms")}
        >
          <span className="bottom-nav-icon"><BottomNavIcon tab="rooms" active={tab === "rooms"} /></span>
          <span>Voice Room</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-btn ${tab === "explore" ? "bottom-nav-btn--active" : ""}`}
          onClick={() => setTab("explore")}
        >
          <span className="bottom-nav-icon"><BottomNavIcon tab="explore" active={tab === "explore"} /></span>
          <span>Explore</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-btn ${tab === "chats" ? "bottom-nav-btn--active" : ""}`}
          onClick={() => setTab("chats")}
        >
          <span className="bottom-nav-icon"><BottomNavIcon tab="chats" active={tab === "chats"} /></span>
          <span>Chats</span>
          {hasUnread && <span className="bottom-nav-dot" />}
        </button>
        <button
          type="button"
          className={`bottom-nav-btn ${tab === "profile" ? "bottom-nav-btn--active" : ""}`}
          onClick={() => setTab("profile")}
        >
          <span className="bottom-nav-icon"><BottomNavIcon tab="profile" active={tab === "profile"} /></span>
          <span>Me</span>
        </button>
      </nav>
    </div>
  );
}
