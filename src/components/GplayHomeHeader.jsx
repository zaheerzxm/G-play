import { formatCoins } from "../gifts.js";
import CoinIcon from "./CoinIcon.jsx";
import { IconGift, IconStar, UiIcon } from "./NavIcons.jsx";

function initialFor(profile) {
  return (profile?.display_name || "Z").charAt(0).toUpperCase();
}

export default function GplayHomeHeader({
  profile,
  coins,
  isSuperAdmin,
  onBuyCoins,
  onAvatarClick,
  onOpenNewGift,
  onOpenEvents,
}) {
  return (
    <header className="gplay-home-top">
      <button type="button" className="gplay-home-top-left" onClick={onAvatarClick}>
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="gplay-home-avatar" />
        ) : (
          <span className="gplay-home-avatar gplay-home-avatar--fallback">{initialFor(profile)}</span>
        )}
      </button>
      <button type="button" className="gplay-home-coins" onClick={onBuyCoins} aria-label="Coins balance, tap to top up">
        <CoinIcon size="lg" />
        <span className="gplay-home-coins-val">{formatCoins(coins, isSuperAdmin)}</span>
        <span className="gplay-home-coins-add" aria-hidden>+</span>
      </button>
      <button type="button" className="gplay-home-action gplay-home-action--new" onClick={onOpenNewGift} aria-label="New gift pack">
        <span className="gplay-home-action-icon">
          <UiIcon Icon={IconGift} />
          <em aria-hidden />
        </span>
        <span>NEW</span>
      </button>
      <button type="button" className="gplay-home-events" onClick={onOpenEvents} aria-label="Events">
        <span className="gplay-home-action-icon">
          <UiIcon Icon={IconStar} />
        </span>
        <span>Events</span>
      </button>
    </header>
  );
}
