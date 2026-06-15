import DDDReactionBar from "./DDDReactionBar.jsx";

function line(emoji, label, name) {
  return (
    <div className="ddd-turn-result-line">
      <span>{emoji}</span>
      <strong>{label}:</strong>
      <span>{name || "Skipped"}</span>
    </div>
  );
}

export default function DDDTurnResult({ actor, currentTurn, reactions, userId, onReact }) {
  if (!currentTurn || !actor) return null;

  return (
    <div className="ddd-turn-result">
      <h3>{actor.nickname} chose:</h3>
      {line("❤️", "Dil", currentTurn.dil_name)}
      {line("🧠", "Dimaag", currentTurn.dimaag_name)}
      {line("🗑️", "Dustbin", currentTurn.dustbin_name)}
      <DDDReactionBar
        turnId={currentTurn.id}
        reactions={reactions}
        userId={userId}
        onReact={onReact}
      />
    </div>
  );
}
