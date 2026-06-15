import { useState } from "react";
import { createPortal } from "react-dom";
import { formatCompactNumber } from "../formatCompact.js";
import { deductWalletCoins } from "../wallet.js";
import { addShopItemToInventory } from "../userShopInventory.js";
import CoinIcon from "./CoinIcon.jsx";
import { IconInventory } from "./NavIcons.jsx";
import { formatCoins } from "../gifts.js";

const CATEGORIES = ["Relationship", "Decorations", "Voice Room", "Items", "Games", "Clan"];

const SHOP_ITEMS = [
  { id: "entry_fx", name: "Entry FX", emoji: "✨", category: "Items", cost: 300, bg: "#ede9fe", tag: "From Activity" },
  { id: "frame_sakura", name: "Sakura Frame", emoji: "🌸", category: "Decorations", cost: 500, bg: "#fdf2f8" },
  { id: "frame_ocean", name: "Ocean Frame", emoji: "🌊", category: "Decorations", cost: 800, bg: "#e0f2fe" },
  { id: "frame_gold", name: "Gold Frame", emoji: "🖼️", category: "Decorations", cost: 2000, bg: "#fef3c7" },
  { id: "room_stage", name: "Stage Theme", emoji: "🎤", category: "Voice Room", cost: 1200, bg: "#e0f2fe", tag: "From Activity" },
  { id: "room_entrance", name: "Room Entry", emoji: "🚪", category: "Voice Room", cost: 1800, bg: "#ede9fe" },
  { id: "room_nameplate", name: "Nameplate", emoji: "🏷️", category: "Voice Room", cost: 900, bg: "#fef9c3" },
  { id: "ring_silver", name: "Silver Ring", emoji: "💍", category: "Relationship", cost: 520, bg: "#f1f5f9" },
  { id: "ring_gold", name: "Gold Ring", emoji: "💛", category: "Relationship", cost: 1314, bg: "#fff7ed", tag: "From Activity" },
  { id: "couple_bg", name: "Couple BG", emoji: "💑", category: "Relationship", cost: 999, bg: "#fce7f3" },
  { id: "game_luck", name: "Lucky Boost", emoji: "🍀", category: "Games", cost: 300, bg: "#dcfce7" },
  { id: "game_dice", name: "Dice Skin", emoji: "🎲", category: "Games", cost: 420, bg: "#fee2e2" },
  { id: "game_bingo", name: "Bingo Card", emoji: "🅱️", category: "Games", cost: 520, bg: "#e0e7ff" },
  { id: "family_badge", name: "Clan Badge", emoji: "🏠", category: "Clan", cost: 600, bg: "#ffedd5" },
  { id: "family_flag", name: "Clan Flag", emoji: "🚩", category: "Clan", cost: 760, bg: "#fce7f3", tag: "From Activity" },
  { id: "family_frame", name: "Clan Frame", emoji: "👨‍👩‍👧", category: "Clan", cost: 1100, bg: "#dbeafe" },
];

export default function ShopSheet({
  userId,
  coins,
  isSuperAdmin,
  onClose,
  onToast,
  onCoinsChange,
  onOpenInventory,
  onOpenChatBubbleShop,
}) {
  const [tab, setTab] = useState("Relationship");
  const [busy, setBusy] = useState(null);

  const visible = SHOP_ITEMS.filter((item) => item.category === tab);
  const silverBalance = Math.floor(coins * 1.6);

  async function buyItem(item) {
    if (!isSuperAdmin && coins < item.cost) {
      onToast?.(`Need ${item.cost} coins`);
      return;
    }
    setBusy(item.id);
    try {
      if (!isSuperAdmin && userId) {
        const balance = await deductWalletCoins(userId, item.cost);
        onCoinsChange?.(balance);
      }
      addShopItemToInventory(userId, item);
      onToast?.(`${item.name} added to inventory!`);
    } catch (e) {
      onToast?.(e.message ?? "Purchase failed");
    } finally {
      setBusy(null);
    }
  }

  const sheet = (
    <div className="gplay-mobile-shell-backdrop" onClick={onClose}>
      <div className="gplay-mobile-shell shop-sheet shop-sheet--v2" onClick={(e) => e.stopPropagation()}>
        <header className="hub-sheet-header shop-sheet-header-v2">
          <button type="button" className="hub-sheet-back" onClick={onClose} aria-label="Back">‹</button>
          <h2>Shop</h2>
          <button type="button" className="shop-bag-btn" onClick={onOpenInventory} aria-label="Inventory">
            <IconInventory />
          </button>
        </header>

        <div className="shop-sheet-scroll">
          <div className="shop-balance-row">
            <span className="shop-balance-label">Balance:</span>
            <span className="shop-balance-coins shop-balance-coins--silver">
              <span className="shop-coin-icon shop-coin-icon--silver" aria-hidden>◎</span>
              {formatCompactNumber(silverBalance)}
            </span>
            <span className="shop-balance-coins shop-balance-coins--gold">
              <CoinIcon size="sm" />
              {formatCoins(coins, isSuperAdmin)}
              <button type="button" className="shop-balance-topup" aria-label="Top up">+</button>
            </span>
          </div>

          <button
            type="button"
            className="shop-chat-bubble-entry"
            onClick={onOpenChatBubbleShop}
          >
            <span className="shop-chat-bubble-entry-icon" aria-hidden>
              💬
            </span>
            <div className="shop-chat-bubble-entry-copy">
              <strong>Chat Bubble</strong>
              <span>Style your messages</span>
            </div>
            <span className="shop-chat-bubble-entry-chevron" aria-hidden>
              ›
            </span>
          </button>

          <div className="shop-avatar-banner">
            <div className="shop-avatar-banner-art" aria-hidden>🧑‍🎤👧</div>
            <div className="shop-avatar-banner-copy">
              <strong>3D Avatar</strong>
              <span className="shop-avatar-banner-pill">Dollify Your New Self</span>
            </div>
          </div>

          <div className="shop-tabs shop-tabs--v2">
            {CATEGORIES.map((t) => (
              <button
                key={t}
                type="button"
                className={tab === t ? "shop-tab--active" : ""}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Relationship" && (
            <p className="shop-section-divider">
              <span>Wedding Ring</span>
            </p>
          )}

          <div className="shop-grid shop-grid--v2 shop-grid--rings">
            {visible.map((item) => (
              <button
                key={item.id}
                type="button"
                className="shop-card-v2"
                style={{ background: item.bg }}
                disabled={busy === item.id}
                onClick={() => buyItem(item)}
              >
                {item.tag && <span className="shop-card-tag">{item.tag}</span>}
                <span className="shop-card-emoji">{item.emoji}</span>
                <strong>{item.name}</strong>
                <span className="shop-card-cost coin-inline">
                  <CoinIcon size="sm" /> {formatCompactNumber(item.cost)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
