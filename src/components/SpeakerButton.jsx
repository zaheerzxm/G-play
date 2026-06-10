import { useVoice } from "../context/VoiceContext.jsx";

export default function SpeakerButton() {
  const voice = useVoice();

  if (!voice?.voiceReady) return null;

  const { speakerEnabled, toggleSpeaker } = voice;

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
