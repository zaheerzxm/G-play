import { useEffect, useRef } from "react";
import { IconGames, IconHammer, IconHeart, IconHome, IconVideo } from "./NavIcons.jsx";

export default function RoomMenu({
  open,
  onClose,
  isOwner,
  isSaved,
  isFollowing,
  busy,
  onJoin,
  onLeaveSaved,
  onFollow,
  onUnfollow,
  onInvite,
  onShare,
  onReport,
  onRally,
  onLeaveRoom,
  onDeleteRoom,
  isSuperAdmin = false,
  onSettings,
  onToggleGiftSound,
  giftSoundOn = true,
  onAdmins,
  onMode,
  currentMode = "normal",
  canChangeMode = false,
  canRally = false,
  canManageRoom = false,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, onClose]);

  if (!open) return null;

  const modes = [
    { key: "normal", Icon: IconHome, label: "Normal" },
    { key: "acquaint", Icon: IconHeart, label: "Acquaint" },
    { key: "auction", Icon: IconHammer, label: "Auction", badge: "NEW" },
    { key: "video", Icon: IconVideo, label: "Video" },
    { key: "games", Icon: IconGames, label: "Games" },
  ];

  const actions = [
    { key: "join", icon: isSaved ? "✓" : "＋", label: isSaved ? "Room joined" : "Join room", onClick: isSaved ? onLeaveSaved : onJoin, hidden: isOwner },
    { key: "friend", icon: isFollowing ? "★" : "♡", label: isFollowing ? "Followed" : "Follow room", onClick: isFollowing ? onUnfollow : onFollow, hidden: isOwner },
    { key: "share", icon: "↗", label: "Share", onClick: onShare },
    { key: "sound", icon: giftSoundOn ? "♪" : "🔇", label: giftSoundOn ? "Gift Sound" : "Sound Off", onClick: onToggleGiftSound ?? onSettings },
    { key: "report", icon: "!", label: "Report Room", onClick: onReport },
    { key: "exit", icon: "↪", label: "Exit", onClick: onLeaveRoom, danger: true },
    { key: "settings", icon: "◎", label: "Settings", onClick: onSettings, hidden: !canManageRoom },
    { key: "recommend", icon: "⇧", label: "Recommendation", onClick: onInvite },
    { key: "rally", icon: "⚑", label: "Rally Fans", onClick: onRally, hidden: !canRally },
    { key: "guide", icon: "▱", label: "Guide", onClick: onInvite },
  ].filter((item) => !item.hidden);

  return (
    <div className="stage-menu-backdrop" onClick={onClose}>
      <div className="stage-menu-panel" ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <div className="stage-menu-section">
          <p className="stage-menu-title">Mode</p>
          <div className="stage-menu-modes">
            {modes.map((mode) => (
              <button
                key={mode.key}
                type="button"
                className={`stage-menu-mode ${currentMode === mode.key ? "stage-menu-mode--active" : ""} ${!canChangeMode ? "stage-menu-mode--locked" : ""}`}
                disabled={!canChangeMode}
                title={!canChangeMode ? "Only host, admin, or owner can change mode" : undefined}
                onClick={() => {
                  if (!canChangeMode) return;
                  onClose();
                  onMode?.(mode.key);
                }}
              >
                {mode.badge && <span className="stage-menu-mode-badge">{mode.badge}</span>}
                <span className="stage-menu-mode-icon"><mode.Icon /></span>
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="stage-menu-section">
          <p className="stage-menu-title">Function of the room</p>
          <div className="stage-menu-grid">
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                className={`stage-menu-tile ${action.danger ? "stage-menu-tile--danger" : ""}`}
                disabled={busy}
                onClick={() => {
                  action.onClick?.();
                  if (action.key !== "exit" && action.key !== "delete") onClose();
                }}
              >
                <span className="stage-menu-tile-icon">{action.icon}</span>
                <span className="stage-menu-tile-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
