import { useState } from "react";
import MafiaPlayerList from "./MafiaPlayerList.jsx";

export default function MafiaActionPanel({
  title,
  hint,
  players,
  userId,
  onSubmit,
  busy,
  aliveOnly = true,
}) {
  const [target, setTarget] = useState(null);
  const list = aliveOnly ? players.filter((p) => p.is_alive !== false && p.user_id !== userId) : players;

  return (
    <div className="mafia-action-panel">
      <h3>{title}</h3>
      <p className="mafia-action-hint">{hint}</p>
      <MafiaPlayerList
        players={list}
        userId={userId}
        selectable
        selectedId={target}
        onSelect={setTarget}
      />
      <button
        type="button"
        className="game-btn game-btn--primary mafia-action-submit"
        disabled={!target || busy || !onSubmit}
        onClick={() => target && onSubmit?.(target)}
      >
        {busy ? "…" : "Confirm"}
      </button>
    </div>
  );
}
