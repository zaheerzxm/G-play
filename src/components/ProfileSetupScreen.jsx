import { useState } from "react";

export default function ProfileSetupScreen({ error, onRetry }) {
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    setRetrying(true);
    await onRetry();
    setRetrying(false);
  }

  return (
    <div className="app">
      <div className="join-screen">
        <h1>G-play</h1>
        <p className="subtitle">Setting up your profile…</p>
        {error ? (
          <>
            <p className="banner error">{error}</p>
            <p className="hint">
              Run <code>supabase/RUN-THIS.sql</code> in Supabase SQL Editor, then retry.
            </p>
            <button type="button" className="primary-btn" disabled={retrying} onClick={handleRetry}>
              {retrying ? "Retrying…" : "Retry"}
            </button>
          </>
        ) : (
          <p className="hint">Almost ready…</p>
        )}
      </div>
    </div>
  );
}
