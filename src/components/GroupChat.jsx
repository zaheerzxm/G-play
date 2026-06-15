import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  loadGroupMessages,
  markGroupRead,
  sendGroupMessage,
} from "../groupChat.js";
import AvatarImg from "./AvatarImg.jsx";
import { IconOnlineFriends } from "./NavIcons.jsx";

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function GroupChat({
  group,
  members = [],
  userId,
  displayName,
  onClose,
  onOpenProfile,
  onToast,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const endRef = useRef(null);

  const groupId = group?.id;
  const memberCount = members.length;

  const sync = useCallback(async () => {
    if (!groupId || !userId) return;
    try {
      const rows = await loadGroupMessages(groupId, userId);
      setMessages(rows);
      const lastId = rows.length ? rows[rows.length - 1]?.id : null;
      await markGroupRead(userId, groupId, lastId);
    } catch (e) {
      setError(e.message);
    }
  }, [groupId, userId]);

  useEffect(() => {
    sync();
    const t = setInterval(sync, 8000);
    return () => clearInterval(t);
  }, [sync]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy || !groupId) return;
    setBusy(true);
    setError(null);
    setInput("");
    try {
      const msg = await sendGroupMessage(groupId, userId, text);
      setMessages((prev) => [
        ...prev,
        { ...msg, profile: { display_name: displayName } },
      ]);
      await markGroupRead(userId, groupId, msg?.id ?? null);
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
      <div
        className="gplay-mobile-shell personal-chat personal-chat--ref group-chat--ref"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="personal-chat-header personal-chat-header--ref">
          <button type="button" className="personal-chat-back personal-chat-back--ref" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <div className="group-chat-peer">
            <span className="G-play-module-icon G-play-module-icon--group" aria-hidden>
              <IconOnlineFriends />
            </span>
            <div className="group-chat-peer-meta">
              <p className="personal-chat-title">{group?.name ?? "Group"}</p>
              <button
                type="button"
                className="group-chat-members-toggle"
                onClick={() => setMembersOpen((open) => !open)}
              >
                {memberCount} members
              </button>
            </div>
          </div>
        </header>

        {membersOpen && (
          <ul className="group-chat-members">
            {members.map((member) => {
              const name = member.profile?.display_name ?? "Member";
              return (
                <li key={member.user_id}>
                  <button
                    type="button"
                    className="group-chat-member-row"
                    onClick={() =>
                      onOpenProfile?.({
                        user_id: member.user_id,
                        profile: member.profile,
                        display_name: name,
                      })
                    }
                  >
                    <AvatarImg
                      src={member.profile?.avatar_url}
                      fallback={name}
                      className="group-chat-member-avatar"
                      imgClassName="group-chat-member-avatar"
                    />
                    <span>{name}</span>
                    {member.role === "owner" && <em>Owner</em>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {error && <p className="banner error personal-chat-error">{error}</p>}

        <div className="personal-chat-messages personal-chat-messages--ref">
          {messages.length === 0 && (
            <p className="personal-chat-empty">Say hi to your group!</p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === userId;
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
                    onClick={() =>
                      onOpenProfile?.({ user_id: m.sender_id, profile: m.profile, display_name: name })
                    }
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
              placeholder="Message your group…"
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
