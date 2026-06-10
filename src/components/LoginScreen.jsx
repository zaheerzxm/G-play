import { useState } from "react";
import { signInWithGoogle } from "../auth.js";
import { isConfigured } from "../supabase.js";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e.message ?? "Sign in failed");
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="join-screen">
        <h1>G-play</h1>
        <p className="subtitle">Sign in to join voice rooms</p>
        {!isConfigured && (
          <p className="banner error">
            Add Supabase keys to <code>.env</code>
          </p>
        )}
        {error && <p className="banner error">{error}</p>}
        <button
          type="button"
          className="google-btn"
          disabled={!isConfigured || loading}
          onClick={handleGoogleSignIn}
        >
          {loading ? "Redirecting…" : "Continue with Google"}
        </button>
        <p className="hint">New accounts get 500 coins. Create your own room at 2,000 coins.</p>
      </div>
    </div>
  );
}
