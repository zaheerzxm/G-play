import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { loadClanMessages, sendClanMessage } from "../clans.js";
import AvatarImg from "./AvatarImg.jsx";
import { IconClan } from "./NavIcons.jsx";

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
        { ...msg, profile: { display_name: displayName } },
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
                <div className="personal-chat-msg-col">
                  <div className={`personal-chat-bubble personal-chat-bubble--ref ${mine ? "personal-chat-bubble--mine" : ""}`}>
                    {!mine && <strong className="clan-chat-sender">{name}</strong>}
                    <span className="personal-chat-text">{m.message}</span>
                  </div>
                  <time className="personal-chat-time-ref">{formatTime(m.created_at)}</time>
                </div>
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
