import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  loadPrivateMessages,
  markMessagesRead,
  parseClanInvite,
  parseRoomInvite,
  sendPrivateMessage,
} from "../privateChat.js";
import { isMutualFriend } from "../social.js";
import { isBlockedEitherWay } from "../userBlocks.js";
import { supabase } from "../supabase.js";
import { deductWalletCoins, fetchWalletCoins } from "../wallet.js";
import {
  GIFTS,
  formatGiftMessage,
  giftsByCategory,
  isOrphanCharmMessage,
  looksLikeCharmSystemMessage,
  splitGiftMessage,
} from "../gifts.js";
import { giftIconFor } from "../gplayAssets.js";
import { logGiftTransaction } from "../giftTransactions.js";
import { charmForGift } from "../charmTiers.js";
import { applyGiftCharm } from "../gamification.js";
import { creditGiftReward } from "../profile.js";
import {
  claimDmRedPacket,
  createDmRedPacket,
  formatRedPacketMessage,
  parseRedPacketMessage,
} from "../redPacket.js";
import { useDmCall } from "../context/DmCallContext.jsx";
import RingProgressWidget from "./RingProgressWidget.jsx";
import { IconCall, IconGift, IconImage, IconVoiceRoom, UiIcon } from "./NavIcons.jsx";
import VipDisplayName from "./VipDisplayName.jsx";
import UserFullProfileSheet from "./UserFullProfileSheet.jsx";
import GiftWallSheet from "./GiftWallSheet.jsx";
import RedPacketSheet from "./RedPacketSheet.jsx";
import ChatSettingsSheet from "./ChatSettingsSheet.jsx";
import CreateGroupSheet from "./CreateGroupSheet.jsx";
import { loadProfilesForUserIds } from "../profile.js";
import { markGameTaskProgress } from "../gameTasks.js";
import { bondMeta, loadBondBetween, relationshipLevelProgress } from "../relationships.js";
import { parseGiftMessage } from "../giftFx.js";
import { loadDmAlias, loadDmWallpaper } from "../dmChatPrefs.js";

const REPLY_RE = /^\[\[reply\]\]([\s\S]*?)\[\[\/reply\]\]\n?([\s\S]*)$/;

const DM_GIFT_TABS = ["Package", "Gift", "Special", "VIP"];

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateDivider(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const day = d.toLocaleDateString([], { weekday: "long" });
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return `${day} ${time}`;
  return `${day} ${time}`;
}

const DM_FALLBACK_POLL_MS = 45_000;

function isDmBetween(row, userId, friendId) {
  if (!row || !userId || !friendId) return false;
  return (
    (row.sender_id === userId && row.recipient_id === friendId)
    || (row.sender_id === friendId && row.recipient_id === userId)
  );
}

function extractRoomName(text) {
  const match = String(text ?? "").match(/join ['"]([^'"]+)['"]/i);
  return match?.[1] ?? "Voice Room";
}

function ChatAvatar({ src, name, className = "" }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  if (src) {
    return <img src={src} alt="" className={`personal-chat-msg-avatar ${className}`} />;
  }
  return <span className={`personal-chat-msg-avatar personal-chat-msg-avatar--fallback ${className}`}>{initial}</span>;
}

export default function PersonalChat({
  userId,
  displayName,
  friend,
  coins = 0,
  isSuperAdmin = false,
  onCoinsChange,
  onJoinRoom,
  onJoinClan,
  onClose,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftTab, setGiftTab] = useState("Gift");
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [giftWallOpen, setGiftWallOpen] = useState(false);
  const [redPacketOpen, setRedPacketOpen] = useState(false);
  const [peerProfile, setPeerProfile] = useState(null);
  const [viewerProfile, setViewerProfile] = useState(null);
  const [chatAlias, setChatAlias] = useState("");
  const [coupleBond, setCoupleBond] = useState(null);
  const [canReply, setCanReply] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [wallpaper, setWallpaper] = useState(() => loadDmWallpaper(userId, friend?.id));
  const { startCall, inCall, busy: callBusy } = useDmCall() ?? {};
  const endRef = useRef(null);

  useEffect(() => {
    if (!userId || !friend?.id) return;
    setWallpaper(loadDmWallpaper(userId, friend.id));
  }, [userId, friend?.id, settingsOpen]);

  const syncMessages = useCallback(async () => {
    if (!userId || !friend?.id) return;
    try {
      const rows = await loadPrivateMessages(userId, friend.id);
      setMessages(rows);
      await markMessagesRead(userId, friend.id);
    } catch (e) {
      setError(e.message);
    }
  }, [userId, friend?.id]);

  useEffect(() => {
    if (!userId || !friend?.id || !supabase) return undefined;
    let active = true;
    let fallbackTimer = null;

    const appendRow = (row) => {
      if (!active || !isDmBetween(row, userId, friend.id)) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === row.id)) return prev;
        return [...prev, row].slice(-50);
      });
      if (row.recipient_id === userId) {
        markMessagesRead(userId, friend.id).catch(() => {});
      }
    };

    const sync = async () => {
      if (document.hidden) return;
      try {
        const rows = await loadPrivateMessages(userId, friend.id);
        if (!active) return;
        setMessages(rows);
        await markMessagesRead(userId, friend.id);
      } catch (e) {
        if (active) setError(e.message);
      }
    };

    sync();
    fallbackTimer = setInterval(sync, DM_FALLBACK_POLL_MS);

    const channel = supabase
      .channel(`dm-${userId}-${friend.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "private_messages", filter: `recipient_id=eq.${userId}` },
        (payload) => appendRow(payload.new),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "private_messages", filter: `sender_id=eq.${userId}` },
        (payload) => appendRow(payload.new),
      )
      .subscribe();

    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      clearInterval(fallbackTimer);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [userId, friend?.id]);

  useEffect(() => {
    if (!userId || !friend?.id) {
      setCanReply(false);
      return;
    }
    Promise.all([isMutualFriend(userId, friend.id), isBlockedEitherWay(userId, friend.id)])
      .then(([mutual, blocked]) => setCanReply(mutual && !blocked))
      .catch(() => setCanReply(false));
  }, [userId, friend?.id]);

  useEffect(() => {
    if (!userId || !friend?.id) {
      setCoupleBond(null);
      return;
    }
    loadBondBetween(userId, friend.id, userId)
      .then((bond) => {
        const type = bond?.bondType;
        setCoupleBond(type === "cp" || type === "wedding" ? bond : null);
      })
      .catch(() => setCoupleBond(null));
  }, [userId, friend?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!friend?.id || !userId) {
      setPeerProfile(null);
      setViewerProfile(null);
      return;
    }
    loadProfilesForUserIds([friend.id, userId])
      .then((map) => {
        setPeerProfile(map[friend.id] ?? friend);
        setViewerProfile(map[userId] ?? null);
      })
      .catch(() => {
        setPeerProfile(friend);
        setViewerProfile(null);
      });
    setChatAlias(loadDmAlias(userId, friend.id));
  }, [friend, userId]);

  useEffect(() => {
    if (!settingsOpen && userId && friend?.id) {
      setChatAlias(loadDmAlias(userId, friend.id));
    }
  }, [settingsOpen, userId, friend?.id]);

  async function handleSendGift(gift) {
    if (busy || !gift || !friend?.id) return;
    if (!isSuperAdmin && Number(coins) < gift.cost) {
      setError("Not enough coins");
      return;
    }
    setBusy(true);
    setError(null);
    setGiftOpen(false);
    try {
      if (!isSuperAdmin) {
        const newBalance = await deductWalletCoins(userId, gift.cost);
        onCoinsChange?.(newBalance);
      }
      const charmAmount = charmForGift(gift, 1);
      await applyGiftCharm({
        recipientId: friend.id,
        senderId: userId,
        charm: charmAmount,
        senderGetsCharm: true,
      });
      logGiftTransaction({
        senderId: userId,
        recipientId: friend.id,
        roomId: null,
        gift,
        quantity: 1,
        cost: gift.cost,
        charm: charmAmount,
      }).catch(() => {});

      const text = formatGiftMessage({
        senderName: displayName || "User",
        emoji: gift.emoji,
        giftName: gift.name,
        recipientName: friend.display_name || "Friend",
        reward: 0,
        quantity: 1,
        charm: charmAmount,
      });
      const msg = await sendPrivateMessage(userId, friend.id, text);
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSendRedPacket({ totalCoins }) {
    if (busy || !friend?.id) return;
    const total = Math.floor(Number(totalCoins) || 0);
    if (total < 10) {
      setError("Minimum 10 coins");
      return;
    }
    if (!isSuperAdmin && Number(coins) < total) {
      setError("Not enough coins");
      return;
    }

    setBusy(true);
    setError(null);
    setRedPacketOpen(false);
    let deducted = false;
    try {
      if (!isSuperAdmin) {
        const newBalance = await deductWalletCoins(userId, total);
        onCoinsChange?.(newBalance);
        deducted = true;
      }
      const { packet } = await createDmRedPacket({
        senderId: userId,
        recipientId: friend.id,
        totalCoins: total,
      });
      const text = formatRedPacketMessage(packet.id, total, 1);
      const msg = await sendPrivateMessage(userId, friend.id, text);
      setMessages((prev) => [...prev, msg]);
      markGameTaskProgress(userId, "send_gift");
    } catch (e) {
      if (deducted) {
        try {
          await creditGiftReward(userId, total);
          const balance = await fetchWalletCoins(userId);
          if (balance != null) onCoinsChange?.(balance);
        } catch {
          /* wallet refund failed */
        }
      }
      setError(e.message ?? "Red packet failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleClaimDmRedPacket(packetId) {
    if (busy || !packetId) return;
    setBusy(true);
    setError(null);
    try {
      const coinsWon = await claimDmRedPacket(packetId, userId);
      if (coinsWon > 0) {
        const balance = await fetchWalletCoins(userId);
        if (balance != null) onCoinsChange?.(balance);
      }
      const msg = await sendPrivateMessage(
        userId,
        friend.id,
        `🧧 Opened red packet${coinsWon > 0 ? ` +${coinsWon} gold` : ""}`,
      );
      setMessages((prev) => [...prev, msg]);
      await syncMessages();
    } catch (e) {
      setError(e.message ?? "Could not open red packet");
    } finally {
      setBusy(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!canReply) return;
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    setInput("");
    const payload = replyTo
      ? `[[reply]]${replyTo.text}[[/reply]]\n${text}`
      : text;
    setReplyTo(null);
    try {
      const msg = await sendPrivateMessage(userId, friend.id, payload);
      setMessages((prev) => [...prev, msg]);
      markGameTaskProgress(userId, "chat_friend");
    } catch (e) {
      setError(e.message);
      setInput(text);
    } finally {
      setBusy(false);
    }
  }

  const headerName = chatAlias.trim() || friend.display_name || "Player";
  const bondProgress = coupleBond ? relationshipLevelProgress(coupleBond.relationshipExp ?? 0) : null;

  function renderMessageBody(msg, mine) {
    if (looksLikeCharmSystemMessage(msg.message)) return null;

    const invite = parseRoomInvite(msg.message);
    if (invite) {
      const roomName = extractRoomName(invite.text);
      return (
        <div className={`personal-chat-card personal-chat-card--invite ${mine ? "personal-chat-card--mine" : ""}`}>
          <p className="personal-chat-card-lead">
            {invite.text?.replace(/\[\[room:[^\]]+\]\]/i, "").trim() || "Join my voice room!"}
          </p>
          <div className="personal-chat-invite-inner">
            <span className="personal-chat-invite-thumb">
              <UiIcon Icon={IconVoiceRoom} />
            </span>
            <span className="personal-chat-invite-meta">
              <strong>{roomName}</strong>
              <small>Room · {invite.roomCode}</small>
            </span>
          </div>
          {!mine && onJoinRoom && (
            <button
              type="button"
              className="personal-chat-invite-join"
              onClick={() => onJoinRoom(invite.roomCode)}
            >
              Join room
            </button>
          )}
        </div>
      );
    }

    const clanInvite = parseClanInvite(msg.message);
    if (clanInvite) {
      return (
        <div className={`personal-chat-card personal-chat-card--invite ${mine ? "personal-chat-card--mine" : ""}`}>
          <p className="personal-chat-card-lead">
            {clanInvite.text?.replace(/\[\[clan:\d+\]\]/i, "").trim() || "Join my clan!"}
          </p>
          <div className="personal-chat-invite-inner">
            <span className="personal-chat-invite-thumb">
              <UiIcon Icon={IconVoiceRoom} />
            </span>
            <span className="personal-chat-invite-meta">
              <strong>Clan invite</strong>
              <small>Clan ID · {clanInvite.clanCode}</small>
            </span>
          </div>
          {!mine && onJoinClan && (
            <button
              type="button"
              className="personal-chat-invite-join"
              onClick={() => onJoinClan(clanInvite.clanCode)}
            >
              View clan
            </button>
          )}
        </div>
      );
    }

    const redPacket = parseRedPacketMessage(msg.message);
    if (redPacket) {
      return (
        <div className={`personal-chat-card personal-chat-card--redpacket ${mine ? "personal-chat-card--mine" : ""}`}>
          <span className="personal-chat-redpacket-icon" aria-hidden>🧧</span>
          <div className="personal-chat-redpacket-copy">
            <strong>
              {mine
                ? `You sent ${redPacket.totalCoins} gold`
                : `${friend.display_name || "Friend"} sent ${redPacket.totalCoins} gold`}
            </strong>
            <small>Red packet · 1 open</small>
          </div>
          {!mine && canReply && (
            <button
              type="button"
              className="personal-chat-redpacket-open"
              disabled={busy}
              onClick={() => handleClaimDmRedPacket(redPacket.packetId)}
            >
              Open
            </button>
          )}
        </div>
      );
    }

    const gift = parseGiftMessage(msg.message);
    if (gift) {
      const icon = giftIconFor(
        GIFTS.find((g) => g.name === gift.giftName || g.name.startsWith(gift.giftName.split(" ")[0]))?.id,
      );
      const { charm } = splitGiftMessage(msg.message);
      return (
        <div className={`personal-chat-card personal-chat-card--gift ${mine ? "personal-chat-card--mine" : ""}`}>
          <span className="personal-chat-gift-icon">{icon ? <img src={icon} alt="" /> : gift.emoji}</span>
          <div className="personal-chat-gift-copy">
            <strong>
              {mine ? `You sent ${gift.giftName}` : `${gift.senderName || friend.display_name} sent you ${gift.giftName}`}
            </strong>
            {charm && <small className="personal-chat-gift-charm">{charm}</small>}
          </div>
        </div>
      );
    }

    const replyMatch = String(msg.message ?? "").match(REPLY_RE);
    if (replyMatch) {
      return (
        <div className={`personal-chat-bubble personal-chat-bubble--reply ${mine ? "personal-chat-bubble--mine" : ""}`}>
          <blockquote className="personal-chat-reply-quote">{replyMatch[1]}</blockquote>
          <span className="personal-chat-text">{replyMatch[2]}</span>
        </div>
      );
    }

    return (
      <div
        className={`personal-chat-bubble ${mine ? "personal-chat-bubble--mine" : ""}`}
        onDoubleClick={() => {
          if (!looksLikeCharmSystemMessage(msg.message)) {
            setReplyTo({ text: String(msg.message).slice(0, 120), id: msg.id });
          }
        }}
      >
        <span className="personal-chat-text">
          {msg.message}
          <time className="chat-time-inline personal-chat-time-ref">{formatTime(msg.created_at)}</time>
        </span>
      </div>
    );
  }

  const chatUi = (
    <div className="gplay-mobile-shell-backdrop gplay-mobile-shell-backdrop--chat">
      <div className="gplay-mobile-shell personal-chat personal-chat--ref" onClick={(e) => e.stopPropagation()}>
        <header className="personal-chat-header personal-chat-header--ref">
          <button type="button" className="personal-chat-back personal-chat-back--ref" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <button type="button" className="personal-chat-title-btn" onClick={() => setProfileOpen(true)}>
            <VipDisplayName
              as="span"
              name={headerName}
              profile={friend}
              variant="light"
              className="personal-chat-title"
            />
          </button>
          <div className="personal-chat-header-actions">
            <button
              type="button"
              className="personal-chat-header-icon"
              disabled={inCall || callBusy}
              onClick={() => startCall?.(friend)}
              aria-label="Voice call"
            >
              <IconCall />
            </button>
            <button
              type="button"
              className="personal-chat-header-icon personal-chat-header-icon--menu"
              onClick={() => setSettingsOpen(true)}
              aria-label="Chat settings"
            >
              ···
            </button>
          </div>
        </header>

        {coupleBond && bondProgress && (
          <div className="personal-chat-bond-bar">
            <RingProgressWidget
              pct={bondProgress.pct}
              level={bondProgress.level}
              ringKey={coupleBond.weddingRing ?? "floral"}
            />
            <span className="personal-chat-bond-label">
              {bondMeta(coupleBond.bondType).emoji} {bondMeta(coupleBond.bondType).label} · LV.{bondProgress.level}
            </span>
          </div>
        )}

        {error && <p className="banner error personal-chat-error">{error}</p>}

        <div
          className="personal-chat-messages personal-chat-messages--ref"
          style={wallpaper?.css ? { background: wallpaper.css } : undefined}
        >
          {messages.length === 0 && (
            <p className="personal-chat-empty">Say hi to your friend</p>
          )}
          {messages.map((msg, index) => {
            const mine = msg.sender_id === userId;
            const prev = messages[index - 1];
            if (isOrphanCharmMessage(msg, prev)) return null;
            const showDate =
              !prev ||
              new Date(prev.created_at).toDateString() !== new Date(msg.created_at).toDateString();
            const body = renderMessageBody(msg, mine);
            if (!body) return null;

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="personal-chat-date">{formatDateDivider(msg.created_at)}</div>
                )}
                <div className={`personal-chat-msg-row ${mine ? "personal-chat-msg-row--mine" : ""}`}>
                  {!mine && (
                    <ChatAvatar src={friend.avatar_url} name={friend.display_name} />
                  )}
                  <div className="personal-chat-msg-col">
                    {body}
                  </div>
                  {mine && (
                    <ChatAvatar
                      src={viewerProfile?.avatar_url}
                      name={displayName}
                    />
                  )}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {giftOpen && (
          <div className="personal-chat-gift-panel personal-chat-gift-panel--tabs">
            <div className="personal-chat-gift-tabs" role="tablist">
              {DM_GIFT_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={giftTab === tab}
                  className={`personal-chat-gift-tab ${giftTab === tab ? "personal-chat-gift-tab--active" : ""}`}
                  onClick={() => setGiftTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="personal-chat-gift-grid">
              {giftsByCategory(giftTab === "VIP" ? "VIP" : giftTab).slice(0, 12).map((g) => {
                const icon = giftIconFor(g.id);
                const afford = g.inventory || isSuperAdmin || coins >= g.cost;
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`personal-chat-gift-btn ${afford ? "" : "personal-chat-gift-btn--locked"}`}
                    disabled={busy || !afford}
                    onClick={() => handleSendGift(g)}
                    title={`${g.name} · ${g.cost} coins`}
                  >
                    {g.badge && <span className="personal-chat-gift-badge">{g.badge}</span>}
                    {icon ? <img src={icon} alt="" /> : g.emoji}
                    <span>{g.cost > 0 ? g.cost : "Free"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {replyTo && (
          <div className="personal-chat-reply-bar">
            <span>Replying to: {replyTo.text}</span>
            <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply">×</button>
          </div>
        )}

        <div className="personal-chat-compose personal-chat-compose--ref">
          <button
            type="button"
            className="personal-chat-compose-redpacket"
            aria-label="Send red packet"
            disabled={!canReply || busy}
            onClick={() => {
              setGiftOpen(false);
              setRedPacketOpen(true);
            }}
          >
            🧧
          </button>
          <button
            type="button"
            className="personal-chat-compose-sticker"
            aria-label="Sticker"
            onClick={() => setInput((v) => `${v} 🙂`)}
            disabled={!canReply || busy}
          >
            <IconImage />
          </button>
          <form className="personal-chat-compose-form" onSubmit={handleSend}>
          <div className="personal-chat-input-wrap">
            <input
              type="text"
              placeholder={canReply ? "Message..." : "Add each other as friends to reply"}
              maxLength={500}
              value={input}
              disabled={!canReply || busy}
              onChange={(e) => setInput(e.target.value)}
            />
            {canReply && (
              <button
                type="button"
                className="personal-chat-emoji-btn"
                aria-label="Insert emoji"
                onClick={() => setInput((v) => `${v}🙂`)}
              >
                ☺
              </button>
            )}
          </div>
          <button
            type="button"
            className="personal-chat-compose-gift"
            onClick={() => setGiftOpen((v) => !v)}
            aria-label="Send gift"
          >
            <IconGift />
          </button>
          <button
            type="button"
            className="personal-chat-compose-plus"
            aria-label="More"
            onClick={() => setGiftOpen((v) => !v)}
          >
            +
          </button>
          </form>
        </div>

      {redPacketOpen && (
        <RedPacketSheet
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          variant="dm"
          onSend={handleSendRedPacket}
          onClose={() => setRedPacketOpen(false)}
        />
      )}
      </div>
    </div>
  );

  return createPortal(
    <>
      {chatUi}

      {settingsOpen && (
        <ChatSettingsSheet
          userId={userId}
          friend={friend}
          peerProfile={peerProfile}
          onClose={() => setSettingsOpen(false)}
          onOpenProfile={() => {
            setSettingsOpen(false);
            setProfileOpen(true);
          }}
          onOpenCreateGroup={() => {
            setSettingsOpen(false);
            setCreateGroupOpen(true);
          }}
          onToast={(msg) => setError(msg)}
          onBlocked={onClose}
        />
      )}

      {createGroupOpen && (
        <CreateGroupSheet
          userId={userId}
          preselectedFriendId={friend?.id}
          onClose={() => setCreateGroupOpen(false)}
          onToast={(msg) => setError(msg)}
        />
      )}

      {profileOpen && peerProfile && (
        <UserFullProfileSheet
          seat={{
            user_id: friend.id,
            display_name: friend.display_name,
            avatar_url: friend.avatar_url,
            user_code: peerProfile.user_code,
          }}
          profile={peerProfile}
          viewerId={userId}
          viewerName={displayName}
          onClose={() => setProfileOpen(false)}
          onMessage={() => setProfileOpen(false)}
          onToast={(msg) => setError(msg)}
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onCoinsChange={onCoinsChange}
          onOpenGiftWall={() => setGiftWallOpen(true)}
          onSendGift={() => {
            setProfileOpen(false);
            setGiftOpen(true);
          }}
        />
      )}

      {giftWallOpen && peerProfile && (
        <GiftWallSheet
          userId={friend.id}
          profile={peerProfile}
          fullPage
          onClose={() => setGiftWallOpen(false)}
        />
      )}

    </>,
    document.body,
  );
}
