import { useCallback, useEffect, useRef, useState } from "react";
import { charmTierFromTotal } from "../../charmTiers.js";
import {
  canManageClan,
  clanActivenessPercent,
  loadClanTasksState,
  loadMyClan,
  markClanTaskProgress,
} from "../../clans.js";
import ClanInviteSheet from "./ClanInviteSheet.jsx";
import ClanDonateSheet from "./ClanDonateSheet.jsx";
import ClanLanding from "./ClanLanding.jsx";
import ClanManageTab from "./ClanManageTab.jsx";
import ClanMembersTab from "./ClanMembersTab.jsx";
import ClanNewsTab from "./ClanNewsTab.jsx";
import ClanProfileTab from "./ClanProfileTab.jsx";
import ClanTasksTab from "./ClanTasksTab.jsx";

const HUB_TABS = [
  { key: "profile", label: "Profile" },
  { key: "tasks", label: "Tasks" },
  { key: "members", label: "Members" },
  { key: "news", label: "News" },
  { key: "manage", label: "Manage", managerOnly: true },
];

export default function ClanHubSheet({
  userId,
  profile,
  coins,
  isSuperAdmin = false,
  onCoinsChange,
  onClose,
  onToast,
  onClanJoined,
  onOpenClanChat,
  onJoinClanRoom,
  initialClanCode = "",
}) {
  const [clanData, setClanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("profile");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [activenessPct, setActivenessPct] = useState(0);
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;

  const charmLevel = charmTierFromTotal(profile?.charm ?? 0)?.level ?? 0;

  const refresh = useCallback(async () => {
    if (!userId) return null;
    const data = await loadMyClan(userId);
    setClanData(data);
    if (data?.id) {
      const taskState = await loadClanTasksState(userId, data.id);
      setActivenessPct(clanActivenessPercent(taskState));
    }
    return data;
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    refresh()
      .catch(() => onToastRef.current?.("Could not load clan"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const visibleTabs = HUB_TABS.filter(
    (t) => !t.managerOnly || canManageClan(clanData?.membership?.role),
  );

  async function handleJoined(result) {
    if (result?.id && result?.membership) {
      setClanData(result);
      const taskState = await loadClanTasksState(userId, result.id);
      setActivenessPct(clanActivenessPercent(taskState));
      setTab("profile");
      onClanJoined?.(result);
      return;
    }
    const data = await refresh();
    if (data) onClanJoined?.(data);
  }

  function handleReward(result) {
    if (result?.newBalance != null) onCoinsChange?.(result.newBalance);
    refresh();
  }

  function handleOpenDonate() {
    setTab("profile");
    setDonateOpen(true);
  }

  async function handleDonated() {
    if (userId && clanData?.id) {
      markClanTaskProgress(userId, clanData.id, "clan_donate", 1);
    }
    return refresh();
  }

  function goToClanChat() {
    if (clanData) onOpenClanChat?.(clanData);
  }

  return (
    <div className="clan-page">
      <header className="clan-page-header">
        <button type="button" className="clan-page-back" onClick={onClose} aria-label="Back">‹</button>
        <h2 className="clan-page-title">Clan</h2>
        {clanData && (
          <div className="clan-page-actions">
            <button
              type="button"
              className="clan-page-action-btn"
              onClick={() => setInviteOpen(true)}
              aria-label="Invite"
            >
              Invite
            </button>
          </div>
        )}
      </header>

      <div className="clan-page-body">
        {loading && <p className="hub-sheet-hint clan-page-loading">Loading…</p>}

        {!loading && !clanData && (
          <ClanLanding
            userId={userId}
            coins={coins}
            charmLevel={charmLevel}
            initialClanCode={initialClanCode}
            onCoinsChange={onCoinsChange}
            onJoined={handleJoined}
            onToast={onToast}
          />
        )}

        {!loading && clanData && (
          <>
            <div className="clan-hub-tabs">
              {visibleTabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={tab === t.key ? "clan-hub-tab--active" : ""}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="clan-hub-body">
              {tab === "profile" && (
                <ClanProfileTab
                  clan={clanData}
                  userId={userId}
                  activenessPct={activenessPct}
                  isSuperAdmin={isSuperAdmin}
                  onInvite={() => setInviteOpen(true)}
                  onJoinClanRoom={onJoinClanRoom}
                  onCoinsChange={onCoinsChange}
                  onToast={onToast}
                  onClanRefresh={refresh}
                  onOpenDonate={handleOpenDonate}
                />
              )}
              {tab === "tasks" && (
                <ClanTasksTab
                  userId={userId}
                  clanId={clanData.id}
                  onReward={handleReward}
                  onOpenChat={goToClanChat}
                  onOpenDonate={handleOpenDonate}
                  onToast={onToast}
                />
              )}
              {tab === "members" && (
                <ClanMembersTab
                  clanId={clanData.id}
                  userId={userId}
                  myRole={clanData.membership?.role}
                  onToast={onToast}
                  onRefresh={refresh}
                />
              )}
              {tab === "news" && <ClanNewsTab clanId={clanData.id} />}
              {tab === "manage" && canManageClan(clanData.membership?.role) && (
                <ClanManageTab
                  clan={clanData}
                  userId={userId}
                  onRefresh={refresh}
                  onLeft={onClose}
                  onToast={onToast}
                />
              )}
            </div>

            <footer className="clan-page-footer">
              <button type="button" className="clan-footer-btn clan-footer-btn--primary" onClick={() => setInviteOpen(true)}>
                + Invite to Clan
              </button>
            </footer>
          </>
        )}
      </div>

      {inviteOpen && clanData && (
        <ClanInviteSheet
          clan={clanData}
          userId={userId}
          onClose={() => setInviteOpen(false)}
          onToast={onToast}
        />
      )}

      {donateOpen && clanData && (
        <ClanDonateSheet
          clan={clanData}
          userId={userId}
          coins={coins}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setDonateOpen(false)}
          onToast={onToast}
          onCoinsChange={onCoinsChange}
          onDonated={handleDonated}
        />
      )}
    </div>
  );
}
