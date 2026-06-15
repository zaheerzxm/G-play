import { useEffect, useState } from "react";

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function GiftPackFloater({ onOpen }) {
  const [endsAt] = useState(() => Date.now() + 4 * 60 * 60 * 1000);
  const [countdown, setCountdown] = useState(() => formatCountdown(endsAt - Date.now()));

  useEffect(() => {
    const t = setInterval(() => setCountdown(formatCountdown(endsAt - Date.now())), 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  return (
    <button type="button" className="gift-pack-floater" onClick={onOpen} aria-label="Open Gift Pack">
      <span className="gift-pack-floater-chest" aria-hidden>🎁</span>
      <span className="gift-pack-floater-time">{countdown}</span>
    </button>
  );
}
