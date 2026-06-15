import { useEffect, useState } from "react";
import {
  decideClanApplication,
  leaveClan,
  loadClanApplications,
  updateClanSettings,
} from "../../clans.js";
import AvatarImg from "../AvatarImg.jsx";

export default function ClanManageTab({ clan, userId, onRefresh, onLeft, onToast }) {
  const [name, setName] = useState(clan.name ?? "");
  const [intro, setIntro] = useState(clan.intro ?? "");
  const [signLabel, setSignLabel] = useState(clan.sign_label ?? "");
  const [announcement, setAnnouncement] = useState(clan.announcement ?? "");
  const [joinMode, setJoinMode] = useState(clan.join_mode ?? "application");
  const [acceptApps, setAcceptApps] = useState(clan.accept_applications !== false);
  const [minCharm, setMinCharm] = useState(clan.min_charm_level ?? 0);
  const [applications, setApplications] = useState([]);
  const [busy, setBusy] = useState(false);
  const [decideBusy, setDecideBusy] = useState(null);

  useEffect(() => {
    loadClanApplications(clan.id).then(setApplications).catch(() => {});
  }, [clan.id]);

  async function handleSave(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await updateClanSettings(clan.id, userId, {
        name,
        intro,
        sign_label: signLabel,
        announcement,
        join_mode: joinMode,
        accept_applications: acceptApps,
        min_charm_level: minCharm,
      });
      onToast?.("Clan settings saved");
      onRefresh?.();
    } catch (err) {
      onToast?.(err?.message ?? "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function handleDecide(app, approve) {
    if (decideBusy) return;
    setDecideBusy(app.id);
    try {
      await decideClanApplication({
        applicationId: app.id,
        clanId: clan.id,
        approverId: userId,
        approve,
      });
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
      onToast?.(approve ? "Application approved" : "Application rejected");
      if (approve) onRefresh?.();
    } catch (err) {
      onToast?.(err?.message ?? "Could not decide");
    } finally {
      setDecideBusy(null);
    }
  }

  async function handleLeave() {
    if (busy || !window.confirm("Leave this clan?")) return;
    setBusy(true);
    try {
      await leaveClan(userId);
      onToast?.("Left clan");
      onLeft?.();
    } catch (err) {
      onToast?.(err?.message ?? "Could not leave");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="clan-manage-tab">
      <form className="clan-manage-form" onSubmit={handleSave}>
        <label className="clan-field">
          <span>Clan title</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
        </label>
        <label className="clan-field">
          <span>Sign label</span>
          <input type="text" value={signLabel} onChange={(e) => setSignLabel(e.target.value)} maxLength={32} placeholder="Motto or tagline" />
        </label>
        <label className="clan-field">
          <span>Intro</span>
          <textarea value={intro} onChange={(e) => setIntro(e.target.value)} maxLength={200} rows={2} />
        </label>
        <label className="clan-field">
          <span>Announcement</span>
          <textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value)} maxLength={300} rows={2} />
        </label>

        <fieldset className="clan-fieldset">
          <legend>Join settings</legend>
          <label className="clan-radio">
            <input
              type="radio"
              name="joinMode"
              checked={joinMode === "open"}
              onChange={() => setJoinMode("open")}
            />
            Free to join
          </label>
          <label className="clan-radio">
            <input
              type="radio"
              name="joinMode"
              checked={joinMode === "application"}
              onChange={() => setJoinMode("application")}
            />
            Application required
          </label>
          <label className="clan-check">
            <input type="checkbox" checked={acceptApps} onChange={(e) => setAcceptApps(e.target.checked)} />
            Accept applications
          </label>
          <label className="clan-field clan-field--inline">
            <span>Min charm level</span>
            <input
              type="number"
              min={0}
              max={20}
              value={minCharm}
              onChange={(e) => setMinCharm(Number(e.target.value))}
            />
          </label>
        </fieldset>

        <button type="submit" className="primary-btn" disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </button>
      </form>

      {applications.length > 0 && (
        <section className="clan-applications">
          <h4>Pending applications ({applications.length})</h4>
          <ul className="clan-applications-list">
            {applications.map((app) => {
              const nameLabel = app.profile?.display_name ?? "Player";
              return (
                <li key={app.id} className="clan-application-row">
                  <AvatarImg
                    src={app.profile?.avatar_url}
                    fallback={nameLabel}
                    className="clan-member-avatar"
                    imgClassName="clan-member-avatar"
                  />
                  <div className="clan-application-body">
                    <strong>{nameLabel}</strong>
                    {app.message && <p>{app.message}</p>}
                  </div>
                  <div className="clan-application-actions">
                    <button
                      type="button"
                      className="friends-request-accept"
                      disabled={decideBusy === app.id}
                      onClick={() => handleDecide(app, true)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="friends-request-reject"
                      disabled={decideBusy === app.id}
                      onClick={() => handleDecide(app, false)}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <button type="button" className="clan-leave-btn" disabled={busy} onClick={handleLeave}>
        Leave clan
      </button>
    </div>
  );
}
