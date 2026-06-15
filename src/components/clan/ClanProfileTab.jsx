import { useEffect, useState } from "react";
import { formatCompactNumber } from "../../formatCompact.js";
import {
  claimClanWeeklyGift,
  clanWeeklyGiftStatus,
  openClanVoiceRoom,
} from "../../clans.js";
import {
  IconChest,
  IconGacha,
  IconShop,
  IconVoiceRoom,
  ModuleIcon,
  UiIcon,
} from "../NavIcons.jsx";
import AvatarImg from "../AvatarImg.jsx";
import ClanChestSheet from "./ClanChestSheet.jsx";

const WEEKLY_GIFT_MILESTONES = [10000, 30000, 60000, 100000];

const PERK_ITEMS = [
  { key: "chests", Icon: IconChest, label: "Clan Chests", hint: "Activeness rewards" },
  { key: "store", Icon: IconShop, label: "Clan Store", hint: "Coming in phase B" },
  { key: "gacha", Icon: IconGacha, label: "Clan Gacha", hint: "Coming in phase B" },
];

export default function ClanProfileTab({
  clan,
  userId,
  activenessPct,
  onInvite,
  onJoinClanRoom,
  onCoinsChange,
  onToast,
  onClanRefresh,
  onOpenDonate,
}) {
  const weeklyRank = clan.weekly_rank ?? "—";
  const activeness = Number(clan.activeness ?? 0) || Math.round(activenessPct * 1000);
  const [weeklyBusy, setWeeklyBusy] = useState(null);
  const [roomBusy, setRoomBusy] = useState(false);
  const [chestOpen, setChestOpen] = useState(false);
  const [chestGroup, setChestGroup] = useState("activeness");
  const [treasury, setTreasury] = useState({
    fund: clan.fund ?? 0,
    clan_coins: clan.clan_coins ?? 0,
    shield: clan.shield ?? 0,
  });

  function syncTreasury(nextClan) {
    setTreasury({
      fund: nextClan?.fund ?? 0,
      clan_coins: nextClan?.clan_coins ?? 0,
      shield: nextClan?.shield ?? 0,
    });
  }

  useEffect(() => {
    syncTreasury(clan);
  }, [clan?.fund, clan?.clan_coins, clan?.shield]);

  async function handleWeeklyClaim(threshold) {
    if (!userId || !clan?.id || weeklyBusy) return;
    setWeeklyBusy(threshold);
    try {
      const result = await claimClanWeeklyGift(userId, clan.id, threshold, activeness);
      onCoinsChange?.(result.newBalance);
      onToast?.(`Claimed ${result.coins} coins!`);
    } catch (e) {
      onToast?.(e.message ?? "Could not claim");
    } finally {
      setWeeklyBusy(null);
    }
  }

  async function handleClanRoom() {
    if (!userId || roomBusy) return;
    setRoomBusy(true);
    try {
      const room = await openClanVoiceRoom(userId, clan);
      if (onJoinClanRoom) {
        onJoinClanRoom(room);
      } else {
        onToast?.(`Clan room ${room.room_code} ready`);
      }
    } catch (e) {
      onToast?.(e.message ?? "Could not open clan room");
    } finally {
      setRoomBusy(false);
    }
  }

  function openChests(group = "activeness") {
    setChestGroup(group);
    setChestOpen(true);
  }

  function handlePerkClick(key) {
    if (key === "chests") {
      openChests("activeness");
      return;
    }
    if (key === "store" || key === "gacha") {
      onToast?.("Coming in phase B — earn Clan Coins via Donate first");
      return;
    }
  }

  async function handleTreasuryRefresh() {
    const refreshed = await onClanRefresh?.();
    if (refreshed) syncTreasury(refreshed);
  }

  return (
    <div className="clan-profile-tab">
      <div className="clan-profile-hero">
        <AvatarImg
          src={clan.avatar_url}
          fallback={clan.name}
          className="clan-profile-avatar"
          imgClassName="clan-profile-avatar"
        />
        <div className="clan-profile-hero-meta">
          <h3>{clan.name}</h3>
          <div className="clan-profile-badges">
            <span className="clan-level-badge">Lv.{clan.level ?? 1}</span>
            <span className="clan-id-badge">ID {clan.clan_code}</span>
          </div>
          {clan.sign_label && <p className="clan-sign-label">{clan.sign_label}</p>}
        </div>
      </div>

      <div className="clan-invite-row">
        <button type="button" className="clan-invite-inline-btn" onClick={onInvite}>
          + Invite to Clan
        </button>
      </div>

      <div className="clan-stat-row">
        <div className="clan-stat">
          <span>Weekly Rank</span>
          <strong>{weeklyRank}</strong>
        </div>
        <div className="clan-stat">
          <span>Activeness</span>
          <strong>{activenessPct}%</strong>
        </div>
      </div>

      <div className="clan-activeness-bar">
        <span style={{ width: `${activenessPct}%` }} />
      </div>

      <div className="clan-weekly-gifts">
        <h4>Weekly activeness gifts</h4>
        <div className="clan-weekly-gifts-row">
          {WEEKLY_GIFT_MILESTONES.map((threshold) => {
            const status = userId
              ? clanWeeklyGiftStatus(userId, clan.id, threshold, activeness)
              : activeness >= threshold
                ? "claimable"
                : "locked";
            return (
              <button
                key={threshold}
                type="button"
                className={`clan-weekly-gift-box clan-weekly-gift-box--${status}`}
                disabled={status !== "claimable" || weeklyBusy === threshold}
                onClick={() => handleWeeklyClaim(threshold)}
              >
                <em aria-hidden>{status === "claimed" ? "✓" : "🎁"}</em>
                <small>{formatCompactNumber(threshold)}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="clan-treasury">
        <h4>Treasury</h4>
        <div className="clan-treasury-grid">
          <div className="clan-treasury-item">
            <span>Fund</span>
            <strong>{formatCompactNumber(treasury.fund)}</strong>
          </div>
          <div className="clan-treasury-item">
            <span>Coins</span>
            <strong>{formatCompactNumber(treasury.clan_coins)}</strong>
          </div>
          <div className="clan-treasury-item">
            <span>Shield</span>
            <strong>{treasury.shield}</strong>
          </div>
        </div>
        <div className="clan-treasury-actions">
          <button type="button" className="clan-donate-inline-btn" onClick={onOpenDonate}>
            Donate
          </button>
        </div>
        <button
          type="button"
          className="clan-treasury-chest"
          onClick={() => openChests("treasury")}
        >
          <UiIcon Icon={IconChest} className="clan-treasury-chest-icon" />
          <span>Treasury Chest</span>
          <small>Level-gated rewards</small>
        </button>
      </div>

      {clan.announcement && (
        <div className="clan-announcement">
          <h4>Announcement</h4>
          <p>{clan.announcement}</p>
        </div>
      )}

      {clan.intro && (
        <div className="clan-intro">
          <h4>Intro</h4>
          <p>{clan.intro}</p>
        </div>
      )}

      <button
        type="button"
        className="clan-room-stub-btn clan-room-stub-btn--live"
        disabled={roomBusy}
        onClick={handleClanRoom}
      >
        <UiIcon Icon={IconVoiceRoom} className="clan-room-stub-icon" />
        {roomBusy ? "Opening…" : "Open Clan Room"}
      </button>

      <section className="clan-perks">
        <h4>Clan Guide</h4>
        <div className="clan-perks-grid">
          {PERK_ITEMS.map((p) => (
            <button
              key={p.key}
              type="button"
              className="clan-perk-card"
              onClick={() => handlePerkClick(p.key)}
            >
              <ModuleIcon Icon={p.Icon} />
              <strong>{p.label}</strong>
              <small>{p.hint}</small>
            </button>
          ))}
        </div>
      </section>

      {chestOpen && (
        <ClanChestSheet
          clan={clan}
          userId={userId}
          initialGroup={chestGroup}
          onClose={() => setChestOpen(false)}
          onToast={onToast}
          onCoinsChange={onCoinsChange}
          onClaimed={handleTreasuryRefresh}
        />
      )}
    </div>
  );
}
