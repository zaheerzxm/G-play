import { useState } from "react";
import { SPOTLIGHT_FEED_NAME } from "../moments.js";
import MomentsFeed from "./MomentsFeed.jsx";
import CreateMomentSheet from "./CreateMomentSheet.jsx";
import { IconChurch, IconClan, IconMoments, IconNearby } from "./NavIcons.jsx";

const EXPLORE_SHORTCUTS = [
  { key: "church", Icon: IconChurch, label: "church" },
  { key: "clan", Icon: IconClan, label: "Clan", notifyKey: "clan" },
  { key: "nearby", Icon: IconNearby, label: "nearby" },
];

export default function ExploreTab({
  userId,
  displayName,
  avatarUrl,
  onOpenChurch,
  onOpenClan,
  onOpenNearby,
  onOpenSpotlight,
  clanNotify = false,
}) {
  const [postOpen, setPostOpen] = useState(false);
  const [editingMoment, setEditingMoment] = useState(null);
  const [momentsOpen, setMomentsOpen] = useState(false);
  const [feedKey, setFeedKey] = useState(0);

  function handleShortcut(key) {
    if (key === "church") {
      if (onOpenChurch) onOpenChurch();
      else return;
    } else if (key === "clan") {
      if (onOpenClan) onOpenClan();
      else return;
    } else if (key === "nearby") {
      if (onOpenNearby) onOpenNearby();
    }
  }

  function refreshFeed() {
    setFeedKey((k) => k + 1);
  }

  const initial = (displayName || "?").charAt(0).toUpperCase();

  return (
    <div className="G-play-explore-tab">
      <header className="G-play-tab-header G-play-tab-header--explore">
        <h2 className="G-play-tab-title G-play-tab-title--discover">Discover</h2>
      </header>

      <button type="button" className="G-play-explore-moments-card" onClick={() => onOpenSpotlight?.() ?? setMomentsOpen(true)}>
        <span className="G-play-explore-moments-icon" aria-hidden>
          <IconMoments />
        </span>
        <strong className="G-play-explore-moments-label">{SPOTLIGHT_FEED_NAME}</strong>
        <span className="G-play-explore-moments-trail">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="G-play-explore-moments-avatar" />
          ) : (
            <span className="G-play-explore-moments-avatar G-play-explore-moments-avatar--fallback">{initial}</span>
          )}
          <span className="G-play-explore-moments-chevron" aria-hidden>›</span>
        </span>
      </button>

      <div className="G-play-explore-shortcuts">
        {EXPLORE_SHORTCUTS.map(({ key, Icon, label, notifyKey }) => (
          <button key={key} type="button" className="G-play-explore-shortcut" onClick={() => handleShortcut(key)}>
            <span className={`G-play-explore-shortcut-icon G-play-explore-shortcut-icon--${key}`}>
              <Icon />
            </span>
            <strong>
              {label}
              {notifyKey === "clan" && clanNotify && (
                <em className="G-play-explore-shortcut-dot" aria-hidden />
              )}
            </strong>
          </button>
        ))}
      </div>

      {momentsOpen && (
        <MomentsFeed
          key={feedKey}
          userId={userId}
          fullPage
          onClose={() => setMomentsOpen(false)}
          onEditMoment={(moment) => setEditingMoment(moment)}
          onCreatePost={() => setPostOpen(true)}
        />
      )}

      {postOpen && (
        <CreateMomentSheet
          userId={userId}
          displayName={displayName}
          onClose={() => setPostOpen(false)}
          onPosted={refreshFeed}
        />
      )}

      {editingMoment && (
        <CreateMomentSheet
          userId={userId}
          displayName={displayName}
          moment={editingMoment}
          onClose={() => setEditingMoment(null)}
          onPosted={refreshFeed}
        />
      )}
    </div>
  );
}
