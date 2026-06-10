import { useState } from "react";
import VoiceRoom from "./VoiceRoom.jsx";
import MicButton from "./MicButton.jsx";
import SpeakerButton from "./SpeakerButton.jsx";

export default function DmVoiceCall({ userId, displayName, friend, roomName, onClose }) {
  const [status, setStatus] = useState("connecting");
  const liveRoomName = roomName || ["dm", ...[userId, friend.id].sort()].join("-");

  return (
    <div className="dm-call-overlay">
      <VoiceRoom
        roomName={liveRoomName}
        participantName={displayName}
        participantIdentity={userId}
        isSeated
        onVoiceStatus={setStatus}
      >
        <div className="dm-call-panel">
          <p className="dm-call-title">Voice call with {friend.display_name}</p>
          <p className="dm-call-status">{status === "connected" ? "Connected" : "Connecting…"}</p>
          <div className="dm-call-controls">
            <SpeakerButton />
            <MicButton />
            <button type="button" className="dm-call-end" onClick={onClose}>
              End call
            </button>
          </div>
        </div>
      </VoiceRoom>
    </div>
  );
}
