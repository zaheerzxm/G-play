export default function MafiaSettingsModal({ settings, onChange, onClose }) {
  return (
    <div className="mafia-settings-backdrop" onClick={onClose}>
      <div className="mafia-settings-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Mafia settings</h3>
        <label>
          Day discussion (seconds)
          <input
            type="number"
            min={30}
            max={300}
            value={settings.daySeconds}
            onChange={(e) => onChange({ ...settings, daySeconds: Number(e.target.value) })}
          />
        </label>
        <label>
          Voting (seconds)
          <input
            type="number"
            min={20}
            max={120}
            value={settings.votingSeconds}
            onChange={(e) => onChange({ ...settings, votingSeconds: Number(e.target.value) })}
          />
        </label>
        <label className="mafia-settings-check">
          <input
            type="checkbox"
            checked={settings.revealOnDeath}
            onChange={(e) => onChange({ ...settings, revealOnDeath: e.target.checked })}
          />
          Reveal role when eliminated
        </label>
        <label className="mafia-settings-check">
          <input
            type="checkbox"
            checked={settings.allowDeadChat}
            onChange={(e) => onChange({ ...settings, allowDeadChat: e.target.checked })}
          />
          Allow dead players to chat
        </label>
        <button type="button" className="game-btn game-btn--primary" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
