import { useEffect, useRef, useState } from "react";
import { COUNTRY_OPTIONS, formatProfileLocation } from "../countries.js";
import { updateProfile, uploadProfileAvatar } from "../profile.js";
import { markGameTaskProgress } from "../gameTasks.js";
import { cpLimitHint } from "../relationships.js";
import AvatarCropModal from "./AvatarCropModal.jsx";
import UserBadges from "./UserBadges.jsx";

function initialFor(profile) {
  return (profile?.display_name || "?").charAt(0).toUpperCase();
}

export default function EditProfileSheet({ profile, userId, onClose, onProfileUpdate, onToast }) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarObjectUrl, setAvatarObjectUrl] = useState(null);
  const [cropSourceUrl, setCropSourceUrl] = useState(null);
  const [gender, setGender] = useState(profile.gender ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [busy, setBusy] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    setDisplayName(profile.display_name ?? "");
    setAvatarUrl(profile.avatar_url ?? "");
    setAvatarFile(null);
    setGender(profile.gender ?? "");
    setCountry(profile.country ?? "");
    setBio(profile.bio ?? "");
  }, [profile.id, profile.display_name, profile.avatar_url, profile.gender, profile.country, profile.bio]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarObjectUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  useEffect(() => {
    if (!cropSourceUrl) return undefined;
    return () => URL.revokeObjectURL(cropSourceUrl);
  }, [cropSourceUrl]);

  const avatarPreview = avatarObjectUrl || avatarUrl.trim() || profile.avatar_url;

  function handleAvatarPick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      onToast?.("Choose an image file");
      return;
    }
    setCropSourceUrl(URL.createObjectURL(file));
  }

  function handleCropConfirm(file) {
    setAvatarFile(file);
    setCropSourceUrl(null);
  }

  function handleCropCancel(msg) {
    setCropSourceUrl(null);
    if (msg) onToast?.(msg);
  }

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
        displayName: displayName.trim(),
        avatarUrl: nextAvatarUrl || avatarUrl.trim() || profile.avatar_url || null,
        gender,
        country,
        bio,
      });
      markGameTaskProgress(userId, "edit_profile");
      onProfileUpdate?.((prev) => (prev ? { ...prev, ...updated } : updated));
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
        <button
          type="button"
          className="edit-profile-row edit-profile-row--avatar"
          onClick={() => avatarInputRef.current?.click()}
        >
          <span>Avatar</span>
          <span className="edit-profile-row-val">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="edit-profile-avatar" />
            ) : (
              <span className="edit-profile-avatar edit-profile-avatar--fallback">{initialFor(profile)}</span>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="edit-profile-file"
              onChange={handleAvatarPick}
            />
            <span className="edit-profile-chevron">›</span>
          </span>
        </button>
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
        <label className="edit-profile-row">
          <span>Country / Location</span>
          <select className="edit-profile-select" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Select…</option>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.label}
              </option>
            ))}
          </select>
        </label>
        {country && (
          <p className="edit-profile-hint">
            Shown as: {formatProfileLocation(country)}
          </p>
        )}
        <label className="edit-profile-row edit-profile-row--stack">
          <span>Bio / Signature</span>
          <textarea
            className="edit-profile-textarea"
            rows={3}
            maxLength={200}
            placeholder="Tell others about yourself"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </label>
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
        disabled={busy || displayName.trim().length < 2}
        onClick={handleSave}
      >
        {busy ? "Saving…" : "Save"}
      </button>

      {cropSourceUrl && (
        <AvatarCropModal
          imageSrc={cropSourceUrl}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
