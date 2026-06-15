import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { countryDisplay } from "../countries.js";
import {
  dmWallpaperOptions,
  loadDmAlias,
  loadDmBlockInvites,
  loadDmMuted,
  loadDmWallpaper,
  saveDmAlias,
  saveDmBlockInvites,
  saveDmMuted,
  saveDmWallpaper,
} from "../dmChatPrefs.js";
import { blockUser, hasBlockedUser, unblockUser } from "../userBlocks.js";
import AvatarImg from "./AvatarImg.jsx";
import VipDisplayName from "./VipDisplayName.jsx";

function SettingsRow({ label, value, onClick, children }) {
  if (children) {
    return (
      <div className="chat-settings-row chat-settings-row--toggle">
        <span>{label}</span>
        {children}
      </div>
    );
  }
  return (
    <button type="button" className="chat-settings-row" onClick={onClick}>
      <span>{label}</span>
      <span className="chat-settings-row-right">
        {value && <span className="chat-settings-row-value">{value}</span>}
        <span className="chat-settings-row-chevron" aria-hidden>›</span>
      </span>
    </button>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      className={`chat-settings-toggle ${on ? "chat-settings-toggle--on" : ""}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
    >
      <span className="chat-settings-toggle-knob" />
    </button>
  );
}

export default function ChatSettingsSheet({
  userId,
  friend,
  peerProfile,
  onClose,
  onOpenProfile,
  onToast,
  onBlocked,
}) {
  const [alias, setAlias] = useState("");
  const [muted, setMuted] = useState(false);
  const [blockInvites, setBlockInvites] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [wallpaperKey, setWallpaperKey] = useState("default");
  const [wallpaperOpen, setWallpaperOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const profile = peerProfile ?? friend;
  const country = countryDisplay(profile?.country_code);
  const displayName = friend?.display_name || "Player";
  const wallpaperLabel = dmWallpaperOptions().find((w) => w.key === wallpaperKey)?.label ?? "Default";

  useEffect(() => {
    if (!userId || !friend?.id) return;
    setAlias(loadDmAlias(userId, friend.id));
    setMuted(loadDmMuted(userId, friend.id));
    setBlockInvites(loadDmBlockInvites(userId, friend.id));
    setWallpaperKey(loadDmWallpaper(userId, friend.id).key);
    hasBlockedUser(userId, friend.id).then(setBlocked).catch(() => setBlocked(false));
  }, [userId, friend?.id]);

  function handleChangeAlias() {
    const next = window.prompt("Nickname for this chat", alias || displayName);
    if (next === null) return;
    const trimmed = next.trim();
    saveDmAlias(userId, friend.id, trimmed);
    setAlias(trimmed);
    onToast?.(trimmed ? "Alias updated" : "Alias cleared");
  }

  async function handleBlockToggle(next) {
    if (busy) return;
    if (next && !window.confirm(`Block ${displayName}? You won't be able to chat.`)) return;
    setBusy(true);
    try {
      if (next) {
        await blockUser(userId, friend.id);
        setBlocked(true);
        onToast?.("User blocked");
        onBlocked?.();
      } else {
        await unblockUser(userId, friend.id);
        setBlocked(false);
        onToast?.("User unblocked");
      }
    } catch (e) {
      onToast?.(e.message ?? "Could not update block");
    } finally {
      setBusy(false);
    }
  }

  const sheet = (
    <div className="gplay-mobile-shell-backdrop gplay-mobile-shell-backdrop--chat-settings" onClick={onClose}>
      <div className="gplay-mobile-shell chat-settings-page" onClick={(e) => e.stopPropagation()}>
        <header className="chat-settings-header">
          <button type="button" className="chat-settings-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <h1>Chat Settings</h1>
          <span className="chat-settings-header-spacer" aria-hidden />
        </header>

        <div className="chat-settings-scroll">
          <button type="button" className="chat-settings-profile-card" onClick={onOpenProfile}>
            <AvatarImg
              src={profile?.avatar_url}
              fallback={displayName}
              className="chat-settings-profile-avatar"
              imgClassName="chat-settings-profile-avatar"
            />
            <span className="chat-settings-profile-meta">
              <VipDisplayName name={displayName} profile={profile} variant="light" className="chat-settings-profile-name" />
              {country && (
                <small className="chat-settings-profile-country">
                  {country.flag} {country.label}
                </small>
              )}
            </span>
            <span className="chat-settings-row-chevron" aria-hidden>›</span>
          </button>

          <section className="chat-settings-group">
            <SettingsRow
              label="Change Alias"
              value={alias || displayName}
              onClick={handleChangeAlias}
            />
          </section>

          <section className="chat-settings-group">
            <SettingsRow
              label="Create Group"
              onClick={() => onToast?.("Create Group — coming soon (stub)")}
            />
            <SettingsRow
              label="Choose a background"
              value={wallpaperLabel}
              onClick={() => setWallpaperOpen((v) => !v)}
            />
            {wallpaperOpen && (
              <div className="chat-settings-wallpapers">
                {dmWallpaperOptions().map((w) => (
                  <button
                    key={w.key}
                    type="button"
                    className={`chat-settings-wallpaper ${wallpaperKey === w.key ? "chat-settings-wallpaper--active" : ""}`}
                    style={w.css ? { background: w.css } : undefined}
                    onClick={() => {
                      saveDmWallpaper(userId, friend.id, w.key);
                      setWallpaperKey(w.key);
                      onToast?.(`Background: ${w.label}`);
                    }}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            )}
            <SettingsRow label="Mute Notification">
              <Toggle
                label="Mute Notification"
                on={muted}
                onChange={(v) => {
                  setMuted(v);
                  saveDmMuted(userId, friend.id, v);
                }}
              />
            </SettingsRow>
            <SettingsRow label="Block his/her gaming invitation">
              <Toggle
                label="Block gaming invitations"
                on={blockInvites}
                onChange={(v) => {
                  setBlockInvites(v);
                  saveDmBlockInvites(userId, friend.id, v);
                }}
              />
            </SettingsRow>
            <SettingsRow label="Block">
              <Toggle label="Block user" on={blocked} onChange={handleBlockToggle} />
            </SettingsRow>
          </section>

          <section className="chat-settings-group">
            <SettingsRow
              label="Report"
              onClick={() => onToast?.("Report submitted — thank you")}
            />
          </section>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
