import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  VIP_GATED_PRIVACY,
  canEnablePrivacyToggle,
  loadPrivacySettings,
  privacyFromProfile,
  savePrivacySettings,
} from "../privacySettings.js";
import { effectiveVipLevel } from "../vipStatus.js";

function Toggle({ on, disabled, onChange, label }) {
  return (
    <button
      type="button"
      className={`chat-settings-toggle ${on ? "chat-settings-toggle--on" : ""}${disabled ? " chat-settings-toggle--disabled" : ""}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!on)}
    >
      <span className="chat-settings-toggle-knob" />
    </button>
  );
}

const SECTIONS = [
  {
    title: "Profile visibility",
    rows: [
      { key: "hide_stats", label: "Stats", hint: "Hide game stats from other users" },
      { key: "hide_voice_rooms_joined", label: "Voice rooms joined", hint: "Hide joined rooms on your profile" },
      { key: "hide_location", label: "Hide Location", hint: "Hide country/region from other users" },
    ],
  },
  {
    title: "Social",
    rows: [
      { key: "do_not_recommend", label: "Do Not Recommend", hint: "Opt out of friend recommendations" },
      { key: "hide_moment_sharing", label: "Post sharing", hint: "Limit moment/post sharing visibility" },
    ],
  },
  {
    title: "VIP privacy",
    rows: [
      { key: "incognito_visit", label: "Incognito Visit", vip: 6, hint: "Visit profiles without appearing in Visitors" },
      { key: "hide_recent_gifts", label: "Hide recent gifts", vip: 7, hint: "Hide recent gift activity from others" },
      { key: "hide_guardian_board", label: "Hide Guardian board", vip: 8, hint: "Hide Guard ranking from other users" },
    ],
  },
  {
    title: "Invitations",
    rows: [
      {
        key: "block_game_invites_global",
        label: "Game Invitation Blacklist",
        hint: "Block game invites globally (enforcement coming later)",
      },
    ],
  },
];

export default function PrivacySettingsSheet({ userId, profile, onClose, onToast, onProfileUpdate }) {
  const [settings, setSettings] = useState(() => privacyFromProfile(profile));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const vipLevel = effectiveVipLevel(profile);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadPrivacySettings(userId)
      .then((rows) => {
        if (active) setSettings(rows);
      })
      .catch((err) => onToast?.(err?.message ?? "Could not load privacy settings"))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, onToast]);

  async function handleToggle(key, next) {
    if (busy) return;
    if (next && !canEnablePrivacyToggle(key, profile)) {
      onToast?.(`Requires VIP ${VIP_GATED_PRIVACY[key]}`);
      return;
    }
    setBusy(true);
    try {
      const saved = await savePrivacySettings(userId, { [key]: next }, profile);
      setSettings(saved);
      onProfileUpdate?.({ ...profile, privacy_settings: saved });
    } catch (err) {
      onToast?.(err?.message ?? "Could not save privacy setting");
    } finally {
      setBusy(false);
    }
  }

  const sheet = (
    <div className="gplay-mobile-shell-backdrop gplay-mobile-shell-backdrop--privacy" onClick={onClose}>
      <div className="gplay-mobile-shell privacy-settings-page" onClick={(e) => e.stopPropagation()}>
        <header className="privacy-settings-header">
          <button type="button" className="privacy-settings-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <h1>Privacy</h1>
          <span className="privacy-settings-header-spacer" aria-hidden />
        </header>

        <div className="privacy-settings-scroll">
          {loading && <p className="privacy-settings-note">Loading privacy settings…</p>}

          {!loading &&
            SECTIONS.map((section) => (
              <section key={section.title} className="privacy-settings-group">
                <h2 className="privacy-settings-group-title">{section.title}</h2>
                <ul className="privacy-settings-list">
                  {section.rows.map((row) => {
                    const locked = row.vip ? vipLevel < row.vip : false;
                    const on = Boolean(settings[row.key]);
                    return (
                      <li key={row.key} className="privacy-settings-row">
                        <div className="privacy-settings-row-copy">
                          <span className="privacy-settings-row-label">
                            {row.label}
                            {row.vip ? <em className="privacy-settings-vip-badge">V{row.vip}</em> : null}
                          </span>
                          {row.hint ? <small className="privacy-settings-row-hint">{row.hint}</small> : null}
                          {locked ? (
                            <small className="privacy-settings-row-lock">Requires VIP {row.vip}</small>
                          ) : null}
                        </div>
                        <Toggle
                          label={row.label}
                          on={on && !locked}
                          disabled={busy || locked}
                          onChange={(next) => handleToggle(row.key, next)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
