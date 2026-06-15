import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CHAT_BUBBLE_CATALOG,
  CHAT_BUBBLE_SAMPLE_TEXT,
  inventoryPayloadFromBubble,
} from "../chatBubbleCatalog.js";
import { loadMyClan } from "../clans.js";
import { formatCompactNumber } from "../formatCompact.js";
import { formatCoins } from "../gifts.js";
import { effectiveVipLevel } from "../vipStatus.js";
import {
  addShopItemToInventory,
  loadUserShopInventory,
  userOwnsShopItem,
} from "../userShopInventory.js";
import { deductWalletCoins } from "../wallet.js";
import CoinIcon from "./CoinIcon.jsx";
import { IconInventory } from "./NavIcons.jsx";

function bubbleLockReason(item, profile, hasClan) {
  if (item.source === "vip" && effectiveVipLevel(profile) < item.minVip) {
    return `VIP ${item.minVip}`;
  }
  if (item.source === "family" && item.requiresClan && !hasClan) {
    return "Join a Family";
  }
  return null;
}

export default function ChatBubbleShop({
  userId,
  profile,
  coins,
  isSuperAdmin,
  onClose,
  onToast,
  onCoinsChange,
  onOpenInventory,
}) {
  const [busy, setBusy] = useState(null);
  const [hasClan, setHasClan] = useState(false);
  const [ownedIds, setOwnedIds] = useState(() => new Set());

  const refreshOwned = useCallback(() => {
    const ids = new Set(
      loadUserShopInventory(userId)
        .filter((row) => row.type === "chat_bubble")
        .map((row) => row.id),
    );
    setOwnedIds(ids);
  }, [userId]);

  useEffect(() => {
    refreshOwned();
  }, [refreshOwned]);

  useEffect(() => {
    if (!userId) {
      setHasClan(false);
      return;
    }
    let cancelled = false;
    loadMyClan(userId)
      .then((clan) => {
        if (!cancelled) setHasClan(Boolean(clan?.id));
      })
      .catch(() => {
        if (!cancelled) setHasClan(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const vipLevel = useMemo(() => effectiveVipLevel(profile), [profile]);

  async function handleAcquire(item) {
    if (!userId || busy) return;
    if (ownedIds.has(item.id) || userOwnsShopItem(userId, item.id)) {
      onToast?.("Already owned");
      return;
    }

    const locked = bubbleLockReason(item, profile, hasClan);
    if (locked) {
      onToast?.(locked === "Join a Family" ? locked : `Requires ${locked}`);
      return;
    }

    setBusy(item.id);
    try {
      if (item.source === "coin") {
        if (!isSuperAdmin && coins < item.cost) {
          onToast?.(`Need ${item.cost} coins`);
          return;
        }
        if (!isSuperAdmin) {
          const balance = await deductWalletCoins(userId, item.cost);
          onCoinsChange?.(balance);
        }
      }

      addShopItemToInventory(userId, inventoryPayloadFromBubble(item));
      refreshOwned();
      onToast?.(
        item.source === "coin"
          ? `${item.name} added to inventory!`
          : `${item.name} unlocked!`,
      );
    } catch (err) {
      onToast?.(err?.message ?? "Could not acquire bubble");
    } finally {
      setBusy(null);
    }
  }

  const sheet = (
    <div className="gplay-mobile-shell-backdrop" onClick={onClose}>
      <div
        className="gplay-mobile-shell shop-sheet shop-sheet--v2 chat-bubble-shop"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="hub-sheet-header shop-sheet-header-v2">
          <button type="button" className="hub-sheet-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <h2>Chat Bubble</h2>
          <button
            type="button"
            className="shop-bag-btn chat-bubble-shop-bag"
            onClick={onOpenInventory}
            aria-label="Chat bubble inventory"
          >
            <IconInventory />
          </button>
        </header>

        <div className="shop-sheet-scroll">
          <div className="shop-balance-row">
            <span className="shop-balance-label">Balance:</span>
            <span className="shop-balance-coins shop-balance-coins--gold chat-bubble-shop-balance">
              <CoinIcon size="sm" />
              {formatCoins(coins, isSuperAdmin)}
            </span>
          </div>

          <div className="chat-bubble-shop-grid">
            {CHAT_BUBBLE_CATALOG.map((item) => {
              const owned = ownedIds.has(item.id);
              const lockLabel = owned ? null : bubbleLockReason(item, profile, hasClan);
              const locked = Boolean(lockLabel);

              return (
                <button
                  key={item.id}
                  type="button"
                  className={[
                    "chat-bubble-shop-card",
                    owned ? "chat-bubble-shop-card--owned" : "",
                    locked ? "chat-bubble-shop-card--locked" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ background: item.bg }}
                  disabled={busy === item.id || owned}
                  onClick={() => handleAcquire(item)}
                >
                  <div className={`chat-bubble-preview ${item.previewClass}`}>
                    <span className="chat-bubble-preview-text">{CHAT_BUBBLE_SAMPLE_TEXT}</span>
                  </div>

                  <strong className="chat-bubble-shop-name">{item.name}</strong>

                  {owned ? (
                    <span className="chat-bubble-shop-tag chat-bubble-shop-tag--owned">Owned</span>
                  ) : item.source === "coin" ? (
                    <span className="chat-bubble-shop-tag chat-bubble-shop-tag--coin">
                      <CoinIcon size="sm" /> {formatCompactNumber(item.cost)}
                    </span>
                  ) : item.source === "vip" ? (
                    <span className="chat-bubble-shop-tag chat-bubble-shop-tag--vip">
                      {item.tag ?? `VIP ${item.minVip}`}
                    </span>
                  ) : (
                    <span className="chat-bubble-shop-tag chat-bubble-shop-tag--family">
                      {item.tag ?? "From Family"}
                    </span>
                  )}

                  {locked && !owned && (
                    <span className="chat-bubble-shop-lock" aria-hidden>
                      🔒 {lockLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {vipLevel > 0 && (
            <p className="chat-bubble-shop-hint">Your VIP level: {vipLevel}</p>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
