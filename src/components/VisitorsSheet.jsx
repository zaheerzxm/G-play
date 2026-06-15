import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AvatarImg from "./AvatarImg.jsx";
import { formatVisitAgo, loadVisitors, markVisitorsSeen } from "../visitors.js";

export default function VisitorsSheet({ userId, onClose }) {
  const [visitors, setVisitors] = useState([]);

  useEffect(() => {
    if (!userId) return;
    setVisitors(loadVisitors(userId));
    markVisitorsSeen(userId);
  }, [userId]);

  const sheet = (
    <div className="gplay-mobile-shell-backdrop" onClick={onClose}>
      <div className="gplay-mobile-shell hub-sheet visitors-sheet visitors-sheet--full" onClick={(e) => e.stopPropagation()}>
        <header className="hub-sheet-header">
          <button type="button" className="hub-sheet-back" onClick={onClose} aria-label="Back">‹</button>
          <h2>Visitors</h2>
          <span />
        </header>

        {visitors.length === 0 ? (
          <p className="visitors-empty">No visitors yet — share your profile!</p>
        ) : (
          <ul className="visitors-list">
            {visitors.map((v) => (
              <li key={`${v.id}-${v.visitedAt}`} className="visitors-row">
                <AvatarImg
                  src={v.avatar_url}
                  fallback={(v.display_name || "?").charAt(0)}
                  className="visitors-avatar"
                  imgClassName="visitors-avatar"
                />
                <div className="visitors-row-body">
                  <strong>{v.display_name}</strong>
                  <span className="visitors-row-meta">
                    {v.country ? `${v.country} · ` : ""}
                    {formatVisitAgo(v.visitedAt)}
                  </span>
                </div>
                {v.isNew && <span className="visitors-new-badge">New</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
