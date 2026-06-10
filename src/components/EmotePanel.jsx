import { useState } from "react";
import { EMOTE_FAMILIES } from "../emotes.js";
import CoinIcon from "./CoinIcon.jsx";
import TgsEmote from "./TgsEmote.jsx";

const QUICK = [
  { key: "lottery", label: "Lottery", emoji: "🎰" },
  { key: "rps", label: "Rock Paper", emoji: "✌️" },
  { key: "dice", label: "Dice", emoji: "🎲" },
  { key: "heart", label: "Light burst", emoji: "💖" },
  { key: "coin", label: "Toss coin", emoji: "coin" },
  { key: "wave", label: "Wave", emoji: "👋" },
];

export default function EmotePanel({ onPick, onReaction, onClose }) {
  const [familyId, setFamilyId] = useState(EMOTE_FAMILIES[0]?.id ?? "");
  const family = EMOTE_FAMILIES.find((f) => f.id === familyId) ?? EMOTE_FAMILIES[0];

  return (
    <div className="emote-panel-backdrop" onClick={onClose}>
      <div className="emote-panel emote-panel--G-play" onClick={(e) => e.stopPropagation()}>
        <p className="emote-panel-hint">Tap to animate on your seat</p>
        <div className="emote-panel-row emote-panel-row--quick">
          {QUICK.map((item) => (
            <button
              key={item.key}
              type="button"
              className="emote-panel-btn emote-panel-btn--quick"
              onClick={() => onReaction?.({ key: item.key, emoji: item.emoji, label: item.label })}
              title={item.label}
            >
              <span className="emote-panel-btn-emoji">
                {item.key === "coin" ? <CoinIcon size="lg" /> : item.emoji}
              </span>
              <span className="emote-panel-btn-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="emote-panel-tabs" role="tablist" aria-label="Sticker families">
          {EMOTE_FAMILIES.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={f.id === family?.id}
              className={`emote-panel-tab ${f.id === family?.id ? "emote-panel-tab--active" : ""}`}
              onClick={() => setFamilyId(f.id)}
              title={f.label}
            >
              {f.emotes[0]?.tgs ? (
                <TgsEmote src={f.emotes[0].tgs} className="emote-panel-tab-tgs" loop autoplay />
              ) : (
                <span className="emote-panel-tab-icon">{f.icon}</span>
              )}
              <span className="emote-panel-tab-label">{f.label}</span>
            </button>
          ))}
        </div>

        <div className="emote-panel-grid" role="tabpanel">
          {family?.emotes.map((emote) => (
            <button
              key={emote.key}
              type="button"
              className={`emote-panel-btn emote-panel-btn--${emote.anim}`}
              onClick={() => onPick(emote)}
              title={emote.label}
            >
              <TgsEmote src={emote.tgs} className="emote-panel-btn-tgs" loop autoplay />
              <span className="emote-panel-btn-label">{emote.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
