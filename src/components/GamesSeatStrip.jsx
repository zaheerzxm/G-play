import AvatarImg from "./AvatarImg.jsx";
import { GAMES_MODE_SEAT_LAYOUT } from "../roomSeats.js";

const SEAT_NUMBERS = GAMES_MODE_SEAT_LAYOUT[0];

export default function GamesSeatStrip({
  seatMap,
  userId,
  speakingSeatNumbers,
  seatBusy,
  onSeatClick,
  seatAvatarUrl,
  seatInitial,
}) {
  function renderFace(seat, isMine, isEmpty) {
    if (isEmpty) return <span className="games-seat-plus">+</span>;
    const url = seatAvatarUrl(seat, isMine);
    if (url) {
      return (
        <AvatarImg
          src={url}
          fallback={seatInitial(seat)}
          className="games-seat-letter"
          imgClassName="games-seat-img"
        />
      );
    }
    return <span className="games-seat-letter">{seatInitial(seat)}</span>;
  }

  return (
    <div className="games-seat-strip" role="list" aria-label="Room seats">
      {SEAT_NUMBERS.map((num) => {
        const seat = seatMap[num];
        const isMine = seat?.user_id === userId;
        const isEmpty = !seat?.user_id;
        const isSpeaking = speakingSeatNumbers?.has(num);
        const isMuted = seat?.mic_on === false;

        return (
          <button
            key={num}
            type="button"
            className={`games-seat ${isMine ? "games-seat--mine" : ""} ${isSpeaking ? "games-seat--speaking" : ""} ${isEmpty ? "games-seat--empty" : ""}`}
            disabled={seatBusy}
            onClick={() => onSeatClick(num)}
            aria-label={isEmpty ? `Seat ${num} empty` : seat?.nickname || `Seat ${num}`}
          >
            <span className="games-seat-avatar">
              {renderFace(seat, isMine, isEmpty)}
              {isMuted && !isEmpty && <span className="games-seat-mute" aria-hidden />}
              {isSpeaking && <span className="games-seat-ring" aria-hidden />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
