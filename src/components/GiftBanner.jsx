export default function GiftBanner({ banner }) {
  if (!banner) return null;

  const initial = banner.senderName?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="gift-banner" key={banner.id}>
      <span className="gift-banner-avatar">
        {banner.senderAvatar ? (
          <img src={banner.senderAvatar} alt="" />
        ) : (
          initial
        )}
      </span>
      <div className="gift-banner-body">
        <p className="gift-banner-line">
          <strong>{banner.senderName}</strong> sent {banner.emoji} {banner.giftName} to{" "}
          <strong>{banner.recipientName}</strong>
        </p>
        <p className="gift-banner-reward">Receiver won +{banner.reward} gold</p>
      </div>
      <span className="gift-banner-emoji">{banner.emoji}</span>
    </div>
  );
}
