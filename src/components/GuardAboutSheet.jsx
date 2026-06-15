import { createPortal } from "react-dom";
import { formatCompactNumber } from "../formatCompact.js";
import { GUARD_PROPOSE_CP } from "../relationships.js";
import { IconGuard, UiIcon } from "./NavIcons.jsx";

export default function GuardAboutSheet({ onClose }) {
  const sheet = (
    <div className="profile-card-backdrop weplay-subpage-backdrop" onClick={onClose}>
      <div className="weplay-subpage weplay-guard-about" onClick={(e) => e.stopPropagation()}>
        <header className="weplay-subpage-header">
          <button type="button" className="weplay-subpage-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <h1>About Protection</h1>
        </header>

        <div className="weplay-guard-about-body">
          <section>
            <h2><UiIcon Icon={IconGuard} /> Daily Protect</h2>
            <p>
              Tap <strong>Protect</strong> once per day for free — it adds <strong>40 protection points</strong> without spending coins.
            </p>
          </section>
          <section>
            <h2>Gifts &amp; points</h2>
            <p>
              Sending gifts also adds protection: <strong>5 gold gift = 1 protection point</strong>.
              Guard scores appear on profiles and in the Guard ranking.
            </p>
          </section>
          <section>
            <h2>Church proposal</h2>
            <p>
              Reach <strong>{formatCompactNumber(GUARD_PROPOSE_CP)} protection points</strong> to propose
              a couple bond in the church. Higher guard shows stronger commitment.
            </p>
          </section>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
