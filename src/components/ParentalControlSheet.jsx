import { useState } from "react";

export default function ParentalControlSheet({ onClose, onToast }) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem("gplay.parental") === "1";
    } catch {
      return false;
    }
  });

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    try {
      if (next) localStorage.setItem("gplay.parental", "1");
      else localStorage.removeItem("gplay.parental");
    } catch {
      /* ignore */
    }
    onToast?.(next ? "Parental control mode on" : "Parental control mode off");
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <header className="sheet-header">
          <button type="button" className="sheet-back" onClick={onClose}>‹</button>
          <h2>Parental control mode</h2>
        </header>
        <div className="sheet-body">
          <p className="sheet-muted">
            When enabled, coin purchases and some social features require extra confirmation.
          </p>
          <label className="sheet-toggle-row">
            <span>Parental control mode</span>
            <input type="checkbox" checked={enabled} onChange={toggle} />
          </label>
        </div>
      </div>
    </div>
  );
}
