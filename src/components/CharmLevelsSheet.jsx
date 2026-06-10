import { CHARM_TIERS, GOLD_PER_CHARM, formatCharmThreshold } from "../charmTiers.js";
import CharmBadge from "./CharmBadge.jsx";

export default function CharmLevelsSheet({ onClose }) {
  return (
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div className="charm-levels-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="charm-levels-tabs">
          <span className="charm-levels-tab charm-levels-tab--active">Charm Levels</span>
          <span className="charm-levels-tab">Active Levels</span>
        </div>
        <section className="charm-levels-how">
          <h3>How to Increase Charm</h3>
          <p>Receive Gifts</p>
          <p className="charm-levels-rate">{GOLD_PER_CHARM} Gold&apos;s worth of gift = 1 Charm 🎁</p>
        </section>
        <table className="charm-levels-table">
          <thead>
            <tr>
              <th>Charm</th>
              <th>Icon</th>
            </tr>
          </thead>
          <tbody>
            {CHARM_TIERS.map((row) => (
              <tr key={row.level}>
                <td>{formatCharmThreshold(row.min)}</td>
                <td>
                  <CharmBadge charm={row.min} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className="online-list-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
