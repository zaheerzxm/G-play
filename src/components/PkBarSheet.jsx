import { useState } from "react";
import { createPortal } from "react-dom";

export default function PkBarSheet({
  onClose,
  onStart,
  onReset,
  onToast,
  initialTeamA = 0,
  initialTeamB = 0,
}) {
  const [teamA, setTeamA] = useState(initialTeamA);
  const [teamB, setTeamB] = useState(initialTeamB);

  const total = Math.max(1, teamA + teamB);
  const pctA = Math.round((teamA / total) * 100);
  const pctB = 100 - pctA;

  const sheet = (
    <div className="pk-bar-backdrop" onClick={onClose}>
      <div className="pk-bar-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="pk-bar-header">
          <button type="button" className="pk-bar-back" onClick={onClose} aria-label="Close">
            ‹
          </button>
          <h3>PK Battle</h3>
          <button
            type="button"
            className="pk-bar-reset"
            onClick={() => {
              setTeamA(0);
              setTeamB(0);
              onReset?.();
            }}
          >
            Reset
          </button>
        </header>
        <p className="pk-bar-hint">Seats 1–7 = Team A · Seats 8–14 = Team B. Gifts add to the recipient&apos;s team.</p>
        <div className="pk-bar-track">
          <div className="pk-bar-side pk-bar-side--a" style={{ flex: Math.max(1, teamA + 1) }}>
            <span>Team A</span>
            <strong>{teamA}</strong>
          </div>
          <span className="pk-bar-vs">VS</span>
          <div className="pk-bar-side pk-bar-side--b" style={{ flex: Math.max(1, teamB + 1) }}>
            <strong>{teamB}</strong>
            <span>Team B</span>
          </div>
        </div>
        <div className="pk-bar-pct">
          <span>{pctA}%</span>
          <span>{pctB}%</span>
        </div>
        <div className="pk-bar-controls">
          <button type="button" onClick={() => setTeamA((v) => v + 10)}>
            +10 A
          </button>
          <button type="button" onClick={() => setTeamB((v) => v + 10)}>
            +10 B
          </button>
        </div>
        <button
          type="button"
          className="pk-bar-start"
          onClick={() => {
            onStart?.({ teamA, teamB });
            onToast?.("PK started — gift battle live!");
            onClose?.();
          }}
        >
          Start PK
        </button>
      </div>
    </div>
  );
  return createPortal(sheet, document.body);
}
