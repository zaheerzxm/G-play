import { useState } from "react";
import MomentsFeed from "./MomentsFeed.jsx";
import CreateMomentSheet from "./CreateMomentSheet.jsx";
import { SPOTLIGHT_FEED_NAME } from "../moments.js";
import { IconChurch, IconFamily, IconNearby } from "./NavIcons.jsx";

const EXPLORE_SHORTCUTS = [
  { key: "church", Icon: IconChurch, label: "Church" },
  { key: "family", Icon: IconFamily, label: "Family" },
  { key: "nearby", Icon: IconNearby, label: "Nearby" },
];

export default function ExploreTab({
  userId,
  displayName,
  onOpenChurch,
  onOpenFamily,
  onOpenNearby,
}) {
  const [postOpen, setPostOpen] = useState(false);
  const [editingMoment, setEditingMoment] = useState(null);
  const [feedKey, setFeedKey] = useState(0);

  function handleShortcut(key) {
    if (key === "church") onOpenChurch?.();
    else if (key === "family") onOpenFamily?.();
    else if (key === "nearby") onOpenNearby?.();
  }

  function refreshFeed() {
    setFeedKey((k) => k + 1);
  }

  return (
    <div className="G-play-explore-tab">
      <header className="G-play-tab-header G-play-tab-header--explore">
        <h2 className="G-play-tab-title">Discover</h2>
      </header>

      <div className="G-play-explore-shortcuts">
        {EXPLORE_SHORTCUTS.map(({ key, Icon, label }) => (
          <button key={key} type="button" className="G-play-explore-shortcut" onClick={() => handleShortcut(key)}>
            <span className="G-play-explore-shortcut-icon">
              <Icon />
            </span>
            <strong>{label}</strong>
          </button>
        ))}
      </div>

      <section className="G-play-explore-moments">
        <div className="G-play-explore-moments-head">
          <div>
            <h3 className="G-play-explore-moments-title">{SPOTLIGHT_FEED_NAME}</h3>
            <p className="G-play-explore-moments-sub">Share vibes with the community</p>
          </div>
          <button
            type="button"
            className="G-play-explore-moments-add"
            onClick={() => setPostOpen(true)}
            aria-label="New post"
          >
            +
          </button>
        </div>
        <MomentsFeed
          key={feedKey}
          userId={userId}
          embedded
          feedOnly
          onEditMoment={(moment) => setEditingMoment(moment)}
        />
      </section>

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
