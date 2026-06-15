import { useEffect, useState } from "react";
import { loadClanNews } from "../../clans.js";
import { IconMegaphone, IconMe, IconStar, IconTrophy, ModuleIcon } from "../NavIcons.jsx";

const NEWS_TABS = [
  { key: "world", label: "World News" },
  { key: "clan", label: "Clan News" },
];

const KIND_ICONS = {
  milestone: IconTrophy,
  achievement: IconStar,
  info: IconMegaphone,
  member: IconMe,
};

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ClanNewsTab({ clanId }) {
  const [tab, setTab] = useState("clan");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadClanNews(clanId, tab)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [clanId, tab]);

  return (
    <div className="clan-news-tab">
      <div className="clan-subtabs">
        {NEWS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "clan-subtab--active" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="hub-sheet-hint">Loading…</p>}

      <ul className="clan-news-feed">
        {items.map((item) => {
          const KindIcon = KIND_ICONS[item.kind] ?? IconMegaphone;
          return (
            <li key={item.id} className="clan-news-item">
              <ModuleIcon Icon={KindIcon} className="clan-news-icon" />
              <div className="clan-news-body">
                <p>{item.body}</p>
                <time>{formatDate(item.created_at)}</time>
              </div>
            </li>
          );
        })}
        {!loading && items.length === 0 && (
          <li className="clan-news-empty">No news yet</li>
        )}
      </ul>
    </div>
  );
}
