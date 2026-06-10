const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

export default function WordleKeyboard({ onKey, keyStates = {}, disabled }) {
  return (
    <div className="wordle-keyboard" role="group" aria-label="Wordle keyboard">
      {ROWS.map((row, ri) => (
        <div key={ri} className="wordle-kb-row">
          {row.map((key) => {
            const state = key.length === 1 ? keyStates[key.toLowerCase()] : null;
            const wide = key === "ENTER" || key === "⌫";
            return (
              <button
                key={key}
                type="button"
                className={`wordle-kb-key ${wide ? "wordle-kb-key--wide" : ""} ${
                  state ? `wordle-kb-key--${state}` : ""
                }`}
                disabled={disabled}
                onClick={() => onKey(key)}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
