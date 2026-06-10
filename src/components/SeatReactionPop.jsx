export default function SeatReactionPop({ reactions }) {
  if (!reactions?.length) return null;

  return (
    <div className="seat-reaction-layer" aria-hidden>
      {reactions.map((r) => (
        <div
          key={r.id}
          className="seat-reaction-pop"
          style={{
            left: `${r.x}px`,
            top: `${r.y}px`,
          }}
        >
          <span className="seat-reaction-emoji">{r.emoji}</span>
        </div>
      ))}
    </div>
  );
}
