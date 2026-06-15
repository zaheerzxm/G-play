import { useVoice } from "../context/VoiceContext.jsx";

export default function SpeakerButton() {
  const voice = useVoice();
  if (!voice) return null;

  const { voiceReady, voiceStatus, voiceError, speakerEnabled, toggleSpeaker, retryConnect } = voice;

  if (!voiceReady) {
    const hint = voiceError
      || (voiceStatus === "connecting" ? "Connecting voice…" : "Voice unavailable — tap to retry");
    return (
      <button
        type="button"
        className="speaker-btn dock-speaker-btn speaker-btn--muted"
        disabled={voiceStatus === "connecting"}
        onClick={() => retryConnect?.()}
        aria-label={hint}
        title={hint}
      >
        <span className="dock-speaker-icon" aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`speaker-btn dock-speaker-btn ${speakerEnabled ? "speaker-btn--on" : "speaker-btn--muted"}`}
      onClick={toggleSpeaker}
      aria-label={speakerEnabled ? "Mute speaker" : "Unmute speaker"}
      title={speakerEnabled ? "Speaker on" : "Speaker off"}
    >
      <span className="dock-speaker-icon" aria-hidden />
    </button>
  );
}
