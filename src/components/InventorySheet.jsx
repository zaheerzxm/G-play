import { useEffect, useState } from "react";
import { GIFT_CATALOG } from "../gifts.js";
import { loadGiftInventory } from "../giftInventory.js";
import { loadUserShopInventory } from "../userShopInventory.js";

export default function InventorySheet({ userId, onClose, filterType = null }) {
  const [giftItems, setGiftItems] = useState([]);
  const [shopItems, setShopItems] = useState([]);

  useEffect(() => {
    if (!userId) return;
    loadGiftInventory(userId)
      .then((map) => {
        const rows = Object.entries(map)
          .filter(([, row]) => Number(row?.quantity ?? 0) > 0)
          .map(([giftId, row]) => {
            const gift = GIFT_CATALOG.find((g) => g.id === giftId);
            return {
              id: giftId,
              name: gift?.name ?? giftId,
              emoji: gift?.emoji ?? "🎁",
              quantity: row.quantity,
              source: "gift",
            };
          });
        setGiftItems(rows);
      })
      .catch(() => setGiftItems([]));

    const allShop = loadUserShopInventory(userId);
    setShopItems(
      filterType ? allShop.filter((item) => item.type === filterType) : allShop,
    );
  }, [userId, filterType]);

  const allItems = filterType ? shopItems : [...shopItems, ...giftItems];
  const isEmpty = allItems.length === 0;
  const title = filterType === "chat_bubble" ? "Chat Bubbles" : "Inventory";
  const emptyMessage =
    filterType === "chat_bubble"
      ? "No chat bubbles yet — visit the Chat Bubble shop!"
      : "Your bag is empty — visit the Shop to get items!";

  return (
    <div className="profile-card-backdrop" onClick={onClose}>
      <div className="hub-sheet inventory-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="hub-sheet-header">
          <button type="button" className="hub-sheet-back" onClick={onClose}>
            ←
          </button>
          <h2>{title}</h2>
          <span />
        </header>

        {isEmpty ? (
          <p className="inventory-empty">{emptyMessage}</p>
        ) : (
          <div className="inventory-grid">
            {allItems.map((item) => (
              <div
                key={`${item.source ?? "shop"}-${item.id}`}
                className="inventory-card"
                style={{ background: item.bg ?? "#f8fafc" }}
              >
                <span className="inventory-card-emoji">{item.emoji}</span>
                <strong>{item.name}</strong>
                <span className="inventory-card-qty">×{item.quantity ?? 1}</span>
                {item.tag && <em className="inventory-card-tag">{item.tag}</em>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
