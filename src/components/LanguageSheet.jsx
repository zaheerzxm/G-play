import { useState } from "react";

const LANGUAGES = ["English", "Hindi", "Urdu", "Arabic", "Spanish"];

export default function LanguageSheet({ onClose, onToast }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("gplay.language") || "English";
    } catch {
      return "English";
    }
  });

  function pick(next) {
    setLang(next);
    try {
      localStorage.setItem("gplay.language", next);
    } catch {
      /* ignore */
    }
    onToast?.(`Language set to ${next}`);
    onClose?.();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <header className="sheet-header">
          <button type="button" className="sheet-back" onClick={onClose}>‹</button>
          <h2>Language</h2>
        </header>
        <ul className="sheet-pick-list">
          {LANGUAGES.map((label) => (
            <li key={label}>
              <button
                type="button"
                className={lang === label ? "sheet-pick-item sheet-pick-item--active" : "sheet-pick-item"}
                onClick={() => pick(label)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
