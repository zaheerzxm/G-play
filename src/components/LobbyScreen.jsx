import { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "../auth.js";
import { markAllConversationsRead } from "../privateChat.js";
import { formatChatPreview, chatRowTags } from "../chatPreview.js";
import { loadDmMuted } from "../dmChatPrefs.js";
import { loadClanChatThread, loadClanByCode } from "../clans.js";
import { loadGroupConversation, loadGroupConversations } from "../groupChat.js";
import ClanChat from "./ClanChat.jsx";
import GroupChat from "./GroupChat.jsx";
import {
  createPersonalRoom,
  createTempPartyRoom,
  discoverRooms,
  searchRoomByCode,
  lookupProfileByCode,
  cleanupOwnedEmptyTempRooms,
  cleanupStaleTempRooms,
  touchUserActivity,
} from "../profile.js";
import { loadLobbySocialSnapshot } from "../social.js";
import AvatarImg from "./AvatarImg.jsx";
import ChatListRow from "./ChatListRow.jsx";
import ProfilePanel from "./ProfilePanel.jsx";
import FriendsHub from "./FriendsHub.jsx";
import OnlineFriendsSheet from "./OnlineFriendsSheet.jsx";
import PersonalChat from "./PersonalChat.jsx";
import RankingsSheet from "./RankingsSheet.jsx";
import ExploreTab from "./ExploreTab.jsx";
import MomentsFeed from "./MomentsFeed.jsx";
import CreateMomentSheet from "./CreateMomentSheet.jsx";
import UserFullProfileSheet from "./UserFullProfileSheet.jsx";
import GiftWallSheet from "./GiftWallSheet.jsx";
import { BottomNavIcon, IconArchive, IconClan, IconMe, IconOnlineFriends, IconSearch, IconStar, IconVoiceRoom, ModuleIcon, UiIcon } from "./NavIcons.jsx";
import ChurchSheet from "./ChurchSheet.jsx";
import ClanHubSheet from "./clan/ClanHubSheet.jsx";
import NearbySheet from "./NearbySheet.jsx";
import ShopSheet from "./ShopSheet.jsx";
import ChatBubbleShop from "./ChatBubbleShop.jsx";
import VipSheet from "./VipSheet.jsx";
import AdminPanelSheet from "./AdminPanelSheet.jsx";
import DailyTaskSheet from "./DailyTaskSheet.jsx";
import LoveHomeSheet from "./LoveHomeSheet.jsx";
import MyHomeSheet from "./MyHomeSheet.jsx";
import PlayShowSheet from "./PlayShowSheet.jsx";
import CoinShopSheet from "./CoinShopSheet.jsx";
import RoomTagBadge from "./RoomTagBadge.jsx";
import GplayHomeHeader from "./GplayHomeHeader.jsx";
import GplayHubRow from "./GplayHubRow.jsx";
import CreateRoomSheet from "./CreateRoomSheet.jsx";
import EditProfileSheet from "./EditProfileSheet.jsx";
import FindPlayerSheet from "./FindPlayerSheet.jsx";
import { loadPrimaryCoupleBond } from "../relationships.js";
import { effectiveVipLevel } from "../vipStatus.js";
import VisitorsSheet from "./VisitorsSheet.jsx";
import InventorySheet from "./InventorySheet.jsx";
import LobbyGamesSection from "./LobbyGamesSection.jsx";
import HomeExploreSection from "./HomeExploreSection.jsx";
import { countClaimableTasks } from "../gameTasks.js";
import { roomShowsLock } from "../roomPassword.js";
import HelpCenterSheet from "./HelpCenterSheet.jsx";
import EventCenterSheet from "./EventCenterSheet.jsx";
import GiftPackSheet from "./GiftPackSheet.jsx";
import GiftPackFloater from "./GiftPackFloater.jsx";
import PromoModal from "./PromoModal.jsx";
import StatsSheet from "./StatsSheet.jsx";
import SecurityCenterSheet from "./SecurityCenterSheet.jsx";
import PrivacySettingsSheet from "./PrivacySettingsSheet.jsx";
import { countNewVisitors } from "../visitors.js";
import LanguageSheet from "./LanguageSheet.jsx";
import ParentalControlSheet from "./ParentalControlSheet.jsx";
import { PENDING_LOBBY_GAME_KEY, ROOM_PROMO_BANNERS } from "../lobbyGames.js";
import { getGameById } from "../games/catalog.js";
import { normalizeRoomTag } from "../roomTags.js";

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

const RELATED_SUB_TABS = [
  { key: "recents", label: "Recents" },
  { key: "join", label: "Join" },
  { key: "following", label: "Following" },
];

const LOBBY_SOCIAL_POLL_MS = 60_000;

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
  chatFriend: chatFriendProp,
  onChatFriendChange,
}) {
  const [tab, setTab] = useState(hasActiveRoom ? "profile" : "home");
  const [searchCode, setSearchCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [onlineFriendsOpen, setOnlineFriendsOpen] = useState(false);
  const [friendsInitialTab, setFriendsInitialTab] = useState("friends");
  const [pendingRequests, setPendingRequests] = useState(0);
  const [pendingRequestUsers, setPendingRequestUsers] = useState([]);
  const [chatFriendLocal, setChatFriendLocal] = useState(null);
  const chatFriend = chatFriendProp ?? chatFriendLocal;
  const setChatFriend = onChatFriendChange ?? setChatFriendLocal;
  const [clanChatClan, setClanChatClan] = useState(null);
  const [initialClanCode, setInitialClanCode] = useState("");
  const [clanChatThread, setClanChatThread] = useState(null);
  const [groupConversations, setGroupConversations] = useState([]);
  const [groupChatConversation, setGroupChatConversation] = useState(null);
  const [partyBusy, setPartyBusy] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [mutualFriends, setMutualFriends] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [discoverTab, setDiscoverTab] = useState("all");
  const [relatedSubTab, setRelatedSubTab] = useState("recents");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [discoveredRooms, setDiscoveredRooms] = useState([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [parentalOpen, setParentalOpen] = useState(false);
  const [rankingsOpen, setRankingsOpen] = useState(false);
  const [churchOpen, setChurchOpen] = useState(false);
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [chatBubbleShopOpen, setChatBubbleShopOpen] = useState(false);
  const [coinShopOpen, setCoinShopOpen] = useState(false);
  const [vipOpen, setVipOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [dailyTasksOpen, setDailyTasksOpen] = useState(false);
  const [visitorsOpen, setVisitorsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryFilterType, setInventoryFilterType] = useState(null);
  const [loveHomeOpen, setLoveHomeOpen] = useState(false);
  const [loveHomeBond, setLoveHomeBond] = useState(null);
  const [myHomeOpen, setMyHomeOpen] = useState(false);
  const [playShowOpen, setPlayShowOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [selfProfileOpen, setSelfProfileOpen] = useState(false);
  const [playerCardFriend, setPlayerCardFriend] = useState(null);
  const [giftWallOpen, setGiftWallOpen] = useState(false);
  const [findPlayerOpen, setFindPlayerOpen] = useState(false);
  const [roomSearchOpen, setRoomSearchOpen] = useState(false);
  const [roomSearchTab, setRoomSearchTab] = useState("room");
  const [userSearchCode, setUserSearchCode] = useState("");
  const [roomTag, setRoomTag] = useState("all");
  const [eventsOpen, setEventsOpen] = useState(false);
  const [giftPackOpen, setGiftPackOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [exploreUsers, setExploreUsers] = useState([]);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [createMomentOpen, setCreateMomentOpen] = useState(false);
  const [editingMoment, setEditingMoment] = useState(null);
  const partyInFlightRef = useRef(false);

  const needsSocialData =
    tab === "home"
    || tab === "chats"
    || tab === "profile"
    || friendsOpen
    || onlineFriendsOpen
    || Boolean(chatFriend);

  useEffect(() => {
    if (!userId) return undefined;
    touchUserActivity(userId).catch(() => {});
    const heartbeat = setInterval(() => touchUserActivity(userId).catch(() => {}), 30_000);
    return () => clearInterval(heartbeat);
  }, [userId]);

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
    if (!userId || !needsSocialData) return undefined;
    let active = true;
    let timer = null;

    async function loadChatData() {
      if (document.hidden) return;

      const snapshot = await loadLobbySocialSnapshot(userId).catch(() => null);
      const nextGroups = await loadGroupConversations(userId).catch(() => []);
      if (!active || !snapshot) return;

      setConversations(snapshot.conversations);
      setMutualFriends(snapshot.mutualFriends);
      setOnlineFriends(snapshot.onlineFriends);
      setExploreUsers(snapshot.onlineFriends.slice(0, 12));
      setPendingRequestUsers(snapshot.pendingRequestUsers);
      setPendingRequests(snapshot.pendingRequestUsers.length);
      setGroupConversations(nextGroups ?? []);

      if (tab === "chats") {
        const nextClanThread = await loadClanChatThread(userId).catch(() => null);
        if (active) setClanChatThread(nextClanThread);
      }
    }

    loadChatData();
    timer = setInterval(loadChatData, LOBBY_SOCIAL_POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") loadChatData();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, needsSocialData, tab]);

  useEffect(() => {
    if (!userId || hasActiveRoom) return;
    try {
      if (localStorage.getItem("gplay.promo.dismissed") === "1") return;
    } catch {
      /* ignore */
    }
    setPromoOpen(true);
  }, [userId, hasActiveRoom]);

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

  const relatedRooms = useMemo(() => {
    let list = [...savedRooms];
    if (relatedSubTab === "following") {
      list = list.filter((r) => r.is_following);
    }
    if (roomTag && roomTag !== "all") {
      const tag = normalizeRoomTag(roomTag);
      list = list.filter((r) => normalizeRoomTag(r.room_tag ?? r.tag) === tag);
    }
    list.sort((a, b) => String(b.saved_at ?? "").localeCompare(String(a.saved_at ?? "")));
    return list;
  }, [savedRooms, relatedSubTab, roomTag]);

  const visibleRooms = discoverTab === "related" ? relatedRooms : discoveredRooms;
  const featuredRelatedRoom = relatedRooms[0] ?? null;
  const clanId = clanChatThread?.clan?.id ?? null;

  const emptyRoomMessage =
    discoverTab === "related"
      ? "No saved rooms yet — bookmark rooms to see them in Related"
      : discoverTab === "popular"
        ? "No popular rooms right now — check back later"
        : "No rooms yet — tap + to create one";
  const unreadCount = useMemo(
    () =>
      conversations.reduce((sum, row) => sum + (row.unread || 0), 0)
      + groupConversations.reduce((sum, row) => sum + (row.unread || 0), 0),
    [conversations, groupConversations],
  );
  const claimableTasks = useMemo(
    () =>
      countClaimableTasks(userId, "lobby", {
        charm: profile?.charm ?? 0,
        friendCount: mutualFriends.length,
        userLevel: profile?.user_level ?? 1,
      }),
    [userId, dailyTasksOpen, profile?.charm, profile?.user_level, mutualFriends.length],
  );
  const newVisitors = useMemo(() => countNewVisitors(userId), [userId]);
  const hasDiscoverNotify = Boolean(clanChatThread?.clan) || claimableTasks > 0;
  const topHotRooms = useMemo(
    () =>
      [...discoveredRooms]
        .sort((a, b) => {
          const onlineDiff = (b.online_count ?? 0) - (a.online_count ?? 0);
          if (onlineDiff) return onlineDiff;
          return Number(b.room_level ?? 1) - Number(a.room_level ?? 1);
        })
        .slice(0, 3),
    [discoveredRooms],
  );
  const lobbyBannerSlides = useMemo(
    () => [{ key: "hot", type: "hot" }, ...ROOM_PROMO_BANNERS.map((b) => ({ ...b, type: "promo" }))],
    [],
  );

  useEffect(() => {
    if (tab !== "rooms") return undefined;
    const timer = setInterval(() => {
      setBannerIndex((i) => (i + 1) % lobbyBannerSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [tab, lobbyBannerSlides.length]);

  const activeSlide = lobbyBannerSlides[bannerIndex] ?? lobbyBannerSlides[0];

  function handleEventCenterAction(action) {
    if (action === "rankings") {
      setRankingsOpen(true);
      return true;
    }
    if (action === "tasks") {
      setDailyTasksOpen(true);
      return true;
    }
    if (action === "vip") {
      setVipOpen(true);
      return true;
    }
    if (action === "rooms") {
      setTab("rooms");
      return true;
    }
    if (action === "clan") {
      setTab("clan");
      return true;
    }
    if (action === "invite") {
      setFriendsOpen(true);
      return true;
    }
    return false;
  }

  function openDirectChat(friend) {
    setFriendsOpen(false);
    setClanChatClan(null);
    setGroupChatConversation(null);
    setPlayerCardFriend(null);
    setChatFriend(friend);
  }

  function openPlayerCard(friend) {
    if (!friend?.id) return;
    setPlayerCardFriend(friend);
  }

  function openClanChat(clan) {
    if (!clan?.id) return;
    setChatFriend(null);
    setGroupChatConversation(null);
    setClanChatClan(clan);
    setTab("chats");
  }

  function openGroupChat(conversation) {
    if (!conversation?.groupId) return;
    setChatFriend(null);
    setClanChatClan(null);
    setGroupChatConversation(conversation);
    setTab("chats");
  }

  async function refreshGroupConversations() {
    const rows = await loadGroupConversations(userId).catch(() => []);
    setGroupConversations(rows);
    return rows;
  }

  async function handleGroupCreated(created) {
    const groupId = created?.id;
    if (!groupId || !userId) return;

    setChatFriend(null);

    let conversation = await loadGroupConversation(userId, groupId).catch(() => null);
    if (!conversation) {
      const rows = await refreshGroupConversations();
      conversation = rows.find((row) => row.groupId === groupId) ?? null;
    } else {
      setGroupConversations((prev) => {
        const rest = prev.filter((row) => row.groupId !== groupId);
        return [conversation, ...rest];
      });
    }

    if (conversation) {
      openGroupChat(conversation);
    } else {
      showToast("Group created — open it from Chats");
    }
  }

  async function handleClanJoined(clan) {
    if (!clan?.id) return;
    const thread = await loadClanChatThread(userId).catch(() => ({ clan, lastMessage: null }));
    setClanChatThread(thread ?? { clan, lastMessage: null });
    openClanChat(clan);
  }

  async function refreshClanChatThread() {
    const thread = await loadClanChatThread(userId).catch(() => null);
    setClanChatThread(thread);
    return thread;
  }

  async function handleJoinClanFromInvite(clanCode) {
    if (!clanCode) return;
    setLoading(true);
    setError(null);
    try {
      const clan = await loadClanByCode(clanCode);
      if (!clan) {
        setError(`Clan ${clanCode} not found`);
        return;
      }
      setFriendsOpen(false);
      setChatFriend(null);
      setInitialClanCode(String(clanCode).trim());
      setTab("clan");
      showToast(`Opening "${clan.name}"`);
    } catch (e) {
      setError(e.message ?? "Could not open clan");
    } finally {
      setLoading(false);
    }
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

  async function handleUserSearch() {
    setLoading(true);
    setError(null);
    try {
      const row = await lookupProfileByCode(userSearchCode.trim().toUpperCase());
      if (!row) {
        setError("No player found with that ID");
        return;
      }
      setRoomSearchOpen(false);
      openPlayerCard(row);
    } catch (e) {
      setError(e.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function dismissPromo() {
    try {
      localStorage.setItem("gplay.promo.dismissed", "1");
    } catch {
      /* ignore */
    }
    setPromoOpen(false);
  }

  async function handleSignOut() {
    await signOut();
    onSignOut();
  }

  async function handlePickGame(game) {
    if (!game?.id || partyInFlightRef.current) return;
    const def = getGameById(game.id);
    if (!def?.live) {
      showToast(`${game.name} is coming soon`);
      return;
    }
    await startPartyRoom({
      roomName: `${profile.display_name}'s ${game.name}`,
      roomMode: "games",
      pendingGameType: game.id,
    });
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
      if (opts.pendingGameType) {
        try {
          sessionStorage.setItem(PENDING_LOBBY_GAME_KEY, opts.pendingGameType);
        } catch {
          /* ignore */
        }
      }
      onJoinRoom(room);
    } catch (e) {
      setError(e.message ?? "Could not create party room");
    } finally {
      partyInFlightRef.current = false;
      setPartyBusy(false);
    }
  }

  function showToast(msg) {
    if (!msg) return;
    setToast(String(msg));
  }

  function openMyHome() {
    setMyHomeOpen(true);
  }

  async function openLoveHome() {
    try {
      const bond = await loadPrimaryCoupleBond(userId);
      if (!bond) {
        setMyHomeOpen(true);
        return;
      }
      setLoveHomeBond(bond);
      setLoveHomeOpen(true);
    } catch (e) {
      setError(e.message ?? "Could not open Love Home");
    }
  }

  async function handleCreateAdvanceRoom(roomName, roomPassword = null) {
    setPartyBusy(true);
    setError(null);
    try {
      const { room, newBalance } = await createPersonalRoom({
        userId,
        roomName,
        currentCoins: coins,
        isSuperAdmin,
        roomPassword,
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

  function roomBadgeTiers(room) {
    const level = Number(room.room_level ?? 1);
    const tiers = [];
    if (level >= 8) tiers.push("gold");
    if (level >= 5) tiers.push("silver");
    if (level >= 3) tiers.push("bronze");
    return tiers.slice(0, 3);
  }

  function roomEntrepreneurRibbon(room, index) {
    const level = Number(room.room_level ?? 1);
    const online = room.online_count ?? 0;
    if (online <= 0 || level < 8) return null;
    if (level >= 10 && index === 0) return { label: "No.1 Entrepreneur", variant: "no1" };
    if (level >= 8 && index === 1) return { label: "No.2 Entrepreneur", variant: "no2" };
    if (level >= 10) return { label: "Entrepreneur", variant: "default" };
    if (level >= 8 && index === 0) return { label: "No.1", variant: "no1" };
    return null;
  }

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  function roomRowSubtitle(room) {
    const tag = normalizeRoomTag(room.room_tag ?? room.tag);
    const mode = room.room_mode ?? "normal";
    if (tag === "pk") return "Group PK";
    if (mode === "games") return "Bingo · Power-up";
    if (mode === "video") return "Video · Watch";
    if (mode === "music") return "Music · Listen";
    if (mode === "auction") return "Auction · Bid";
    return "";
  }

  function renderRoomRow(room, index) {
    const canOpen = Boolean(room.id);
    const tag = room.room_tag ?? room.tag ?? "chats";
    const online = room.online_count ?? 0;
    const isPartying = online > 0;
    const badges = roomBadgeTiers(room);
    const isOffline = online === 0;
    const level = Number(room.room_level ?? 1);
    const entrepreneurRibbon = roomEntrepreneurRibbon(room, index);
    const isTrending = index < 3 && online > 0;
    const subtitle = roomRowSubtitle(room);
    return (
      <article key={room.id ?? room.room_code ?? index} className={`G-play-room-row ${isTrending ? "G-play-room-row--trending" : ""}`}>
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
              <ModuleIcon Icon={IconVoiceRoom} className="G-play-room-row-thumb-fallback" />
            )}
            {roomShowsLock(room) && (
              <span className="G-play-room-row-lock" aria-hidden>🔒</span>
            )}
          </span>
          <span className="G-play-room-row-body">
            <span className="G-play-room-row-title-row">
              <strong>{room.name}</strong>
              <span className="G-play-room-row-level">Lv.{level}</span>
              {isTrending && <span className="G-play-room-row-trend">🔥</span>}
              {entrepreneurRibbon && (
                <span className={`G-play-room-ribbon G-play-room-ribbon--${entrepreneurRibbon.variant}`}>
                  {entrepreneurRibbon.label}
                </span>
              )}
              {isPartying && (
                <span className="G-play-room-ribbon G-play-room-ribbon--partying">
                  <UiIcon Icon={IconStar} /> Partying
                </span>
              )}
            </span>
            <span className="G-play-room-row-meta">
              <RoomTagBadge tag={tag} compact />
              {room.room_code && (
                <span className="G-play-room-row-code">#{room.room_code}</span>
              )}
              <span className="G-play-room-row-mode">{room.room_mode === "normal" ? "Chats" : room.room_mode ?? "Chats"}</span>
              <span className="G-play-room-row-count">
                <UiIcon Icon={IconMe} />
                {isOffline ? "Offline" : online}
              </span>
            </span>
            {subtitle && <span className="G-play-room-row-subtitle">{subtitle}</span>}
          </span>
          {badges.length > 0 && (
            <span className="G-play-room-badge-cluster" aria-hidden>
              {badges.map((tier) => (
                <span key={tier} className={`G-play-room-shield G-play-room-shield--${tier}`} />
              ))}
            </span>
          )}
        </button>
      </article>
    );
  }

  async function handleMarkAllChatsRead() {
    try {
      await markAllConversationsRead(userId);
      const snapshot = await loadLobbySocialSnapshot(userId).catch(() => null);
      if (snapshot) setConversations(snapshot.conversations);
    } catch (e) {
      setError(e.message ?? "Could not update chats");
    }
  }

  function openFriendsHub() {
    setFriendsInitialTab(pendingRequests > 0 ? "requests" : "friends");
    setFriendsOpen(true);
  }

  function openOnlineFriends() {
    setOnlineFriendsOpen(true);
  }

  return (
    <div className="app lobby-app G-play-home">
      <div className="lobby-body G-play-home-body">
        {error && <p className="banner error">{error}</p>}
        {toast && <p className="banner G-play-lobby-toast">{toast}</p>}

        {tab === "home" && (
          <div className="G-play-discover">
            <GplayHomeHeader
              profile={profile}
              coins={coins}
              isSuperAdmin={isSuperAdmin}
              onBuyCoins={() => setCoinShopOpen(true)}
              onAvatarClick={() => setTab("profile")}
              onOpenNewGift={() => setGiftPackOpen(true)}
              onOpenEvents={() => setEventsOpen(true)}
            />
            <GplayHubRow
              onlineCount={onlineFriends.length}
              tasksNotify={claimableTasks > 0}
              onRanking={() => setRankingsOpen(true)}
              onDailyTasks={() => setDailyTasksOpen(true)}
              onOnlineFriends={openOnlineFriends}
            />

            <LobbyGamesSection
              onOpenGameRooms={() => setTab("rooms")}
              onPickGame={handlePickGame}
            />

            <HomeExploreSection
              users={exploreUsers}
              onOpenProfile={openPlayerCard}
              onOpenChat={openDirectChat}
              onJoinRoom={handleJoinRoomFromInvite}
            />
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
              <button type="button" className="G-play-lobby-search G-play-icon-btn" aria-label="Search room" onClick={() => setRoomSearchOpen(true)}>
                <IconSearch />
              </button>
              <button type="button" className="G-play-lobby-create" aria-label="Create room" onClick={() => setCreateRoomOpen(true)} disabled={partyBusy}>+</button>
            </div>

            {discoverTab === "related" && (
              <div className="G-play-related-subtabs" role="tablist" aria-label="Related rooms">
                {RELATED_SUB_TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={relatedSubTab === t.key}
                    className={`G-play-related-subtab ${relatedSubTab === t.key ? "G-play-related-subtab--active" : ""}`}
                    onClick={() => setRelatedSubTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {discoverTab === "related" && featuredRelatedRoom && (
              <button
                type="button"
                className="G-play-related-hero"
                onClick={() => onJoinRoom(featuredRelatedRoom)}
              >
                <span className="G-play-related-hero-thumb">
                  {featuredRelatedRoom.cover_url ? (
                    <img src={featuredRelatedRoom.cover_url} alt="" />
                  ) : (
                    <ModuleIcon Icon={IconVoiceRoom} className="G-play-room-row-thumb-fallback" />
                  )}
                </span>
                <span className="G-play-related-hero-body">
                  <strong>{featuredRelatedRoom.name}</strong>
                  <small>
                    <RoomTagBadge tag={featuredRelatedRoom.room_tag ?? featuredRelatedRoom.tag} compact />
                    {(featuredRelatedRoom.online_count ?? 0) > 0
                      ? `${featuredRelatedRoom.online_count} online`
                      : "Offline"}
                  </small>
                </span>
              </button>
            )}

            <div className="G-play-room-banner-carousel" role="region" aria-label="Promotions">
              {activeSlide.type === "hot" ? (
                <button
                  type="button"
                  className="G-play-hot-ranking-banner"
                  onClick={() => setRankingsOpen(true)}
                >
                  <span className="G-play-hot-ranking-banner-copy">
                    <strong className="G-play-hot-ranking-title">HOT ROOM</strong>
                    <span className="G-play-hot-ranking-cta">View the ranking ›</span>
                  </span>
                  <span className="G-play-hot-ranking-podium" aria-hidden>
                    {[
                      { rank: 2, room: topHotRooms[1] },
                      { rank: 1, room: topHotRooms[0] },
                      { rank: 3, room: topHotRooms[2] },
                    ].map(({ rank, room: hotRoom }) => (
                      <span
                        key={rank}
                        className={`G-play-hot-ranking-slot G-play-hot-ranking-slot--${rank}`}
                      >
                        <span className="G-play-hot-ranking-rank">{rank === 1 ? "👑" : rank}</span>
                        {hotRoom?.cover_url ? (
                          <img src={hotRoom.cover_url} alt="" className="G-play-hot-ranking-avatar" />
                        ) : hotRoom ? (
                          <span className="G-play-hot-ranking-avatar G-play-hot-ranking-avatar--room">
                            <ModuleIcon Icon={IconVoiceRoom} className="G-play-hot-ranking-room-icon" />
                          </span>
                        ) : (
                          <span className="G-play-hot-ranking-avatar G-play-hot-ranking-avatar--empty">
                            {rank}
                          </span>
                        )}
                      </span>
                    ))}
                  </span>
                </button>
              ) : (
                <div className={`G-play-room-banner G-play-room-banner--slide ${activeSlide.className}`}>
                  <div className="G-play-room-banner-promo">
                    <strong>{activeSlide.title}</strong>
                    <p>{activeSlide.text}</p>
                  </div>
                </div>
              )}
              <div className="G-play-room-banner-markers" aria-hidden>
                {lobbyBannerSlides.map((b, i) => (
                  <button
                    key={b.key}
                    type="button"
                    className={`G-play-room-banner-mark ${i === bannerIndex ? "G-play-room-banner-mark--active" : ""}`}
                    onClick={() => setBannerIndex(i)}
                    aria-label={`Banner ${i + 1}`}
                  >
                    —
                  </button>
                ))}
              </div>
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
              {visibleRooms.length === 0 && <p className="G-play-empty">{emptyRoomMessage}</p>}
            </div>
          </div>
        )}

        {tab === "discover" && (
          <ExploreTab
            userId={userId}
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            clanNotify={Boolean(clanChatThread?.clan)}
            onOpenChurch={() => setChurchOpen(true)}
            onOpenClan={() => setTab("clan")}
            onOpenNearby={() => setNearbyOpen(true)}
            onOpenSpotlight={() => setSpotlightOpen(true)}
          />
        )}

        {tab === "chats" && (
          <div className="G-play-chats">
            <header className="G-play-tab-header G-play-tab-header--chats">
              <h2 className="G-play-tab-title G-play-tab-title--chats">
                Chats
                <span className="G-play-chat-title-badge" aria-hidden>
                  <IconArchive />
                </span>
              </h2>
              <div className="G-play-chat-header-actions G-play-chat-header-actions--weplay">
                <button
                  type="button"
                  className="G-play-icon-btn G-play-icon-btn--archive"
                  aria-label="Mark all read"
                  onClick={handleMarkAllChatsRead}
                >
                  <IconArchive />
                </button>
                <button
                  type="button"
                  className="G-play-icon-btn G-play-icon-btn--people"
                  onClick={openFriendsHub}
                  aria-label="Add friend"
                >
                  <IconOnlineFriends />
                  {pendingRequests > 0 && (
                    <span className="G-play-action-badge">{pendingRequests > 9 ? "9+" : pendingRequests}</span>
                  )}
                </button>
                <button
                  type="button"
                  className="G-play-icon-btn G-play-icon-btn--chat-plus"
                  onClick={() => setFindPlayerOpen(true)}
                  aria-label="New chat"
                >
                  +
                </button>
              </div>
            </header>

            <div className="G-play-chat-list">
              {clanChatThread?.clan && (
                <ChatListRow
                  friend={{
                    id: clanChatThread.clan.id,
                    display_name: clanChatThread.clan.name,
                    avatar_url: clanChatThread.clan.avatar_url,
                  }}
                  preview={
                    formatChatPreview(clanChatThread.lastMessage?.message, {
                      clanMessage: clanChatThread.lastMessage,
                    }) || "Clan group chat"
                  }
                  timestamp={clanChatThread.lastMessage?.created_at}
                  tags={[{ key: "clan", label: "Clan" }]}
                  avatarSlot={(
                    <span className="G-play-module-icon G-play-module-icon--clan" aria-hidden>
                      <IconClan />
                    </span>
                  )}
                  onOpenChat={() => openClanChat(clanChatThread.clan)}
                />
              )}
              {groupConversations.map((row) => (
                <ChatListRow
                  key={row.groupId}
                  friend={{
                    id: row.groupId,
                    display_name: row.group?.name ?? "Group",
                  }}
                  preview={
                    formatChatPreview(row.lastMessage?.message, {
                      groupMessage: row.lastMessage,
                      senderName:
                        row.lastMessage?.sender_id === userId
                          ? "You"
                          : row.lastMessage?.profile?.display_name,
                    }) || "Group chat"
                  }
                  timestamp={row.lastMessage?.created_at ?? row.group?.created_at}
                  unread={row.unread}
                  tags={[{ key: "group", label: "Group" }]}
                  avatarSlot={(
                    <span className="G-play-module-icon G-play-module-icon--group" aria-hidden>
                      <IconOnlineFriends />
                    </span>
                  )}
                  onOpenChat={() => openGroupChat(row)}
                />
              ))}
                {conversations.map(({ friend, lastMessage, unread }) => (
                  <ChatListRow
                    key={friend.id}
                    friend={friend}
                    preview={formatChatPreview(lastMessage?.message, {
                      senderName:
                        lastMessage?.sender_id === userId
                          ? "You"
                          : friend.display_name,
                    })}
                    timestamp={lastMessage?.created_at}
                    unread={unread}
                    muted={loadDmMuted(userId, friend.id)}
                    tags={chatRowTags(friend, { clanId })}
                    onOpenChat={openDirectChat}
                    onOpenProfile={openPlayerCard}
                  />
                ))}
                {conversations.length === 0 && !clanChatThread?.clan && groupConversations.length === 0 &&
                  mutualFriends.map((friend) => (
                    <ChatListRow
                      key={friend.id}
                      friend={friend}
                      preview="Say hi"
                      onOpenChat={openDirectChat}
                      onOpenProfile={openPlayerCard}
                    />
                  ))}
              {conversations.length === 0 && !clanChatThread?.clan && groupConversations.length === 0 && mutualFriends.length === 0 && (
                <p className="G-play-empty">No chats yet — tap + to find a player</p>
              )}
            </div>
          </div>
        )}

        {tab === "clan" && (
          <ClanHubSheet
            userId={userId}
            profile={profile}
            coins={coins}
            isSuperAdmin={isSuperAdmin}
            onCoinsChange={onCoinsChange}
            onClose={() => {
              setInitialClanCode("");
              setTab("discover");
            }}
            onToast={showToast}
            onClanJoined={handleClanJoined}
            onOpenClanChat={openClanChat}
            onJoinClanRoom={(room) => {
              onJoinRoom(room);
              setTab("rooms");
            }}
            initialClanCode={initialClanCode}
          />
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
              onOpenMoments={() => setSpotlightOpen(true)}
              onOpenContributions={() => setRankingsOpen(true)}
              onOpenLanguage={() => setLanguageOpen(true)}
              onOpenParental={() => setParentalOpen(true)}
              onOpenPrivacy={() => setPrivacyOpen(true)}
              onOpenHelpCenter={() => setHelpOpen(true)}
              onOpenStats={() => setStatsOpen(true)}
              onOpenSecurity={() => setSecurityOpen(true)}
              onOpenRankings={() => setRankingsOpen(true)}
              onOpenShop={() => setShopOpen(true)}
              onOpenInventory={() => setInventoryOpen(true)}
              onOpenVip={() => setVipOpen(true)}
              onOpenMyHome={openMyHome}
              onOpenPlayShow={() => setPlayShowOpen(true)}
              onOpenVisitors={() => setVisitorsOpen(true)}
              onOpenInvite={() => setFriendsOpen(true)}
              onOpenPlayerCard={() => setSelfProfileOpen(true)}
              onEditProfile={() => setEditProfileOpen(true)}
              isSuperAdmin={isSuperAdmin}
              onOpenAdminPanel={() => setAdminPanelOpen(true)}
              onToast={showToast}
            />
          </div>
        )}
      </div>

      {onlineFriendsOpen && (
        <OnlineFriendsSheet
          userId={userId}
          displayName={profile.display_name}
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onCoinsChange={onCoinsChange}
          onJoinRoom={handleJoinRoomFromInvite}
          onJoinClan={handleJoinClanFromInvite}
          onClose={() => {
            setOnlineFriendsOpen(false);
            loadLobbySocialSnapshot(userId)
              .then((snapshot) => {
                if (!snapshot) return;
                setOnlineFriends(snapshot.onlineFriends);
                setExploreUsers(snapshot.onlineFriends.slice(0, 12));
              })
              .catch(() => {});
          }}
        />
      )}

      {friendsOpen && (
        <FriendsHub
          userId={userId}
          displayName={profile.display_name}
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onCoinsChange={onCoinsChange}
          onJoinRoom={handleJoinRoomFromInvite}
          onJoinClan={handleJoinClanFromInvite}
          initialTab={friendsInitialTab}
          onClose={() => {
            setFriendsOpen(false);
            loadLobbySocialSnapshot(userId)
              .then((snapshot) => {
                if (!snapshot) return;
                setMutualFriends(snapshot.mutualFriends);
                setPendingRequestUsers(snapshot.pendingRequestUsers);
                setPendingRequests(snapshot.pendingRequestUsers.length);
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
          onJoinClan={handleJoinClanFromInvite}
          onClose={() => setChatFriend(null)}
          onGroupCreated={handleGroupCreated}
        />
      )}

      {clanChatClan && (
        <ClanChat
          clan={clanChatClan}
          userId={userId}
          displayName={profile.display_name}
          onClose={() => {
            setClanChatClan(null);
            refreshClanChatThread();
          }}
          onOpenProfile={(member) => {
            if (!member?.user_id && !member?.id) return;
            openPlayerCard({
              id: member.user_id ?? member.id,
              display_name: member.profile?.display_name ?? member.display_name,
              avatar_url: member.profile?.avatar_url ?? member.avatar_url,
              user_code: member.profile?.user_code ?? member.user_code,
            });
          }}
          onToast={showToast}
        />
      )}

      {groupChatConversation && (
        <GroupChat
          group={groupChatConversation.group}
          members={groupChatConversation.members ?? []}
          userId={userId}
          displayName={profile.display_name}
          onClose={() => {
            setGroupChatConversation(null);
            refreshGroupConversations();
          }}
          onOpenProfile={(member) => {
            if (!member?.user_id && !member?.id) return;
            openPlayerCard({
              id: member.user_id ?? member.id,
              display_name: member.profile?.display_name ?? member.display_name,
              avatar_url: member.profile?.avatar_url ?? member.avatar_url,
              user_code: member.profile?.user_code ?? member.user_code,
            });
          }}
          onToast={showToast}
        />
      )}

      {rankingsOpen && (
        <RankingsSheet
          profile={profile}
          userId={userId}
          onClose={() => setRankingsOpen(false)}
          onReceiveGifts={() => {
            setRankingsOpen(false);
            setGiftWallOpen(true);
          }}
        />
      )}

      {churchOpen && (
        <ChurchSheet
          userId={userId}
          onClose={() => setChurchOpen(false)}
          onToast={showToast}
        />
      )}

      {nearbyOpen && (
        <NearbySheet
          userId={userId}
          profile={profile}
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
          userId={userId}
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onCoinsChange={onCoinsChange}
          onClose={() => setShopOpen(false)}
          onOpenInventory={() => {
            setShopOpen(false);
            setInventoryFilterType(null);
            setInventoryOpen(true);
          }}
          onOpenChatBubbleShop={() => {
            setShopOpen(false);
            setChatBubbleShopOpen(true);
          }}
          onToast={showToast}
        />
      )}

      {chatBubbleShopOpen && (
        <ChatBubbleShop
          userId={userId}
          profile={profile}
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onCoinsChange={onCoinsChange}
          onClose={() => setChatBubbleShopOpen(false)}
          onOpenInventory={() => {
            setChatBubbleShopOpen(false);
            setInventoryFilterType("chat_bubble");
            setInventoryOpen(true);
          }}
          onToast={showToast}
        />
      )}

      {inventoryOpen && (
        <InventorySheet
          userId={userId}
          filterType={inventoryFilterType}
          onClose={() => {
            setInventoryOpen(false);
            setInventoryFilterType(null);
          }}
        />
      )}

      {visitorsOpen && (
        <VisitorsSheet
          userId={userId}
          onClose={() => setVisitorsOpen(false)}
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

      {playerCardFriend && (
        <UserFullProfileSheet
          seat={{
            user_id: playerCardFriend.id,
            display_name: playerCardFriend.display_name,
            avatar_url: playerCardFriend.avatar_url,
            user_code: playerCardFriend.user_code,
          }}
          profile={playerCardFriend}
          viewerId={userId}
          viewerProfile={profile}
          viewerName={profile.display_name}
          onClose={() => setPlayerCardFriend(null)}
          onMessage={() => {
            const friend = playerCardFriend;
            setPlayerCardFriend(null);
            openDirectChat(friend);
          }}
          onSendGift={() => {
            const friend = playerCardFriend;
            setPlayerCardFriend(null);
            openDirectChat(friend);
          }}
          onOpenGiftWall={() => setGiftWallOpen(true)}
          onOpenClan={() => setTab("clan")}
          onOpenStats={() => {
            setPlayerCardFriend(null);
            setStatsOpen(true);
          }}
          onToast={showToast}
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onCoinsChange={onCoinsChange}
        />
      )}

      {giftWallOpen && playerCardFriend && (
        <GiftWallSheet
          userId={playerCardFriend.id}
          profile={playerCardFriend}
          fullPage
          onClose={() => setGiftWallOpen(false)}
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
          onOpenGiftWall={() => setGiftWallOpen(true)}
          onOpenLoveHome={openLoveHome}
          onOpenPlayShow={() => setPlayShowOpen(true)}
          onOpenFriends={() => {
            setSelfProfileOpen(false);
            setFriendsOpen(true);
          }}
          onOpenStats={() => {
            setSelfProfileOpen(false);
            setStatsOpen(true);
          }}
          onToast={showToast}
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onCoinsChange={onCoinsChange}
        />
      )}

      {giftWallOpen && !playerCardFriend && (
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

      {spotlightOpen && (
        <MomentsFeed
          userId={userId}
          fullPage
          onClose={() => setSpotlightOpen(false)}
          onEditMoment={(moment) => {
            setSpotlightOpen(false);
            setEditingMoment(moment);
          }}
          onCreatePost={() => setCreateMomentOpen(true)}
        />
      )}

      {createMomentOpen && (
        <CreateMomentSheet
          userId={userId}
          displayName={profile.display_name}
          onClose={() => setCreateMomentOpen(false)}
          onPosted={() => {
            setCreateMomentOpen(false);
          }}
        />
      )}

      {editingMoment && (
        <CreateMomentSheet
          userId={userId}
          displayName={profile.display_name}
          moment={editingMoment}
          onClose={() => setEditingMoment(null)}
          onPosted={() => {
            setEditingMoment(null);
            setSpotlightOpen(true);
          }}
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
              <h2>Search</h2>
            </header>
            <div className="room-search-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={roomSearchTab === "room"}
                className={roomSearchTab === "room" ? "room-search-tab--active" : ""}
                onClick={() => setRoomSearchTab("room")}
              >
                Room ID
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={roomSearchTab === "user"}
                className={roomSearchTab === "user" ? "room-search-tab--active" : ""}
                onClick={() => setRoomSearchTab("user")}
              >
                User ID
              </button>
            </div>
            {roomSearchTab === "room" ? (
              <div className="G-play-search-row G-play-search-row--sheet">
                <input
                  type="text"
                  placeholder="Room ID"
                  maxLength={8}
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button type="button" className="room-search-confirm" disabled={loading || searchCode.trim().length < 4} onClick={handleSearch}>
                  {loading ? "…" : "Confirm"}
                </button>
              </div>
            ) : (
              <div className="G-play-search-row G-play-search-row--sheet">
                <input
                  type="text"
                  placeholder="User ID"
                  maxLength={8}
                  value={userSearchCode}
                  onChange={(e) => setUserSearchCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleUserSearch()}
                />
                <button type="button" className="room-search-confirm" disabled={loading || userSearchCode.trim().length < 4} onClick={handleUserSearch}>
                  {loading ? "…" : "Confirm"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {eventsOpen && (
        <EventCenterSheet
          onClose={() => setEventsOpen(false)}
          onAction={handleEventCenterAction}
          onToast={showToast}
        />
      )}
      {giftPackOpen && <GiftPackSheet onClose={() => setGiftPackOpen(false)} onToast={showToast} />}
      {promoOpen && (
        <PromoModal
          onClose={dismissPromo}
          onCheckNow={() => {
            dismissPromo();
            setEventsOpen(true);
          }}
        />
      )}
      {statsOpen && <StatsSheet userId={userId} onClose={() => setStatsOpen(false)} />}
      {securityOpen && (
        <SecurityCenterSheet
          userId={userId}
          onClose={() => setSecurityOpen(false)}
          onToast={showToast}
        />
      )}
      {privacyOpen && (
        <PrivacySettingsSheet
          userId={userId}
          profile={profile}
          onClose={() => setPrivacyOpen(false)}
          onToast={showToast}
          onProfileUpdate={onProfileUpdate}
        />
      )}

      {adminPanelOpen && (
        <AdminPanelSheet
          userId={userId}
          vipLevel={effectiveVipLevel(profile)}
          earnedVipLevel={profile.vip_level ?? 0}
          onClose={() => setAdminPanelOpen(false)}
          onProfileUpdate={onProfileUpdate}
          onToast={showToast}
        />
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
          profile={profile}
          friendCount={mutualFriends.length}
          isSuperAdmin={isSuperAdmin}
          context="lobby"
          onClose={() => setDailyTasksOpen(false)}
          onReward={(r) => {
            if (r?.newBalance != null) onCoinsChange?.(r.newBalance);
            const coins = r?.rewards?.coins ?? 0;
            showToast(coins ? `Claimed ${coins} coins!` : "Task completed!");
          }}
          onNavigate={(action) => {
            setDailyTasksOpen(false);
            if (action === "games" || action === "home") setTab("home");
            else if (action === "rooms") setTab("rooms");
            else if (action === "chats") setTab("chats");
            else if (action === "profile") setTab("profile");
            else if (action === "discover") setSpotlightOpen(true);
            else if (action === "invite") setFriendsOpen(true);
            else if (action === "clan") setTab("clan");
            else if (action === "clan_chat") {
              setTab("chats");
              if (clanChatThread?.clan) openClanChat(clanChatThread.clan);
              else {
                loadClanChatThread(userId).then((thread) => {
                  if (thread?.clan) {
                    setClanChatThread(thread);
                    openClanChat(thread.clan);
                  } else showToast("Join a clan first");
                });
              }
            }
          }}
        />
      )}

      {myHomeOpen && (
        <MyHomeSheet
          userId={userId}
          profile={profile}
          onClose={() => setMyHomeOpen(false)}
          onOpenLoveHome={() => {
            setMyHomeOpen(false);
            openLoveHome();
          }}
          onOpenGuard={(friend) => {
            if (friend) {
              setMyHomeOpen(false);
              openPlayerCard(friend);
            }
          }}
          onOpenChurch={() => {
            setMyHomeOpen(false);
            setChurchOpen(true);
          }}
          onToast={showToast}
        />
      )}

      {playShowOpen && (
        <PlayShowSheet
          userId={userId}
          profile={profile}
          onClose={() => setPlayShowOpen(false)}
          onToast={showToast}
        />
      )}

      {loveHomeOpen && loveHomeBond && (
        <LoveHomeSheet
          userId={userId}
          bond={loveHomeBond}
          ownerProfile={profile}
          onClose={() => {
            setLoveHomeOpen(false);
            setLoveHomeBond(null);
          }}
        />
      )}

      {helpOpen && <HelpCenterSheet onClose={() => setHelpOpen(false)} />}
      {languageOpen && (
        <LanguageSheet
          onClose={() => setLanguageOpen(false)}
          onToast={showToast}
        />
      )}
      {parentalOpen && (
        <ParentalControlSheet
          onClose={() => setParentalOpen(false)}
          onToast={showToast}
        />
      )}

      <GiftPackFloater onOpen={() => setGiftPackOpen(true)} />

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
          className={`bottom-nav-btn ${tab === "chats" ? "bottom-nav-btn--active" : ""}`}
          onClick={() => setTab("chats")}
        >
          <span className="bottom-nav-icon"><BottomNavIcon tab="chats" active={tab === "chats"} /></span>
          <span>Chats</span>
          {unreadCount > 0 && (
            <span className="bottom-nav-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </button>
        <button
          type="button"
          className={`bottom-nav-btn ${tab === "discover" ? "bottom-nav-btn--active" : ""}`}
          onClick={() => setTab("discover")}
        >
          <span className="bottom-nav-icon"><BottomNavIcon tab="discover" active={tab === "discover"} /></span>
          <span>Discover</span>
          {hasDiscoverNotify && tab !== "discover" && <span className="bottom-nav-dot" />}
        </button>
        <button
          type="button"
          className={`bottom-nav-btn ${tab === "profile" ? "bottom-nav-btn--active" : ""}`}
          onClick={() => setTab("profile")}
        >
          <span className="bottom-nav-icon"><BottomNavIcon tab="profile" active={tab === "profile"} /></span>
          <span>Me</span>
          {newVisitors > 0 && tab !== "profile" && <span className="bottom-nav-dot" />}
        </button>
      </nav>
    </div>
  );
}
