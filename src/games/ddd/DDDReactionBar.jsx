import { DDD_REACTIONS } from "./constants.js";

export default function DDDReactionBar({ turnId, reactions, userId, onReact }) {
  const mine = reactions?.find((r) => String(r.user_id) === String(userId))?.reaction_type;

  return (
    <div className="ddd-reactions">
      {DDD_REACTIONS.map((r) => (
        <button
          key={r.id}
          type="button"
          className={`ddd-reaction-btn ${mine === r.id ? "ddd-reaction-btn--active" : ""}`}
          title={r.label}
          onClick={() => onReact?.(turnId, r.id)}
        >
          {r.emoji}
          <span className="ddd-reaction-count">
            {reactions?.filter((x) => x.reaction_type === r.id).length || ""}
          </span>
        </button>
      ))}
    </div>
  );
}
