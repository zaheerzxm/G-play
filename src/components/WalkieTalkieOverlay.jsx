import AvatarImg from "./AvatarImg.jsx";

export default function WalkieTalkieOverlay({ self, peer, session, onEnd }) {
  if (!session?.active || !peer) return null;

  const isSender = Boolean(session.outgoingTargetId);
  const isReceiver = Boolean(session.incomingFromId);

  let subtitle = "Private walkie talkie line";
  if (isSender && isReceiver) {
    subtitle = "You are both on walkie talkie";
  } else if (isSender) {
    subtitle = `You → ${peer.name}`;
  } else if (isReceiver) {
    subtitle = `${peer.name} → You`;
  }

  return (
    <div className="walkie-overlay" role="status" aria-live="polite">
      <div className="walkie-overlay-backdrop" aria-hidden />
      <div className="walkie-overlay-panel">
        <div className="walkie-overlay-icon" aria-hidden>
          📻
        </div>
        <p className="walkie-overlay-title">Walkie talkie</p>
        <p className="walkie-overlay-sub">{subtitle}</p>

        <div className="walkie-overlay-parties">
          <div className={`walkie-party ${isSender ? "walkie-party--active" : ""}`}>
            <span className="walkie-party-avatar-wrap">
              <AvatarImg
                src={self.avatar}
                fallback={self.name || "You"}
                className="walkie-party-avatar walkie-party-avatar--fallback"
                imgClassName="walkie-party-avatar"
              />
            </span>
            <span className="walkie-party-name">{self.name || "You"}</span>
            <span className="walkie-party-role">You</span>
          </div>

          <div className="walkie-overlay-pulse" aria-hidden>
            <span className="walkie-overlay-pulse-dot" />
            <span className="walkie-overlay-pulse-line" />
            <span className="walkie-overlay-pulse-dot" />
          </div>

          <div className={`walkie-party ${isReceiver ? "walkie-party--active" : ""}`}>
            <span className="walkie-party-avatar-wrap">
              <AvatarImg
                src={peer.avatar}
                fallback={peer.name || "?"}
                className="walkie-party-avatar walkie-party-avatar--fallback"
                imgClassName="walkie-party-avatar"
              />
            </span>
            <span className="walkie-party-name">{peer.name}</span>
            <span className="walkie-party-role">Them</span>
          </div>
        </div>

        {isSender && (
          <p className="walkie-overlay-hint">Hold the walkie button to talk · release to listen</p>
        )}
        {isReceiver && !isSender && (
          <p className="walkie-overlay-hint">Listening to {peer.name} on this private line</p>
        )}

        {isSender && onEnd && (
          <button type="button" className="walkie-overlay-end" onClick={onEnd}>
            End walkie talkie
          </button>
        )}
      </div>
    </div>
  );
}
