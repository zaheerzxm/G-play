import { useMemo, useState } from "react";
import CharmBadge from "./CharmBadge.jsx";

const SHARE_CHANNELS = [
  { key: "copy", label: "Copy Link", icon: "🔗", color: "#fbbf24" },
  { key: "whatsapp", label: "WhatsApp", icon: "💬", color: "#25d366" },
  { key: "facebook", label: "Facebook", icon: "f", color: "#1877f2" },
  { key: "twitter", label: "X", icon: "𝕏", color: "#111" },
  { key: "instagram", label: "Instagram", icon: "📷", color: "#e1306c" },
];

export default function ShareSheet({
  room,
  recentContacts = [],
  onShareToContact,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const code = room?.room_code ?? room?.id ?? "";
  const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL}?room=${encodeURIComponent(code)}`;
  const shareText = `Join my voice room "${room?.name ?? "Party"}" — ID: ${code}`;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recentContacts;
    return recentContacts.filter((c) => c.display_name?.toLowerCase().includes(q));
  }, [query, recentContacts]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    } catch {
      await navigator.clipboard.writeText(code);
    }
    onClose?.();
  }

  async function nativeShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: room?.name, text: shareText, url: shareUrl });
        onClose?.();
      } else {
        await copyLink();
      }
    } catch {
      /* cancelled */
    }
  }

  function openChannel(key) {
    if (key === "copy") {
      copyLink();
      return;
    }
    const encoded = encodeURIComponent(`${shareText} ${shareUrl}`);
    const urls = {
      whatsapp: `https://wa.me/?text=${encoded}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encoded}`,
      instagram: shareUrl,
    };
    if (urls[key]) window.open(urls[key], "_blank", "noopener");
  }

  return (
    <div className="share-sheet-backdrop" onClick={onClose}>
      <div className="share-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="share-sheet-handle" />
        <input
          type="search"
          className="share-sheet-search"
          placeholder="Search Nickname"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="share-sheet-label">Recent Contacts</p>
        <ul className="share-sheet-contacts">
          {filtered.map((contact) => (
            <li key={contact.id}>
              <button type="button" className="share-sheet-contact" onClick={() => onShareToContact?.(contact)}>
                {contact.avatar_url ? (
                  <img src={contact.avatar_url} alt="" className="share-sheet-avatar" />
                ) : (
                  <span className="share-sheet-avatar share-sheet-avatar--fallback">
                    {(contact.display_name || "?").charAt(0)}
                  </span>
                )}
                <span className="share-sheet-name">
                  {contact.display_name}
                  {contact.familyTag && <em className="share-sheet-family">{contact.familyTag}</em>}
                </span>
                <span className="share-sheet-send" aria-hidden>→</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="share-sheet-empty">No contacts found</li>}
        </ul>
        <div className="share-sheet-social">
          {SHARE_CHANNELS.map((ch) => (
            <button key={ch.key} type="button" className="share-sheet-social-btn" onClick={() => openChannel(ch.key)}>
              <span className="share-sheet-social-icon" style={{ background: ch.color }}>{ch.icon}</span>
              <span>{ch.label}</span>
            </button>
          ))}
        </div>
        <button type="button" className="share-sheet-native" onClick={nativeShare}>
          Share room link
        </button>
      </div>
    </div>
  );
}
