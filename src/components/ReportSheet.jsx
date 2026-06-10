import { useState } from "react";

const REASONS = ["Spam", "Harassment", "Inappropriate content", "Scam", "Other"];

export default function ReportSheet({ onSubmit, onClose }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setBusy(true);
    try {
      await onSubmit(reason);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div className="report-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 className="report-title">Report room</h3>
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button type="button" className="primary-btn" disabled={busy} onClick={handleSubmit}>
          {busy ? "Sending…" : "Submit report"}
        </button>
      </div>
    </div>
  );
}
