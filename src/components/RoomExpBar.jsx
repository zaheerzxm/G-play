import { formatCompactNumber } from "../formatCompact.js";
import { roomExpPercent } from "../gamification.js";

export default function RoomExpBar({ roomLevel = 1, roomExp = 0 }) {
  const pct = roomExpPercent(roomExp, roomLevel);

  return (
    <div className="room-exp-bar" title={`Room EXP ${formatCompactNumber(roomExp)}`}>
      <div className="room-exp-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
