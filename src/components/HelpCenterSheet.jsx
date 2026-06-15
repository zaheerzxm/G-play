import { useMemo, useState } from "react";

const FAQ_CATEGORIES = [
  { key: "account", label: "Account", icon: "👤" },
  { key: "voice", label: "Voice Room", icon: "🎙️" },
  { key: "games", label: "Games", icon: "🎮" },
  { key: "gifts", label: "Gifts & Coins", icon: "🎁" },
  { key: "social", label: "Friends & Chat", icon: "💬" },
  { key: "safety", label: "Safety", icon: "🛡️" },
];

const FAQ_ITEMS = [
  { cat: "account", q: "How do I change my profile?", a: "Me → Edit Profile to update avatar, name, and bio." },
  { cat: "voice", q: "How do I join a voice room?", a: "Tap Voice Room, browse or search by Room ID, then tap a room." },
  { cat: "games", q: "How do I start a game?", a: "In a room, open the tools grid and pick Games, or set room mode to Games." },
  { cat: "gifts", q: "How do gifts work?", a: "Send gifts in voice rooms or DMs. Receivers earn charm; 5 gold = 1 charm." },
  { cat: "social", q: "How do I add friends?", a: "Chats → + or Find Player, enter their ID, then follow until mutual." },
  { cat: "safety", q: "How do I report someone?", a: "Use Report in chat settings or Report Room from the in-room menu." },
  { cat: "voice", q: "What is PK mode?", a: "PK lets teams compete with gifts — open PK from room tools." },
  { cat: "gifts", q: "Where is my gift wall?", a: "Open a profile → Gift Wall to see received gifts and charm level." },
];

export default function HelpCenterSheet({ onClose }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      if (category && item.cat !== category) return false;
      if (!q) return true;
      return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
    });
  }, [query, category]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet-panel sheet-panel--help" onClick={(e) => e.stopPropagation()}>
        <header className="sheet-header">
          <button type="button" className="sheet-back" onClick={onClose}>‹</button>
          <h2>Help Center</h2>
        </header>
        <div className="sheet-body sheet-body--help">
          <label className="help-center-search">
            <input
              type="search"
              placeholder="Search FAQ…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <p className="help-center-categories-title">Browse by topic</p>
          <div className="help-center-categories" role="group" aria-label="FAQ categories">
            {FAQ_CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`help-center-cat ${category === c.key ? "help-center-cat--active" : ""}`}
                onClick={() => setCategory(category === c.key ? null : c.key)}
              >
                <span aria-hidden>{c.icon}</span>
                <small>{c.label}</small>
              </button>
            ))}
          </div>
          {category && (
            <p className="help-center-active-cat">
              {FAQ_CATEGORIES.find((c) => c.key === category)?.label ?? "Topic"} · {filtered.length} answers
            </p>
          )}
          <ul className="help-center-faq">
            {filtered.length === 0 && <li className="help-center-faq-empty">No matches — try another search</li>}
            {filtered.map((item) => (
              <li key={item.q} className="help-center-faq-item">
                <strong>{item.q}</strong>
                <p>{item.a}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
