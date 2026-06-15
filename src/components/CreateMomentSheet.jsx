import { useEffect, useState } from "react";
import { markGameTaskProgress } from "../gameTasks.js";
import { createMoment, updateMoment, uploadSpotlightPhoto } from "../moments.js";

export default function CreateMomentSheet({ userId, displayName, onClose, onPosted, moment = null }) {
  const isEdit = Boolean(moment?.id);
  const [content, setContent] = useState(moment?.content ?? "");
  const [imageUrl, setImageUrl] = useState(moment?.image_url ?? "");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(moment?.image_url ?? "");
  const [showUrlField, setShowUrlField] = useState(false);
  const [pollMode, setPollMode] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDays, setPollDays] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!imageFile) return undefined;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const hasPhoto = Boolean(imageFile || imageUrl.trim() || (isEdit && moment?.image_url && !imageFile));
  const pollValid = pollMode && pollOptions.filter((o) => o.trim()).length >= 2;
  const canSubmit = content.trim() || hasPhoto || pollValid;

  function handlePickFile(e) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImageUrl("");
    setError(null);
    if (!file && moment?.image_url) {
      setImagePreview(moment.image_url);
    }
  }

  function clearPhoto() {
    setImageFile(null);
    setImageUrl("");
    setImagePreview("");
  }

  async function resolveImageUrl() {
    if (imageFile) {
      return uploadSpotlightPhoto(userId, imageFile);
    }
    const trimmed = imageUrl.trim();
    if (trimmed) return trimmed;
    if (isEdit && moment?.image_url) return moment.image_url;
    return null;
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (busy || !canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const uploadedUrl = await resolveImageUrl();
      const payload = {
        content: content.trim() || (uploadedUrl ? "📷" : ""),
        imageUrl: uploadedUrl,
      };
      if (isEdit) {
        await updateMoment(userId, moment.id, payload);
      } else {
        await createMoment(userId, {
          ...payload,
          poll: pollValid
            ? { options: pollOptions.map((o) => o.trim()).filter(Boolean), days: pollDays }
            : null,
        });
        markGameTaskProgress(userId, "spotlight_post");
      }
      onPosted?.();
      onClose?.();
    } catch (err) {
      setError(err.message ?? "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="create-moment-backdrop" onClick={onClose}>
      <div className="create-moment-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="create-moment-header">
          <button type="button" className="create-moment-cancel" onClick={onClose}>Cancel</button>
          <h2>{isEdit ? "Edit post" : "New post"}</h2>
          <button
            type="button"
            className="create-moment-share"
            disabled={busy || !canSubmit}
            onClick={handleSubmit}
          >
            {busy ? "…" : isEdit ? "Save" : "Share"}
          </button>
        </header>

        <form className="create-moment-body" onSubmit={handleSubmit}>
          <label className="create-moment-upload">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handlePickFile}
            />
            {imagePreview ? (
              <span className="create-moment-upload-preview-wrap">
                <img src={imagePreview} alt="" className="create-moment-preview" />
                <span className="create-moment-upload-change">Tap to change photo</span>
              </span>
            ) : (
              <span className="create-moment-upload-empty">
                <span className="create-moment-upload-icon" aria-hidden>📷</span>
                <strong>Upload photo</strong>
                <small>From gallery or camera</small>
              </span>
            )}
          </label>

          {imagePreview && (
            <button type="button" className="create-moment-remove-photo" onClick={clearPhoto}>
              Remove photo
            </button>
          )}

          <textarea
            rows={3}
            placeholder={`Write a caption, ${displayName || "friend"}… (optional)`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
          />

          <button
            type="button"
            className="create-moment-poll-toggle"
            onClick={() => setPollMode((v) => !v)}
          >
            {pollMode ? "Remove poll" : "Add poll"}
          </button>

          {pollMode && (
            <div className="create-moment-poll">
              <label className="create-moment-poll-duration">
                <span>Voting duration</span>
                <select value={pollDays} onChange={(e) => setPollDays(Number(e.target.value))}>
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                </select>
              </label>
              {pollOptions.map((opt, i) => (
                <input
                  key={`poll-${i}`}
                  type="text"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  maxLength={80}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[i] = e.target.value;
                    setPollOptions(next);
                  }}
                />
              ))}
              {pollOptions.length < 6 && (
                <button
                  type="button"
                  className="create-moment-poll-add"
                  onClick={() => setPollOptions((opts) => [...opts, ""])}
                >
                  + Add option
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            className="create-moment-url-toggle"
            onClick={() => setShowUrlField((v) => !v)}
          >
            {showUrlField ? "Hide image link" : "Paste image link instead"}
          </button>

          {showUrlField && (
            <label className="create-moment-photo">
              <span>Image URL</span>
              <input
                type="url"
                placeholder="https://…"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImageFile(null);
                  setImagePreview(e.target.value);
                }}
              />
            </label>
          )}

          {error && <p className="banner error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
