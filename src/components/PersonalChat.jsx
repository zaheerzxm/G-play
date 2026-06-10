import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadPrivateMessages,
  markMessagesRead,
  parseRoomInvite,
  sendPrivateMessage,
} from "../privateChat.js";
import { isMutualFriend } from "../social.js";
import { isBlockedEitherWay } from "../userBlocks.js";
import { deductWalletCoins } from "../wallet.js";
import { GIFTS, formatGiftMessage } from "../gifts.js";
import { giftIconFor } from "../gplayAssets.js";
import { logGiftTransaction } from "../giftTransactions.js";
import { charmForGift } from "../charmTiers.js";
import { applyGiftCharm } from "../gamification.js";
import { useDmCall } from "../context/DmCallContext.jsx";
import RingProgressWidget from "./RingProgressWidget.jsx";
import SendCoinsSheet from "./SendCoinsSheet.jsx";
import CoinIcon from "./CoinIcon.jsx";
import UserFullProfileSheet from "./UserFullProfileSheet.jsx";
import GiftWallSheet from "./GiftWallSheet.jsx";
import { loadProfilesForUserIds } from "../profile.js";
import { bondMeta, loadBondBetween, relationshipLevelProgress } from "../relationships.js";

const DM_GIFTS = GIFTS.slice(0, 8);

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function PersonalChat({
  userId,
  displayName,
  friend,
  coins = 0,
  isSuperAdmin = false,
  onCoinsChange,
  onJoinRoom,
  onClose,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [sendCoinsOpen, setSendCoinsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [giftWallOpen, setGiftWallOpen] = useState(false);
  const [peerProfile, setPeerProfile] = useState(null);
  const [coupleBond, setCoupleBond] = useState(null);
  const [canReply, setCanReply] = useState(false);
  const { startCall, inCall, busy: callBusy } = useDmCall() ?? {};
  const endRef = useRef(null);

  const load = useCallback(async () => {
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
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [load]);

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
    if (!friend?.id) {
      setPeerProfile(null);
      return;
    }
    loadProfilesForUserIds([friend.id])
      .then((map) => setPeerProfile(map[friend.id] ?? friend))
      .catch(() => setPeerProfile(friend));
  }, [friend]);

  async function handleSendGift(gift) {
    if (busy || !gift) return;
    if (!isSuperAdmin && coins < gift.cost) {
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
      });
      const msg = await sendPrivateMessage(userId, friend.id, text);
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    setInput("");
    try {
      const msg = await sendPrivateMessage(userId, friend.id, text);
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      setError(e.message);
      setInput(text);
    } finally {
      setBusy(false);
    }
  }

  const initial = (friend.display_name || "?").charAt(0).toUpperCase();
  const bondProgress = coupleBond ? relationshipLevelProgress(coupleBond.relationshipExp ?? 0) : null;

  return (
    <div className="personal-chat">
      <header className="personal-chat-header">
        <button type="button" className="personal-chat-back" onClick={onClose} aria-label="Back">
          ←
        </button>
        <button type="button" className="personal-chat-peer" onClick={() => setProfileOpen(true)}>
          {friend.avatar_url ? (
            <img src={friend.avatar_url} alt="" className="personal-chat-avatar" />
          ) : (
            <span className="personal-chat-avatar personal-chat-avatar--fallback">{initial}</span>
          )}
          <div>
            <p className="personal-chat-name">{friend.display_name}</p>
            <p className="personal-chat-sub">Tap for profile</p>
          </div>
        </button>
        <button type="button" className="personal-chat-gift" onClick={() => setGiftOpen((v) => !v)} title="Send gift">
          🎁
        </button>
        <button
          type="button"
          className="personal-chat-coins"
          onClick={() => setSendCoinsOpen(true)}
          title="Send coins"
          aria-label="Send coins"
        >
          <CoinIcon size="sm" />
        </button>
        <button
          type="button"
          className="personal-chat-call"
          disabled={inCall || callBusy}
          onClick={() => startCall?.(friend)}
          title="Voice call"
        >
          📞
        </button>
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

      {giftOpen && (
        <div className="personal-chat-gift-strip">
          {DM_GIFTS.map((g) => {
            const icon = giftIconFor(g.id);
            const afford = isSuperAdmin || coins >= g.cost;
            return (
              <button
                key={g.id}
                type="button"
                className={`personal-chat-gift-btn ${afford ? "" : "personal-chat-gift-btn--locked"}`}
                disabled={busy || !afford}
                onClick={() => handleSendGift(g)}
                title={`${g.name} · ${g.cost} coins`}
              >
                {icon ? <img src={icon} alt="" /> : g.emoji}
                <span>{g.cost}</span>
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="banner error personal-chat-error">{error}</p>}

      <div className="personal-chat-messages">
        {messages.length === 0 && (
          <p className="personal-chat-empty">Say hi to your friend 👋</p>
        )}
        {messages.map((msg) => {
          const mine = msg.sender_id === userId;
          const invite = parseRoomInvite(msg.message);
          return (
            <div
              key={msg.id}
              className={`personal-chat-bubble-row ${mine ? "personal-chat-bubble-row--mine" : ""}`}
            >
              <div className={`personal-chat-bubble ${mine ? "personal-chat-bubble--mine" : ""} ${invite ? "personal-chat-bubble--invite" : ""}`}>
                {invite ? (
                  <>
                    <span className="personal-chat-text">{invite.text || "You're invited to a voice room!"}</span>
                    {!mine && onJoinRoom && (
                      <button
                        type="button"
                        className="personal-chat-room-invite"
                        onClick={() => onJoinRoom(invite.roomCode)}
                      >
                        Join room
                      </button>
                    )}
                  </>
                ) : (
                  <span className="personal-chat-text">{msg.message}</span>
                )}
                <span className="personal-chat-time">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {canReply ? (
        <form className="personal-chat-compose" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Message…"
            maxLength={500}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="personal-chat-send" disabled={busy || !input.trim()}>
            Send
          </button>
        </form>
      ) : (
        <p className="personal-chat-invite-hint">Add each other as friends to reply in chat</p>
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
          onOpenGiftWall={() => {
            setProfileOpen(false);
            setGiftWallOpen(true);
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

      {sendCoinsOpen && (
        <SendCoinsSheet
          userId={userId}
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          recipient={friend}
          onCoinsChange={onCoinsChange}
          onClose={(result) => {
            setSendCoinsOpen(false);
            if (result?.message) {
              setError(null);
              load();
            }
          }}
        />
      )}
    </div>
  );
}
