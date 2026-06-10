import { useVoice } from "../context/VoiceContext.jsx";

export default function MicButton() {
  const voice = useVoice();

  if (!voice?.voiceReady) return null;

  const { isSeated, micEnabled, seatMicAllowed, toggleMic } = voice;
  const canUseMic = isSeated && seatMicAllowed !== false;

  return (
    <button
      type="button"
      className={`mic-btn dock-mic-btn ${micEnabled && canUseMic ? "mic-btn--on" : "mic-btn--muted"}`}
      onClick={toggleMic}
      disabled={!canUseMic}
      aria-label={
        !isSeated
          ? "Take a seat to use microphone"
          : !canUseMic
            ? "Seat is muted"
            : micEnabled
              ? "Mute microphone"
              : "Unmute microphone"
      }
      title={
        !isSeated ? "Take a seat" : !canUseMic ? "Seat muted" : micEnabled ? "Mic on" : "Mic off"
      }
    >
      <span className="dock-mic-icon" aria-hidden />
    </button>
  );
}
