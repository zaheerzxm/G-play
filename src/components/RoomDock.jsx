import MicButton from "./MicButton.jsx";
import SpeakerButton from "./SpeakerButton.jsx";

export default function RoomDock({
  chatInput,
  onChatInput,
  onSendMessage,
  onEmoji,
  onGift,
  onChest,
  onGrid,
}) {
  return (
    <div className="room-dock room-dock--G-play">
      <div className="dock-voice">
        <SpeakerButton />
        <MicButton />
      </div>
      <form className="dock-chat" onSubmit={onSendMessage}>
        <input
          type="text"
          placeholder="Type…"
          maxLength={300}
          value={chatInput}
          onChange={(e) => onChatInput(e.target.value)}
        />
      </form>
      <button type="button" className="dock-btn dock-btn--emoji" aria-label="Emotes" onClick={onEmoji}>
        <span className="dock-chip dock-chip--emoji" aria-hidden>
          😊
        </span>
      </button>
      <button type="button" className="dock-btn dock-btn--gift" aria-label="Gifts" onClick={onGift}>
        <span className="dock-chip dock-chip--gift" aria-hidden>
          🎁
        </span>
      </button>
      <button type="button" className="dock-btn dock-btn--chest" aria-label="Daily tasks" onClick={onChest}>
        <span className="dock-chip dock-chip--chest" aria-hidden>
          📦
        </span>
      </button>
      <button type="button" className="dock-btn dock-btn--grid" aria-label="Functions" onClick={onGrid}>
        <span className="dock-chip dock-chip--grid" aria-hidden>
          ⊞
        </span>
      </button>
    </div>
  );
}
