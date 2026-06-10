import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function WaitingQueueSheet({
  queue,
  canModerate,
  includeSeated = false,
  pendingInvites = {},
  inviteTargetSeat,
  onInvite,
  onClose,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div className="waiting-queue-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 className="waiting-queue-title">Invite to seat ({queue.length})</h3>
        <p className="waiting-queue-hint">
          {canModerate
            ? inviteTargetSeat
              ? `${includeSeated ? "Online users" : "Audience members"} in this room — invite to seat ${inviteTargetSeat}. They must accept first.`
              : `${includeSeated ? "Online users" : "Audience members"} in this room. They must accept before taking a seat.`
            : "You are in the audience — wait for a host invite"}
        </p>
        <ul className="waiting-queue-list">
          {queue.length === 0 && (
            <li className="waiting-queue-empty">
              {canModerate ? "No other players online in this room" : "No one else in the audience"}
            </li>
          )}
          {queue.map((w) => {
            const pending = pendingInvites[w.user_id];
            return (
              <li key={w.user_id} className="waiting-queue-item">
                <span className="waiting-queue-name">
                  {w.nickname}
                  {canModerate && (
                    <em className="waiting-queue-seat-tag">
                      {w.current_seat ? `Seat ${w.current_seat}` : "Audience"}
                    </em>
                  )}
                </span>
                {canModerate &&
                  (pending ? (
                    <span className="waiting-queue-invite waiting-queue-invite--pending">
                      Invited · seat {pending.seat_number}
                    </span>
                  ) : (
                    <button type="button" className="waiting-queue-invite" onClick={() => onInvite(w)}>
                      Invite
                    </button>
                  ))}
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
