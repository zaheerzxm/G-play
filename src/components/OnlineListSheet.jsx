export default function OnlineListSheet({ users, onClose }) {
  return (
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div className="online-list-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 className="online-list-title">Online ({users.length})</h3>
        <ul className="online-list">
          {users.map((u) => (
            <li key={u.user_id || u.nickname} className="online-list-item">
              <span className="online-list-avatar">
                {(u.nickname || "?").charAt(0).toUpperCase()}
              </span>
              <span>{u.nickname || "Guest"}</span>
            </li>
          ))}
        </ul>
        {users.length === 0 && <p className="online-list-empty">No one online</p>}
        <button type="button" className="online-list-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
