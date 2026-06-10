import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { loadBlockedUsers, unblockUser } from "../userBlocks.js";

export default function BlockedUsersSheet({ userId, onClose, onToast }) {
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const next = await loadBlockedUsers(userId);
    setRows(next);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    refresh()
      .catch((e) => {
        if (!cancelled) setErr(e.message ?? "Could not load blocked users");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function handleUnblock(blockedUserId) {
    if (!blockedUserId || busyId) return;
    const removed = rows.find((r) => r.user_id === blockedUserId);
    setBusyId(blockedUserId);
    setErr(null);
    try {
      await unblockUser(userId, blockedUserId);
      setRows((prev) => prev.filter((r) => r.user_id !== blockedUserId));
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
          <h3 className="room-settings-title">Blocked users</h3>
          <span />
        </div>

        <p className="room-blacklist-hint">
          People you blocked from their profile — unfriended, no DMs, and you can&apos;t enter each
          other&apos;s owned rooms. Unblock here to lift those limits (you won&apos;t auto-refriend).
          Room blacklist is separate (room Settings → Blacklist).
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
                </div>
                <button
                  type="button"
                  className="room-admin-action room-admin-action--remove"
                  disabled={isBusy}
                  onClick={() => handleUnblock(row.user_id)}
                >
                  {isBusy ? "…" : "Unblock"}
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
