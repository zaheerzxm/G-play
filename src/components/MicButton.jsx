import { useVoice } from "../context/VoiceContext.jsx";

export default function MicButton() {
  const voice = useVoice();
  if (!voice) return null;

  const {
    voiceReady,
    voiceStatus,
    voiceError,
    micError,
    isSeated,
    micEnabled,
    seatMicAllowed,
    toggleMic,
    retryConnect,
  } = voice;

  if (!voiceReady) {
    const hint = voiceError
      || (voiceStatus === "connecting" ? "Connecting voice…" : "Voice unavailable — tap to retry");
    return (
      <button
        type="button"
        className="mic-btn dock-mic-btn mic-btn--muted"
        disabled={voiceStatus === "connecting"}
        onClick={() => retryConnect?.()}
        aria-label={hint}
        title={hint}
      >
        <span className="dock-mic-icon" aria-hidden />
      </button>
    );
  }

  const canUseMic = isSeated && seatMicAllowed !== false;
  const hint = micError
    || (!isSeated
      ? "Take a seat"
      : !canUseMic
        ? "Seat muted"
        : micEnabled
          ? "Mic on"
          : "Mic off");

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
      title={hint}
    >
      <span className="dock-mic-icon" aria-hidden />
    </button>
  );
}
