import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { loadRoomBlacklist, removeFromBlacklist } from "../roomAdmin.js";

export default function RoomBlacklistSheet({ roomId, onClose, onToast }) {
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    const next = await loadRoomBlacklist(roomId);
    setRows(next);
  }, [roomId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    refresh()
      .catch((e) => {
        if (!cancelled) setErr(e.message ?? "Could not load blacklist");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function handleRemove(userId) {
    if (!userId || busyId) return;
    const removed = rows.find((r) => r.user_id === userId);
    setBusyId(userId);
    setErr(null);
    try {
      await removeFromBlacklist(roomId, userId);
      setRows((prev) => prev.filter((r) => r.user_id !== userId));
      onToast?.(removed ? `Unblocked ${removed.display_name}` : "User unblocked");
    } catch (e) {
      setErr(e.message ?? "Could not unblock user");
    } finally {
      setBusyId(null);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="room-admin-portal profile-card-backdrop room-profile-backdrop room-admin-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="room-settings-sheet room-admin-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="room-settings-nav">
          <button type="button" className="room-settings-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <h3 className="room-settings-title">Blacklist</h3>
          <span />
        </div>

        <p className="room-blacklist-hint">
          Room blacklist — kicked users you checked &quot;Add to blacklist&quot;. Remove here to let them back in.
          Profile Block is separate (unfriend / no DM / can&apos;t enter each other&apos;s owned rooms).
        </p>

        {loading && <p className="room-settings-saving">Loading…</p>}
        {err && <p className="room-admin-error">{err}</p>}

        {!loading && !rows.length && !err && (
          <p className="room-blacklist-empty">No blocked users</p>
        )}

        <div className="room-admin-list">
          {rows.map((row) => {
            const initial = (row.display_name ?? "?").charAt(0).toUpperCase();
            const isBusy = busyId === row.user_id;
            return (
              <div key={row.user_id} className="room-admin-row">
                {row.avatar_url ? (
                  <img src={row.avatar_url} alt="" className="room-admin-avatar" draggable={false} />
                ) : (
                  <span className="room-admin-avatar room-admin-avatar--fallback">{initial}</span>
                )}
                <div className="room-admin-meta">
                  <span className="room-admin-name">{row.display_name}</span>
                  {row.reason && <span className="room-admin-tag">{row.reason}</span>}
                </div>
                <button
                  type="button"
                  className="room-admin-action room-admin-action--remove"
                  disabled={isBusy}
                  onClick={() => handleRemove(row.user_id)}
                >
                  {isBusy ? "…" : "Remove"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
