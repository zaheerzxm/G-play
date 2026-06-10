import DmVoiceCall from "./DmVoiceCall.jsx";

function peerInitial(peer) {
  return (peer?.display_name || "?").charAt(0).toUpperCase();
}

export default function DmCallOverlay({
  phase,
  peer,
  displayName,
  userId,
  roomName,
  busy,
  onAnswer,
  onReject,
  onCancel,
  onHangUp,
}) {
  if (phase === "active" && peer && roomName) {
    return (
      <DmVoiceCall
        userId={userId}
        displayName={displayName}
        friend={peer}
        roomName={roomName}
        onClose={onHangUp}
      />
    );
  }

  const isIncoming = phase === "incoming";
  const isOutgoing = phase === "outgoing";

  return (
    <div className="dm-call-overlay dm-call-overlay--ringing">
      <div className="dm-call-panel dm-call-panel--ringing">
        <div className="dm-call-avatar-wrap">
          <span className="dm-call-ring dm-call-ring--1" />
          <span className="dm-call-ring dm-call-ring--2" />
          {peer?.avatar_url ? (
            <img src={peer.avatar_url} alt="" className="dm-call-avatar" />
          ) : (
            <span className="dm-call-avatar dm-call-avatar--fallback">{peerInitial(peer)}</span>
          )}
        </div>

        <p className="dm-call-title">{peer?.display_name ?? "Friend"}</p>
        <p className="dm-call-status">
          {isIncoming ? "Incoming voice call…" : isOutgoing ? "Calling…" : "Connecting…"}
        </p>

        <div className={`dm-call-actions ${isIncoming ? "dm-call-actions--incoming" : ""}`}>
          {isIncoming ? (
            <>
              <button type="button" className="dm-call-decline" disabled={busy} onClick={onReject}>
                Decline
              </button>
              <button type="button" className="dm-call-answer" disabled={busy} onClick={onAnswer}>
                Answer
              </button>
            </>
          ) : (
            <button type="button" className="dm-call-decline" disabled={busy} onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
