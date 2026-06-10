import CoinIcon from "./CoinIcon.jsx";

const REACTIONS = [
  { key: "dice", label: "Dice", emoji: "🎲" },
  { key: "coin", label: "Coin", emoji: "coin" },
  { key: "wave", label: "Wave", emoji: "👋" },
  { key: "heart", label: "Heart", emoji: "💖" },
  { key: "lottery", label: "Lottery", emoji: "🎰" },
  { key: "rps", label: "RPS", emoji: "✌️" },
];

export default function ReactionPanel({ onPick, onClose }) {
  return (
    <div className="emoji-panel-backdrop" onClick={onClose}>
      <div className="reaction-panel" onClick={(e) => e.stopPropagation()}>
        <p className="emoji-panel-title">Quick reactions</p>
        <div className="reaction-panel-grid">
          {REACTIONS.map((r) => (
            <button key={r.key} type="button" className="reaction-panel-btn" onClick={() => onPick(r)}>
              <span className="reaction-panel-emoji">
                {r.emoji === "coin" ? <CoinIcon size="lg" /> : r.emoji}
              </span>
              <span className="reaction-panel-label">{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
