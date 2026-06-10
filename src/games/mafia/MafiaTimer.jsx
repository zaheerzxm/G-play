export default function MafiaTimer({ secondsLeft, label }) {
  if (!secondsLeft && secondsLeft !== 0) return null;
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return (
    <div className="mafia-timer">
      {label && <span className="mafia-timer-label">{label}</span>}
      <span className="mafia-timer-value">
        {m}:{String(s).padStart(2, "0")}
      </span>
    </div>
  );
}
