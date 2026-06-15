import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CLAN_CHESTS } from "../../clanChestCatalog.js";
import {
  clanChestStatus,
  loadClanChestClaims,
  loadClanTasksClaimedToday,
  openClanChest,
} from "../../clanEconomy.js";
import { formatCompactNumber } from "../../formatCompact.js";
import CoinIcon from "../CoinIcon.jsx";

export default function ClanChestSheet({
  clan,
  userId,
  initialGroup = "activeness",
  onClose,
  onToast,
  onCoinsChange,
  onClaimed,
}) {
  const [group, setGroup] = useState(initialGroup);
  const [claimedKeys, setClaimedKeys] = useState(() => new Set());
  const [tasksClaimedToday, setTasksClaimedToday] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId || !clan?.id) return;
    setLoading(true);
    try {
      const [claims, tasks] = await Promise.all([
        loadClanChestClaims(userId, clan.id),
        loadClanTasksClaimedToday(userId, clan.id),
      ]);
      setClaimedKeys(claims);
      setTasksClaimedToday(tasks);
    } catch {
      setClaimedKeys(new Set());
      setTasksClaimedToday(0);
    } finally {
      setLoading(false);
    }
  }, [userId, clan?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visible = CLAN_CHESTS.filter((c) => c.group === group);
  const clanLevel = clan?.level ?? 1;

  async function handleClaim(chest) {
    if (!userId || !clan?.id || busyId) return;
    setBusyId(chest.id);
    try {
      const result = await openClanChest(clan.id, chest.id);
      if (result?.new_balance != null) {
        onCoinsChange?.(Number(result.new_balance));
      }
      await refresh();
      onClaimed?.();
      const coins = Number(result?.reward?.amount ?? chest.rewardCoins ?? 0);
      onToast?.(`Claimed ${formatCompactNumber(coins)} coins!`);
    } catch (err) {
      onToast?.(err?.message ?? "Could not claim chest");
    } finally {
      setBusyId(null);
    }
  }

  const sheet = (
    <div className="profile-card-backdrop" onClick={onClose}>
      <div className="hub-sheet clan-chest-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="hub-sheet-header">
          <button type="button" className="hub-sheet-back" onClick={onClose}>
            ←
          </button>
          <h2>Clan Chests</h2>
          <span />
        </header>

        <div className="clan-chest-tabs">
          <button
            type="button"
            className={group === "activeness" ? "clan-chest-tab--active" : ""}
            onClick={() => setGroup("activeness")}
          >
            Activeness
          </button>
          <button
            type="button"
            className={group === "treasury" ? "clan-chest-tab--active" : ""}
            onClick={() => setGroup("treasury")}
          >
            Treasury
          </button>
        </div>

        {loading ? (
          <p className="hub-sheet-hint">Loading chests…</p>
        ) : (
          <ul className="clan-chest-list">
            {visible.map((chest) => {
              const status = clanChestStatus(chest, {
                claimedKeys,
                tasksClaimedToday,
                clanLevel,
              });
              return (
                <li key={chest.id} className={`clan-chest-row clan-chest-row--${status}`}>
                  <div className="clan-chest-row-copy">
                    <strong>{chest.name}</strong>
                    <p>{chest.description}</p>
                    <span className="clan-chest-reward coin-inline">
                      <CoinIcon size="sm" /> {formatCompactNumber(chest.rewardCoins)}
                    </span>
                  </div>
                  {status === "claimed" ? (
                    <span className="clan-chest-btn clan-chest-btn--done">Claimed</span>
                  ) : status === "locked" ? (
                    <span className="clan-chest-btn clan-chest-btn--locked">Locked</span>
                  ) : (
                    <button
                      type="button"
                      className="clan-chest-btn clan-chest-btn--claim"
                      disabled={busyId === chest.id}
                      onClick={() => handleClaim(chest)}
                    >
                      {busyId === chest.id ? "…" : "Claim"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {group === "activeness" && (
          <p className="clan-chest-hint">
            Tasks claimed today: {tasksClaimedToday} / 4
          </p>
        )}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
