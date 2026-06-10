const STICKERS = [
  { key: "wave", emoji: "👋", label: "Wave" },
  { key: "mascot_hi", emoji: "🐻", label: "Hi" },
  { key: "mascot_love", emoji: "🧸", label: "Love" },
  { key: "mascot_cool", emoji: "😎", label: "Cool" },
  { key: "mascot_angry", emoji: "😤", label: "Angry" },
  { key: "mascot_cry", emoji: "😢", label: "Cry" },
  { key: "mascot_party", emoji: "🥳", label: "Party" },
  { key: "mascot_sleep", emoji: "😴", label: "Sleep" },
];

export function stickerMessage(key) {
  const s = STICKERS.find((x) => x.key === key);
  return s ? `[sticker:${s.emoji}]` : "";
}

export function parseStickerMessage(message) {
  const m = message?.match(/^\[sticker:(.+)\]$/);
  return m ? m[1] : null;
}

export default function StickerPanel({ onPick, onClose }) {
  return (
    <div className="emoji-panel-backdrop" onClick={onClose}>
      <div className="sticker-panel" onClick={(e) => e.stopPropagation()}>
        <p className="emoji-panel-title">Stickers</p>
        <div className="sticker-panel-grid">
          {STICKERS.map((s) => (
            <button key={s.key} type="button" className="sticker-panel-btn" onClick={() => onPick(s)}>
              <span className="sticker-panel-emoji">{s.emoji}</span>
              <span className="sticker-panel-label">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
