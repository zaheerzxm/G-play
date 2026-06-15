import { useState } from "react";
import { createPortal } from "react-dom";
import BlockedUsersSheet from "./BlockedUsersSheet.jsx";

const TIPS = [
  "Never share your password or verification codes.",
  "Report suspicious users from chat settings or room menu.",
  "Enable parental controls for younger players.",
  "Block users who send unwanted invites or messages.",
];

export default function SecurityCenterSheet({ userId, onClose, onToast }) {
  const [blockedOpen, setBlockedOpen] = useState(false);

  const sheet = (
    <div className="gplay-mobile-shell-backdrop" onClick={onClose}>
      <div className="gplay-mobile-shell security-center-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="security-center-header">
          <button type="button" className="security-center-back" onClick={onClose} aria-label="Back">‹</button>
          <h2>Security Center</h2>
          <span className="security-center-header-spacer" aria-hidden />
        </header>
        <section className="security-center-section">
          <h3>Account safety</h3>
          <ul className="security-center-tips">
            {TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
        <button
          type="button"
          className="security-center-link"
          onClick={() => setBlockedOpen(true)}
        >
          Blocked users ›
        </button>
        {blockedOpen && (
          <BlockedUsersSheet
            userId={userId}
            onClose={() => setBlockedOpen(false)}
            onToast={onToast}
          />
        )}
      </div>
    </div>
  );
  return createPortal(sheet, document.body);
}
