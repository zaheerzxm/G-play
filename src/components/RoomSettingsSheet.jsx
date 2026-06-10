import { useState } from "react";
import { uploadRoomBackground } from "../roomAdmin.js";
import { ROOM_TAG_GROUPS, normalizeRoomTag, roomTagMeta, tagsInGroup } from "../roomTags.js";

const BACKGROUNDS = [
  { key: "golden_party", label: "Golden Party" },
  { key: "purple_club", label: "Purple Club" },
  { key: "starfield", label: "Starfield" },
];

export default function RoomSettingsSheet({
  room,
  onSave,
  onClose,
  isSuperAdmin = false,
  onDeleteRoom,
  onOpenAdmins,
  onOpenBlacklist,
  canAssignAdmins = false,
}) {
  const [title, setTitle] = useState(room.name ?? "");
  const [announcement, setAnnouncement] = useState(room.announcement ?? "");
  const [backgroundKey, setBackgroundKey] = useState(room.background_key ?? "golden_party");
  const [backgroundUrl, setBackgroundUrl] = useState(room.background_url ?? "");
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [roomTag, setRoomTag] = useState(normalizeRoomTag(room.room_tag ?? "chats"));
  const [highQuality, setHighQuality] = useState(room.high_quality !== false);
  const [banChat, setBanChat] = useState(Boolean(room.ban_chat));
  const [banImages, setBanImages] = useState(Boolean(room.ban_images));
  const [giftSound, setGiftSound] = useState(room.gift_sound !== false);
  const [partnerSeatEnabled, setPartnerSeatEnabled] = useState(room.partner_seat_enabled !== false);
  const [banRedPacket, setBanRedPacket] = useState(Boolean(room.ban_red_packet));
  const [busy, setBusy] = useState(false);

  const selectedMeta = roomTagMeta(roomTag);

  async function savePatch(patch) {
    setBusy(true);
    try {
      await onSave(patch);
    } finally {
      setBusy(false);
    }
  }

  function saveTitle() {
    const next = title.trim() || room.name;
    if (next !== room.name) savePatch({ name: next });
  }

  function saveAnnouncement() {
    const next = announcement.trim() || null;
    if (next !== (room.announcement ?? null)) savePatch({ announcement: next });
  }

  async function handleBackgroundFile(file) {
    setBackgroundFile(file);
    if (!file) return;
    setBusy(true);
    try {
      const nextBackgroundUrl = await uploadRoomBackground(room.id, room.owner_id, file);
      setBackgroundUrl(nextBackgroundUrl);
      setBackgroundFile(null);
      await onSave({ background_url: nextBackgroundUrl });
    } finally {
      setBusy(false);
    }
  }

  function instantToggle(setter, key) {
    return (event) => {
      const next = event.target.checked;
      setter(next);
      savePatch({ [key]: next });
    };
  }

  return (
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div className="room-settings-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="room-settings-nav">
          <button type="button" className="room-settings-back" onClick={onClose} aria-label="Back">‹</button>
          <h3 className="room-settings-title">Settings</h3>
          <span />
        </div>

        <div className="room-settings-group">
          <label className="room-settings-row">
            <span>Title</span>
            <input
              className="room-settings-inline-input"
              value={title}
              maxLength={40}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              disabled={busy}
            />
          </label>
          <label className="room-settings-row">
            <span>Cover</span>
            <span className="room-settings-avatar-preview">
              {(room.name || "R").charAt(0).toUpperCase()}
            </span>
          </label>
          <label className="room-settings-row room-settings-row--stack">
            <span>Announcement</span>
            <textarea
              className="room-settings-textarea"
              rows={3}
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              onBlur={saveAnnouncement}
              disabled={busy}
            />
          </label>
          <label className="room-settings-row">
            <span>Mode</span>
            <span className="room-settings-value">{(room.room_mode || "normal").replace(/^\w/, (c) => c.toUpperCase())}</span>
          </label>
          <label className="room-settings-row">
            <span>Tag</span>
            <select
              className="room-settings-select"
              value={roomTag}
              disabled={busy}
              onChange={(e) => {
                const next = e.target.value;
                setRoomTag(next);
                savePatch({ room_tag: next });
              }}
            >
              {ROOM_TAG_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {tagsInGroup(group).map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="room-settings-row">
            <span>Background</span>
            <select
              className="room-settings-select"
              value={backgroundKey}
              disabled={busy}
              onChange={(e) => {
                const next = e.target.value;
                setBackgroundKey(next);
                setBackgroundUrl("");
                setBackgroundFile(null);
                savePatch({ background_key: next, background_url: null });
              }}
            >
              {BACKGROUNDS.map((b) => (
                <option key={b.key} value={b.key}>{b.label}</option>
              ))}
            </select>
          </label>
          <label className="room-settings-row room-settings-row--upload">
            <span>Custom background</span>
            <span className="room-background-upload">
              {backgroundFile ? backgroundFile.name : backgroundUrl ? "Change image" : "Upload image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={busy}
                onChange={(e) => handleBackgroundFile(e.target.files?.[0] ?? null)}
              />
            </span>
          </label>
          {(backgroundUrl || backgroundFile) && (
            <button
              type="button"
              className="room-background-clear"
              disabled={busy}
              onClick={() => {
                setBackgroundFile(null);
                setBackgroundUrl("");
                savePatch({ background_url: null });
              }}
            >
              Use built-in background
            </button>
          )}
        </div>

        <div className="room-settings-group">
          <label className="room-settings-row">
            <span>Partner Seat</span>
            <span className="room-settings-value">Enable All</span>
            <input type="checkbox" checked={partnerSeatEnabled} disabled={busy} onChange={instantToggle(setPartnerSeatEnabled, "partner_seat_enabled")} />
          </label>
        </div>

        <div className="room-settings-group">
          <label className="room-settings-row">
            <span>High Quality Mode</span>
            <input type="checkbox" checked={highQuality} disabled={busy} onChange={instantToggle(setHighQuality, "high_quality")} />
          </label>
          <label className="room-settings-row">
            <span>Gift Sound</span>
            <input type="checkbox" checked={giftSound} disabled={busy} onChange={instantToggle(setGiftSound, "gift_sound")} />
          </label>
          <label className="room-settings-row">
            <span>Ban Text Chatting</span>
            <input type="checkbox" checked={banChat} disabled={busy} onChange={instantToggle(setBanChat, "ban_chat")} />
          </label>
          <label className="room-settings-row">
            <span>No Images</span>
            <input type="checkbox" checked={banImages} disabled={busy} onChange={instantToggle(setBanImages, "ban_images")} />
          </label>
          <label className="room-settings-row">
            <span>Ban Red Packet</span>
            <input type="checkbox" checked={banRedPacket} disabled={busy} onChange={instantToggle(setBanRedPacket, "ban_red_packet")} />
          </label>
        </div>

        <div className="room-settings-group">
          {canAssignAdmins && (
            <button type="button" className="room-settings-row room-settings-row--link" onClick={onOpenAdmins}>
              <span>Admin</span>
              <span className="room-settings-value">›</span>
            </button>
          )}
          <button type="button" className="room-settings-row room-settings-row--link" onClick={onOpenBlacklist}>
            <span>Blacklist</span>
            <span className="room-settings-value">›</span>
          </button>
          <div className="room-settings-row">
            <span>Room ID</span>
            <span className="room-settings-value">{room.room_code || room.id}</span>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="room-settings-group">
            <button
              type="button"
              className="room-settings-delete"
              disabled={busy}
              onClick={onDeleteRoom}
            >
              Delete Room
            </button>
          </div>
        )}

        {busy && <p className="room-settings-saving">Saving…</p>}
      </div>
    </div>
  );
}
