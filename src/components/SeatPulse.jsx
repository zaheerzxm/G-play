/** Decorative heartbeat connectors between seat rows (G-play style). */
export default function SeatPulse() {
  return (
    <div className="seat-pulse-layer" aria-hidden>
      <svg className="seat-pulse-svg" viewBox="0 0 320 120" preserveAspectRatio="none">
        <path
          className="seat-pulse-line"
          d="M40 20 H140 M180 20 H280 M20 60 H100 M120 60 H200 M220 60 H300 M60 100 H160 M200 100 H260"
        />
        <path className="seat-pulse-wave" d="M130 20 l8 -6 l8 12 l8 -12 l8 6" />
        <path className="seat-pulse-wave" d="M110 60 l8 -6 l8 12 l8 -12 l8 6" />
        <path className="seat-pulse-wave" d="M150 100 l8 -6 l8 12 l8 -12 l8 6" />
      </svg>
    </div>
  );
}
