import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  SPOTLIGHT_FEED_NAME,
  addMomentComment,
  deleteMoment,
  loadMomentComments,
  loadMomentsFeed,
  loadUserMoments,
  loadUserLikedMomentIds,
  toggleMomentLike,
} from "../moments.js";

function formatWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function IconHeart({ filled }) {
  return (
    <svg className={`moments-heart ${filled ? "moments-heart--on" : ""}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20.5s-6.8-4.2-9-8.2C1.2 9.2 2.6 6 5.8 5.2c2-.5 4 .4 5.2 2 1.2-1.6 3.2-2.5 5.2-2 3.2.8 4.6 4 2.8 7.1-2.2 4-9 8.2-9 8.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

function IconComment() {
  return (
    <svg className="moments-comment-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5.5 6.8h13a1.8 1.8 0 0 1 1.8 1.8v6.2a1.8 1.8 0 0 1-1.8 1.8H11l-3.8 2.6V6.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MomentPost({
  moment,
  userId,
  isLiked,
  onLike,
  onEdit,
  onDelete,
}) {
  const author = moment.author;
  const initial = (author?.display_name || "?").charAt(0).toUpperCase();
  const isOwn = userId && moment.user_id === userId;
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(moment.comments_count ?? 0);

  async function openComments() {
    setCommentsOpen(true);
    if (comments.length) return;
    setCommentsLoading(true);
    try {
      const rows = await loadMomentComments(moment.id);
      setComments(rows);
    } finally {
      setCommentsLoading(false);
    }
  }

  async function handleDelete() {
    if (!userId) return;
    if (!window.confirm("Delete this Spotlight post? This cannot be undone.")) return;
    setMenuOpen(false);
    try {
      await deleteMoment(userId, moment.id);
      onDelete?.(moment.id);
    } catch {
      window.alert("Could not delete post. Try again.");
    }
  }

  async function handleCommentSubmit(e) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || commentBusy || !userId) return;
    setCommentBusy(true);
    try {
      const row = await addMomentComment(moment.id, userId, text);
      setComments((prev) => [...prev, row]);
      setCommentText("");
      setCommentCount((n) => n + 1);
    } catch {
      /* parent may show toast */
    } finally {
      setCommentBusy(false);
    }
  }

  return (
    <article className="moments-post">
      <header className="moments-post-head">
        {author?.avatar_url ? (
          <img src={author.avatar_url} alt="" className="moments-post-avatar" />
        ) : (
          <span className="moments-post-avatar moments-post-avatar--fallback">{initial}</span>
        )}
        <div className="moments-post-meta">
          <strong>{author?.display_name ?? "User"}</strong>
          <small>{formatWhen(moment.created_at)}</small>
        </div>
        {isOwn && (
          <div className="moments-post-menu-wrap">
            <button
              type="button"
              className="moments-post-menu-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Post options"
            >
              ···
            </button>
            {menuOpen && (
              <div className="moments-post-menu">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(moment);
                  }}
                >
                  Edit post
                </button>
                <button
                  type="button"
                  className="moments-post-menu-delete"
                  onClick={handleDelete}
                >
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {moment.image_url ? (
        <img src={moment.image_url} alt="" className="moments-post-media" />
      ) : (
        <div className="moments-post-media moments-post-media--text">
          <p>{moment.content}</p>
        </div>
      )}

      <div className="moments-post-actions">
        <button
          type="button"
          className="moments-post-like"
          onClick={() => onLike(moment.id)}
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          <IconHeart filled={isLiked} />
        </button>
        <button
          type="button"
          className="moments-post-comment-btn"
          onClick={openComments}
          aria-label="Comments"
        >
          <IconComment />
        </button>
      </div>

      {(moment.likes_count ?? 0) > 0 && (
        <p className="moments-post-likes-line">{moment.likes_count} likes</p>
      )}

      {commentCount > 0 && !commentsOpen && (
        <button type="button" className="moments-post-view-comments" onClick={openComments}>
          View all {commentCount} comments
        </button>
      )}

      {moment.image_url && moment.content?.trim() && moment.content !== "📷" && (
        <p className="moments-post-caption">
          <strong>{author?.display_name ?? "User"}</strong> {moment.content}
        </p>
      )}

      {commentsOpen && (
        <div className="moments-post-comments">
          {commentsLoading && <p className="moments-post-comments-loading">Loading…</p>}
          {comments.map((c) => (
            <p key={c.id} className="moments-post-comment">
              <strong>{c.author?.display_name ?? "User"}</strong> {c.content}
            </p>
          ))}
          {userId ? (
            <form className="moments-post-comment-form" onSubmit={handleCommentSubmit}>
              <input
                type="text"
                placeholder="Add a comment…"
                maxLength={300}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" disabled={commentBusy || !commentText.trim()}>
                Post
              </button>
            </form>
          ) : (
            <p className="moments-post-comments-hint">Sign in to comment</p>
          )}
        </div>
      )}
    </article>
  );
}

export default function MomentsFeed({
  userId,
  profileUserId = null,
  profileName = null,
  onClose,
  onEditMoment,
  onCreatePost,
  embedded = false,
  feedOnly = false,
  fullPage = false,
  elevated = false,
}) {
  const [moments, setMoments] = useState([]);
  const [liked, setLiked] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = profileUserId
        ? await loadUserMoments(profileUserId, 40)
        : await loadMomentsFeed(40);
      setMoments(rows);
      if (userId && rows.length) {
        const ids = await loadUserLikedMomentIds(userId, rows.map((m) => m.id));
        setLiked(ids);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, profileUserId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  async function handleLike(momentId) {
    if (!userId) return;
    const result = await toggleMomentLike(momentId, userId);
    if (!result) return;
    setLiked((prev) => {
      const next = new Set(prev);
      if (result.liked) next.add(momentId);
      else next.delete(momentId);
      return next;
    });
    setMoments((prev) =>
      prev.map((m) => (m.id === momentId ? { ...m, likes_count: result.likes_count } : m)),
    );
  }

  const body = (
    <div className={`moments-feed ${embedded ? "moments-feed--embedded" : ""} ${fullPage ? "moments-feed--page" : ""}`}>
      {!embedded && !feedOnly && (
        <header className="moments-feed-header moments-feed-header--page">
          <button type="button" className="moments-feed-back" onClick={onClose} aria-label="Back">‹</button>
          <h2>
            {profileUserId ? (
              <>
                {profileName ? `${profileName}'s ` : ""}
                {SPOTLIGHT_FEED_NAME}
                {moments.length > 0 ? ` · ${moments.length}` : ""}
              </>
            ) : (
              SPOTLIGHT_FEED_NAME
            )}
          </h2>
          {userId && !profileUserId && onCreatePost ? (
            <button type="button" className="moments-feed-create" onClick={onCreatePost} aria-label="New post">
              +
            </button>
          ) : (
            <span className="moments-feed-header-spacer" aria-hidden />
          )}
        </header>
      )}

      <div className="moments-list moments-list--ig">
        {loading && moments.length === 0 && (
          <p className="moments-empty">Loading feed…</p>
        )}
        {!loading && moments.length === 0 && (
          <p className="moments-empty">
            {profileUserId
              ? `${profileName ? `${profileName} has` : "No"} ${SPOTLIGHT_FEED_NAME} posts yet.`
              : `No posts yet. Tap + to share on ${SPOTLIGHT_FEED_NAME}.`}
          </p>
        )}
        {moments.map((moment) => (
          <MomentPost
            key={moment.id}
            moment={moment}
            userId={userId}
            isLiked={liked.has(moment.id)}
            onLike={handleLike}
            onEdit={onEditMoment}
            onDelete={(momentId) => {
              setMoments((prev) => prev.filter((m) => m.id !== momentId));
              setLiked((prev) => {
                const next = new Set(prev);
                next.delete(momentId);
                return next;
              });
            }}
          />
        ))}
      </div>
    </div>
  );

  if (embedded || feedOnly) return body;

  const backdrop = (
    <div
      className={`moments-feed-backdrop ${fullPage ? `gplay-mobile-shell-backdrop moments-feed-backdrop--page${elevated ? " gplay-mobile-shell-backdrop--profile-child" : ""}` : ""}`}
      onClick={fullPage ? onClose : undefined}
    >
      <div
        className={fullPage ? "gplay-mobile-shell" : undefined}
        onClick={fullPage ? (e) => e.stopPropagation() : undefined}
      >
        {body}
      </div>
    </div>
  );

  if (fullPage) {
    return createPortal(backdrop, document.body);
  }

  return backdrop;
}
