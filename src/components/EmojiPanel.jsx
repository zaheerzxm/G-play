import { GPLAY_ASSETS } from "../gplayAssets.js";

/** Sprite sheet is 32×32 cells @ 64px (2048²). Indices map to common chat emojis. */
const EMOJI_PICKS = [
  { emoji: "😀", ix: 0 },
  { emoji: "😃", ix: 1 },
  { emoji: "😄", ix: 2 },
  { emoji: "😁", ix: 3 },
  { emoji: "😆", ix: 4 },
  { emoji: "😅", ix: 5 },
  { emoji: "😂", ix: 6 },
  { emoji: "🤣", ix: 7 },
  { emoji: "😊", ix: 10 },
  { emoji: "😇", ix: 11 },
  { emoji: "🙂", ix: 12 },
  { emoji: "😉", ix: 14 },
  { emoji: "😍", ix: 18 },
  { emoji: "🥰", ix: 19 },
  { emoji: "😘", ix: 20 },
  { emoji: "😗", ix: 21 },
  { emoji: "😙", ix: 23 },
  { emoji: "😚", ix: 24 },
  { emoji: "😋", ix: 25 },
  { emoji: "😛", ix: 26 },
  { emoji: "😜", ix: 28 },
  { emoji: "🤪", ix: 29 },
  { emoji: "😝", ix: 30 },
  { emoji: "🤑", ix: 31 },
  { emoji: "🤗", ix: 32 },
  { emoji: "🤭", ix: 33 },
  { emoji: "🤔", ix: 35 },
  { emoji: "🤐", ix: 36 },
  { emoji: "🤨", ix: 37 },
  { emoji: "😐", ix: 38 },
  { emoji: "😑", ix: 39 },
  { emoji: "😶", ix: 40 },
  { emoji: "😏", ix: 41 },
  { emoji: "😒", ix: 42 },
  { emoji: "🙄", ix: 43 },
  { emoji: "😬", ix: 44 },
  { emoji: "😌", ix: 47 },
  { emoji: "😔", ix: 48 },
  { emoji: "😪", ix: 49 },
  { emoji: "🤤", ix: 50 },
  { emoji: "😴", ix: 51 },
  { emoji: "😷", ix: 52 },
  { emoji: "🤒", ix: 53 },
  { emoji: "🤕", ix: 54 },
  { emoji: "🤢", ix: 55 },
  { emoji: "🤮", ix: 56 },
  { emoji: "🤧", ix: 57 },
  { emoji: "🥵", ix: 58 },
  { emoji: "🥶", ix: 59 },
  { emoji: "😵", ix: 61 },
  { emoji: "🤯", ix: 62 },
  { emoji: "😎", ix: 64 },
  { emoji: "🤓", ix: 65 },
  { emoji: "🧐", ix: 66 },
  { emoji: "😕", ix: 67 },
  { emoji: "😟", ix: 68 },
  { emoji: "🙁", ix: 69 },
  { emoji: "😮", ix: 70 },
  { emoji: "😯", ix: 71 },
  { emoji: "😲", ix: 72 },
  { emoji: "😳", ix: 73 },
  { emoji: "🥺", ix: 74 },
  { emoji: "😦", ix: 75 },
  { emoji: "😧", ix: 76 },
  { emoji: "😨", ix: 77 },
  { emoji: "😰", ix: 78 },
  { emoji: "😥", ix: 79 },
  { emoji: "😢", ix: 80 },
  { emoji: "😭", ix: 81 },
  { emoji: "😱", ix: 82 },
  { emoji: "😖", ix: 83 },
  { emoji: "😣", ix: 84 },
  { emoji: "😞", ix: 85 },
  { emoji: "😓", ix: 86 },
  { emoji: "😩", ix: 87 },
  { emoji: "😫", ix: 88 },
  { emoji: "🥱", ix: 89 },
  { emoji: "😤", ix: 90 },
  { emoji: "😡", ix: 91 },
  { emoji: "😠", ix: 92 },
  { emoji: "🤬", ix: 93 },
  { emoji: "👍", ix: 128 },
  { emoji: "👎", ix: 129 },
  { emoji: "👏", ix: 136 },
  { emoji: "🙌", ix: 137 },
  { emoji: "👐", ix: 138 },
  { emoji: "🤝", ix: 139 },
  { emoji: "🙏", ix: 140 },
  { emoji: "✌️", ix: 141 },
  { emoji: "🤞", ix: 142 },
  { emoji: "🤟", ix: 143 },
  { emoji: "🤘", ix: 144 },
  { emoji: "👌", ix: 145 },
  { emoji: "🤌", ix: 146 },
  { emoji: "👈", ix: 148 },
  { emoji: "👉", ix: 149 },
  { emoji: "👆", ix: 150 },
  { emoji: "👇", ix: 151 },
  { emoji: "☝️", ix: 152 },
  { emoji: "✋", ix: 153 },
  { emoji: "🤚", ix: 154 },
  { emoji: "🖐️", ix: 155 },
  { emoji: "🖖", ix: 156 },
  { emoji: "👋", ix: 157 },
  { emoji: "💪", ix: 158 },
  { emoji: "❤️", ix: 192 },
  { emoji: "🧡", ix: 193 },
  { emoji: "💛", ix: 194 },
  { emoji: "💚", ix: 195 },
  { emoji: "💙", ix: 196 },
  { emoji: "💜", ix: 197 },
  { emoji: "🖤", ix: 198 },
  { emoji: "🤍", ix: 199 },
  { emoji: "💔", ix: 200 },
  { emoji: "❣️", ix: 201 },
  { emoji: "💕", ix: 202 },
  { emoji: "💞", ix: 203 },
  { emoji: "💓", ix: 204 },
  { emoji: "💗", ix: 205 },
  { emoji: "💖", ix: 206 },
  { emoji: "💘", ix: 207 },
  { emoji: "💝", ix: 208 },
  { emoji: "🔥", ix: 256 },
  { emoji: "✨", ix: 257 },
  { emoji: "⭐", ix: 258 },
  { emoji: "🌟", ix: 259 },
  { emoji: "💯", ix: 260 },
  { emoji: "🎉", ix: 261 },
  { emoji: "🎊", ix: 262 },
  { emoji: "🥳", ix: 263 },
];

const CELL = 64;
const COLS = 32;

function spriteStyle(index) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const scale = 32 / CELL;
  return {
    backgroundImage: `url(${GPLAY_ASSETS.emojiSheet})`,
    backgroundPosition: `-${col * CELL * scale}px -${row * CELL * scale}px`,
    backgroundSize: `${2048 * scale}px ${2048 * scale}px`,
  };
}

export default function EmojiPanel({ onPick, onClose }) {
  return (
    <div className="emoji-panel-backdrop" onClick={onClose}>
      <div className="emoji-panel emoji-panel--G-play" onClick={(e) => e.stopPropagation()}>
        <p className="emoji-panel-title">Emoji</p>
        <div className="emoji-panel-grid emoji-panel-grid--G-play">
          {EMOJI_PICKS.map(({ emoji, ix }) => (
            <button
              key={`${emoji}-${ix}`}
              type="button"
              className="emoji-panel-btn emoji-panel-btn--sprite"
              style={spriteStyle(ix)}
              title={emoji}
              onClick={() => onPick(emoji)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
