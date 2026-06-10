export default function MafiaEventFeed({ events = [] }) {
  const publicEvents = [...events]
    .filter((e) => !e.private_user_id)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(-8);

  if (!publicEvents.length) return null;

  return (
    <div className="mafia-event-feed">
      <h3>Events</h3>
      <ul>
        {publicEvents.map((e) => (
          <li key={e.id} className={`mafia-event mafia-event--${e.event_type}`}>
            {e.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
