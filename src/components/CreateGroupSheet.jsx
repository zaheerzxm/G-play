import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  createGroup,
  groupChatMissingError,
  GROUP_DM_MIN_MEMBERS,
} from "../groupChat.js";
import { loadMutualFriends } from "../social.js";
import { isBlockedEitherWay } from "../userBlocks.js";
import AvatarImg from "./AvatarImg.jsx";

const MIN_FRIEND_PICKS = GROUP_DM_MIN_MEMBERS - 1;
const MAX_GROUP_NAME = 40;

export default function CreateGroupSheet({
  userId,
  preselectedFriendId = null,
  onClose,
  onCreated,
  onToast,
}) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [blockedIds, setBlockedIds] = useState(() => new Set());

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    loadMutualFriends(userId)
      .then(async (rows) => {
        if (cancelled) return;
        setFriends(rows);
        const blocked = new Set();
        await Promise.all(
          rows.map(async (friend) => {
            if (await isBlockedEitherWay(userId, friend.id)) blocked.add(friend.id);
          }),
        );
        if (cancelled) return;
        setBlockedIds(blocked);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (preselectedFriendId && !blocked.has(preselectedFriendId)) {
            next.add(preselectedFriendId);
          }
          return next;
        });
      })
      .catch(() => onToast?.("Could not load friends"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, preselectedFriendId, onToast]);

  const selectedCount = selectedIds.size;
  const nameValid = name.trim().length >= 1 && name.trim().length <= MAX_GROUP_NAME;
  const canSubmit = nameValid && selectedCount >= MIN_FRIEND_PICKS && !busy;

  const hint = useMemo(() => {
    if (selectedCount < MIN_FRIEND_PICKS) {
      return `Select at least ${MIN_FRIEND_PICKS} friends (${GROUP_DM_MIN_MEMBERS} members including you)`;
    }
    return `${selectedCount + 1} members total`;
  }, [selectedCount]);

  function toggleFriend(friendId) {
    if (blockedIds.has(friendId) || busy) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(friendId)) next.delete(friendId);
      else next.add(friendId);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || !userId) return;
    setBusy(true);
    try {
      const created = await createGroup(userId, name.trim(), [...selectedIds]);
      onClose?.();
      if (onCreated) {
        await onCreated(created);
      } else {
        onToast?.("Group created");
      }
    } catch (err) {
      const message = err?.message ?? "Could not create group";
      onToast?.(message === groupChatMissingError().message ? message : message);
    } finally {
      setBusy(false);
    }
  }

  const sheet = (
    <div className="create-group-backdrop" onClick={onClose}>
      <div className="create-group-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="create-group-header">
          <button type="button" className="hub-sheet-back" onClick={onClose} aria-label="Back">
            ←
          </button>
          <h3>Create Group</h3>
        </header>

        <form className="create-group-form" onSubmit={handleSubmit}>
          <label className="create-group-label">
            Group name
            <input
              type="text"
              value={name}
              maxLength={MAX_GROUP_NAME}
              placeholder="Name your group"
              disabled={busy}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <div className="create-group-friends-head">
            <h4>Add friends</h4>
            <small>{hint}</small>
          </div>

          {loading && <p className="hub-sheet-hint">Loading friends…</p>}
          <ul className="create-group-friends">
            {friends.map((friend) => {
              const selected = selectedIds.has(friend.id);
              const blocked = blockedIds.has(friend.id);
              return (
                <li key={friend.id}>
                  <button
                    type="button"
                    className={`create-group-friend-row${selected ? " create-group-friend-row--selected" : ""}${blocked ? " create-group-friend-row--blocked" : ""}`}
                    disabled={blocked || busy}
                    onClick={() => toggleFriend(friend.id)}
                  >
                    <AvatarImg
                      src={friend.avatar_url}
                      fallback={friend.display_name}
                      className="create-group-avatar"
                      imgClassName="create-group-avatar"
                    />
                    <span className="create-group-friend-name">{friend.display_name}</span>
                    <span className="create-group-check" aria-hidden>
                      {selected ? "✓" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
            {!loading && friends.length === 0 && (
              <li className="create-group-empty">Add mutual friends to create a group</li>
            )}
          </ul>

          <button type="submit" className="primary-btn create-group-submit" disabled={!canSubmit}>
            {busy ? "Creating…" : "Create Group"}
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
