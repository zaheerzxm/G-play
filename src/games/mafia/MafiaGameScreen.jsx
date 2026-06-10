import { motion, AnimatePresence } from "framer-motion";
import { PHASE_LABELS } from "./constants.js";
import MafiaTimer from "./MafiaTimer.jsx";
import MafiaPlayerList from "./MafiaPlayerList.jsx";
import MafiaEventFeed from "./MafiaEventFeed.jsx";
import MafiaRoleReveal from "./MafiaRoleReveal.jsx";
import MafiaActionPanel from "./MafiaActionPanel.jsx";

export default function MafiaGameScreen({
  game,
  players,
  events,
  voteCounts,
  userId,
  roleInfo,
  actions,
  secondsLeft,
  spectator,
}) {
  const phase = game?.phase;
  const alive = players.filter((p) => p.is_alive !== false);

  return (
    <div className={`mafia-game-screen mafia-game-screen--${phase}`}>
      <header className="mafia-game-header">
        <h2>🕵️ Mafia</h2>
        <div className="mafia-game-meta">
          <span>Round {game?.round_number ?? 1}</span>
          <span>{PHASE_LABELS[phase] ?? phase}</span>
          <MafiaTimer secondsLeft={secondsLeft} />
        </div>
      </header>

      <AnimatePresence mode="wait">
        {phase === "role_reveal" && roleInfo.role && !spectator && (
          <motion.div key="role" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MafiaRoleReveal role={roleInfo.role} teammates={roleInfo.teammates} />
          </motion.div>
        )}

        {phase === "night" && (
          <motion.div key="night" className="mafia-night" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="mafia-phase-banner">🌙 Everyone is sleeping…</p>
            {spectator || !roleInfo.isAlive ? (
              <p className="mafia-spectator-msg">Wait for night to end</p>
            ) : (
              <>
                {actions.kill && (
                  <MafiaActionPanel
                    title="Mafia — choose a target"
                    hint="Pick a villager to eliminate"
                    players={alive}
                    userId={userId}
                    onSubmit={actions.kill}
                    busy={actions.busy}
                  />
                )}
                {actions.save && (
                  <MafiaActionPanel
                    title="Doctor — choose someone to save"
                    hint="You may save yourself"
                    players={alive}
                    userId={userId}
                    onSubmit={actions.save}
                    busy={actions.busy}
                    aliveOnly={false}
                  />
                )}
                {actions.investigate && (
                  <MafiaActionPanel
                    title="Detective — investigate"
                    hint="Learn if they are Mafia"
                    players={alive}
                    userId={userId}
                    onSubmit={actions.investigate}
                    busy={actions.busy}
                  />
                )}
                {!actions.kill && !actions.save && !actions.investigate && (
                  <p className="mafia-spectator-msg">Sleep tight — no night action</p>
                )}
              </>
            )}
          </motion.div>
        )}

        {phase === "night_result" && (
          <motion.div key="night-result" className="mafia-night-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <MafiaEventFeed events={events} />
          </motion.div>
        )}

        {phase === "day" && (
          <motion.div key="day" className="mafia-day" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="mafia-phase-banner mafia-phase-banner--day">☀️ Day discussion — use voice!</p>
            <MafiaPlayerList players={players} userId={userId} />
            <MafiaEventFeed events={events} />
            {!roleInfo.isAlive && (
              <p className="mafia-spectator-msg">You were eliminated — spectating</p>
            )}
          </motion.div>
        )}

        {phase === "voting" && (
          <motion.div key="vote" className="mafia-voting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="mafia-phase-banner">🗳️ Vote to eliminate</p>
            {voteCounts?.length > 0 && (
              <ul className="mafia-vote-counts">
                {voteCounts.map((v) => {
                  const pl = players.find((p) => p.user_id === v.target_user_id);
                  return (
                    <li key={v.target_user_id}>
                      {pl?.nickname ?? "?"}: {v.votes}
                    </li>
                  );
                })}
              </ul>
            )}
            {actions.vote ? (
              <MafiaActionPanel
                title="Cast your vote"
                hint="Most votes eliminates a player — ties mean no elimination"
                players={alive}
                userId={userId}
                onSubmit={actions.vote}
                busy={actions.busy}
              />
            ) : (
              <p className="mafia-spectator-msg">Spectating vote</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {roleInfo.detectiveResults?.length > 0 && (
        <div className="mafia-detective-log">
          <h4>Investigation results</h4>
          <ul>
            {roleInfo.detectiveResults.map((e) => (
              <li key={e.id}>{e.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
