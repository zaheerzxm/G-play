import { useState } from "react";
import { createPortal } from "react-dom";

export default function AddVideoSheet({ busy, onSubmit, onClose }) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim() || busy) return;
    onSubmit(url.trim());
  };

  return createPortal(
    <div className="add-video-backdrop" onClick={onClose}>
      <div className="add-video-sheet" onClick={(e) => e.stopPropagation()}>
        <h3>YouTube</h3>
        <p>Everyone in the room will watch together.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="url"
            className="add-video-input"
            placeholder="https://www.youtube.com/watch?v=…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
            disabled={busy}
          />
          <button
            type="button"
            className="add-video-paste"
            disabled={busy}
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text?.trim()) setUrl(text.trim());
              } catch {
                /* clipboard denied */
              }
            }}
          >
            Paste URL
          </button>
          <div className="add-video-actions">
            <button type="button" className="add-video-cancel" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="add-video-ok" disabled={busy || !url.trim()}>
              {busy ? "Adding…" : "Add video"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
