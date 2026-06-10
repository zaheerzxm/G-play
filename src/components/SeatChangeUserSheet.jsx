import { createPortal } from "react-dom";
import AvatarImg from "./AvatarImg.jsx";

export default function SeatChangeUserSheet({
  seatNumber,
  candidates = [],
  currentUserId,
  onPick,
  onClose,
}) {
  const list = candidates.filter((u) => u.user_id && u.user_id !== currentUserId);

  const sheet = (
    <div className="profile-card-backdrop seat-change-backdrop" onClick={onClose}>
      <div className="seat-change-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="seat-change-handle" aria-hidden />
        <h3 className="seat-change-title">Change user · Seat {seatNumber}</h3>
        <p className="seat-change-hint">Pick someone in the room to seat here</p>
        <ul className="seat-change-list">
          {list.length ? (
            list.map((u) => (
              <li key={u.user_id}>
                <button type="button" className="seat-change-row" onClick={() => onPick(u)}>
                  <AvatarImg
                    src={u.avatar_url}
                    fallback={u.display_name || u.nickname || "?"}
                    className="seat-change-avatar seat-change-avatar--fallback"
                    imgClassName="seat-change-avatar"
                  />
                  <span>{u.display_name || u.nickname || "Guest"}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="seat-change-empty">No one available — try when more people are online</li>
          )}
        </ul>
        <button type="button" className="seat-change-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
