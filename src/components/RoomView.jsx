import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVoice } from "../context/VoiceContext.jsx";
import { addContribution, loadTodayTopContributors } from "../contribution.js";
import { ensureStarterInventory, consumeInventoryGift, loadGiftInventory } from "../giftInventory.js";
import { playGiftSound, playPfpGiftSound, playPremiumGiftSound } from "../giftSound.js";
import {
  isPremiumGift,
  premiumFxDuration,
  premiumFxTypeForGift,
  premiumValueForName,
} from "../giftPremiumTypes.js";
import { deductWalletCoins, fetchWalletCoins } from "../wallet.js";
import { addVipActivity } from "../vipActivity.js";
import { effectiveVipLevel } from "../vipStatus.js";
import { charmForGift } from "../charmTiers.js";
import { formatCompactNumber } from "../formatCompact.js";
import { findGift, findGiftByName, formatCoins, formatGiftMessage, giftPaysRewards, giftQuantityFromName, giftRewardUnitCost, giftSendUnitCost, isOrphanCharmMessage, looksLikeCharmSystemMessage, looksLikeGiftSystemMessage, rollGiftRewardResult, roomShieldEmoji, splitGiftMessage } from "../gifts.js";
import { addUserExp } from "../userLevels.js";
import { joinWaitingQueue, leaveWaitingQueue } from "../waitingQueue.js";
import { reportRoom } from "../social.js";
import {
  creditGiftReward,
  cleanupInactiveRoomUsers,
  cleanupTempRoomIfEmpty,
  deleteRoomAsSuperAdmin,
  followRoom,
  joinSavedRoom,
  leaveSavedRoom,
  loadProfilesForUserIds,
  loadRoomById,
  loadRoomOwnerProfile,
  loadRoomSaveState,
  loadRoomSocialStats,
  rallyRoomFans,
  unfollowRoom,
} from "../profile.js";
import { supabase } from "../supabase.js";
import { speakingIdsToSeatNumbers } from "../voiceSeatMap.js";
import {
  buildGiftEffect,
  buildGiftHit,
  findSeatForRecipient,
  parseGiftMessage,
} from "../giftFx.js";
import { roomTagLabel } from "../roomTags.js";
import { addCharm, addRoomExp, applyGiftCharm, markDailyTask, tickWatchMinutes } from "../gamification.js";
import { buildReactionMessage, reactionFromMessage } from "../reactions.js";
import ComboGiftButton from "./ComboGiftButton.jsx";
import DailyTaskSheet from "./DailyTaskSheet.jsx";
import GiftAnimation from "./GiftAnimation.jsx";
import GiftSheet from "./GiftSheet.jsx";
import PremiumGiftFx from "./PremiumGiftFx.jsx";
import EmotePanel from "./EmotePanel.jsx";
import { emoteMessage } from "../emotes.js";
import ShareSheet from "./ShareSheet.jsx";
import RoomAudienceSheet from "./RoomAudienceSheet.jsx";
import GiftWallSheet from "./GiftWallSheet.jsx";
import ModeConfirmSheet from "./ModeConfirmSheet.jsx";
import { postSystemMessage } from "../roomLog.js";
import {
  claimRedPacket,
  claimRedPacketDrop,
  createRedPacketRain,
  formatRedPacketMessage,
  formatRedPacketResultsMessage,
  loadRedPacketDrops,
  loadRedPacketLeaderboard,
  parseRedPacketMessage,
  settleRedPacketRain,
} from "../redPacket.js";
import { loadMutualFriends } from "../social.js";
import { lookupProfileByCode } from "../profile.js";
import ReactionPanel from "./ReactionPanel.jsx";
import RoomModeSheet from "./RoomModeSheet.jsx";
import RoomProfileSheet from "./RoomProfileSheet.jsx";
import RoomSettingsSheet from "./RoomSettingsSheet.jsx";
import UserProfileCard from "./UserProfileCard.jsx";
import SeatChangeUserSheet from "./SeatChangeUserSheet.jsx";
import WalkieTalkieOverlay from "./WalkieTalkieOverlay.jsx";
import RelationshipBondCard from "./RelationshipBondCard.jsx";
import SeatBondLayer from "./SeatBondLayer.jsx";
import IntimateSpaceSheet from "./IntimateSpaceSheet.jsx";
import LoveHomeSheet from "./LoveHomeSheet.jsx";
import {
  activeSeatBonds,
  bondMeta,
  cancelBond,
  enrichBondWithProfiles,
  loadBondBetween,
  loadBondsAmongUsers,
  loadPrimaryCoupleBond,
  partnerUserId,
} from "../relationships.js";
import { ADJACENT_SEAT_PAIRS, ADMIN_SEAT, GAMES_MODE_SEAT_LAYOUT, HOST_SEAT, PARTNER_SEAT_NUMBERS, ROOM_SEAT_COUNT, SEAT_LAYOUT, VIDEO_MODE_SEAT_LAYOUT } from "../roomSeats.js";
import {
  blacklistUser,
  formatKickCooldown,
  kickUserFromRoom,
  loadRoomAdmins,
  updateRoomSettings,
} from "../roomAdmin.js";
import { checkRoomEntry } from "../roomAccess.js";
import { blockUser, isBlockedEitherWay } from "../userBlocks.js";
import RoomBlacklistSheet from "./RoomBlacklistSheet.jsx";
import KickUserDialog from "./KickUserDialog.jsx";
import BlockUserDialog from "./BlockUserDialog.jsx";
import RoomDock from "./RoomDock.jsx";
import GameLauncher from "../games/GameLauncher.jsx";
import GamesSeatStrip from "./GamesSeatStrip.jsx";
import VideoRoomPanel from "./VideoRoomPanel.jsx";
import AddVideoSheet from "./AddVideoSheet.jsx";
import {
  addRoomVideoFromUrl,
  clearRoomVideo,
  readRoomVideo,
  syncRoomVideoPlayback,
} from "../video/roomVideo.js";
import { connectSocket, emitAck } from "../lib/socket.js";
import RoomMenu from "./RoomMenu.jsx";
import SpeakerButton from "./SpeakerButton.jsx";
import SeatActionSheet from "./SeatActionSheet.jsx";
import AdminAssignSheet from "./AdminAssignSheet.jsx";
import CoinShopSheet from "./CoinShopSheet.jsx";
import FunctionsGrid from "./FunctionsGrid.jsx";
import RedPacketSheet from "./RedPacketSheet.jsx";
import RedPacketRain from "./RedPacketRain.jsx";
import ReportSheet from "./ReportSheet.jsx";
import StickerPanel, { parseStickerMessage, stickerMessage } from "./StickerPanel.jsx";
import WaitingQueueSheet from "./WaitingQueueSheet.jsx";
import SeatInviteDialog from "./SeatInviteDialog.jsx";
import {
  acceptSeatInvite,
  loadPendingInvitesForRoom,
  loadPendingSeatInvite,
  rejectSeatInvite,
  sendSeatInvite,
} from "../seatInvites.js";
import PersonalChat from "./PersonalChat.jsx";
import SeatEmoteFx from "./SeatEmoteFx.jsx";
import GiftHitFx from "./GiftHitFx.jsx";
import SvgaGiftFx from "./SvgaGiftFx.jsx";
import { giftSvgaUrl } from "../giftSvga.js";
import { logGiftTransaction } from "../giftTransactions.js";
import AuctionPanel from "./AuctionPanel.jsx";
import StageBackdrop from "./StageBackdrop.jsx";
import VoiceRoom from "./VoiceRoom.jsx";
import AvatarImg from "./AvatarImg.jsx";
import UserBadges from "./UserBadges.jsx";

const WELCOME_MSG =
  "Welcome to G-play Voice Room. Please respect community guidelines — no inappropriate or illegal content.";

function truncateName(name, max = 10) {
  if (!name) return "Room";
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

const POLL_MS = 2000;
const PRESENCE_TTL_MS = 90_000;
const ROOM_INACTIVE_KICK_MS = 10 * 60_000;
const ACTIVE_SEAT_STORAGE_KEY = "gplay.activeSeat.v1";

function isSeatTaken(seat) {
  return Boolean(seat?.user_id);
}

function seatInitial(seat) {
  const name = seat?.nickname?.trim();
  return name ? name.charAt(0).toUpperCase() : "?";
}

function messageSortKey(row) {
  const t = row?.created_at ? new Date(row.created_at).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
}

function formatMessageClock(value) {
  const t = value ? new Date(value) : null;
  if (!t || Number.isNaN(t.getTime())) return "";
  return t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isTempMessage(row) {
  return typeof row?.id === "string" && row.id.startsWith("temp-");
}

function isSameSentMessage(a, b) {
  return (
    a?.room_id === b?.room_id &&
    a?.user_id === b?.user_id &&
    a?.nickname === b?.nickname &&
    a?.message === b?.message
  );
}

function mergeMessageRows(prev, rows) {
  const byId = new Map();
  for (const row of prev ?? []) {
    if (row?.id) byId.set(row.id, row);
  }
  for (const row of rows ?? []) {
    if (!row?.id) continue;
    if (!isTempMessage(row)) {
      for (const [id, existing] of byId.entries()) {
        if (isTempMessage(existing) && isSameSentMessage(existing, row)) {
          byId.delete(id);
        }
      }
    }
    byId.set(row.id, row);
  }
  return [...byId.values()].sort((a, b) => messageSortKey(a) - messageSortKey(b));
}

async function clearStaleSeats(roomId, uid, name) {
  if (!supabase) return;
  await supabase
    .from("seats")
    .update({ user_id: null, nickname: null })
    .eq("room_id", roomId)
    .eq("user_id", uid);
  await supabase
    .from("seats")
    .update({ user_id: null, nickname: null })
    .eq("room_id", roomId)
    .ilike("nickname", name.trim());
}

async function clearStaleSeatsExcept(roomId, uid, name, exceptSeatNumber) {
  if (!supabase) return;
  let mineQuery = supabase
    .from("seats")
    .update({ user_id: null, nickname: null })
    .eq("room_id", roomId)
    .eq("user_id", uid);
  if (exceptSeatNumber) mineQuery = mineQuery.neq("seat_number", exceptSeatNumber);
  await mineQuery;

  if (!name?.trim()) return;
  let nameQuery = supabase
    .from("seats")
    .update({ user_id: null, nickname: null })
    .eq("room_id", roomId)
    .ilike("nickname", name.trim());
  if (exceptSeatNumber) nameQuery = nameQuery.neq("seat_number", exceptSeatNumber);
  await nameQuery;
}

function readStoredSeat(roomId, userId) {
  try {
    const raw = window.localStorage.getItem(ACTIVE_SEAT_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const seat = Number(data?.[`${roomId}:${userId}`]);
    return Number.isInteger(seat) && seat >= 1 && seat <= ROOM_SEAT_COUNT ? seat : null;
  } catch {
    return null;
  }
}

function saveStoredSeat(roomId, userId, seatNumber) {
  if (!roomId || !userId || !seatNumber) return;
  try {
    const raw = window.localStorage.getItem(ACTIVE_SEAT_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[`${roomId}:${userId}`] = seatNumber;
    window.localStorage.setItem(ACTIVE_SEAT_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* optional */
  }
}

function clearStoredSeat(roomId, userId) {
  if (!roomId || !userId) return;
  try {
    const raw = window.localStorage.getItem(ACTIVE_SEAT_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    delete data[`${roomId}:${userId}`];
    window.localStorage.setItem(ACTIVE_SEAT_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* optional */
  }
}

async function restoreStoredSeat(roomId, uid, name) {
  if (!supabase) return false;
  const seatNumber = readStoredSeat(roomId, uid);
  if (!seatNumber) return false;

  const { data: target, error: targetError } = await supabase
    .from("seats")
    .select("seat_number, user_id, is_locked")
    .eq("room_id", roomId)
    .eq("seat_number", seatNumber)
    .maybeSingle();

  if (targetError || !target || target.is_locked) return false;
  if (target.user_id && target.user_id !== uid) {
    clearStoredSeat(roomId, uid);
    return false;
  }

  await clearStaleSeatsExcept(roomId, uid, name, seatNumber);
  const { error } = await supabase
    .from("seats")
    .update({ user_id: uid, nickname: name })
    .eq("room_id", roomId)
    .eq("seat_number", seatNumber);
  return !error;
}

async function ensureRoomSeats(roomId) {
  if (!supabase || !roomId) return;
  const { data } = await supabase
    .from("seats")
    .select("seat_number")
    .eq("room_id", roomId);
  const existing = new Set((data ?? []).map((seat) => seat.seat_number));
  const missing = Array.from({ length: ROOM_SEAT_COUNT }, (_, i) => i + 1)
    .filter((seatNumber) => !existing.has(seatNumber))
    .map((seatNumber) => ({ room_id: roomId, seat_number: seatNumber }));
  if (missing.length) {
    await supabase.from("seats").upsert(missing, { onConflict: "room_id,seat_number" });
  }
}

function RoomContent({
  room,
  userId,
  displayName,
  avatarUrl,
  coins,
  isSuperAdmin,
  vipLevel = 0,
  onCoinsChange,
  onMinimize,
  onLeave,
  onMySeatChange,
  onSeatMicAllowedChange,
  onSavedRoomsChange,
  onProfileUpdate,
  speakingUserIds,
  voiceStatus,
}) {
  const voice = useVoice();
  const joinedAtRef = useRef(new Date().toISOString());

  useEffect(() => {
    joinedAtRef.current = new Date().toISOString();
  }, [room?.id]);

  const [seats, setSeats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [giftTarget, setGiftTarget] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [error, setError] = useState(null);
  const [live, setLive] = useState(false);
  const [seatBusy, setSeatBusy] = useState(false);
  const [giftBusy, setGiftBusy] = useState(false);
  const [giftSheetOpen, setGiftSheetOpen] = useState(false);
  const [giftWallUser, setGiftWallUser] = useState(null);
  const [giftEffects, setGiftEffects] = useState([]);
  const seenGiftMsgRef = useRef(new Set());
  const seenReactionMsgRef = useRef(new Set());
  const [seatSheet, setSeatSheet] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [roomSaved, setRoomSaved] = useState(false);
  const [roomFollowing, setRoomFollowing] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [profileMap, setProfileMap] = useState({});
  const profileMapRef = useRef({});
  const [userProfileSeat, setUserProfileSeat] = useState(null);
  const [seatChangeTarget, setSeatChangeTarget] = useState(null);
  const [userBonds, setUserBonds] = useState([]);
  const [bondCard, setBondCard] = useState(null);
  const [intimateSpaceBond, setIntimateSpaceBond] = useState(null);
  const [loveHomeOpen, setLoveHomeOpen] = useState(false);
  const [loveHomeBond, setLoveHomeBond] = useState(null);
  const [myCoupleBond, setMyCoupleBond] = useState(null);
  const [guardRefreshToken, setGuardRefreshToken] = useState(0);
  const [roomProfileOpen, setRoomProfileOpen] = useState(false);
  const [roomStats, setRoomStats] = useState({ members: 0, fans: 0 });
  const [roomOwner, setRoomOwner] = useState(null);
  const [giftBanner, setGiftBanner] = useState(null);
  const [combo, setCombo] = useState(null);
  const [roomMeta, setRoomMeta] = useState(room);
  const [roomAdmins, setRoomAdmins] = useState([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [blacklistOpen, setBlacklistOpen] = useState(false);
  const [blacklistFromSettings, setBlacklistFromSettings] = useState(false);
  const [kickTarget, setKickTarget] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);
  const [onlineListOpen, setOnlineListOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareContacts, setShareContacts] = useState([]);
  const [modePending, setModePending] = useState(null);
  const [dailyTasksOpen, setDailyTasksOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [videoAddOpen, setVideoAddOpen] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);
  const [functionsOpen, setFunctionsOpen] = useState(false);
  const [gamesSessionActive, setGamesSessionActive] = useState(false);
  const [gamesWaitingActive, setGamesWaitingActive] = useState(false);
  const [dockChatConfig, setDockChatConfig] = useState(null);
  const liveGameRef = useRef(null);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [coinShopOpen, setCoinShopOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminFromSettings, setAdminFromSettings] = useState(false);
  const [waitingOpen, setWaitingOpen] = useState(false);
  const [inviteTargetSeat, setInviteTargetSeat] = useState(null);
  const [inviteSeatUser, setInviteSeatUser] = useState(null);
  const [inviteIncludeSeated, setInviteIncludeSeated] = useState(false);
  const [pendingInvites, setPendingInvites] = useState({});
  const [seatInvite, setSeatInvite] = useState(null);
  const [redPacketOpen, setRedPacketOpen] = useState(false);
  const [redPacketRain, setRedPacketRain] = useState(null);
  const seenRainRef = useRef(new Set());
  const seenRainMsgRef = useRef(new Set());
  const [topContributors, setTopContributors] = useState([]);
  const [giftInventory, setGiftInventory] = useState({});
  const [personalChatFriend, setPersonalChatFriend] = useState(null);
  const [seatReactions, setSeatReactions] = useState([]);
  const [seatEmoteAnim, setSeatEmoteAnim] = useState({});
  const [giftHits, setGiftHits] = useState([]);
  const [svgaGift, setSvgaGift] = useState(null);
  const [premiumGiftFx, setPremiumGiftFx] = useState(null);
  const premiumGiftQueueRef = useRef([]);
  const premiumGiftPlayingRef = useRef(false);
  const premiumGiftSeqRef = useRef(0);
  const [giftQueueLen, setGiftQueueLen] = useState(0);
  const giftQueueRef = useRef([]);
  const giftDrainingRef = useRef(false);
  const giftDrainTimerRef = useRef(null);
  const giftSheetOpenRef = useRef(false);
  const giftSheetRestoreRef = useRef(false);
  const giftEffectsRef = useRef([]);
  const premiumGiftFxRef = useRef(null);
  const restoreGiftSheetTimerRef = useRef(null);
  const switchingSeatRef = useRef(false);
  const comboTimerRef = useRef(null);
  const [seatSwitching, setSeatSwitching] = useState(false);
  const imageInputRef = useRef(null);
  const chatScrollRef = useRef(null);
  const chatPinnedToBottomRef = useRef(true);
  const sessionReleasedRef = useRef(false);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    sessionReleasedRef.current = false;
  }, [room?.id]);

  useEffect(() => {
    giftSheetOpenRef.current = giftSheetOpen;
  }, [giftSheetOpen]);

  useEffect(() => {
    giftEffectsRef.current = giftEffects;
  }, [giftEffects]);

  useEffect(() => {
    premiumGiftFxRef.current = premiumGiftFx;
  }, [premiumGiftFx]);

  useEffect(
    () => () => {
      clearTimeout(restoreGiftSheetTimerRef.current);
    },
    [],
  );

  const maybeRestoreGiftSheet = useCallback(() => {
    if (!giftSheetRestoreRef.current) return;
    if (giftDrainingRef.current) return;
    if (giftQueueRef.current.length > 0) return;
    if (premiumGiftPlayingRef.current) return;
    if (premiumGiftQueueRef.current.length > 0) return;
    if (premiumGiftFxRef.current) return;
    if (giftEffectsRef.current.length > 0) return;
    giftSheetRestoreRef.current = false;
    setGiftSheetOpen(true);
  }, []);

  const scheduleRestoreGiftSheet = useCallback(() => {
    clearTimeout(restoreGiftSheetTimerRef.current);
    restoreGiftSheetTimerRef.current = setTimeout(() => {
      restoreGiftSheetTimerRef.current = null;
      maybeRestoreGiftSheet();
    }, 280);
  }, [maybeRestoreGiftSheet]);

  const hideGiftSheetForFx = useCallback(() => {
    if (!giftSheetOpenRef.current) return;
    giftSheetRestoreRef.current = true;
    setGiftSheetOpen(false);
  }, []);

  useEffect(() => {
    setRoomMeta(room);
  }, [room?.id, room]);

  const isGlobalRoom = roomMeta.id === "global-room" || !roomMeta.is_custom;
  const isRoomOwner = roomMeta.owner_id === userId;

  useEffect(() => {
    if (!userId) return;
    loadMutualFriends(userId).then(setShareContacts).catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!roomMeta?.id) return;
    loadRoomAdmins(roomMeta.id).then(setRoomAdmins).catch(() => {});
    loadTodayTopContributors(roomMeta.id).then(setTopContributors).catch(() => {});
    loadRoomSocialStats(roomMeta.id).then(setRoomStats).catch(() => {});
  }, [roomMeta?.id]);

  useEffect(() => {
    if (!userId || !room?.id || isGlobalRoom) return;
    joinSavedRoom(userId, room.id)
      .then(() => loadRoomSocialStats(room.id))
      .then(setRoomStats)
      .catch(() => {});
  }, [userId, room?.id, isGlobalRoom]);

  useEffect(() => {
    if (!userId) return;
    ensureStarterInventory(userId).then(setGiftInventory).catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!room?.id) return;
    const load = () => loadPendingInvitesForRoom(room.id).then(setPendingInvites).catch(() => {});
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [room?.id]);

  useEffect(() => {
    if (!userId || !room?.id) return;
    loadRoomSaveState(userId, room.id)
      .then(({ isSaved, isFollowing }) => {
        setRoomSaved(isSaved);
        setRoomFollowing(isFollowing);
      })
      .catch(() => {});
  }, [userId, room?.id]);

  const mySeats = userId ? seats.filter((s) => s.user_id === userId) : [];
  const mySeat = mySeats[0]?.seat_number ?? null;

  useEffect(() => {
    onMySeatChange?.(mySeat);
    if (room?.id && userId && mySeat) {
      saveStoredSeat(room.id, userId, mySeat);
    }
  }, [room?.id, userId, mySeat, onMySeatChange]);

  useEffect(() => {
    if (!userId || !mySeat) return undefined;
    const t = setInterval(() => tickWatchMinutes(userId, 1).catch(() => {}), 60_000);
    return () => clearInterval(t);
  }, [userId, mySeat]);

  useEffect(() => {
    if (!userId || !room?.id || switchingSeatRef.current || seatSwitching) return;
    if (!mySeat) {
      joinWaitingQueue(room.id, userId, displayName).catch(() => {});
    } else {
      leaveWaitingQueue(room.id, userId).catch(() => {});
    }
  }, [userId, room?.id, mySeat, displayName, seatSwitching]);

  useEffect(() => {
    if (!room?.id || !userId) {
      setSeatInvite(null);
      return undefined;
    }
    let active = true;
    const refresh = () => {
      loadPendingSeatInvite(room.id, userId).then((row) => {
        if (active) setSeatInvite(row);
      });
    };
    refresh();
    const t = setInterval(refresh, 1000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [room?.id, userId]);

  const isHost = isGlobalRoom && mySeat === HOST_SEAT;
  const isSeatAdmin = isGlobalRoom && mySeat === ADMIN_SEAT;
  const isDelegatedAdmin = roomAdmins.some((a) => a.id === userId);
  const isAdmin = isGlobalRoom ? isSeatAdmin : isRoomOwner || isDelegatedAdmin;
  const canModerate = isSuperAdmin || isHost || isAdmin;
  const canManageRoom = isRoomOwner || isDelegatedAdmin || isSuperAdmin;
  const canChangeMode = isRoomOwner || isHost || isDelegatedAdmin || isSuperAdmin;
  const seatMap = Object.fromEntries(seats.map((s) => [s.seat_number, s]));

  const inviteCandidates = useMemo(() => {
    const seatByUser = {};
    for (const s of seats) {
      if (s.user_id) seatByUser[s.user_id] = s.seat_number;
    }
    return onlineUsers
      .filter((u) => u.user_id && u.user_id !== userId)
      .map((u) => ({
        user_id: u.user_id,
        nickname: u.nickname || profileMap[u.user_id]?.display_name || "Guest",
        avatar_url: profileMap[u.user_id]?.avatar_url ?? u.avatar_url ?? null,
        current_seat: seatByUser[u.user_id] ?? null,
      }));
  }, [onlineUsers, seats, profileMap, userId]);

  const audienceCount = useMemo(() => {
    const seatedIds = new Set(seats.map((s) => s.user_id).filter(Boolean));
    return Math.max(0, onlineUsers.length - seatedIds.size);
  }, [onlineUsers.length, seats]);

  const unseatedAudience = useMemo(
    () => inviteCandidates.filter((u) => !u.current_seat),
    [inviteCandidates],
  );

  useEffect(() => {
    if (!mySeat) {
      onSeatMicAllowedChange?.(true);
      return;
    }
    const seat = seatMap[mySeat];
    onSeatMicAllowedChange?.(seat?.mic_on !== false);
  }, [mySeat, seats, seatMap, onSeatMicAllowedChange]);

  function canKickSeat(seatNumber) {
    if (!canModerate || !userId || seatNumber === mySeat) return false;
    return isSeatTaken(seatMap[seatNumber]);
  }

  const giftRecipients = seats.filter((s) => isSeatTaken(s));
  const seatedUsers = seats.filter((s) => isSeatTaken(s));
  const seatBonds = useMemo(() => activeSeatBonds(seats, userBonds), [seats, userBonds]);

  const refreshBonds = useCallback(async () => {
    const userIds = seats.map((s) => s.user_id).filter(Boolean);
    if (userIds.length < 2) {
      setUserBonds([]);
      return;
    }
    setUserBonds(await loadBondsAmongUsers(userIds));
  }, [seats]);
  const refreshBondsRef = useRef(refreshBonds);
  refreshBondsRef.current = refreshBonds;

  useEffect(() => {
    refreshBonds().catch(() => {});
  }, [refreshBonds]);

  useEffect(() => {
    if (!userId) return;
    loadPrimaryCoupleBond(userId).then(setMyCoupleBond).catch(() => {});
  }, [userId, guardRefreshToken]);

  const partnerId = myCoupleBond ? partnerUserId(myCoupleBond, userId) : null;
  const partnerSeat = partnerId ? seats.find((s) => s.user_id === partnerId) : null;
  const partnerInRoom = Boolean(partnerSeat);

  const partnerSeatNumbers = useMemo(() => {
    if (roomMeta.partner_seat_enabled === false || !partnerSeat) return new Set();
    const nums = new Set();
    for (const [a, b] of ADJACENT_SEAT_PAIRS) {
      if (a === partnerSeat.seat_number && !isSeatTaken(seatMap[b])) nums.add(b);
      if (b === partnerSeat.seat_number && !isSeatTaken(seatMap[a])) nums.add(a);
    }
    return nums;
  }, [roomMeta.partner_seat_enabled, partnerSeat, seatMap]);

  const headerGuard = myCoupleBond?.guardMine ?? 0;

  async function openIntimateSpaceForBond(bond) {
    if (!bond?.bondType || bond.status !== "active") {
      setToast("No active bond");
      return;
    }
    setBondCard(null);
    setIntimateSpaceBond(bond);
  }

  async function handleSeatBondTap(bond) {
    if (!bond) return;
    const enriched = await enrichBondWithProfiles(bond, profileMap);
    setBondCard(enriched);
  }

  async function openIntimateSpaceForUser(otherUserId) {
    const bond = await loadBondBetween(userId, otherUserId, userId);
    await openIntimateSpaceForBond(bond);
  }

  useEffect(() => {
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    return () => {
      clearTimeout(comboTimerRef.current);
      clearTimeout(giftDrainTimerRef.current);
    };
  }, []);

  function resetComboTimer() {
    clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => setCombo(null), 3500);
  }

  function showGiftBanner(banner) {
    if (!banner) return;
    setGiftBanner(banner);
    setTimeout(() => setGiftBanner((cur) => (cur?.id === banner.id ? null : cur)), 4500);
  }

  const [audienceInitialTab, setAudienceInitialTab] = useState("contribution");

  async function openAudienceSheet(initialTab = "contribution") {
    setAudienceInitialTab(initialTab);
    setOnlineListOpen(true);
    try {
      const [stats, contributors] = await Promise.all([
        loadRoomSocialStats(roomMeta.id),
        loadTodayTopContributors(roomMeta.id),
      ]);
      setRoomStats(stats);
      setTopContributors(contributors);
    } catch {
      /* sheet still opens */
    }
  }

  async function openRoomProfile() {
    try {
      const [stats, owner, admins] = await Promise.all([
        loadRoomSocialStats(roomMeta.id),
        loadRoomOwnerProfile(roomMeta.owner_id),
        loadRoomAdmins(roomMeta.id),
      ]);
      setRoomStats(stats);
      setRoomOwner(owner);
      setRoomAdmins(admins);
      setRoomProfileOpen(true);
    } catch {
      setRoomProfileOpen(true);
    }
  }

  async function handleSaveSettings(patch) {
    const prev = roomMeta;
    const updated = await updateRoomSettings(roomMeta.id, patch);
    setRoomMeta((p) => ({ ...p, ...updated }));
    const logs = [];
    if (patch.announcement !== undefined && patch.announcement !== (prev.announcement ?? null)) {
      logs.push(patch.announcement ? "Owner updated the announcement" : "Owner cleared the announcement");
    }
    if (patch.background_key && patch.background_key !== prev.background_key) {
      logs.push(`Owner changed background to ${String(patch.background_key).replace(/_/g, " ")}`);
    }
    if (patch.room_tag && patch.room_tag !== prev.room_tag) {
      logs.push(`Owner set room tag to ${roomTagLabel(patch.room_tag)}`);
    }
    if (patch.ban_chat !== undefined && patch.ban_chat !== Boolean(prev.ban_chat)) {
      logs.push(patch.ban_chat ? "Owner disabled text chat" : "Owner enabled text chat");
    }
    if (patch.ban_images !== undefined && patch.ban_images !== Boolean(prev.ban_images)) {
      logs.push(patch.ban_images ? "Owner disabled images" : "Owner enabled images");
    }
    if (patch.high_quality !== undefined && patch.high_quality !== (prev.high_quality !== false)) {
      logs.push(patch.high_quality ? "This room applies high quality mode" : "Owner turned high quality mode off");
    }
    if (patch.gift_sound !== undefined && patch.gift_sound !== (prev.gift_sound !== false)) {
      logs.push(patch.gift_sound ? "Owner turned gift sound on" : "Owner turned gift sound off");
    }
    for (const line of logs) {
      await postSystemMessage(room.id, line);
    }
    if (logs.length) await loadMessages(room.id);
    setToast("Settings saved");
  }

  async function handleToggleGiftSound() {
    if (!isRoomOwner) return;
    const enabled = roomMeta.gift_sound !== false;
    await handleSaveSettings({ gift_sound: !enabled });
    setToast(enabled ? "Gift sound off" : "Gift sound on");
  }
  const speakingSeatNumbers = useMemo(
    () => speakingIdsToSeatNumbers(seats, speakingUserIds),
    [seats, speakingUserIds],
  );

  useEffect(() => {
    if (!giftRecipients.length) {
      setGiftTarget(null);
      return;
    }
    if (!giftTarget || !giftRecipients.some((s) => s.user_id === giftTarget.user_id)) {
      setGiftTarget(giftRecipients[0]);
    }
  }, [giftRecipients, giftTarget]);

  useEffect(() => {
    profileMapRef.current = profileMap;
  }, [profileMap]);

  useEffect(() => {
    if (!isSuperAdmin || !userId) return;
    setProfileMap((prev) => {
      const cur = prev[userId];
      if (cur?.is_super_admin) return prev;
      return { ...prev, [userId]: { ...(cur ?? {}), is_super_admin: true } };
    });
  }, [isSuperAdmin, userId]);

  const mergeProfiles = useCallback(async (userIds) => {
    const profiles = await loadProfilesForUserIds(userIds);
    if (isSuperAdmin && userId && profiles[userId]) {
      profiles[userId] = { ...profiles[userId], is_super_admin: true };
    }
    if (Object.keys(profiles).length) {
      setProfileMap((prev) => ({ ...prev, ...profiles }));
    }
    return profiles;
  }, [isSuperAdmin, userId]);

  const loadSeats = useCallback(async (roomId) => {
    if (!supabase) return;
    const { data, error: seatError } = await supabase
      .from("seats")
      .select("*")
      .eq("room_id", roomId)
      .order("seat_number");
    if (seatError) throw seatError;

    const userIds = (data ?? []).map((s) => s.user_id).filter(Boolean);
    const profiles = await mergeProfiles(userIds);

    setSeats(
      (data ?? []).map((s) => ({
        ...s,
        avatar_url: s.user_id ? profiles[s.user_id]?.avatar_url ?? null : null,
        user_code: s.user_id ? profiles[s.user_id]?.user_code ?? null : null,
      })),
    );
  }, [mergeProfiles]);

  const loadMessages = useCallback(async (roomId) => {
    if (!supabase) return;
    let query = supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (joinedAtRef.current) {
      query = query.gte("created_at", joinedAtRef.current);
    }

    const { data, error: msgError } = await query.limit(200);
    if (msgError) throw msgError;
    const rows = data ?? [];
    await mergeProfiles(rows.map((m) => m.user_id).filter(Boolean));
    setMessages((prev) => mergeMessageRows(prev, rows));
  }, [mergeProfiles]);

  const loadPresence = useCallback(async (roomId) => {
    if (!supabase) return;
    const since = new Date(Date.now() - PRESENCE_TTL_MS).toISOString();
    const { data, error: presError } = await supabase
      .from("presence")
      .select("*")
      .eq("room_id", roomId)
      .gte("last_seen", since)
      .order("nickname");

    if (presError) {
      const { data: seated } = await supabase
        .from("seats")
        .select("user_id, nickname")
        .eq("room_id", roomId)
        .not("user_id", "is", null);
      setOnlineUsers(seated ?? []);
      return;
    }
    const rows = data ?? [];
    await mergeProfiles(rows.map((u) => u.user_id).filter(Boolean));
    setOnlineUsers(rows);
  }, [mergeProfiles]);

  const upsertPresence = useCallback(async (roomId, uid, name) => {
    if (!supabase) return;
    await supabase.from("presence").upsert({
      room_id: roomId,
      user_id: uid,
      nickname: name,
      last_seen: new Date().toISOString(),
    });
  }, []);

  const removePresence = useCallback(async (roomId, uid) => {
    if (!supabase) return;
    await supabase.from("presence").delete().eq("room_id", roomId).eq("user_id", uid);
  }, []);

  const releaseRoomSession = useCallback(async () => {
    if (sessionReleasedRef.current || !room?.id || !supabase || !userId) return;
    sessionReleasedRef.current = true;
    clearStoredSeat(room.id, userId);
    await Promise.all([
      clearStaleSeats(room.id, userId, displayName),
      removePresence(room.id, userId),
      leaveWaitingQueue(room.id, userId).catch(() => {}),
    ]);
    if (room.is_temp || roomMeta.is_temp) {
      await cleanupTempRoomIfEmpty(room.id).catch(() => {});
    }
  }, [room?.id, room?.is_temp, roomMeta.is_temp, userId, displayName, removePresence]);

  useEffect(() => {
    return () => {
      releaseRoomSession();
    };
  }, [releaseRoomSession]);

  useEffect(() => {
    if (!userId || !room?.id || isRoomOwner) return;
    checkRoomEntry(userId, room)
      .then(({ ok, reason }) => {
        if (!ok && reason) {
          setError(reason);
          releaseRoomSession().finally(() => onLeave());
        }
      })
      .catch(() => {});
  }, [room, userId, isRoomOwner, onLeave, releaseRoomSession]);

  useEffect(() => {
    if (!room?.id || !userId || !supabase || isRoomOwner) return undefined;

    const forceLeave = (message) => {
      releaseRoomSession().finally(() => {
        if (message) setToast(message);
        onLeave();
      });
    };

    const modChannel = supabase
      .channel(`room-mod-${room.id}-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_blacklist", filter: `room_id=eq.${room.id}` },
        (payload) => {
          if (payload.new?.user_id === userId) {
            forceLeave("You have been blocked from this room");
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_kicks", filter: `room_id=eq.${room.id}` },
        (payload) => {
          const row = payload.new;
          if (!row || row.user_id !== userId) return;
          const remaining = new Date(row.expires_at).getTime() - Date.now();
          if (remaining > 0) {
            forceLeave(`Kicked from room. Rejoin in ${formatKickCooldown(remaining)}.`);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(modChannel);
    };
  }, [room?.id, userId, isRoomOwner, onLeave, releaseRoomSession]);

  useEffect(() => {
    if (!room?.id || !userId) return undefined;
    lastActivityRef.current = Date.now();

    const markActive = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ["pointerdown", "keydown", "touchstart", "wheel"];
    events.forEach((eventName) => window.addEventListener(eventName, markActive, { passive: true }));

    const timer = setInterval(() => {
      if (Date.now() - lastActivityRef.current < ROOM_INACTIVE_KICK_MS) return;
      releaseRoomSession().finally(() => {
        setToast("Removed from room after 10 minutes inactive");
        onLeave();
      });
    }, 30_000);

    return () => {
      clearInterval(timer);
      events.forEach((eventName) => window.removeEventListener(eventName, markActive));
    };
  }, [room?.id, userId, releaseRoomSession, onLeave]);

  useEffect(() => {
    if (!room?.id || !userId || !displayName) return undefined;
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      upsertPresence(room.id, userId, displayName).finally(() => {
        loadPresence(room.id);
      });
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [room?.id, userId, displayName, upsertPresence, loadPresence]);

  useEffect(() => {
    if (!room?.id) return undefined;
    const runCleanup = () => {
      cleanupInactiveRoomUsers(room.id)
        .then(() => Promise.all([loadSeats(room.id), loadPresence(room.id)]))
        .catch(() => {});
    };
    const t = setInterval(runCleanup, 60_000);
    return () => clearInterval(t);
  }, [room?.id, loadSeats, loadPresence]);

  useEffect(() => {
    if (!room || !userId || !displayName) return;

    let active = true;

    (async () => {
      try {
        await ensureRoomSeats(room.id);
        try {
          await upsertPresence(room.id, userId, displayName);
        } catch {
          /* optional */
        }
        await restoreStoredSeat(room.id, userId, displayName);
        await Promise.all([
          loadSeats(room.id),
          loadMessages(room.id),
          loadPresence(room.id),
        ]);
      } catch (e) {
        if (active) setError(e.message ?? "Could not load room");
      }
    })();

    return () => {
      active = false;
    };
  }, [room, userId, displayName, loadSeats, loadMessages, loadPresence, upsertPresence]);

  useEffect(() => {
    if (!displayName || !room || !supabase || !userId) return;

    let active = true;
    let pollTimer = null;
    let presenceTimer = null;
    let seatsOk = false;
    let messagesOk = false;

    const syncRoomMeta = () => {
      loadRoomById(room.id)
        .then((row) => {
          if (!active || !row) return;
          setRoomMeta((prev) => ({ ...prev, ...row }));
          if (row.room_mode && row.room_mode !== "games") {
            setGamesSessionActive(false);
            setGamesWaitingActive(false);
          }
        })
        .catch(() => {});
    };

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        if (active) {
          loadSeats(room.id);
          loadMessages(room.id);
          loadPresence(room.id);
          syncRoomMeta();
          upsertPresence(room.id, userId, displayName);
        }
      }, POLL_MS);
    };

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const startPresencePolling = () => {
      if (presenceTimer) return;
      presenceTimer = setInterval(() => {
        if (!active) return;
        upsertPresence(room.id, userId, displayName).finally(() => {
          if (active) loadPresence(room.id);
        });
      }, 5000);
    };

    const stopPresencePolling = () => {
      if (presenceTimer) {
        clearInterval(presenceTimer);
        presenceTimer = null;
      }
    };

    const checkLive = () => {
      const realtimeOk = seatsOk && messagesOk;
      setLive(realtimeOk);
      if (realtimeOk) stopPolling();
      else startPolling();
    };

    const seatsChannel = supabase
      .channel(`seats-${room.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seats", filter: `room_id=eq.${room.id}` },
        () => loadSeats(room.id),
      )
      .subscribe((status) => {
        if (!active) return;
        seatsOk = status === "SUBSCRIBED";
        checkLive();
      });

    const messagesChannel = supabase
      .channel(`messages-${room.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${room.id}` },
        (payload) => {
          const row = payload.new;
          if (!row?.id) return;
          if (joinedAtRef.current && row.created_at && row.created_at < joinedAtRef.current) return;
          mergeProfiles([row.user_id].filter(Boolean)).finally(() => {
            setMessages((prev) => mergeMessageRows(prev, [row]));
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `room_id=eq.${room.id}` },
        () => loadMessages(room.id),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `room_id=eq.${room.id}` },
        () => loadMessages(room.id),
      )
      .subscribe((status) => {
        if (!active) return;
        messagesOk = status === "SUBSCRIBED";
        checkLive();
      });

    const bondsChannel = supabase
      .channel(`bonds-${room.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_relationships" },
        () => refreshBondsRef.current?.(),
      )
      .subscribe();

    const redPacketChannel = supabase
      .channel(`red-packets-${room.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "red_packets", filter: `room_id=eq.${room.id}` },
        (payload) => {
          const packet = payload.new;
          if (!packet?.id) return;
          mergeProfiles([packet.sender_id]).finally(() => {
            const senderName = profileMapRef.current[packet.sender_id]?.display_name ?? "Someone";
            openRedPacketRain(packet.id, packet.total_coins, senderName, packet.sender_id);
          });
        },
      )
      .subscribe();

    const presenceChannel = supabase
      .channel(`presence-${room.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "presence", filter: `room_id=eq.${room.id}` },
        () => loadPresence(room.id),
      )
      .subscribe();

    const inviteChannel = supabase
      .channel(`seat-invites-${room.id}-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seat_invites", filter: `room_id=eq.${room.id}` },
        () => {
          if (!active) return;
          loadPendingInvitesForRoom(room.id).then(setPendingInvites).catch(() => {});
          if (!mySeat) {
            loadPendingSeatInvite(room.id, userId).then((row) => {
              if (active) setSeatInvite(row);
            });
          }
        },
      )
      .subscribe();

    const roomMetaChannel = supabase
      .channel(`room-meta-${room.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` },
        (payload) => {
          const row = payload.new;
          if (!active || !row?.id) return;
          setRoomMeta((prev) => ({ ...prev, ...row }));
          if (row.room_mode && row.room_mode !== "games") {
            setGamesSessionActive(false);
            setGamesWaitingActive(false);
          }
        },
      )
      .subscribe();

    syncRoomMeta();

    startPolling();
    startPresencePolling();
    const syncLabel = setTimeout(() => {
      if (active) setLive(true);
    }, 4000);

    const heartbeat = setInterval(() => {
      upsertPresence(room.id, userId, displayName).finally(() => {
        if (active) loadPresence(room.id);
      });
    }, 20_000);

    return () => {
      active = false;
      stopPolling();
      stopPresencePolling();
      clearTimeout(syncLabel);
      clearInterval(heartbeat);
      setLive(false);
      supabase.removeChannel(seatsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(bondsChannel);
      supabase.removeChannel(redPacketChannel);
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(inviteChannel);
      supabase.removeChannel(roomMetaChannel);
    };
  }, [displayName, room, userId, mySeat, loadSeats, loadMessages, loadPresence, upsertPresence, mergeProfiles]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    if (!chatPinnedToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleChatScroll = useCallback((event) => {
    const el = event.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    chatPinnedToBottomRef.current = distanceFromBottom < 48;
  }, []);

  const playGiftEffect = useCallback(
    ({
      emoji,
      seatNumber,
      fromSeatNumber = null,
      senderAvatar = null,
      recipientAvatar = null,
      senderName = null,
      recipientName = null,
      reward = 0,
      fx = "fly",
      lottie = null,
      usePfp = true,
    }) => {
      if (!seatNumber) return;
      requestAnimationFrame(() => {
        const effect = buildGiftEffect({
          emoji,
          seatNumber,
          fromSeatNumber,
          senderAvatar,
          recipientAvatar,
          senderName,
          recipientName,
          reward,
          fx,
          lottie,
          usePfp: lottie ? false : usePfp,
        });
        if (!effect) return;
        setGiftEffects((prev) => [...prev.filter((e) => e.id !== effect.id), effect].slice(-3));
        playPfpGiftSound(roomMeta.gift_sound !== false);
        const emoteMs = effect.fx === "rose-lottie" ? 1200 : 900;
        setSeatEmoteAnim((prev) => ({
          ...prev,
          [seatNumber]: { anim: "gift", until: Date.now() + emoteMs },
        }));
        setTimeout(() => {
          setSeatEmoteAnim((prev) => {
            const next = { ...prev };
            if (next[seatNumber]?.anim === "gift") delete next[seatNumber];
            return next;
          });
        }, emoteMs);
        if (effect.fx === "rose-lottie") return;
        setTimeout(() => {
          const hit = buildGiftHit({ emoji, seatNumber, reward, fx: effect.fx });
          if (hit) setGiftHits((prev) => [...prev.slice(-6), hit]);
        }, effect.duration - 120);
      });
    },
    [roomMeta.gift_sound],
  );

  const startNextPremiumGift = useCallback(() => {
    if (premiumGiftPlayingRef.current) return;
    const job = premiumGiftQueueRef.current.shift();
    if (!job) return;

    premiumGiftPlayingRef.current = true;
    premiumGiftSeqRef.current += 1;
    const gift = job.giftId ? findGift(job.giftId) : findGiftByName(job.giftName);
    const premiumType = premiumFxTypeForGift(gift);
    const reward = Math.max(0, Math.floor(Number(job.reward) || 0));
    const duration = premiumFxDuration(premiumType, reward);
    const payload = {
      id: `premium-${premiumGiftSeqRef.current}-${Date.now()}`,
      emoji: job.emoji,
      giftName: job.giftName,
      premiumType,
      reward,
      quantity: Math.max(1, Math.floor(Number(job.quantity) || 1)),
      senderName: job.senderName || "Someone",
      recipientName: job.recipientName || "Someone",
      duration,
    };

    // Unmount then remount on the next frame so CSS animations always restart.
    setPremiumGiftFx(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPremiumGiftFx(payload);
        playPremiumGiftSound(premiumType, roomMeta.gift_sound !== false);
      });
    });
  }, [roomMeta.gift_sound]);

  const handlePremiumGiftDone = useCallback(
    (id) => {
      setPremiumGiftFx((cur) => (cur?.id === id ? null : cur));
      premiumGiftPlayingRef.current = false;
      requestAnimationFrame(() => {
        startNextPremiumGift();
        scheduleRestoreGiftSheet();
      });
    },
    [startNextPremiumGift, scheduleRestoreGiftSheet],
  );

  function playPremiumGiftEffect(job) {
    premiumGiftQueueRef.current.push(job);
    startNextPremiumGift();
  }

  const playSeatEmote = useCallback((seatNumber, emote) => {
    if (!seatNumber || !emote) return;
    const seatEl =
      document.querySelector(`[data-seat-number="${seatNumber}"] .seat-avatar`) ||
      document.querySelector(`[data-seat-number="${seatNumber}"] .games-seat-avatar`);
    const stageEl =
      document.querySelector(".seats-stage") ||
      document.querySelector(".games-seat-strip");
    if (!seatEl || !stageEl) return;
    const seatRect = seatEl.getBoundingClientRect();
    const stageRect = stageEl.getBoundingClientRect();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const duration = emote.duration ?? 2400;

    setSeatEmoteAnim((prev) => ({
      ...prev,
      [seatNumber]: { anim: emote.anim, until: Date.now() + duration },
    }));
    setSeatReactions((prev) => [
      ...prev,
      {
        id,
        key: emote.key,
        emoji: emote.emoji,
        tgs: emote.tgs,
        anim: emote.anim,
        particles: emote.particles ?? (emote.emoji ? [emote.emoji] : []),
        x: seatRect.left + seatRect.width / 2 - stageRect.left,
        y: seatRect.top + seatRect.height / 2 - stageRect.top,
      },
    ]);

    setTimeout(() => {
      setSeatReactions((prev) => prev.filter((r) => r.id !== id));
      setSeatEmoteAnim((prev) => {
        const cur = prev[seatNumber];
        if (!cur || cur.anim !== emote.anim) return prev;
        const next = { ...prev };
        delete next[seatNumber];
        return next;
      });
    }, duration);
  }, []);

  useEffect(() => {
    for (const msg of messages) {
      if (!msg.id || seenGiftMsgRef.current.has(msg.id)) continue;
      const parsed = parseGiftMessage(msg.message);
      if (!parsed) continue;
      seenGiftMsgRef.current.add(msg.id);
      const seat = findSeatForRecipient(seats, parsed.recipientName);
      const quantity = giftQuantityFromName(parsed.giftName);
      const giftNameClean = parsed.giftName.replace(/\s+x\d+$/i, "");
      const giftRow = findGiftByName(parsed.giftName);
      if (premiumValueForName(parsed.giftName, parsed.reward) >= 500) {
        if (msg.user_id !== userId) {
          playPremiumGiftEffect({
            emoji: parsed.emoji,
            giftId: giftRow?.id ?? null,
            giftName: giftNameClean,
            reward: parsed.reward,
            quantity,
            senderName: parsed.senderName || msg.nickname,
            recipientName: parsed.recipientName,
          });
        }
      } else if (seat && msg.user_id !== userId) {
        const senderSeat = seats.find((s) => s.user_id === msg.user_id);
        const senderProf = profileMap[msg.user_id];
        const recipientProf = profileMap[seat.user_id];
        playGiftEffect({
          emoji: parsed.emoji,
          seatNumber: seat.seat_number,
          fromSeatNumber: senderSeat?.seat_number ?? null,
          senderAvatar: senderSeat?.avatar_url || senderProf?.avatar_url || null,
          recipientAvatar: seat.avatar_url || recipientProf?.avatar_url || null,
          senderName: parsed.senderName || msg.nickname,
          recipientName: parsed.recipientName,
          reward: parsed.reward,
          fx: giftRow?.fx,
          lottie: giftRow?.lottie ?? null,
          usePfp: !giftRow?.lottie,
        });
      }
    }
  }, [messages, seats, playGiftEffect, userId]);

  useEffect(() => {
    for (const msg of messages) {
      if (!msg.id || seenReactionMsgRef.current.has(msg.id)) continue;
      const sticker = parseStickerMessage(msg.message);
      let reaction = reactionFromMessage(msg.message);
      if (!reaction && sticker) {
        reaction = { key: "sticker", emoji: sticker, anim: "wow", particles: [sticker], duration: 2200 };
      }
      if (!reaction) continue;
      seenReactionMsgRef.current.add(msg.id);
      if (msg.user_id === userId) continue;
      const seat = seats.find((s) => s.user_id === msg.user_id);
      if (seat) playSeatEmote(seat.seat_number, reaction);
    }
  }, [messages, seats, playSeatEmote, userId]);

  useEffect(() => {
    for (const msg of messages) {
      if (!msg.id || seenRainMsgRef.current.has(msg.id)) continue;
      const parsed = parseRedPacketMessage(msg.message);
      if (!parsed) continue;
      if (msg.created_at && msg.created_at < joinedAtRef.current) {
        seenRainMsgRef.current.add(msg.id);
        continue;
      }
      seenRainMsgRef.current.add(msg.id);
      openRedPacketRain(parsed.packetId, parsed.totalCoins, msg.nickname ?? "Someone", msg.user_id);
    }
  }, [messages]);

  useEffect(() => {
    if (!room || !supabase || !seats.length) return;

    const clearSeat = (seatNumber) => {
      supabase
        .from("seats")
        .update({ user_id: null, nickname: null })
        .eq("room_id", room.id)
        .eq("seat_number", seatNumber);
    };

    const byNickname = new Map();
    for (const seat of seats) {
      if (!seat.nickname?.trim()) continue;
      const key = seat.nickname.trim().toLowerCase();
      if (!byNickname.has(key)) byNickname.set(key, []);
      byNickname.get(key).push(seat);
    }

    for (const [, group] of byNickname) {
      if (group.length <= 1) continue;
      const mine = group.find((s) => s.user_id === userId);
      const keeper = mine ?? group.sort((a, b) => a.seat_number - b.seat_number)[0];
      group.filter((s) => s.seat_number !== keeper.seat_number).forEach((s) => clearSeat(s.seat_number));
    }

    if (mySeats.length > 1) {
      const [, ...extras] = mySeats.sort((a, b) => a.seat_number - b.seat_number);
      extras.forEach((s) => clearSeat(s.seat_number));
    }
  }, [room, seats, mySeats, userId]);

  async function kickFromSeat(seatNumber) {
    if (!room || !supabase || seatBusy || !canKickSeat(seatNumber)) return;
    setSeatBusy(true);
    setError(null);
    try {
      const { error: kickError } = await supabase
        .from("seats")
        .update({ user_id: null, nickname: null })
        .eq("room_id", room.id)
        .eq("seat_number", seatNumber);
      if (kickError) setError(kickError.message);
    } finally {
      setSeatBusy(false);
      await loadSeats(room.id);
    }
  }

  async function kickUserFromRoomFully(targetUserId, targetName = "User", addToBlacklist = false) {
    if (!room || !targetUserId || !canModerate || targetUserId === userId) return;
    setSeatBusy(true);
    setError(null);
    try {
      if (addToBlacklist) {
        await blacklistUser(room.id, targetUserId);
      }
      await kickUserFromRoom(room.id, targetUserId, userId);
      await leaveWaitingQueue(room.id, targetUserId).catch(() => {});
      await loadSeats(room.id);
      await loadPresence(room.id);
      setToast(
        addToBlacklist
          ? `${targetName} kicked and blacklisted`
          : `${targetName} kicked — can rejoin in 5 min`,
      );
    } catch (e) {
      setError(e.message ?? "Could not kick user");
    } finally {
      setSeatBusy(false);
    }
  }

  async function assignUserToSeat(seatNumber, targetUser) {
    if (!room || !supabase || seatBusy || !canKickSeat(seatNumber) || !targetUser?.user_id) return;
    setSeatBusy(true);
    setError(null);
    const name = targetUser.display_name || targetUser.nickname || "Guest";
    const seat = seatMap[seatNumber];
    const occupied = isSeatTaken(seat);
    try {
      if (occupied) {
        const { error: assignError } = await supabase
          .from("seats")
          .update({ user_id: targetUser.user_id, nickname: name })
          .eq("room_id", room.id)
          .eq("seat_number", seatNumber);
        if (assignError) setError(assignError.message);
        else setToast(`${name} seated`);
        await loadSeats(room.id);
      } else {
        await sendSeatInvite({
          roomId: room.id,
          seatNumber,
          inviteeId: targetUser.user_id,
          inviterId: userId,
          inviterName: displayName,
        });
        setPendingInvites(await loadPendingInvitesForRoom(room.id));
        setToast(`Invite sent to ${name}`);
      }
    } catch (e) {
      setError(e.message ?? "Could not seat user");
    } finally {
      setSeatBusy(false);
    }
  }

  async function claimSeat(seatNumber) {
    if (!room || !supabase || seatBusy) return;
    setSeatBusy(true);
    setError(null);

    try {
      if (mySeat === seatNumber) return;

      await ensureRoomSeats(room.id);

      const target = seatMap[seatNumber];
      if (target?.is_locked) {
        setError("This seat is locked");
        return;
      }
      if (isSeatTaken(target) && target.user_id !== userId) {
        setError("Seat is already taken");
        return;
      }

      await clearStaleSeats(room.id, userId, displayName);

      const { data, error: updateError } = await supabase
        .from("seats")
        .update({ user_id: userId, nickname: displayName })
        .eq("room_id", room.id)
        .eq("seat_number", seatNumber)
        .is("user_id", null)
        .select("seat_number");

      if (updateError) {
        setError(updateError.message);
        return;
      }
      if (!data?.length) {
        setError("Seat was just taken by someone else");
        return;
      }

      saveStoredSeat(room.id, userId, seatNumber);
    } finally {
      setSeatBusy(false);
      await loadSeats(room.id);
    }
  }

  async function leaveSeat() {
    if (!room || !supabase) return;
    setError(null);

    const { error: updateError } = await supabase
      .from("seats")
      .update({ user_id: null, nickname: null })
      .eq("room_id", room.id)
      .eq("user_id", userId);

    if (updateError) setError(updateError.message);
    else {
      clearStoredSeat(room.id, userId);
      await loadSeats(room.id);
    }
  }

  function enrichSeatForProfile(seat) {
    if (!seat) return null;
    const prof = seat.user_id ? profileMap[seat.user_id] : null;
    return {
      ...seat,
      avatar_url:
        seat.user_id === userId
          ? avatarUrl || seat.avatar_url || prof?.avatar_url || null
          : seat.avatar_url || prof?.avatar_url || null,
      user_code: seat.user_code || prof?.user_code || null,
    };
  }

  function vipNameClass(profile) {
    return effectiveVipLevel(profile) > 0 ? "vip-name-glow" : "";
  }

  function handleSeatClick(seatNumber) {
    const occupant = seatMap[seatNumber];
    if (inviteSeatUser && canModerate) {
      if (isSeatTaken(occupant)) {
        setToast("Choose an empty seat");
        return;
      }
      if (occupant?.is_locked) {
        setToast("Choose an open seat");
        return;
      }
      sendInviteToSeat(inviteSeatUser, seatNumber);
      return;
    }
    if (isSeatTaken(occupant)) {
      setUserProfileSeat(enrichSeatForProfile(occupant));
      return;
    }
    if (mySeat || canModerate) {
      setSeatSheet({ type: "empty", seatNumber });
      return;
    }
    if (occupant?.is_locked) {
      setError("This seat is locked");
      return;
    }
    claimSeat(seatNumber);
  }

  async function toggleSeatLock(seatNumber) {
    if (!room || !supabase || seatBusy) return;
    if (!canModerate) {
      setError("Only host or admin can lock seats");
      return;
    }
    const seat = seatMap[seatNumber];
    if (!seat) return;
    setSeatBusy(true);
    setSeatSheet(null);
    try {
      const next = !seat.is_locked;
      const { error: updError } = await supabase
        .from("seats")
        .update({ is_locked: next })
        .eq("room_id", room.id)
        .eq("seat_number", seatNumber);
      if (updError) setError(updError.message);
      else setToast(next ? "Seat locked" : "Seat unlocked");
    } finally {
      setSeatBusy(false);
      await loadSeats(room.id);
    }
  }

  async function toggleSeatMute(seatNumber) {
    if (!room || !supabase || seatBusy) return;
    if (!canModerate) {
      setError("Only host or admin can mute seats");
      return;
    }
    const seat = seatMap[seatNumber];
    if (!seat) return;
    setSeatBusy(true);
    setSeatSheet(null);
    try {
      const next = seat.mic_on === false;
      const { error: updError } = await supabase
        .from("seats")
        .update({ mic_on: next })
        .eq("room_id", room.id)
        .eq("seat_number", seatNumber);
      if (updError) setError(updError.message);
      else setToast(next ? "Seat unmuted" : "Seat muted");
    } finally {
      setSeatBusy(false);
      await loadSeats(room.id);
    }
  }

  async function moveToSeat(seatNumber) {
    setSeatSheet(null);
    if (!room || !supabase || seatBusy || !mySeat || mySeat === seatNumber) return;
    if (seatMap[seatNumber]?.is_locked) {
      setError("This seat is locked");
      return;
    }
    if (isSeatTaken(seatMap[seatNumber]) && seatMap[seatNumber]?.user_id !== userId) {
      setError("Seat is already taken");
      return;
    }

    switchingSeatRef.current = true;
    setSeatSwitching(true);
    setSeatBusy(true);
    setError(null);

    setSeats((prev) =>
      prev.map((s) => {
        if (s.seat_number === seatNumber) {
          return {
            ...s,
            user_id: userId,
            nickname: displayName,
            avatar_url: avatarUrl || s.avatar_url || profileMap[userId]?.avatar_url || null,
          };
        }
        if (s.user_id === userId) {
          return { ...s, user_id: null, nickname: null, avatar_url: null };
        }
        return s;
      }),
    );

    try {
      await ensureRoomSeats(room.id);
      await clearStaleSeatsExcept(room.id, userId, displayName, seatNumber);
      const { data, error: updateError } = await supabase
        .from("seats")
        .update({ user_id: userId, nickname: displayName })
        .eq("room_id", room.id)
        .eq("seat_number", seatNumber)
        .is("user_id", null)
        .select("seat_number");

      if (updateError) {
        setError(updateError.message);
        await loadSeats(room.id);
        return;
      }
      if (!data?.length) {
        setError("Seat was just taken by someone else");
        await loadSeats(room.id);
        return;
      }

      saveStoredSeat(room.id, userId, seatNumber);
    } finally {
      switchingSeatRef.current = false;
      setSeatSwitching(false);
      setSeatBusy(false);
      loadSeats(room.id).catch(() => {});
    }
  }

  async function handleLeaveSeatFromSheet() {
    setSeatSheet(null);
    await leaveSeat();
  }

  async function handleInvite() {
    setMenuOpen(false);
    setShareOpen(true);
  }

  async function shareToContact(contact) {
    setShareOpen(false);
    setPersonalChatFriend(contact);
    setToast(`Share room ID ${room.room_code ?? room.id} with ${contact.display_name}`);
  }

  async function openRedPacketRain(packetId, totalCoins, senderName, senderId) {
    if (!packetId || seenRainRef.current.has(packetId)) return;
    try {
      let drops = await loadRedPacketDrops(packetId);
      if (!drops.length) {
        await new Promise((r) => setTimeout(r, 400));
        drops = await loadRedPacketDrops(packetId);
      }
      if (!drops.length) {
        await new Promise((r) => setTimeout(r, 800));
        drops = await loadRedPacketDrops(packetId);
      }
      if (!drops.length || !drops.some((d) => !d.claimed_by)) return;
      seenRainRef.current.add(packetId);
      setRedPacketRain({ packetId, totalCoins, senderName, senderId, drops });
    } catch {
      /* retry on next message/realtime event */
    }
  }

  async function handleGrabRainDrop(packetId, dropIndex) {
    await claimRedPacketDrop(packetId, dropIndex, userId);
    return 1;
  }

  async function handleRainDone() {
    const active = redPacketRain;
    setRedPacketRain(null);
    if (!active?.packetId || !room) return;
    try {
      const result = await settleRedPacketRain(active.packetId);
      const balance = await fetchWalletCoins(userId);
      onCoinsChange(balance);
      const leaders = result.leaders ?? [];
      if (leaders.length && active.senderId === userId) {
        const line = formatRedPacketResultsMessage(leaders);
        if (line) await postSystemMessage(room.id, line);
      }
      await loadMessages(room.id);
    } catch {
      /* ok */
    }
  }

  async function handleClaimRedPacket(packetId) {
    try {
      const drops = await loadRedPacketDrops(packetId);
      if (drops.length) {
        const msg = messages.find((m) => parseRedPacketMessage(m.message)?.packetId === packetId);
        const parsed = msg ? parseRedPacketMessage(msg.message) : null;
        await openRedPacketRain(
          packetId,
          parsed?.totalCoins ?? 0,
          msg?.nickname ?? "Someone",
          msg?.user_id,
        );
        return;
      }
      const coins = await claimRedPacket(packetId, userId);
      onCoinsChange((c) => c + coins);
      setToast(`Red packet +${formatCompactNumber(coins)} gold`);
      await loadMessages(room.id);
    } catch (e) {
      setError(e.message ?? "Could not claim");
    }
  }

  function avatarForUser(uid) {
    if (!uid) return null;
    if (uid === userId && avatarUrl) return avatarUrl;
    return profileMap[uid]?.avatar_url ?? null;
  }

  function seatAvatarUrl(seat, isMine) {
    if (!seat?.user_id) return null;
    if (isMine && avatarUrl) return avatarUrl;
    return seat.avatar_url || profileMap[seat.user_id]?.avatar_url || null;
  }

  function renderSeatFace(seat, isMine, isEmpty) {
    if (isEmpty) return <span className="seat-plus">+</span>;
    const url = seatAvatarUrl(seat, isMine);
    if (url) {
      return (
        <AvatarImg
          src={url}
          fallback={seatInitial(seat)}
          className="seat-face-letter"
          imgClassName="seat-face-img"
        />
      );
    }
    return <span className="seat-face-letter">{seatInitial(seat)}</span>;
  }

  async function executeGift(gift, target, opts = {}) {
    if (!target || !room || !supabase || giftBusy) return;
    const quantity = Math.max(1, Math.floor(Number(opts.quantity) || 1));
    const anonymous = Boolean(opts.anonymous);
    const fromInventory = Boolean(opts.fromInventory);
    const unitCost = giftSendUnitCost(gift, fromInventory);
    const totalCost = unitCost * quantity;
    const rewardUnit = giftRewardUnitCost(gift, fromInventory);
    const paysRewards = giftPaysRewards(gift, fromInventory);

    if (gift.inventory && !fromInventory) {
      setError("Package gifts must be sent from the Package tab");
      return;
    }

    const senderLabel = anonymous ? "Anonymous" : displayName;

    setGiftBusy(true);
    try {
      if (fromInventory) {
        await consumeInventoryGift(userId, gift.id, quantity);
        loadGiftInventory(userId).then(setGiftInventory).catch(() => {});
      } else if (!isSuperAdmin) {
        if (coins < totalCost) {
          setError(`Not enough coins (need ${formatCoins(totalCost)})`);
          return;
        }
        const newBalance = await deductWalletCoins(userId, totalCost);
        onCoinsChange(newBalance);
      }

      let totalReward = 0;
      let luckyReward = false;
      let luckyMultiplier = 1;
      const svgaUrl = giftSvgaUrl(gift.id);
      if (paysRewards) {
        const rewardResult = rollGiftRewardResult(rewardUnit, quantity);
        totalReward = rewardResult.total;
        luckyReward = Boolean(rewardResult.lucky);
        luckyMultiplier = rewardResult.multiplier ?? 1;
      }

      const moreInGiftQueue = giftQueueRef.current.length > 0;
      const premiumValue = Math.max(unitCost * quantity, totalReward);
      const showPremium = isPremiumGift(gift, quantity) || premiumValue >= 500;

      if (showPremium) {
        playPremiumGiftEffect({
          emoji: gift.emoji,
          giftId: gift.id,
          giftName: gift.name,
          reward: totalReward,
          quantity,
          senderName: senderLabel,
          recipientName: target.nickname,
        });
      } else if (!moreInGiftQueue) {
        const senderSeat = seats.find((s) => s.user_id === userId);
        playGiftEffect({
          emoji: gift.emoji,
          seatNumber: target.seat_number,
          fromSeatNumber: senderSeat?.seat_number ?? null,
          senderAvatar: senderSeat?.avatar_url || avatarUrl || profileMap[userId]?.avatar_url || null,
          recipientAvatar: target.avatar_url || profileMap[target.user_id]?.avatar_url || null,
          senderName: senderLabel,
          recipientName: target.nickname,
          reward: totalReward,
          fx: gift.fx,
          lottie: gift.lottie ?? null,
          usePfp: !gift.lottie,
        });
        if (svgaUrl) setSvgaGift({ url: svgaUrl, id: `${Date.now()}` });
        playGiftSound(roomMeta.gift_sound !== false);
      } else {
        setSeatEmoteAnim((prev) => ({
          ...prev,
          [target.seat_number]: { anim: "gift", until: Date.now() + 700 },
        }));
      }

      const charmAmount = fromInventory
        ? Math.max(1, Number(gift.charm ?? 1) * quantity)
        : charmForGift(gift, quantity);
      const value = fromInventory
        ? Math.max(Number(gift.charm ?? 1) * 5, 1) * quantity
        : Math.max(unitCost, 1) * quantity;
      const text = formatGiftMessage({
        senderName: senderLabel,
        emoji: gift.emoji,
        giftName: gift.name,
        recipientName: target.nickname,
        reward: totalReward,
        quantity,
        charm: target.user_id !== userId ? charmAmount : 0,
        lucky: luckyReward,
        luckyMultiplier,
      });
      setCombo((prev) =>
        prev?.gift?.id === gift.id &&
        prev?.target?.user_id === target.user_id &&
        prev?.fromInventory === fromInventory
          ? { gift, target, count: prev.count + quantity, quantity, fromInventory }
          : { gift, target, count: quantity, quantity, fromInventory },
      );
      resetComboTimer();

      const rewardPromise =
        paysRewards && totalReward > 0
          ? creditGiftReward(target.user_id, totalReward)
          : Promise.resolve(0);
      const charmPromise = applyGiftCharm({
        recipientId: target.user_id,
        senderId: userId,
        charm: charmAmount,
        senderGetsCharm: !fromInventory,
      });
      const messagePromise = supabase
        .from("messages")
        .insert({
          room_id: room.id,
          user_id: userId,
          nickname: senderLabel,
          message: text,
        })
        .select()
        .single();

      const [, charmResult, { data: msgData, error: msgError }] = await Promise.all([
        rewardPromise,
        charmPromise,
        messagePromise,
      ]);

      if (msgError) throw msgError;
      if (msgData?.id) {
        seenGiftMsgRef.current.add(msgData.id);
        setMessages((prev) => mergeMessageRows(prev, [msgData]));
      }

      if (charmResult?.recipientCharm != null || charmResult?.senderCharm != null) {
        setProfileMap((prev) => {
          const next = { ...prev };
          if (charmResult.recipientCharm != null && target.user_id) {
            next[target.user_id] = { ...(next[target.user_id] ?? {}), charm: charmResult.recipientCharm };
          }
          if (charmResult.senderCharm != null) {
            next[userId] = { ...(next[userId] ?? {}), charm: charmResult.senderCharm };
          }
          return next;
        });
        if (charmResult.senderCharm != null) {
          onProfileUpdate?.((prev) => (prev ? { ...prev, charm: charmResult.senderCharm } : prev));
        }
      } else if (charmAmount > 0) {
        console.warn("Gift charm was not applied — run supabase/RUN-THIS.sql");
      }
      if (target.user_id !== userId && charmAmount > 0) {
        refreshBonds().catch(() => {});
        setGuardRefreshToken((n) => n + 1);
        if (charmResult?.guardApplied && charmResult.guardMine > 0) {
          setToast(`Guard +${formatCompactNumber(charmResult.guardMine)} 🛡️`);
        }
      }

      logGiftTransaction({
        senderId: userId,
        recipientId: target.user_id,
        roomId: room.id,
        gift,
        quantity,
        cost: totalCost,
        charm: charmAmount,
      }).catch(() => {});
      addUserExp(userId, value).catch(() => {});
      if (!fromInventory && value > 0) {
        addVipActivity(userId, value)
          .then((stats) => {
            if (!stats) return;
            onProfileUpdate?.((prev) => (prev ? { ...prev, ...stats } : prev));
            setProfileMap((prev) => ({
              ...prev,
              [userId]: { ...(prev[userId] ?? {}), ...stats },
            }));
          })
          .catch(() => {});
      }
      addRoomExp(room.id, value)
        .then((stats) => {
          if (stats) setRoomMeta((prev) => ({ ...prev, ...stats }));
        })
        .catch(() => {});
      addContribution(room.id, userId, value)
        .then(() => loadTodayTopContributors(room.id).then(setTopContributors))
        .catch(() => {});
      markDailyTask(userId, "sent_gift").catch(() => {});
      mergeProfiles([userId, target.user_id]).catch(() => {});

    } catch (e) {
      setError(e.message ?? "Gift failed");
      if (!fromInventory && !isSuperAdmin) {
        fetchWalletCoins(userId)
          .then((c) => c != null && onCoinsChange(c))
          .catch(() => {});
      }
    } finally {
      setGiftBusy(false);
    }
  }

  function normalizeGiftQuantity(opts = {}) {
    return Math.max(1, Math.floor(Number(opts.quantity) || 1));
  }

  function giftJobKey(gift, target, opts = {}) {
    return [
      gift?.id ?? "",
      target?.user_id ?? "",
      opts.fromInventory ? "inventory" : "coins",
      opts.anonymous ? "anonymous" : "named",
    ].join(":");
  }

  function queuedGiftQuantity() {
    return giftQueueRef.current.reduce((total, job) => total + normalizeGiftQuantity(job.opts), 0);
  }

  async function drainGiftQueue() {
    if (giftDrainingRef.current) return;
    clearTimeout(giftDrainTimerRef.current);
    giftDrainingRef.current = true;
    if (giftQueueRef.current.length > 1) {
      setGiftEffects([]);
      setGiftHits([]);
      setSvgaGift(null);
    }
    while (giftQueueRef.current.length) {
      const job = giftQueueRef.current.shift();
      setGiftQueueLen(queuedGiftQuantity());
      await executeGift(job.gift, job.target, job.opts);
    }
    giftDrainingRef.current = false;
    setGiftQueueLen(0);
    scheduleRestoreGiftSheet();
  }

  function scheduleGiftDrain() {
    if (giftDrainingRef.current || giftDrainTimerRef.current) return;
    giftDrainTimerRef.current = setTimeout(() => {
      giftDrainTimerRef.current = null;
      drainGiftQueue();
    }, 120);
  }

  function enqueueGift(gift, target = giftTarget, opts = {}) {
    if (!target || !room) return;
    hideGiftSheetForFx();
    const normalizedOpts = { ...opts, quantity: normalizeGiftQuantity(opts) };
    const key = giftJobKey(gift, target, normalizedOpts);
    const pending = giftQueueRef.current.find((job) => giftJobKey(job.gift, job.target, job.opts) === key);

    if (pending) {
      pending.opts = {
        ...pending.opts,
        ...normalizedOpts,
        quantity: normalizeGiftQuantity(pending.opts) + normalizedOpts.quantity,
      };
    } else {
      giftQueueRef.current.push({ gift, target, opts: normalizedOpts });
    }

    setGiftQueueLen(queuedGiftQuantity());
    scheduleGiftDrain();
  }

  function sendGift(gift, target = giftTarget, opts = {}) {
    enqueueGift(gift, target, opts);
  }

  async function handleRedPacket({ totalCoins }) {
    if (!room || !supabase || giftBusy) return;
    const total = Math.floor(Number(totalCoins) || 0);
    if (total < 10) {
      setError("Minimum 10 coins");
      return;
    }
    if (!isSuperAdmin && coins < total) {
      setError("Not enough coins");
      return;
    }
    setGiftBusy(true);
    let deducted = false;
    try {
      if (!isSuperAdmin) {
        const newBalance = await deductWalletCoins(userId, total);
        onCoinsChange(newBalance);
        deducted = true;
      }
      const { packet, envelopeCount } = await createRedPacketRain({
        roomId: room.id,
        senderId: userId,
        totalCoins: total,
      });
      const { error: msgErr } = await supabase
        .from("messages")
        .insert({
          room_id: room.id,
          user_id: userId,
          nickname: displayName,
          message: formatRedPacketMessage(packet.id, total, envelopeCount),
        });
      if (msgErr) throw new Error(msgErr.message || "Could not post red packet message");
      const rainDrops = await loadRedPacketDrops(packet.id);
      seenRainRef.current.add(packet.id);
      setRedPacketRain({
        packetId: packet.id,
        totalCoins: total,
        senderName: displayName,
        senderId: userId,
        drops: rainDrops,
      });
      setToast("Red packet sent!");
      await loadMessages(room.id);
    } catch (e) {
      if (deducted) {
        try {
          await creditGiftReward(userId, total);
          const balance = await fetchWalletCoins(userId);
          if (balance != null) onCoinsChange(balance);
        } catch {
          /* refund failed — support must fix wallet */
        }
      }
      setError(e.message ?? "Red packet failed");
    } finally {
      setGiftBusy(false);
    }
  }

  async function handleSendSticker(sticker) {
    if (!room || !supabase) return;
    if (roomMeta.ban_chat) {
      setError("Chat is disabled");
      return;
    }
    setStickerOpen(false);
    const text = stickerMessage(sticker.key);
    if (mySeat) {
      playSeatEmote(mySeat, {
        key: sticker.key,
        emoji: sticker.emoji,
        anim: "wow",
        particles: [sticker.emoji],
        duration: 2200,
      });
    }
    await supabase.from("messages").insert({
      room_id: room.id,
      user_id: userId,
      nickname: displayName,
      message: text,
    });
    await loadMessages(room.id);
    markDailyTask(userId, "sent_message").catch(() => {});
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !room || !supabase) return;
    if (roomMeta.ban_images) {
      setError("Images disabled in this room");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const url = String(reader.result ?? "");
      if (!url.startsWith("data:image")) return;
      await supabase.from("messages").insert({
        room_id: room.id,
        user_id: userId,
        nickname: displayName,
        message: `[img]${url.slice(0, 500)}`,
      });
      await loadMessages(room.id);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function openWaitingQueue(seatNumber = null, includeSeated = false) {
    setInviteTargetSeat(seatNumber);
    setInviteIncludeSeated(includeSeated);
    setWaitingOpen(true);
  }

  function closeWaitingQueue() {
    setWaitingOpen(false);
    setInviteTargetSeat(null);
    setInviteSeatUser(null);
    setInviteIncludeSeated(false);
  }

  async function sendInviteToSeat(user, seatNumber) {
    if (!canModerate) {
      setToast("Only room admins and owner can invite to seats");
      return;
    }
    if (!seatNumber) {
      setToast("Choose a seat first");
      return;
    }
    if (seatMap[seatNumber]?.user_id || seatMap[seatNumber]?.is_locked) {
      setToast(`Seat ${seatNumber} is not available`);
      return;
    }
    if (pendingInvites[user.user_id]) {
      setToast(`Already invited ${user.nickname}`);
      return;
    }
    try {
      await sendSeatInvite({
        roomId: room.id,
        seatNumber,
        inviteeId: user.user_id,
        inviterId: userId,
        inviterName: displayName,
      });
      setPendingInvites(await loadPendingInvitesForRoom(room.id));
      setToast(`Invite sent to ${user.nickname} for seat ${seatNumber}`);
      setInviteSeatUser(null);
    } catch (e) {
      setError(e.message ?? "Could not send invite");
    }
  }

  async function inviteFromWaiting(user) {
    if (!canModerate) {
      setToast("Only room admins and owner can invite to seats");
      return;
    }
    if (!inviteTargetSeat) {
      setInviteSeatUser(user);
      setWaitingOpen(false);
      setInviteIncludeSeated(false);
      setToast(`Tap an empty seat for ${user.nickname}`);
      return;
    }
    await sendInviteToSeat(user, inviteTargetSeat);
  }

  async function handleAcceptSeatInvite() {
    if (!seatInvite) return;
    const seatNumber = seatInvite.seat_number;
    try {
      const accepted = await acceptSeatInvite({
        roomId: room.id,
        seatNumber,
        inviteeId: userId,
        displayName,
      });
      const acceptedSeatNumber = accepted?.seatNumber ?? seatNumber;
      saveStoredSeat(room.id, userId, acceptedSeatNumber);
      setSeatInvite(null);
      await loadSeats(room.id);
      setToast(`You joined seat ${acceptedSeatNumber}`);
    } catch (e) {
      setError(e.message ?? "Could not accept seat invite");
    }
  }

  async function handleRejectSeatInvite() {
    if (!seatInvite) return;
    await rejectSeatInvite(room.id, userId);
    setSeatInvite(null);
    setToast("Invite declined");
  }

  function handleChatInput(value) {
    if (dockChatConfig?.lettersOnly) {
      setChatInput(value.replace(/[^a-zA-Z]/g, "").slice(0, dockChatConfig.maxLength ?? 5).toLowerCase());
      return;
    }
    setChatInput(value);
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !room || !supabase) return;
    if (roomMeta.ban_chat) {
      setError("Chat is disabled in this room");
      return;
    }
    if (looksLikeGiftSystemMessage(text)) {
      setError("That message format is reserved for gift notifications");
      return;
    }

    const liveGame = liveGameRef.current;
    if (
      liveGame?.type === "wordle"
      && liveGame.phase === "playing"
      && liveGame.joined
      && !liveGame.myFinished
    ) {
      const word = text.toLowerCase();
      if (word.length !== 5) {
        setToast("Enter a 5-letter word");
        return;
      }
      setError(null);
      connectSocket();
      const guessRes = await emitAck("sendWordleGuess", {
        roomId: roomMeta.id,
        userId,
        guess: word,
      });
      if (guessRes.ok) {
        setChatInput("");
        return;
      }
      setToast(guessRes.error ?? "Invalid word");
      return;
    }

    if (
      liveGame?.type === "draw"
      && liveGame.phase === "drawing"
      && liveGame.drawerId !== userId
    ) {
      setError(null);
      connectSocket();
      if (!liveGame.joined) {
        await emitAck("joinGame", { roomId: roomMeta.id, userId, userName: displayName });
      }
      const guessRes = await emitAck("submitGuess", {
        roomId: roomMeta.id,
        userId,
        guess: text,
      });
      if (guessRes.ok) {
        setChatInput("");
        const rankLabel = guessRes.rank === 1 ? " 🏆 fastest" : guessRes.rank ? ` (#${guessRes.rank})` : "";
        await postSystemMessage(
          room.id,
          `🎨 ${displayName} guessed correctly! +${guessRes.points ?? 0} pts${rankLabel}`,
        );
        await loadMessages(room.id);
        return;
      }
      if (guessRes.error && !guessRes.error.includes("Wrong")) {
        setToast(guessRes.error);
        return;
      }
    }

    setError(null);
    setChatInput("");

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        room_id: room.id,
        user_id: userId,
        nickname: displayName,
        message: text,
        created_at: new Date().toISOString(),
      },
    ]);

    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({ room_id: room.id, user_id: userId, nickname: displayName, message: text })
      .select()
      .single();

    if (sendError) {
      setError(sendError.message);
      setChatInput(text);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return;
    }

    setMessages((prev) => mergeMessageRows(prev, [data]));
    markDailyTask(userId, "sent_message").catch(() => {});
  }

  async function sendEmote(emote) {
    if (!room || !supabase) return;
    const inActiveGame = gamesSessionActive || gamesWaitingActive;
    if (!mySeat && !inActiveGame) {
      setError("Take a seat to send emotes");
      return;
    }
    setEmojiOpen(false);
    setError(null);
    if (mySeat) playSeatEmote(mySeat, emote);
    const text = emoteMessage(emote.key);
    const { error: sendError } = await supabase.from("messages").insert({
      room_id: room.id,
      user_id: userId,
      nickname: displayName,
      message: text,
    });
    if (sendError) setError(sendError.message);
    else markDailyTask(userId, "sent_message").catch(() => {});
  }

  async function sendReaction(reaction) {
    if (!room || !supabase) return;
    if (roomMeta.ban_chat) {
      setError("Chat is disabled in this room");
      return;
    }
    setReactionOpen(false);
    const text = buildReactionMessage(reaction.key);
    setError(null);
    if (mySeat) {
      const isCoin = reaction.key === "coin";
      playSeatEmote(mySeat, {
        key: reaction.key,
        emoji: isCoin ? "coin" : reaction.emoji,
        anim: "wow",
        particles: isCoin ? ["coin"] : [reaction.emoji],
        duration: 2200,
      });
    }
    const { error: sendError } = await supabase.from("messages").insert({
      room_id: room.id,
      user_id: userId,
      nickname: displayName,
      message: text,
    });
    if (sendError) setError(sendError.message);
    else {
      supabase.from("room_reaction_log").insert({
        room_id: room.id,
        user_id: userId,
        reaction_key: reaction.key,
      }).catch(() => {});
      await loadMessages(room.id);
    }
  }

  async function endActiveGameForRoom() {
    if (!roomMeta?.id || !userId) return;
    try {
      connectSocket();
      await emitAck("endGame", { roomId: roomMeta.id, userId, force: true });
    } catch {
      /* socket may be offline */
    }
    setGamesSessionActive(false);
    setGamesWaitingActive(false);
  }

  async function applyModeChange(mode) {
    if (!canChangeMode || !room?.id || !supabase) {
      setError("Only the room owner can change mode");
      return;
    }
    setError(null);
    try {
      const previousMode = roomMeta.room_mode ?? "normal";
      if (previousMode === "games" && mode !== "games") {
        await endActiveGameForRoom();
      }
      const seated = seats.filter((s) => s.user_id);
      if (seated.length) {
        const results = await Promise.all(
          seated.map((s) =>
            supabase
              .from("seats")
              .update({ user_id: null, nickname: null })
              .eq("room_id", room.id)
              .eq("seat_number", s.seat_number),
          ),
        );
        const seatErr = results.find((r) => r.error)?.error;
        if (seatErr) throw seatErr;
        await loadSeats(room.id);
      }
      const modePatch = { room_mode: mode };
      if (previousMode === "video" && mode !== "video") {
        modePatch.video_room = {};
      }
      const updated = await updateRoomSettings(roomMeta.id, modePatch);
      setRoomMeta((prev) => ({ ...prev, ...updated, room_mode: mode }));
      await postSystemMessage(room.id, `Room mode changed to ${mode}`);
      await loadMessages(room.id);
      setModeOpen(false);
      setModePending(null);
      setToast(`Mode: ${mode}`);
    } catch (e) {
      setModePending(null);
      setError(e.message ?? "Could not change room mode");
    }
  }

  function handleModeChange(mode) {
    if (!canChangeMode) {
      setError("Only the room owner can change mode");
      return;
    }
    const current = roomMeta.room_mode ?? "normal";
    if (mode === current) {
      setModeOpen(false);
      setToast(`Already in ${mode} mode`);
      return;
    }
    const seated = seats.filter((s) => s.user_id);
    if (seated.length > 0) {
      setModeOpen(false);
      setModePending(mode);
      return;
    }
    applyModeChange(mode);
  }

  async function handleAddVideoFromUrl(urlOrId) {
    if (!canChangeMode || !room?.id) {
      setToast("Only host or admin can add videos");
      return;
    }
    setVideoBusy(true);
    setError(null);
    try {
      const updated = await addRoomVideoFromUrl(roomMeta.id, urlOrId);
      setRoomMeta((prev) => ({ ...prev, ...updated }));
      setVideoAddOpen(false);
      const title = readRoomVideo(updated).videoTitle || "YouTube video";
      await postSystemMessage(room.id, `📺 Now playing: ${title}`);
      await loadMessages(room.id);
      setToast("Video added for everyone");
    } catch (e) {
      setError(e.message ?? "Could not add video");
    } finally {
      setVideoBusy(false);
    }
  }

  async function handleVideoSyncPlayback(sync) {
    if (!canChangeMode || !room?.id) return;
    try {
      const updated = await syncRoomVideoPlayback(roomMeta.id, sync, roomMeta);
      setRoomMeta((prev) => ({ ...prev, ...updated }));
    } catch {
      /* non-blocking */
    }
  }

  async function handleClearRoomVideo() {
    if (!canChangeMode || !room?.id) return;
    setVideoBusy(true);
    try {
      const updated = await clearRoomVideo(roomMeta.id);
      setRoomMeta((prev) => ({ ...prev, ...updated }));
      await postSystemMessage(room.id, "Video removed from room");
      await loadMessages(room.id);
    } catch (e) {
      setError(e.message ?? "Could not remove video");
    } finally {
      setVideoBusy(false);
    }
  }

  async function deactivateGamesModeAfterPlay() {
    if (!isGamesRoom || !canChangeMode) return;
    try {
      await endActiveGameForRoom();
      const updated = await updateRoomSettings(roomMeta.id, { room_mode: "normal" });
      setRoomMeta((prev) => ({ ...prev, ...updated, room_mode: "normal" }));
      await postSystemMessage(room.id, "Game ended — room back to normal mode");
      await loadMessages(room.id);
    } catch (e) {
      setError(e.message ?? "Could not leave games mode");
    }
  }

  async function handleLeaveRoom() {
    await releaseRoomSession();
    onLeave();
  }

  async function handleDeleteRoomAsSuperAdmin() {
    if (!isSuperAdmin || !room?.id) return;
    const ok = window.confirm(`Delete room "${roomMeta.name ?? room.name}" for everyone?`);
    if (!ok) return;
    setSaveBusy(true);
    setError(null);
    try {
      await deleteRoomAsSuperAdmin(room.id, isSuperAdmin);
      setMenuOpen(false);
      onLeave();
      await onSavedRoomsChange?.();
    } catch (e) {
      setError(e.message ?? "Could not delete room");
    } finally {
      setSaveBusy(false);
    }
  }

  async function refreshSavedRooms() {
    await onSavedRoomsChange?.();
  }

  async function handleJoinRoomSave() {
    if (!userId || !room?.id || isRoomOwner || saveBusy) return;
    setSaveBusy(true);
    setError(null);
    try {
      await joinSavedRoom(userId, room.id);
      setRoomSaved(true);
      setMenuOpen(false);
      await refreshSavedRooms();
    } catch (e) {
      setError(e.message ?? "Could not save room");
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleLeaveSaved() {
    if (!userId || !room?.id || saveBusy) return;
    setSaveBusy(true);
    setError(null);
    try {
      await leaveSavedRoom(userId, room.id);
      setRoomSaved(false);
      setRoomFollowing(false);
      setMenuOpen(false);
      await refreshSavedRooms();
    } catch (e) {
      setError(e.message ?? "Could not remove room");
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleFollowRoom() {
    if (!userId || !room?.id || isRoomOwner || saveBusy) return;
    setSaveBusy(true);
    setError(null);
    try {
      await followRoom(userId, room.id);
      setRoomSaved(true);
      setRoomFollowing(true);
      setMenuOpen(false);
      markDailyTask(userId, "followed_room").catch(() => {});
      await refreshSavedRooms();
    } catch (e) {
      setError(e.message ?? "Could not follow room");
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleUnfollowRoom() {
    if (!userId || !room?.id || saveBusy) return;
    setSaveBusy(true);
    setError(null);
    try {
      await unfollowRoom(userId, room.id);
      setRoomFollowing(false);
      setMenuOpen(false);
      await refreshSavedRooms();
    } catch (e) {
      setError(e.message ?? "Could not unfollow room");
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleRallyFans() {
    if (!roomMeta?.id || saveBusy) return;
    if (!isRoomOwner && !isDelegatedAdmin && !isSuperAdmin) {
      setError("Only the host or an admin can rally fans");
      return;
    }
    setMenuOpen(false);
    setSaveBusy(true);
    setError(null);
    try {
      const count = await rallyRoomFans(roomMeta.id);
      setToast(
        count > 0
          ? `Invited ${count} fan${count === 1 ? "" : "s"} to join ${roomMeta.name ?? "the room"}!`
          : "No fans to invite yet — ask people to follow the room first",
      );
    } catch (e) {
      setError(e.message ?? "Could not rally fans");
    } finally {
      setSaveBusy(false);
    }
  }

  const onlineNames = onlineUsers.map((u) => u.nickname).filter(Boolean);
  const onlineCount = onlineUsers.length;
  const roomTitle = roomMeta.name ?? room.name ?? "Voice Room";
  const roomExp = Number(roomMeta.room_exp ?? 0);
  const roomExpLabel = formatCompactNumber(roomExp);
  const currentRoomMode = roomMeta.room_mode ?? "normal";
  const isGamesRoom = currentRoomMode === "games";
  const isVideoRoom = currentRoomMode === "video";
  const roomVideo = useMemo(() => readRoomVideo(roomMeta), [roomMeta]);
  const inGameLayout = isGamesRoom || gamesSessionActive || gamesWaitingActive;
  const activeSeatLayout = inGameLayout
    ? GAMES_MODE_SEAT_LAYOUT
    : isVideoRoom
      ? VIDEO_MODE_SEAT_LAYOUT
      : SEAT_LAYOUT;
  const walkieSession = voice?.walkieSession;
  const walkiePeerId = walkieSession?.outgoingTargetId || walkieSession?.incomingFromId || null;
  const walkiePeerSeat = walkiePeerId ? seats.find((s) => s.user_id === walkiePeerId) : null;
  const walkiePeerProfile = walkiePeerId ? profileMap[walkiePeerId] : null;
  const walkiePeer = walkiePeerId
    ? {
        id: walkiePeerId,
        name: walkiePeerSeat?.nickname || walkiePeerProfile?.display_name || "Guest",
        avatar: walkiePeerSeat?.avatar_url || walkiePeerProfile?.avatar_url || null,
      }
    : null;

  return (
    <div className={`app voice-room voice-room--${currentRoomMode}`}>
      {premiumGiftFx && (
        <PremiumGiftFx
          key={premiumGiftFx.id}
          effect={premiumGiftFx}
          onDone={handlePremiumGiftDone}
        />
      )}
      <div className="voice-stage">
        <StageBackdrop backgroundKey={roomMeta.background_key} backgroundUrl={roomMeta.background_url} />

        <WalkieTalkieOverlay
          session={walkieSession}
          self={{
            name: displayName,
            avatar: profileMap[userId]?.avatar_url ?? null,
          }}
          peer={walkiePeer}
          onEnd={() => voice?.stopWalkieTalk?.()}
        />

        <header className="stage-header stage-header--clean">
          <button type="button" className="stage-back" onClick={() => onMinimize?.()} aria-label="Back">
            ←
          </button>
          <button type="button" className="stage-title-wrap stage-title-wrap--button" onClick={openRoomProfile}>
            <div className="stage-title-row">
              <span
                className="stage-level"
                title="Room level & daily tasks"
              >
                {roomMeta.room_level ?? 1}
              </span>
              <div className="stage-name-block">
                <h1 className="stage-title">{truncateName(roomTitle, 18)}</h1>
                <p className="stage-code">
                  {room.room_code && <span>ID: {room.room_code}</span>}
                  <span
                    className="stage-exp-link"
                    title="Room contribution"
                  >
                    🔥 {roomExpLabel}
                  </span>
                </p>
              </div>
              {roomFollowing && <span className="stage-friend-tag">Following</span>}
            </div>
          </button>
          {headerGuard > 0 && (
            <span className="stage-guard-badge" title="Your guard toward partner">
              🛡️ {formatCompactNumber(headerGuard)}
            </span>
          )}
          <div className="stage-meta">
            <button
              type="button"
              className="stage-top-users"
              title="Today's top contributors"
              onClick={() => openAudienceSheet("contribution")}
            >
              {topContributors.slice(0, 3).map((s, i) => {
                const uid = s.user_id ?? s.id;
                const url = s.avatar_url || avatarForUser(uid);
                const score = s.amount;
                const rank = i + 1;
                return (
                  <span
                    key={uid ?? i}
                    className={`stage-top-avatar stage-top-avatar--rank${rank}`}
                    title={`${s.nickname || s.display_name || "Guest"}${score != null ? ` · ${formatCompactNumber(score)} gold today` : ""}`}
                  >
                    {rank === 1 && <span className="stage-top-crown" aria-hidden>👑</span>}
                    {url ? (
                      <AvatarImg
                        src={url}
                        fallback={s.nickname || s.display_name || "?"}
                        imgClassName="stage-top-avatar-img"
                      />
                    ) : (
                      (s.nickname || s.display_name || "?").charAt(0)
                    )}
                  </span>
                );
              })}
            </button>
            <button
              type="button"
              className="stage-online"
              onClick={() => openAudienceSheet("online")}
              title="Online people"
            >
              {onlineCount}
            </button>
            <button
              type="button"
              className={`stage-menu-btn ${roomFollowing ? "stage-menu-btn--following" : ""}`}
              onClick={() => setMenuOpen(true)}
              aria-label="Room options"
            >
              ⋯
            </button>
          </div>
        </header>

        <RoomMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          isOwner={isRoomOwner}
          isSaved={roomSaved}
          isFollowing={roomFollowing}
          busy={saveBusy}
          onJoin={handleJoinRoomSave}
          onLeaveSaved={handleLeaveSaved}
          onFollow={handleFollowRoom}
          onUnfollow={handleUnfollowRoom}
          onInvite={handleInvite}
          onShare={handleInvite}
          onRally={handleRallyFans}
          onReport={() => { setMenuOpen(false); setReportOpen(true); }}
          onLeaveRoom={handleLeaveRoom}
          isSuperAdmin={isSuperAdmin}
          onDeleteRoom={handleDeleteRoomAsSuperAdmin}
          giftSoundOn={roomMeta.gift_sound !== false}
          onToggleGiftSound={() => {
            setMenuOpen(false);
            handleToggleGiftSound();
          }}
          onSettings={() => {
            setMenuOpen(false);
            setSettingsOpen(true);
          }}
          onAdmins={() => {
            setMenuOpen(false);
            setSettingsOpen(false);
            setAdminFromSettings(false);
            setAdminOpen(true);
          }}
          onMode={(modeKey) => {
            setMenuOpen(false);
            if (modeKey) handleModeChange(modeKey);
            else setModeOpen(true);
          }}
          currentMode={roomMeta.room_mode ?? "normal"}
          canChangeMode={canChangeMode}
          canRally={isRoomOwner || isDelegatedAdmin || isSuperAdmin}
          canManageRoom={canManageRoom}
        />

        {toast && <p className="stage-toast">{toast}</p>}
        {error && <p className="banner error stage-banner">{error}</p>}
        {inviteSeatUser && (
          <div className="stage-seat-picker-hint">
            <span>Choose an empty seat for {inviteSeatUser.nickname || "user"}</span>
            <button type="button" onClick={() => setInviteSeatUser(null)}>
              Cancel
            </button>
          </div>
        )}

        <div className={`stage-split ${inGameLayout ? "stage-split--games" : ""} ${isVideoRoom ? "stage-split--video" : ""}`}>
          <div className="stage-split-seats">
        {isVideoRoom && (
          <VideoRoomPanel
            videoId={roomVideo.videoId}
            videoTitle={roomVideo.videoTitle}
            videoSync={roomVideo.videoSync}
            canControl={canChangeMode}
            onAddVideo={() => {
              if (!canChangeMode) {
                setToast("Only host or admin can add videos");
                return;
              }
              setVideoAddOpen(true);
            }}
            onChangeVideo={() => setVideoAddOpen(true)}
            onSyncPlayback={handleVideoSyncPlayback}
            onClearVideo={handleClearRoomVideo}
          />
        )}

        {currentRoomMode === "auction" && (
          <AuctionPanel
            roomId={room.id}
            userId={userId}
            displayName={displayName}
            isRoomOwner={isRoomOwner}
            isSuperAdmin={isSuperAdmin}
            coins={coins}
            onBalanceChange={onCoinsChange}
            onSettled={async () => {
              await loadSeats(room.id);
              await postSystemMessage(room.id, "Auction settled — winner seated");
              await loadMessages(room.id);
            }}
            onError={setError}
            onToast={setToast}
          />
        )}

        {!inGameLayout && (
          <div className="stage-float-widgets">
            <button type="button" className="stage-float-redpacket" onClick={() => setRedPacketOpen(true)} title="Red packet">
              🧧
            </button>
          </div>
        )}

        {inGameLayout && (
          <div className="games-seat-stage">
            <SeatEmoteFx reactions={seatReactions} />
            <GamesSeatStrip
              seatMap={seatMap}
              userId={userId}
              speakingSeatNumbers={speakingSeatNumbers}
              seatBusy={seatBusy}
              onSeatClick={handleSeatClick}
              seatAvatarUrl={seatAvatarUrl}
              seatInitial={seatInitial}
              seatEmoteAnim={seatEmoteAnim}
            />
          </div>
        )}

        {!inGameLayout && (
        <section className={`seats-stage seats-stage--weplay seats-stage--${currentRoomMode} ${currentRoomMode === "auction" ? "seats-stage--auction" : ""} ${isVideoRoom ? "seats-stage--video-grid" : ""}`}>
          <GiftAnimation
            effects={giftEffects}
            onDone={(id) => {
              setGiftEffects((prev) => prev.filter((fx) => fx.id !== id));
              scheduleRestoreGiftSheet();
            }}
          />
          <GiftHitFx
            hits={giftHits}
            onDone={(id) => setGiftHits((prev) => prev.filter((h) => h.id !== id))}
          />
          <SeatBondLayer bonds={seatBonds} onBondTap={handleSeatBondTap} />
          {svgaGift && (
            <SvgaGiftFx
              key={svgaGift.id}
              url={svgaGift.url}
              onDone={() => setSvgaGift(null)}
            />
          )}
          <SeatEmoteFx reactions={seatReactions} />
          {activeSeatLayout.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`seat-row seat-row--fixed ${
                inGameLayout
                  ? "seat-row--games-line"
                  : isVideoRoom
                    ? "seat-row--video-line"
                    : row.length === 2
                      ? "seat-row--two seat-row--partner"
                      : "seat-row--quad"
              }`}
            >
              {row.map((num) => {
                const seat = seatMap[num];
                const isMine = seat?.user_id === userId;
                const isEmpty = !isSeatTaken(seat);
                const isLocked = Boolean(seat?.is_locked) && isEmpty;
                const isSeatMuted = seat?.mic_on === false;
                const isKickable = canKickSeat(num);
                const isHostSeat = isGlobalRoom && num === HOST_SEAT && !isEmpty;
                const isAdminSeat =
                  (isGlobalRoom && num === ADMIN_SEAT && !isEmpty) ||
                  (!isGlobalRoom && seat?.user_id === room.owner_id && !isEmpty);
                const isSpeaking = speakingSeatNumbers.has(num);
                const emoteAnim = seatEmoteAnim[num]?.anim;
                const isPartnerSlot =
                  !isVideoRoom && (partnerSeatNumbers.has(num) || PARTNER_SEAT_NUMBERS.has(num));
                const isInviteSelectable = Boolean(inviteSeatUser && canModerate && isEmpty && !isLocked);
                const isInviteBlocked = Boolean(inviteSeatUser && canModerate && !isInviteSelectable);
                const seatProfile = seat?.user_id ? profileMap[seat.user_id] : null;
                return (
                  <button
                    key={num}
                    type="button"
                    data-seat-number={num}
                    className={`seat seat--slot ${isMine ? "seat--mine" : ""} ${isKickable ? "seat--kickable" : ""} ${isLocked ? "seat--locked" : ""} ${isPartnerSlot ? "seat--partner" : ""} ${isInviteSelectable ? "seat--invite-selectable" : ""} ${isInviteBlocked ? "seat--invite-blocked" : ""}`}
                    disabled={seatBusy}
                    onClick={() => handleSeatClick(num)}
                  >
                    <span
                      className={`seat-avatar ${isMine ? "seat-avatar--mine" : ""} ${isEmpty ? "seat-avatar--empty" : "seat-avatar--occupied"} ${isHostSeat ? "seat-avatar--host" : ""} ${isAdminSeat ? "seat-avatar--admin" : ""} ${isSpeaking ? "seat-avatar--speaking" : ""} ${isLocked ? "seat-avatar--locked" : ""} ${emoteAnim ? `seat-avatar--emote-${emoteAnim}` : ""}`}
                    >
                      {isLocked ? (
                        <span className="seat-lock-icon" aria-label="Locked" />
                      ) : (
                        renderSeatFace(seat, isMine, isEmpty)
                      )}
                      {isSeatMuted && (
                        <span className="seat-mute-badge" title="Seat muted" aria-label="Seat muted" />
                      )}
                      {isSpeaking && <span className="seat-speak-ring" />}
                    </span>
                    <span className={`seat-label-slot ${isEmpty ? "seat-label-slot--empty" : ""}`}>
                      {!isEmpty && (
                        <span
                          className={`seat-label ${!isMine ? "seat-label--faded" : ""} ${vipNameClass(seatProfile)}`}
                          data-vip-name={seat.nickname || "Guest"}
                        >
                          {seat.nickname || "Guest"}
                        </span>
                      )}
                    </span>
                    {isHostSeat && <span className="seat-role seat-role--host">host</span>}
                    {isAdminSeat && <span className="seat-role seat-role--admin">admin</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </section>
        )}

        {!inGameLayout && (
          <ComboGiftButton
            combo={combo}
            queueLen={giftQueueLen}
            onCombo={() =>
              combo &&
              enqueueGift(combo.gift, combo.target, {
                quantity: combo.quantity ?? 1,
                fromInventory: combo.fromInventory,
              })
            }
          />
        )}

        <div className={`game-stage-area ${inGameLayout ? "game-stage-area--live" : ""}`}>
          <GameLauncher
            stageActive={inGameLayout}
            roomId={roomMeta.id}
            userId={userId}
            userName={displayName}
            canHost={canModerate || isRoomOwner}
            ownerUserId={roomMeta.owner_id}
            onDeactivateGameMode={deactivateGamesModeAfterPlay}
            onSessionActiveChange={setGamesSessionActive}
            onWaitingGameChange={setGamesWaitingActive}
            onDockChatConfig={setDockChatConfig}
            chatDraft={chatInput}
            liveGameRef={liveGameRef}
          />
        </div>

          </div>

        {(canModerate || audienceCount > 0 || (!mySeat && !seatSwitching && !readStoredSeat(room?.id, userId))) && (
          <button type="button" className="stage-waiting" onClick={() => openWaitingQueue(null, false)}>
            <span className="stage-waiting-icon">🪑</span>
            <span>Audience {audienceCount > 0 ? `(${audienceCount})` : ""}</span>
          </button>
        )}

          <div className="stage-split-chat">
        <div className="stage-chat" ref={chatScrollRef} onScroll={handleChatScroll}>
          <div className="chat-message chat-message--compact chat-message--system">
            <div className="chat-message-head">
              <span className="chat-bubble-name">System</span>
            </div>
            <div className="chat-message-pill">
              <span className="chat-bubble-text">{roomMeta.announcement?.trim() || WELCOME_MSG}</span>
            </div>
          </div>
          {messages
            .slice(-24)
            .filter((msg) => !msg.message?.startsWith("[emote:"))
            .filter((msg, i, arr) => !isOrphanCharmMessage(msg, arr[i - 1]))
            .map((msg) => {
            const isGift = msg.message?.includes("— won ");
            const giftParts = isGift ? splitGiftMessage(msg.message) : null;
            const isCharm = !isGift && looksLikeCharmSystemMessage(msg.message);
            const isAnon = msg.nickname === "Anonymous";
            const sticker = parseStickerMessage(msg.message);
            const isImg = msg.message?.startsWith("[img]");
            const isSystem = msg.nickname === "System" || msg.message?.startsWith("System:");
            const redPacket = parseRedPacketMessage(msg.message);
            const chatProfile = msg.user_id ? profileMap[msg.user_id] : null;
            const useRichMedia = Boolean(sticker || isImg || redPacket);
            const displayName = isSystem ? "System" : (msg.nickname || "Guest");
            const messageTime = formatMessageClock(msg.created_at);
            const displayText = isSystem
              ? String(msg.message ?? "").replace(/^System:\s*/i, "")
              : giftParts?.main ?? msg.message;

            if (useRichMedia) {
              return (
                <div key={msg.id} className="chat-message chat-message--media">
                  <div className="chat-message-head">
                    <span className={`chat-bubble-name ${vipNameClass(chatProfile)}`} data-vip-name={displayName}>
                      {displayName}
                    </span>
                    {!isSystem && !isAnon && chatProfile && <UserBadges profile={chatProfile} compact showLevel={false} />}
                  </div>
                  <div className="chat-message-pill chat-message-pill--media">
                    {sticker ? (
                      <span className="chat-bubble-sticker">{sticker}</span>
                    ) : isImg ? (
                      <img src={msg.message.slice(5)} alt="" className="chat-bubble-image" />
                    ) : (
                      <span className="chat-bubble-redpacket">
                        🧧 {msg.nickname} sent {redPacket.totalCoins} gold
                        <button type="button" className="chat-rp-claim" onClick={() => handleClaimRedPacket(redPacket.packetId)}>
                          Grab
                        </button>
                      </span>
                    )}
                    {messageTime && <span className="chat-message-time">{messageTime}</span>}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`chat-message chat-message--compact ${isGift ? "chat-message--gift" : ""} ${isCharm ? "chat-message--charm" : ""} ${isSystem ? "chat-message--system" : ""}`}
              >
                <div className="chat-message-head">
                  <span className={`chat-bubble-name ${vipNameClass(chatProfile)}`} data-vip-name={displayName}>
                    {displayName}
                  </span>
                  {!isSystem && !isAnon && chatProfile && <UserBadges profile={chatProfile} compact showLevel={false} />}
                </div>
                <div className="chat-message-pill">
                  <span className="chat-bubble-text">{displayText}</span>
                  {messageTime && <span className="chat-message-time">{messageTime}</span>}
                  {giftParts?.charm ? (
                    <span className="chat-bubble-charm">{giftParts.charm}</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
          </div>
        </div>

        <RoomDock
          chatInput={chatInput}
          onChatInput={handleChatInput}
          onSendMessage={sendMessage}
          chatPlaceholder={dockChatConfig?.placeholder ?? "Type…"}
          chatMaxLength={dockChatConfig?.maxLength ?? 300}
          onEmoji={() => setEmojiOpen(true)}
          onGift={() => setGiftSheetOpen(true)}
          onChest={() => setDailyTasksOpen(true)}
          onGrid={() => setFunctionsOpen(true)}
        />
      </div>

      <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />

      {giftSheetOpen && (
        <GiftSheet
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          vipLevel={vipLevel}
          giftRecipients={giftRecipients}
          giftTarget={giftTarget}
          giftBusy={giftBusy}
          inventory={giftInventory}
          onSelectRecipient={setGiftTarget}
          onSendGift={(gift, opts) => sendGift(gift, undefined, opts)}
          onBuyCoins={() => setCoinShopOpen(true)}
          onClose={() => {
            giftSheetRestoreRef.current = false;
            setGiftSheetOpen(false);
          }}
        />
      )}

      {coinShopOpen && (
        <CoinShopSheet
          userId={userId}
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onToast={setToast}
          onClose={() => setCoinShopOpen(false)}
        />
      )}

      {functionsOpen && (
        <FunctionsGrid
          onDailyTasks={() => { setFunctionsOpen(false); setDailyTasksOpen(true); }}
          onReactions={() => { setFunctionsOpen(false); setReactionOpen(true); }}
          onMode={() => { setFunctionsOpen(false); setModeOpen(true); }}
          onWaiting={() => { setFunctionsOpen(false); openWaitingQueue(); }}
          onRedPacket={() => {
            setFunctionsOpen(false);
            if (roomMeta.ban_red_packet) {
              setToast("Red packets are banned in this room");
              return;
            }
            setRedPacketOpen(true);
          }}
          onImage={() => {
            setFunctionsOpen(false);
            imageInputRef.current?.click();
          }}
          onClose={() => setFunctionsOpen(false)}
        />
      )}

      {stickerOpen && (
        <StickerPanel onPick={handleSendSticker} onClose={() => setStickerOpen(false)} />
      )}

      {redPacketOpen && (
        <RedPacketSheet
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onSend={handleRedPacket}
          onClose={() => setRedPacketOpen(false)}
        />
      )}

      {reportOpen && (
        <ReportSheet
          onSubmit={async (reason) => {
            await reportRoom(roomMeta.id, userId, reason);
            setToast("Report submitted");
          }}
          onClose={() => setReportOpen(false)}
        />
      )}

      {waitingOpen && (
        <WaitingQueueSheet
          queue={canModerate && inviteIncludeSeated ? inviteCandidates : unseatedAudience}
          canModerate={canModerate}
          includeSeated={inviteIncludeSeated}
          pendingInvites={pendingInvites}
          inviteTargetSeat={inviteTargetSeat}
          onInvite={inviteFromWaiting}
          onClose={closeWaitingQueue}
        />
      )}

      {seatInvite && (
        <SeatInviteDialog
          inviterName={seatInvite.inviter_name}
          seatNumber={seatInvite.seat_number}
          onAccept={handleAcceptSeatInvite}
          onReject={handleRejectSeatInvite}
          onClose={() => setSeatInvite(null)}
        />
      )}

      {seatSheet?.type === "mine" && (
        <SeatActionSheet
          variant="G-play"
          onClose={() => setSeatSheet(null)}
          actions={[
            { label: "Close Seat", onClick: handleLeaveSeatFromSheet },
            {
              label: voice?.micEnabled ? "Mute" : "Unmute",
              onClick: async () => {
                await voice?.toggleMic?.();
                setSeatSheet(null);
              },
            },
            {
              label: "Invite",
              onClick: () => {
                setSeatSheet(null);
                if (canModerate) openWaitingQueue(null, true);
                else handleInvite();
              },
            },
            { label: "Cancel", onClick: () => setSeatSheet(null) },
          ]}
        />
      )}

      {seatSheet?.type === "empty" && (() => {
        const targetSeat = seatMap[seatSheet.seatNumber];
        const locked = Boolean(targetSeat?.is_locked);
        const seatMuted = targetSeat?.mic_on === false;
        const canManageSeat = canModerate;
        const actions = [
          ...(mySeat && !locked
            ? [{
                label: "Move here",
                onClick: () => moveToSeat(seatSheet.seatNumber),
              }]
            : []),
          ...(!mySeat && !locked
            ? [{
                label: "Take seat",
                onClick: () => {
                  setSeatSheet(null);
                  claimSeat(seatSheet.seatNumber);
                },
              }]
            : []),
          ...(canManageSeat
            ? [
                {
                  label: locked ? "Open Seat" : "Close Seat",
                  onClick: () => toggleSeatLock(seatSheet.seatNumber),
                },
                {
                  label: seatMuted ? "Unmute Seat" : "Mute",
                  onClick: () => toggleSeatMute(seatSheet.seatNumber),
                },
              ]
            : []),
          {
            label: "Invite",
            onClick: () => {
              setSeatSheet(null);
              if (canModerate) openWaitingQueue(seatSheet.seatNumber, true);
              else handleInvite();
            },
          },
          { label: "Cancel", onClick: () => setSeatSheet(null) },
        ];
        return (
          <SeatActionSheet
            variant="G-play"
            onClose={() => setSeatSheet(null)}
            actions={actions}
          />
        );
      })()}

      {dailyTasksOpen && (
        <DailyTaskSheet
          userId={userId}
          isSeated={Boolean(mySeat)}
          onClose={() => setDailyTasksOpen(false)}
          onReward={async (reward) => {
            if (reward?.type === "gift") {
              setGiftInventory(await loadGiftInventory(userId));
              setToast(`Chest: ${reward.rarityLabel} ${reward.gift.emoji} ${reward.gift.name} x${reward.quantity}`);
            } else {
              const amount = Number(reward?.coins ?? reward ?? 0);
              onCoinsChange(reward?.newBalance ?? coins + amount);
              setToast(`Chest: +${formatCompactNumber(amount)} gold`);
            }
          }}
        />
      )}

      {reactionOpen && (
        <ReactionPanel
          onClose={() => setReactionOpen(false)}
          onPick={sendReaction}
        />
      )}

      {modeOpen && (
        <RoomModeSheet
          currentMode={roomMeta.room_mode ?? "normal"}
          canEdit={canChangeMode}
          onPick={handleModeChange}
          onClose={() => setModeOpen(false)}
        />
      )}

      {bondCard && (
        <RelationshipBondCard
          bond={bondCard}
          onClose={() => setBondCard(null)}
          onOpenIntimateSpace={() => openIntimateSpaceForBond(bondCard)}
        />
      )}

      {intimateSpaceBond && (
        <IntimateSpaceSheet
          userId={userId}
          bond={intimateSpaceBond}
          onClose={() => setIntimateSpaceBond(null)}
          onOpenLoveHome={() => {
            setIntimateSpaceBond(null);
            setLoveHomeBond(myCoupleBond);
            setLoveHomeOpen(true);
          }}
          onCancelBond={async () => {
            const other = partnerUserId(intimateSpaceBond, userId);
            await cancelBond(userId, other);
            setMyCoupleBond(null);
            refreshBonds();
          }}
          onToast={(msg) => setToast(msg)}
        />
      )}

      {(loveHomeOpen && (loveHomeBond || myCoupleBond)) && (
        <LoveHomeSheet
          userId={userId}
          bond={loveHomeBond || myCoupleBond}
          onClose={() => {
            setLoveHomeOpen(false);
            setLoveHomeBond(null);
          }}
          onSendGift={() => {
            setLoveHomeOpen(false);
            if (partnerSeat) {
              setGiftTarget(partnerSeat);
              setGiftSheetOpen(true);
            } else {
              setToast("Partner must be in a seat to gift");
            }
          }}
        />
      )}

      {userProfileSeat && (
        <UserProfileCard
          seat={userProfileSeat}
          profile={profileMap[userProfileSeat.user_id]}
          viewerId={userId}
          viewerProfile={profileMap[userId]}
          viewerName={displayName}
          onBondChange={refreshBonds}
          onToast={(msg) => setToast(msg)}
          guardRefreshToken={guardRefreshToken}
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onCoinsChange={onCoinsChange}
          onWalkieStart={
            userProfileSeat.user_id !== userId && voice?.voiceReady
              ? async () => {
                  const ok = await voice.startWalkieTalk?.(userProfileSeat.user_id);
                  if (!ok) setToast("Could not start walkie talkie");
                }
              : undefined
          }
          onWalkieEnd={
            userProfileSeat.user_id !== userId && voice?.voiceReady
              ? async () => {
                  await voice.stopWalkieTalk?.();
                }
              : undefined
          }
          walkieActive={voice?.walkieTargetId === userProfileSeat.user_id}
          walkieDisabled={!voice?.voiceReady}
          onLiftUp={
            canModerate && userProfileSeat.user_id !== userId
              ? () => {
                  const num = userProfileSeat.seat_number;
                  setUserProfileSeat(null);
                  kickFromSeat(num);
                }
              : undefined
          }
          onKickFromRoom={
            canModerate && userProfileSeat.user_id !== userId
              ? () => {
                  const name = userProfileSeat.nickname || profileMap[userProfileSeat.user_id]?.display_name || "User";
                  setUserProfileSeat(null);
                  setKickTarget({ userId: userProfileSeat.user_id, name });
                }
              : undefined
          }
          canKick={canModerate && userProfileSeat.user_id !== userId}
          canBlockUser={userProfileSeat.user_id !== userId}
          onBlockUser={
            userProfileSeat.user_id !== userId
              ? () => {
                  const name = userProfileSeat.nickname || profileMap[userProfileSeat.user_id]?.display_name || "User";
                  setUserProfileSeat(null);
                  setBlockTarget({ userId: userProfileSeat.user_id, name });
                }
              : undefined
          }
          canModerate={canModerate}
          seatMuted={userProfileSeat.mic_on === false}
          onToggleSeatMute={
            canModerate
              ? () => {
                  const num = userProfileSeat.seat_number;
                  const nextMuted = userProfileSeat.mic_on !== false;
                  toggleSeatMute(num);
                  setUserProfileSeat({ ...userProfileSeat, mic_on: nextMuted ? false : true });
                }
              : undefined
          }
          onClose={() => setUserProfileSeat(null)}
          onLeaveSeat={
            userProfileSeat.user_id === userId
              ? () => {
                  setUserProfileSeat(null);
                  handleLeaveSeatFromSheet();
                }
              : undefined
          }
          onInvite={
            userProfileSeat.user_id === userId
              ? () => {
                  setUserProfileSeat(null);
                  if (canModerate) openWaitingQueue(null, true);
                  else handleInvite();
                }
              : undefined
          }
          onSendGift={() => {
            setGiftTarget(userProfileSeat);
            setUserProfileSeat(null);
            setGiftSheetOpen(true);
          }}
          onOpenIntimateSpace={() => {
            openIntimateSpaceForUser(userProfileSeat.user_id);
            setUserProfileSeat(null);
          }}
          onOpenLoveHome={async () => {
            const bond = await loadBondBetween(userId, userProfileSeat.user_id, userId);
            setLoveHomeBond(bond);
            setLoveHomeOpen(true);
            setUserProfileSeat(null);
          }}
          onMessage={async () => {
            const prof = profileMap[userProfileSeat.user_id];
            if (await isBlockedEitherWay(userId, userProfileSeat.user_id)) {
              setToast("You can't message this user");
              setUserProfileSeat(null);
              return;
            }
            setPersonalChatFriend({
              id: userProfileSeat.user_id,
              display_name: userProfileSeat.nickname || prof?.display_name,
              avatar_url: userProfileSeat.avatar_url || prof?.avatar_url,
            });
            setUserProfileSeat(null);
          }}
          onOpenGiftWall={() => {
            const prof = profileMap[userProfileSeat.user_id];
            setUserProfileSeat(null);
            setGiftWallUser({
              id: userProfileSeat.user_id,
              profile: prof,
            });
          }}
          onChangeUser={() => {
            setSeatChangeTarget({
              seatNumber: userProfileSeat.seat_number,
              currentUserId: userProfileSeat.user_id,
            });
            setUserProfileSeat(null);
          }}
        />
      )}

      {kickTarget && (
        <KickUserDialog
          userName={kickTarget.name}
          onClose={() => setKickTarget(null)}
          onConfirm={(addToBlacklist) =>
            kickUserFromRoomFully(kickTarget.userId, kickTarget.name, addToBlacklist)
          }
        />
      )}

      {blockTarget && (
        <BlockUserDialog
          userName={blockTarget.name}
          onClose={() => setBlockTarget(null)}
          onConfirm={async () => {
            await blockUser(userId, blockTarget.userId);
            const ownerId = roomMeta.owner_id;
            if (ownerId === userId) {
              await kickUserFromRoom(room.id, blockTarget.userId, userId);
              await leaveWaitingQueue(room.id, blockTarget.userId).catch(() => {});
              await loadSeats(room.id);
              await loadPresence(room.id);
            } else if (ownerId === blockTarget.userId) {
              await releaseRoomSession();
              setToast("You blocked the room owner — leaving room");
              onLeave();
              return;
            }
            setToast(`${blockTarget.name} blocked`);
          }}
        />
      )}

      {seatChangeTarget && (
        <SeatChangeUserSheet
          seatNumber={seatChangeTarget.seatNumber}
          currentUserId={seatChangeTarget.currentUserId}
          candidates={onlineUsers.map((u) => ({
            ...u,
            ...profileMap[u.user_id],
            display_name: u.nickname || profileMap[u.user_id]?.display_name,
            avatar_url: u.avatar_url || profileMap[u.user_id]?.avatar_url,
          }))}
          onPick={async (u) => {
            const num = seatChangeTarget.seatNumber;
            setSeatChangeTarget(null);
            await assignUserToSeat(num, u);
          }}
          onClose={() => setSeatChangeTarget(null)}
        />
      )}

      {personalChatFriend && (
        <PersonalChat
          userId={userId}
          displayName={displayName}
          friend={personalChatFriend}
          onClose={() => setPersonalChatFriend(null)}
        />
      )}

      {emojiOpen && (
        <EmotePanel
          onClose={() => setEmojiOpen(false)}
          onPick={sendEmote}
          onReaction={(r) => {
            setEmojiOpen(false);
            sendReaction(r);
          }}
        />
      )}

      {settingsOpen && canManageRoom && (
        <RoomSettingsSheet
          room={roomMeta}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSaveSettings}
          isSuperAdmin={isSuperAdmin}
          onDeleteRoom={handleDeleteRoomAsSuperAdmin}
          canAssignAdmins={isRoomOwner || isSuperAdmin}
          onOpenAdmins={() => {
            setSettingsOpen(false);
            setAdminFromSettings(true);
            setAdminOpen(true);
          }}
          onOpenBlacklist={() => {
            setSettingsOpen(false);
            setBlacklistFromSettings(true);
            setBlacklistOpen(true);
          }}
        />
      )}

      {blacklistOpen && canManageRoom && (
        <RoomBlacklistSheet
          roomId={roomMeta.id}
          onToast={setToast}
          onClose={() => {
            setBlacklistOpen(false);
            if (blacklistFromSettings) {
              setSettingsOpen(true);
              setBlacklistFromSettings(false);
            }
          }}
        />
      )}

      {adminOpen && (isRoomOwner || isSuperAdmin) && (
        <AdminAssignSheet
          roomId={roomMeta.id}
          owner={roomOwner}
          ownerId={roomMeta.owner_id}
          onAdminsChange={setRoomAdmins}
          onToast={setToast}
          onClose={() => {
            setAdminOpen(false);
            setSettingsOpen(false);
            if (adminFromSettings) {
              setSettingsOpen(true);
              setAdminFromSettings(false);
            }
          }}
        />
      )}

      {onlineListOpen && (
        <RoomAudienceSheet
          roomId={roomMeta.id}
          onlineUsers={onlineUsers}
          memberCount={roomStats.members}
          initialTab={audienceInitialTab}
          viewerId={userId}
          viewerProfile={profileMap[userId]}
          onClose={() => setOnlineListOpen(false)}
        />
      )}

      {giftWallUser && (
        <GiftWallSheet
          userId={giftWallUser.id}
          profile={giftWallUser.profile}
          onClose={() => setGiftWallUser(null)}
          onSendGift={() => {
            setGiftWallUser(null);
            const seat = seats.find((s) => s.user_id === giftWallUser.id);
            if (seat) {
              setGiftTarget(seat);
              setGiftSheetOpen(true);
            }
          }}
        />
      )}

      {shareOpen && (
        <ShareSheet
          room={roomMeta}
          recentContacts={shareContacts}
          onShareToContact={shareToContact}
          onClose={() => setShareOpen(false)}
        />
      )}

      {modePending && (
        <ModeConfirmSheet
          mode={modePending}
          onConfirm={() => { applyModeChange(modePending); }}
          onCancel={() => setModePending(null)}
        />
      )}

      {videoAddOpen && (
        <AddVideoSheet
          busy={videoBusy}
          onSubmit={handleAddVideoFromUrl}
          onClose={() => !videoBusy && setVideoAddOpen(false)}
        />
      )}

      {roomProfileOpen && (
        <RoomProfileSheet
          room={roomMeta}
          owner={roomOwner}
          admins={roomAdmins}
          stats={roomStats}
          onlineCount={onlineCount}
          isSaved={roomSaved}
          isFollowing={roomFollowing}
          saveBusy={saveBusy}
          isOwner={isRoomOwner}
          onShowOnline={() => {
            setRoomProfileOpen(false);
            openAudienceSheet("online");
          }}
          onShowMembers={() => {
            setRoomProfileOpen(false);
            openAudienceSheet("members");
          }}
          onShare={() => {
            setRoomProfileOpen(false);
            setShareOpen(true);
          }}
          onClose={() => setRoomProfileOpen(false)}
          canEdit={canManageRoom}
          onSettings={() => {
            setRoomProfileOpen(false);
            setSettingsOpen(true);
          }}
          onJoin={async () => {
            if (roomSaved) {
              await handleLeaveSaved();
            } else {
              await handleJoinRoomSave();
            }
            const stats = await loadRoomSocialStats(room.id);
            setRoomStats(stats);
          }}
          onFollow={async () => {
            if (roomFollowing) {
              await handleUnfollowRoom();
            } else {
              await handleFollowRoom();
            }
            const stats = await loadRoomSocialStats(room.id);
            setRoomStats(stats);
          }}
        />
      )}

      {redPacketRain && (
        <RedPacketRain
          packetId={redPacketRain.packetId}
          totalCoins={redPacketRain.totalCoins}
          senderName={redPacketRain.senderName}
          drops={redPacketRain.drops}
          onGrab={handleGrabRainDrop}
          onDone={handleRainDone}
        />
      )}
    </div>
  );
}

export default function RoomView({ onMinimize, ...props }) {
  const [mySeat, setMySeat] = useState(null);
  const [seatMicAllowed, setSeatMicAllowed] = useState(true);
  const [speakingUserIds, setSpeakingUserIds] = useState(() => new Set());
  const [voiceStatus, setVoiceStatus] = useState("off");

  return (
    <VoiceRoom
      roomName={props.room.id}
      participantName={props.displayName}
      participantIdentity={props.userId}
      isSeated={Boolean(mySeat)}
      seatMicAllowed={seatMicAllowed}
      onSpeakingChange={setSpeakingUserIds}
      onVoiceStatus={setVoiceStatus}
    >
      <RoomContent
        {...props}
        onMinimize={onMinimize}
        onMySeatChange={setMySeat}
        onSeatMicAllowedChange={setSeatMicAllowed}
        speakingUserIds={speakingUserIds}
        voiceStatus={voiceStatus}
      />
    </VoiceRoom>
  );
}
