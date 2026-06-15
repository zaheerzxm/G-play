export default function DDDSettingsModal({ settings, onChange, onClose }) {
  return (
    <div className="ddd-settings-backdrop" onClick={onClose}>
      <div className="ddd-settings-modal" onClick={(e) => e.stopPropagation()}>
        <h3>DDD settings</h3>
        <label>
          Turn timer (seconds)
          <input
            type="number"
            min={30}
            max={120}
            value={settings.turnSeconds}
            onChange={(e) => onChange({ ...settings, turnSeconds: Number(e.target.value) })}
          />
        </label>
        <label className="ddd-settings-check">
          <input
            type="checkbox"
            checked={settings.allowSelfPick}
            onChange={(e) => onChange({ ...settings, allowSelfPick: e.target.checked })}
          />
          Allow self-pick (4+ players)
        </label>
        <button type="button" className="game-btn game-btn--primary" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
