import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  clanGiftDisplayFromMessage,
  clanRoleBadgeClass,
  clanRoleBadgeLabel,
  clanRoleShowsBadge,
  formatClanGiftFooter,
} from "../clanChatMessages.js";
import { loadClanMessages, sendClanMessage } from "../clans.js";
import { GIFTS } from "../gifts.js";
import { giftIconFor } from "../gplayAssets.js";
import AvatarImg from "./AvatarImg.jsx";
import { IconClan } from "./NavIcons.jsx";

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ClanRoleBadge({ role }) {
  if (!clanRoleShowsBadge(role)) return null;
  const label = clanRoleBadgeLabel(role);
  const className = clanRoleBadgeClass(role);
  if (!label || !className) return null;
  return <span className={`clan-chat-role-badge ${className}`}>{label}</span>;
}

function ClanChatSenderName({ name, role }) {
  return (
    <span className="clan-chat-sender-row">
      <strong className="clan-chat-sender">{name}</strong>
      <ClanRoleBadge role={role} />
    </span>
  );
}

function ClanChatGiftCard({ msg, mine, displayName }) {
  const gift = clanGiftDisplayFromMessage(msg);
  if (!gift) {
    return (
      <div className="clan-chat-card clan-chat-card--gift clan-chat-card--fallback">
        <span className="personal-chat-text">{msg.message}</span>
      </div>
    );
  }

  const baseName = gift.giftName.replace(/\s+x\d+$/i, "").trim();
  const giftMeta = GIFTS.find(
    (g) => g.name === baseName || g.name.startsWith(baseName.split(" ")[0]),
  );
  const icon = giftIconFor(giftMeta?.id);
  const sender = gift.senderName || (mine ? displayName : "Member");
  const footerLines = formatClanGiftFooter(gift);

  return (
    <div className={`clan-chat-card clan-chat-card--gift ${mine ? "clan-chat-card--mine" : ""}`}>
      {gift.flavor && <p className="clan-chat-gift-flavor">"{gift.flavor}"</p>}
      <div className="clan-chat-gift-main">
        <span className="clan-chat-gift-icon" aria-hidden>
          {icon ? <img src={icon} alt="" /> : gift.emoji}
        </span>
        <div className="clan-chat-gift-copy">
          <strong>
            {mine
              ? `You sent ${gift.giftName} to ${gift.recipientName}`
              : `${sender} sent ${gift.giftName} to ${gift.recipientName}`}
          </strong>
          {gift.reward > 0 && (
            <small className="clan-chat-gift-reward">Won {gift.reward} gold</small>
          )}
        </div>
      </div>
      {footerLines.length > 0 && (
        <div className="clan-chat-gift-footer">
          {footerLines.map((line) => (
            <small key={line}>{line}</small>
          ))}
        </div>
      )}
    </div>
  );
}

function ClanChatMessageBody({ msg, mine, displayName }) {
  const type = msg.message_type ?? "text";

  if (type === "system") {
    return (
      <div className="clan-chat-system">
        <span>{msg.message}</span>
        <time>{formatTime(msg.created_at)}</time>
      </div>
    );
  }

  if (type === "gift") {
    return (
      <div className="clan-chat-msg-col clan-chat-msg-col--card">
        {!mine && (
          <ClanChatSenderName
            name={msg.profile?.display_name ?? "Member"}
            role={msg.role}
          />
        )}
        <ClanChatGiftCard msg={msg} mine={mine} displayName={displayName} />
        <time className="clan-chat-time-centered">{formatTime(msg.created_at)}</time>
      </div>
    );
  }

  return (
    <div className="personal-chat-msg-col">
      <div className={`personal-chat-bubble personal-chat-bubble--ref ${mine ? "personal-chat-bubble--mine" : ""}`}>
        {!mine && (
          <ClanChatSenderName
            name={msg.profile?.display_name ?? "Member"}
            role={msg.role}
          />
        )}
        <span className="personal-chat-text">{msg.message}</span>
      </div>
      <time className="personal-chat-time-ref">{formatTime(msg.created_at)}</time>
    </div>
  );
}

export default function ClanChat({ clan, userId, displayName, onClose, onOpenProfile, onToast }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  const load = useCallback(async () => {
    if (!clan?.id) return;
    try {
      const rows = await loadClanMessages(clan.id);
      setMessages(rows);
    } catch (e) {
      setError(e.message);
    }
  }, [clan?.id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    setInput("");
    try {
      const msg = await sendClanMessage(clan.id, userId, text);
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          message_type: msg.message_type ?? "text",
          role: clan.membership?.role ?? "member",
          profile: { display_name: displayName },
        },
      ]);
    } catch (err) {
      onToast?.(err?.message ?? "Could not send");
      setError(err?.message);
      setInput(text);
    } finally {
      setBusy(false);
    }
  }

  const chatUi = (
    <div className="gplay-mobile-shell-backdrop gplay-mobile-shell-backdrop--chat">
      <div className="gplay-mobile-shell personal-chat personal-chat--ref clan-chat--ref" onClick={(e) => e.stopPropagation()}>
        <header className="personal-chat-header personal-chat-header--ref">
          <button type="button" className="personal-chat-back personal-chat-back--ref" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <div className="clan-chat-peer">
            <span className="G-play-module-icon G-play-module-icon--clan" aria-hidden>
              <IconClan />
            </span>
            <div className="clan-chat-peer-meta">
              <p className="personal-chat-title">{clan.name}</p>
              <p className="personal-chat-sub-ref">Clan · ID {clan.clan_code}</p>
            </div>
          </div>
        </header>

        {error && <p className="banner error personal-chat-error">{error}</p>}

        <div className="personal-chat-messages personal-chat-messages--ref">
          {messages.length === 0 && (
            <p className="personal-chat-empty">Say hi to your clan!</p>
          )}
          {messages.map((m) => {
            const mine = m.user_id === userId;
            const name = m.profile?.display_name ?? (mine ? displayName : "Member");
            const isSystem = (m.message_type ?? "text") === "system";

            if (isSystem) {
              return (
                <div key={m.id} className="clan-chat-system-row">
                  <ClanChatMessageBody msg={m} mine={mine} displayName={displayName} />
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={`personal-chat-msg-row ${mine ? "personal-chat-msg-row--mine" : ""}`}
              >
                {!mine && (
                  <button
                    type="button"
                    className="clan-chat-avatar-btn"
                    onClick={() => onOpenProfile?.({ user_id: m.user_id, profile: m.profile, display_name: name })}
                    aria-label={`${name} profile`}
                  >
                    <AvatarImg
                      src={m.profile?.avatar_url}
                      fallback={name}
                      className="clan-chat-avatar clan-chat-avatar--fallback"
                      imgClassName="clan-chat-avatar"
                    />
                  </button>
                )}
                <ClanChatMessageBody msg={m} mine={mine} displayName={displayName} />
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <form className="personal-chat-compose personal-chat-compose--ref" onSubmit={handleSend}>
          <div className="personal-chat-input-wrap personal-chat-input-wrap--full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message your clan…"
              maxLength={500}
              disabled={busy}
            />
          </div>
          <button type="submit" className="personal-chat-send-ref" disabled={busy || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(chatUi, document.body);
}
