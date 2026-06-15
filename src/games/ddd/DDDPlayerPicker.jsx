import AvatarImg from "../../components/AvatarImg.jsx";

export default function DDDPlayerPicker({ players, query, onQueryChange, onPick, disabledIds = [] }) {
  const q = (query ?? "").trim().toLowerCase();
  const filtered = (players ?? []).filter((p) => {
    if (disabledIds.includes(p.user_id)) return false;
    if (!q) return true;
    return (p.nickname ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="ddd-picker">
      <input
        type="text"
        className="ddd-picker-search"
        placeholder="Search player…"
        value={query ?? ""}
        onChange={(e) => onQueryChange?.(e.target.value)}
      />
      <ul className="ddd-picker-list">
        {filtered.map((p) => (
          <li key={p.user_id}>
            <button type="button" className="ddd-picker-item" onClick={() => onPick?.(p)}>
              <AvatarImg
                src={p.avatar_url}
                fallback={p.nickname}
                className="ddd-picker-avatar ddd-picker-avatar--fallback"
                imgClassName="ddd-picker-avatar"
              />
              <span>{p.nickname}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
