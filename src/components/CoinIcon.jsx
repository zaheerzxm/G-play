/** Gold coin glyph — replaces 🪙 which renders silver on many devices. */
export default function CoinIcon({ className = "", size = "md" }) {
  return (
    <span
      className={`coin-icon coin-icon--${size}${className ? ` ${className}` : ""}`}
      aria-hidden
    />
  );
}
