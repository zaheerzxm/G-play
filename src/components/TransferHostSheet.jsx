import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { loadAdminCandidates, transferRoomOwnership } from "../roomAdmin.js";
import AvatarImg from "./AvatarImg.jsx";

export default function TransferHostSheet({
  roomId,
  ownerId,
  onClose,
  onTransferred,
  onToast,
}) {
  const [mounted, setMounted] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState(null);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    const rows = await loadAdminCandidates(roomId);
    setCandidates(
      rows.filter((m) => m?.user_id && m.user_id !== ownerId),
    );
  }, [roomId, ownerId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    refresh()
      .catch((e) => {
        if (!cancelled) setErr(e.message ?? "Could not load members");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function handleTransfer(userId, displayName) {
    if (!userId || busyId) return;
    const label = displayName || "this member";
    if (!window.confirm(`Transfer room ownership to ${label}? You will become a regular member.`)) return;

    setBusyId(userId);
    setErr(null);
    try {
      const updated = await transferRoomOwnership(roomId, ownerId, userId);
      onToast?.(`Ownership transferred to ${label}`);
      onTransferred?.(updated);
      onClose?.();
    } catch (e) {
      setErr(e.message ?? "Could not transfer ownership");
    } finally {
      setBusyId(null);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="gplay-mobile-shell-backdrop" onClick={onClose}>
      <div className="gplay-mobile-shell admin-assign-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="admin-assign-header">
          <button type="button" className="admin-assign-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <h2>Transfer Host</h2>
          <span />
        </header>

        <p className="admin-assign-hint">
          Choose a seated member or follower in this room. You will lose owner controls after transfer.
        </p>

        {err && <p className="admin-assign-error">{err}</p>}

        {loading ? (
          <p className="admin-assign-loading">Loading members…</p>
        ) : candidates.length === 0 ? (
          <p className="admin-assign-empty">No eligible members in this room yet.</p>
        ) : (
          <ul className="admin-assign-list">
            {candidates.map((member) => {
              const id = member.user_id ?? member.id;
              const initial = (member.display_name || "?").charAt(0).toUpperCase();
              return (
                <li key={id}>
                  <button
                    type="button"
                    className="admin-assign-row"
                    disabled={Boolean(busyId)}
                    onClick={() => handleTransfer(id, member.display_name)}
                  >
                    {member.avatar_url ? (
                      <AvatarImg
                        src={member.avatar_url}
                        fallback={initial}
                        className="admin-assign-avatar"
                        imgClassName="admin-assign-avatar-img"
                      />
                    ) : (
                      <span className="admin-assign-avatar admin-assign-avatar--fallback">{initial}</span>
                    )}
                    <span className="admin-assign-name">{member.display_name ?? "Member"}</span>
                    <span className="admin-assign-action">{busyId === id ? "…" : "Transfer"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  );
}
