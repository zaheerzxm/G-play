import { useEffect, useState } from "react";
import { updateProfile, uploadProfileAvatar } from "../profile.js";
import { cpLimitHint } from "../relationships.js";
import UserBadges from "./UserBadges.jsx";

function initialFor(profile) {
  return (profile?.display_name || "?").charAt(0).toUpperCase();
}

export default function EditProfileSheet({ profile, userId, onClose, onProfileUpdate, onToast }) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarObjectUrl, setAvatarObjectUrl] = useState(null);
  const [gender, setGender] = useState(profile.gender ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarObjectUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const avatarPreview = avatarObjectUrl || avatarUrl.trim() || profile.avatar_url;

  async function copyUserId() {
    if (!profile.user_code) return;
    try {
      await navigator.clipboard.writeText(profile.user_code);
      onToast?.("User ID copied");
    } catch {
      onToast?.(`Your ID: ${profile.user_code}`);
    }
  }

  async function handleSave() {
    setBusy(true);
    try {
      let nextAvatarUrl = avatarUrl;
      if (avatarFile) {
        nextAvatarUrl = await uploadProfileAvatar(userId, avatarFile);
        setAvatarUrl(nextAvatarUrl);
        setAvatarFile(null);
      }
      const updated = await updateProfile(userId, {
        displayName,
        avatarUrl: nextAvatarUrl,
        gender,
      });
      onProfileUpdate(updated);
      onToast?.("Profile saved");
      onClose();
    } catch (e) {
      onToast?.(e.message ?? "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="edit-profile-page">
      <header className="edit-profile-header">
        <button type="button" className="sheet-back" onClick={onClose} aria-label="Back">‹</button>
        <h1>Edit Profile</h1>
      </header>

      <section className="edit-profile-section">
        <label className="edit-profile-row edit-profile-row--avatar">
          <span>Avatar</span>
          <span className="edit-profile-row-val">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="edit-profile-avatar" />
            ) : (
              <span className="edit-profile-avatar edit-profile-avatar--fallback">{initialFor(profile)}</span>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="edit-profile-file"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
            <span className="edit-profile-chevron">›</span>
          </span>
        </label>
        <label className="edit-profile-row">
          <span>Nickname</span>
          <input
            type="text"
            className="edit-profile-input"
            maxLength={24}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
        <button type="button" className="edit-profile-row" onClick={copyUserId}>
          <span>User ID</span>
          <span className="edit-profile-row-val edit-profile-muted">{profile.user_code ?? "…"} ›</span>
        </button>
      </section>

      <section className="edit-profile-section">
        <label className="edit-profile-row">
          <span>Gender</span>
          <select className="edit-profile-select" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        {gender && <p className="edit-profile-hint">{cpLimitHint(gender)}</p>}
      </section>

      <section className="edit-profile-section">
        <div className="edit-profile-row edit-profile-row--static">
          <span>Level</span>
          <span className="edit-profile-row-val">Lv.{profile.user_level ?? 1}</span>
        </div>
        <div className="edit-profile-row edit-profile-row--static">
          <span>Badge</span>
          <span className="edit-profile-row-val">
            <UserBadges profile={profile} compact />
          </span>
        </div>
      </section>

      <button
        type="button"
        className="edit-profile-save"
        disabled={busy || displayName.trim().length < 2 || !gender}
        onClick={handleSave}
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
