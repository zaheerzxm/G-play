import { useState } from "react";
import { formatCoins } from "../gifts.js";
import { RED_PACKET_MIN_COINS } from "../redPacket.js";

import CoinIcon from "./CoinIcon.jsx";

export default function RedPacketSheet({ coins, isSuperAdmin, onSend, onClose, variant = "room" }) {
  const [amountInput, setAmountInput] = useState("200");
  const [busy, setBusy] = useState(false);

  const amount = Math.max(0, Math.floor(Number(amountInput) || 0));
  const canSend = amount >= RED_PACKET_MIN_COINS && (isSuperAdmin || coins >= amount);

  async function handleSend() {
    if (!canSend) return;
    setBusy(true);
    try {
      await onSend({ totalCoins: amount });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div className="red-packet-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="red-packet-header">
          <span className="red-packet-header-spacer" aria-hidden />
          <h3 className="red-packet-title">Send Red Packet</h3>
          <button type="button" className="red-packet-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <p className="red-packet-balance">
          Your balance: <strong className="coin-inline"><CoinIcon size="sm" /> {formatCoins(coins, isSuperAdmin)}</strong>
        </p>

        <p className="red-packet-hint">
          {variant === "dm"
            ? "Send a private envelope your friend can open once for the full amount."
            : "Envelopes fall for everyone — tap to grab. Only grabbed envelopes pay out, split among grabbers. Unclaimed coins are lost."}
        </p>

        <label className="red-packet-label" htmlFor="rp-amount">Amount</label>
        <input
          id="rp-amount"
          type="number"
          min={RED_PACKET_MIN_COINS}
          className="red-packet-input"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          placeholder="Enter coin amount"
        />

        {amount > 0 && amount < RED_PACKET_MIN_COINS && (
          <p className="red-packet-error">Minimum {RED_PACKET_MIN_COINS} coins.</p>
        )}

        <button
          type="button"
          className="red-packet-send"
          disabled={!canSend || busy}
          onClick={handleSend}
        >
          {busy ? "Sending…" : `🧧 Send ${amount || 0} coins`}
        </button>
      </div>
    </div>
  );
}
