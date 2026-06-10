export default function ComboGiftButton({ combo, onCombo, queueLen = 0 }) {
  if (!combo) return null;

  return (
    <button type="button" className="combo-gift-btn" onClick={onCombo}>
      <span className="combo-gift-emoji">{combo.gift.emoji}</span>
      <span className="combo-gift-label">
        Combo x{combo.count}
        {queueLen > 0 ? ` (+${queueLen})` : ""}
      </span>
    </button>
  );
}
