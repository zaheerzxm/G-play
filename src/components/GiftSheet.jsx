import { useEffect, useMemo, useState } from "react";
import { formatCoins, giftRewardRange, GIFT_CATEGORIES, giftsByCategory } from "../gifts.js";
import { giftIconFor } from "../gplayAssets.js";
import CoinIcon from "./CoinIcon.jsx";
import { IconHelp, UiIcon } from "./NavIcons.jsx";

const QTY_OPTIONS = [1, 5, 33, 50, 100];

export default function GiftSheet({
  coins,
  isSuperAdmin,
  vipLevel = 0,
  giftRecipients,
  giftTarget,
  giftBusy,
  inventory = {},
  onSelectRecipient,
  onSendGift,
  onBuyCoins,
  onClose,
}) {
  const [tab, setTab] = useState("Gift");
  const [selectedGift, setSelectedGift] = useState(null);
  const [qty, setQty] = useState(1);
  const [anonymous, setAnonymous] = useState(false);

  const catalog = useMemo(() => (
    tab === "Package"
      ? giftsByCategory(tab).filter((g) => g.starterQty || Number(inventory[g.id]?.quantity ?? 0) > 0)
      : giftsByCategory(tab)
  ), [tab, inventory]);

  const gift = selectedGift ? catalog.find((g) => g.id === selectedGift) : catalog[0];

  useEffect(() => {
    setSelectedGift((cur) => {
      if (cur && catalog.some((g) => g.id === cur)) return cur;
      return catalog[0]?.id ?? null;
    });
  }, [tab, catalog]);

  const inventoryQty = gift?.inventory ? Number(inventory[gift.id]?.quantity ?? 0) : 0;
  const totalCost = (gift?.cost ?? 0) * qty;
  const canAfford = gift?.inventory ? inventoryQty >= qty : isSuperAdmin || coins >= totalCost;
  const vipOk = !gift?.vipRequired || vipLevel >= gift.vipRequired;
  const canSend = gift && giftTarget && !giftBusy && canAfford && vipOk;

  const helperCopy = useMemo(() => {
    if (tab === "Package") return "Owned gifts — no coin cost";
    if (!gift) return "";
    const charm = Math.max(0, Math.floor(Number(gift.charm ?? 0) * qty));
    if (gift.inventory || (gift.cost ?? 0) <= 0) return `Charm +${charm}`;
    const { max } = giftRewardRange(gift.cost);
    return `Charm +${charm}, Gain up to ${max * qty} Gold Coins`;
  }, [tab, gift, qty]);

  return (
    <div className="sheet-backdrop sheet-backdrop--gift" onClick={onClose}>
      <div className="gift-panel" onClick={(e) => e.stopPropagation()}>
        <div className="gift-panel-tabs">
          {GIFT_CATEGORIES.map((t) => (
            <button
              key={t}
              type="button"
              className={`gift-panel-tab ${tab === t ? "gift-panel-tab--active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {giftRecipients.length === 0 ? (
          <p className="gift-panel-empty">Seat someone to send gifts</p>
        ) : (
          <>
            <div className="gift-panel-recipients">
              {giftRecipients.map((seat) => (
                <button
                  key={seat.seat_number}
                  type="button"
                  className={`gift-panel-recipient ${giftTarget?.user_id === seat.user_id ? "gift-panel-recipient--active" : ""}`}
                  onClick={() => onSelectRecipient(seat)}
                  title={seat.nickname}
                >
                  {seat.avatar_url ? (
                    <img src={seat.avatar_url} alt="" className="gift-panel-recipient-img" />
                  ) : (
                    <span className="gift-panel-recipient-face">
                      {(seat.nickname || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <p className="gift-panel-hint">
              <span>{helperCopy}</span>
              {tab !== "Package" && helperCopy && (
                <span className="gift-panel-hint-help" aria-hidden>
                  <UiIcon Icon={IconHelp} />
                </span>
              )}
            </p>

            <div className="gift-panel-grid gift-panel-grid--wide">
              {catalog.map((g) => {
                const owned = g.inventory ? inventory[g.id]?.quantity : null;
                const locked = g.vipRequired && vipLevel < g.vipRequired;
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`gift-panel-item ${selectedGift === g.id ? "gift-panel-item--selected" : ""} ${locked ? "gift-panel-item--locked" : ""}`}
                    onClick={() => setSelectedGift(g.id)}
                  >
                    {locked && (
                      <span className="gift-panel-item-lock" aria-hidden>
                        🔒 V{g.vipRequired}
                      </span>
                    )}
                    {g.badge && <span className={`gift-panel-badge gift-panel-badge--${g.badge}`}>{g.badge}</span>}
                    {giftIconFor(g.id) ? (
                      <img src={giftIconFor(g.id)} alt="" className="gift-panel-item-img" />
                    ) : (
                      <span className="gift-panel-item-emoji">{g.emoji}</span>
                    )}
                    <span className="gift-panel-item-name">{g.name}</span>
                    {owned != null ? (
                      <span className="gift-panel-item-cost">x{owned}</span>
                    ) : (
                      <span className="gift-panel-item-cost coin-inline"><CoinIcon size="sm" /> {g.cost}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <label className="gift-panel-anon">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          Send anonymously
        </label>

        <div className="gift-panel-qty-row" role="group" aria-label="Gift quantity">
          {QTY_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className={`gift-panel-qty-chip ${qty === n ? "gift-panel-qty-chip--active" : ""}`}
              onClick={() => setQty(n)}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="gift-panel-footer">
          <button type="button" className="gift-panel-balance gift-panel-balance--btn" onClick={onBuyCoins}>
            <span className="gift-panel-coin"><CoinIcon size="lg" /></span>
            <span className="gift-panel-coin-val">{formatCoins(coins, isSuperAdmin)}</span>
            <span className="gift-panel-buy">+</span>
          </button>
          <div className="gift-panel-send-row">
            {gift && qty > 1 && !gift.inventory && (
              <span className="gift-panel-qty-total">
                <CoinIcon size="sm" /> {formatCoins(totalCost, isSuperAdmin)}
              </span>
            )}
            <span className="gift-panel-qty-label">x{qty}</span>
            {!vipOk && gift?.vipRequired && (
              <span className="gift-panel-vip-hint">VIP {gift.vipRequired}+ required</span>
            )}
            <button
              type="button"
              className="gift-panel-send"
              disabled={!canSend}
              onClick={() => gift && onSendGift(gift, { quantity: qty, anonymous, fromInventory: tab === "Package" })}
            >
              Send{qty > 1 ? ` x${qty}` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
