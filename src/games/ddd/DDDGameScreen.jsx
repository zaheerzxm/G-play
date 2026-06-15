import { useCallback, useEffect, useRef } from "react";
import { DDD_PHASES } from "./constants.js";
import DDDTurnHeader from "./DDDTurnHeader.jsx";
import DDDInputPanel from "./DDDInputPanel.jsx";
import DDDRevealAnimation from "./DDDRevealAnimation.jsx";
import DDDTurnResult from "./DDDTurnResult.jsx";
import DDDRoundSummary from "./DDDRoundSummary.jsx";
import { useDDDPlayers } from "./useDDDPlayers.js";
import { useDDDTimer } from "./useDDDTimer.js";

export default function DDDGameScreen({
  game,
  players,
  currentTurn,
  reactions,
  userId,
  roundSummary,
  onSubmit,
  onReact,
  onNextRound,
  onEnd,
  canManage,
  sounds,
  submitting,
}) {
  const phase = game?.phase;
  const { actor, pickable, allowSelfPick } = useDDDPlayers(
    players,
    userId,
    game?.current_turn_user_id,
  );
  const isMyTurn = String(game?.current_turn_user_id) === String(userId);
  const lastTickRef = useRef(0);

  const onLastFiveTick = useCallback((left) => {
    if (left !== lastTickRef.current) {
      lastTickRef.current = left;
      sounds?.play("timer_tick");
    }
  }, [sounds]);

  const { secondsLeft, warning } = useDDDTimer(game, onLastFiveTick);

  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current === phase) return;
    prevPhaseRef.current = phase;
    if (phase === DDD_PHASES.TURN_START) sounds?.play("turn_start");
    if (phase === DDD_PHASES.REVEAL_DIL) sounds?.play("dil_reveal");
    if (phase === DDD_PHASES.REVEAL_DIMAAG) sounds?.play("dimaag_reveal");
    if (phase === DDD_PHASES.REVEAL_DUSTBIN) sounds?.play("dustbin_reveal");
    if (phase === DDD_PHASES.ROUND_END) sounds?.play("round_end");
  }, [phase, sounds]);

  if (game?.status === "round_end") {
    return (
      <DDDRoundSummary
        summary={roundSummary}
        roundNumber={game.round_number}
        players={players}
        canManage={canManage}
        onNextRound={onNextRound}
        onEnd={onEnd}
      />
    );
  }

  const isReveal = phase?.startsWith("reveal_");
  const isInput = phase === DDD_PHASES.INPUT;
  const isTurnResult = phase === DDD_PHASES.TURN_RESULT;
  const isWaiting = !isMyTurn && (isInput || phase === DDD_PHASES.TURN_START);

  return (
    <div className={`ddd-screen ${isMyTurn && isInput ? "ddd-screen--input" : ""}`}>
      <DDDTurnHeader
        actor={actor}
        phase={phase}
        secondsLeft={secondsLeft}
        warning={warning}
        isMyTurn={isMyTurn}
      />

      {isWaiting && (
        <div className="ddd-waiting">
          <div className="ddd-waiting-pulse" />
          <p>Waiting for {actor?.nickname}…</p>
        </div>
      )}

      {isMyTurn && isInput && (
        <DDDInputPanel
          pickable={pickable}
          allowSelfPick={allowSelfPick}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      )}

      {isReveal && (
        <DDDRevealAnimation
          phase={phase}
          currentTurn={currentTurn}
          players={players}
          actor={actor}
        />
      )}

      {isTurnResult && (
        <DDDTurnResult
          actor={actor}
          currentTurn={currentTurn}
          reactions={reactions}
          userId={userId}
          onReact={onReact}
        />
      )}
    </div>
  );
}
