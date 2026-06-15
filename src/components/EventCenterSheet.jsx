import { createPortal } from "react-dom";

const EVENTS = [
  {
    key: "pk-king",
    title: "PK King VS Queen",
    subtitle: "Battle for the crown · gift wars",
    badge: "LIVE",
    art: "👑",
    gradient: "linear-gradient(135deg,#2563eb,#7c3aed)",
    action: "rankings",
    cta: "View rankings",
  },
  {
    key: "gold-rush",
    title: "Gold Rush",
    subtitle: "Invite friends · bonus coins",
    badge: "HOT",
    art: "🪙",
    gradient: "linear-gradient(135deg,#f59e0b,#ef4444)",
    action: "invite",
    cta: "Invite now",
  },
  {
    key: "daily-tasks",
    title: "Daily Missions",
    subtitle: "Complete tasks · earn rewards",
    badge: "NEW",
    art: "📋",
    gradient: "linear-gradient(135deg,#0ea5e9,#06b6d4)",
    action: "tasks",
    cta: "Open tasks",
  },
  {
    key: "vip-week",
    title: "VIP Weekly",
    subtitle: "7-day membership perks",
    badge: "VIP",
    art: "✨",
    gradient: "linear-gradient(135deg,#a855f7,#ec4899)",
    action: "vip",
    cta: "My membership",
  },
  {
    key: "game-night",
    title: "Game Night",
    subtitle: "Mafia · Word Battle · Trivia",
    badge: "PLAY",
    art: "🎮",
    gradient: "linear-gradient(135deg,#15803d,#4ade80)",
    action: "rooms",
    cta: "Find game rooms",
  },
  {
    key: "clan-rally",
    title: "Clan Rally",
    subtitle: "Weekly clan heat milestones",
    badge: "CLAN",
    art: "🏰",
    gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    action: "clan",
    cta: "Open clan",
  },
];

export default function EventCenterSheet({ onClose, onAction, onToast }) {
  function handleEvent(ev) {
    if (onAction?.(ev.action)) {
      onClose?.();
      return;
    }
    onToast?.(`${ev.title} — check back soon for full details`);
  }

  const sheet = (
    <div className="gplay-mobile-shell-backdrop" onClick={onClose}>
      <div className="gplay-mobile-shell event-center-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="event-center-header">
          <button type="button" className="event-center-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <h2>Event Center</h2>
          <span className="event-center-header-spacer" aria-hidden />
        </header>
        <p className="event-center-lead">Limited campaigns and weekly bonuses</p>
        <div className="event-center-grid">
          {EVENTS.map((ev) => (
            <button
              key={ev.key}
              type="button"
              className="event-center-card"
              style={{ background: ev.gradient }}
              onClick={() => handleEvent(ev)}
            >
              <span className="event-center-card-badge">{ev.badge}</span>
              <span className="event-center-card-art" aria-hidden>
                {ev.art}
              </span>
              <span className="event-center-card-copy">
                <strong>{ev.title}</strong>
                <small>{ev.subtitle}</small>
                <em>{ev.cta} ›</em>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
  return createPortal(sheet, document.body);
}
