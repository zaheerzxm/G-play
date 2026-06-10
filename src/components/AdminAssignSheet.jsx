import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  addRoomAdmin,
  loadAdminCandidates,
  loadRoomAdmins,
  removeRoomAdmin,
} from "../roomAdmin.js";

function normalizePerson(user) {
  const id = user?.user_id ?? user?.id;
  if (!id) return null;
  return {
    id,
    user_id: id,
    display_name: user.display_name ?? user.nickname ?? "Member",
    avatar_url: user.avatar_url ?? null,
    is_following: Boolean(user.is_following),
  };
}

const tapLock = { busy: false };

function runTap(e, fn) {
  if (tapLock.busy) return;
  if (e?.button != null && e.button !== 0) return;
  e?.preventDefault?.();
  e?.stopPropagation?.();
  tapLock.busy = true;
  Promise.resolve(fn()).finally(() => {
    window.setTimeout(() => {
      tapLock.busy = false;
    }, 280);
  });
}

export default function AdminAssignSheet({
  roomId,
  owner,
  ownerId,
  onClose,
  onAdminsChange,
  onToast,
}) {
  const [mounted, setMounted] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [err, setErr] = useState(null);
  const onAdminsChangeRef = useRef(onAdminsChange);
  onAdminsChangeRef.current = onAdminsChange;

  useEffect(() => {
    setMounted(true);
  }, []);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    const [nextAdmins, nextCandidates] = await Promise.all([
      loadRoomAdmins(roomId),
      loadAdminCandidates(roomId),
    ]);
    setAdmins(nextAdmins.map(normalizePerson).filter(Boolean));
    setCandidates(nextCandidates.map(normalizePerson).filter(Boolean));
    onAdminsChangeRef.current?.(nextAdmins);
  }, [roomId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    refresh()
      .catch((e) => {
        if (!cancelled) setErr(e.message ?? "Could not load admins");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const adminIds = useMemo(
    () => new Set([ownerId, ...admins.map((a) => a.id)].filter(Boolean)),
    [ownerId, admins],
  );

  const addList = useMemo(
    () => candidates.filter((m) => m && !adminIds.has(m.id)),
    [candidates, adminIds],
  );

  async function handleAdd(userId) {
    if (!userId || busyId || adminIds.has(userId)) return;
    const person = candidates.find((c) => c.id === userId);
    if (!person) {
      setErr("Member not found");
      return;
    }

    const before = admins;
    setAdmins((prev) => (prev.some((a) => a.id === userId) ? prev : [...prev, person]));
    setAddOpen(false);
    setErr(null);
    setBusyId(userId);

    try {
      await addRoomAdmin(roomId, userId);
      onToast?.(`${person.display_name} is now an admin`);
      await refresh();
    } catch (ex) {
      setAdmins(before);
      setErr(ex.message ?? "Could not add admin");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(userId) {
    if (!userId || busyId) return;
    const before = admins;
    const removed = admins.find((a) => a.id === userId);
    setAdmins((prev) => prev.filter((a) => a.id !== userId));
    setErr(null);
    setBusyId(userId);

    try {
      await removeRoomAdmin(roomId, userId);
      onToast?.(removed ? `Removed ${removed.display_name}` : "Admin removed");
      await refresh();
    } catch (ex) {
      setAdmins(before);
      setErr(ex.message ?? "Could not remove admin");
    } finally {
      setBusyId(null);
    }
  }

  function UserRow({ user, badge, onAction, actionLabel, actionClass = "" }) {
    const id = user.id;
    const name = user.display_name ?? "Guest";
    const initial = name.charAt(0).toUpperCase();
    const isBusy = busyId === id;
    const actionTap = (e) => {
      if (isBusy) return;
      runTap(e, () => onAction(id));
    };

    return (
      <div className="room-admin-row">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="room-admin-avatar" draggable={false} />
        ) : (
          <span className="room-admin-avatar room-admin-avatar--fallback">{initial}</span>
        )}
        <div className="room-admin-meta">
          <span className="room-admin-name">{name}</span>
          {user.is_following && <span className="room-admin-tag">Fan</span>}
        </div>
        {badge ? (
          <span className="room-admin-badge">{badge}</span>
        ) : (
          <button
            type="button"
            className={`room-admin-action ${actionClass}`}
            disabled={isBusy}
            onPointerUp={actionTap}
            onClick={actionTap}
          >
            {isBusy ? "…" : actionLabel}
          </button>
        )}
      </div>
    );
  }

  const ownerRow = owner ? normalizePerson(owner) : null;

  if (!mounted) return null;

  return createPortal(
    <div
      className="room-admin-portal profile-card-backdrop room-profile-backdrop room-admin-backdrop"
      onPointerUp={(e) => {
        if (e.target === e.currentTarget) runTap(e, onClose);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) runTap(e, onClose);
      }}
    >
      <div
        className="room-settings-sheet room-admin-sheet"
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="room-settings-nav">
          <button
            type="button"
            className="room-settings-back"
            onPointerUp={(e) => runTap(e, onClose)}
            onClick={(e) => runTap(e, onClose)}
            aria-label="Back"
          >
            ‹
          </button>
          <h3 className="room-settings-title">Admins</h3>
          <span />
        </div>

        {loading ? (
          <p className="room-admin-empty">Loading…</p>
        ) : (
          <>
            <div className="room-settings-group">
              <p className="room-admin-hint">Promote someone on a seat or who joined the room.</p>
              {ownerRow && <UserRow user={ownerRow} badge="Owner" />}
              {admins.map((a) => (
                <UserRow
                  key={a.id}
                  user={a}
                  actionLabel="Remove"
                  actionClass="room-admin-action--remove"
                  onAction={handleRemove}
                />
              ))}
              {!ownerRow && admins.length === 0 && (
                <p className="room-admin-empty">No admins yet — tap Add admin below</p>
              )}
            </div>

            <div className="room-settings-group">
              <button
                type="button"
                className="room-admin-add-toggle"
                onPointerUp={(e) => runTap(e, () => setAddOpen((open) => !open))}
                onClick={(e) => runTap(e, () => setAddOpen((open) => !open))}
              >
                <span>Add admin</span>
                <span className="room-settings-value">{addOpen ? "▾" : "›"}</span>
              </button>

              {addOpen && (
                <div className="room-admin-candidates">
                  {addList.length === 0 ? (
                    <p className="room-admin-empty">No one to add — need members on seats or joined</p>
                  ) : (
                    addList.map((m) => (
                      <UserRow
                        key={m.id}
                        user={m}
                        actionLabel="Add"
                        actionClass="room-admin-action--add"
                        onAction={handleAdd}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {err && <p className="banner error room-admin-error">{err}</p>}
      </div>
    </div>,
    document.body,
  );
}
