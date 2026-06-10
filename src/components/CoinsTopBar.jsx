import { formatCoins } from "../gifts.js";
import CoinIcon from "./CoinIcon.jsx";

export default function CoinsTopBar({
  coins,
  isSuperAdmin,
  onBuyCoins,
  variant = "light",
  className = "",
}) {
  return (
    <div className={`coins-top-bar coins-top-bar--${variant} ${className}`.trim()}>
      <button type="button" className="coins-top-bar-btn" onClick={onBuyCoins} aria-label="Coins balance, tap to top up">
        <span className="coins-top-bar-icon">
          <CoinIcon size="lg" />
        </span>
        <span className="coins-top-bar-val">{formatCoins(coins, isSuperAdmin)}</span>
        <span className="coins-top-bar-add" aria-hidden>+</span>
      </button>
    </div>
  );
}
