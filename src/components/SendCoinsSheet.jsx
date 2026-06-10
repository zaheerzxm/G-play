import { useEffect, useState } from "react";
import { formatCoins } from "../gifts.js";
import { sendCoinsToUser } from "../profile.js";
import { loadMutualFriends } from "../social.js";
import CoinIcon from "./CoinIcon.jsx";

const AMOUNTS = [50, 100, 200, 500];

function friendInitial(friend) {
  return (friend.display_name || "?").charAt(0).toUpperCase();
}

export default function SendCoinsSheet({
  userId,
  coins,
  isSuperAdmin,
  onCoinsChange,
  onClose,
  onOpenFriends,
  recipient = null,
}) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(!recipient);
  const [selected, setSelected] = useState(recipient);
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (recipient) {
      setSelected(recipient);
      setLoading(false);
      return;
    }
    if (!userId) return;
    setLoading(true);
    loadMutualFriends(userId)
      .then(setFriends)
      .catch(() => setFriends([]))
      .finally(() => setLoading(false));
  }, [userId, recipient]);

  const sendAmount = customAmount.trim() ? Number(customAmount) : amount;
  const canSend =
    selected &&
    sendAmount >= 1 &&
    (isSuperAdmin || coins >= sendAmount) &&
    !busy;

  async function handleSend() {
    if (!selected || !canSend) return;
    setBusy(true);
    setError(null);
    try {
      const { newSenderBalance, recipientName } = await sendCoinsToUser({
        fromUserId: userId,
        recipientUserId: selected.id,
        amount: sendAmount,
        isSuperAdmin,
        currentCoins: coins,
      });
      onCoinsChange?.(newSenderBalance);
      onClose?.({ message: `Sent ${sendAmount} coins to ${recipientName}` });
    } catch (e) {
      setError(e.message ?? "Transfer failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profile-card-backdrop room-profile-backdrop" onClick={onClose}>
      <div className="send-coins-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="send-coins-header">
          {selected && !recipient ? (
            <button type="button" className="send-coins-back" onClick={() => setSelected(null)}>
              ←
            </button>
          ) : (
            <span className="send-coins-back send-coins-back--spacer" aria-hidden />
          )}
          <h3 className="send-coins-title coin-inline"><CoinIcon size="sm" /> Send Coins</h3>
          <button type="button" className="send-coins-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <p className="send-coins-balance coin-inline">Balance: <CoinIcon size="sm" /> {formatCoins(coins, isSuperAdmin)}</p>

        {!selected && !recipient ? (
          <>
            <p className="send-coins-hint">Choose a friend to send coins to</p>
            {loading ? (
              <p className="send-coins-empty">Loading friends…</p>
            ) : friends.length === 0 ? (
              <div className="send-coins-empty">
                <p>No friends yet — add friends in a room, then send coins here.</p>
                {onOpenFriends && (
                  <button type="button" className="send-coins-link-btn" onClick={onOpenFriends}>
                    Open Friends
                  </button>
                )}
              </div>
            ) : (
              <ul className="send-coins-friends">
                {friends.map((friend) => (
                  <li key={friend.id}>
                    <button type="button" className="send-coins-friend" onClick={() => setSelected(friend)}>
                      {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt="" className="send-coins-friend-avatar" />
                      ) : (
                        <span className="send-coins-friend-avatar send-coins-friend-avatar--fallback">
                          {friendInitial(friend)}
                        </span>
                      )}
                      <span className="send-coins-friend-meta">
                        <strong>{friend.display_name}</strong>
                        {friend.user_code && <small>ID: {friend.user_code}</small>}
                      </span>
                      <span className="send-coins-friend-arrow">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <div className="send-coins-recipient">
              {selected?.avatar_url ? (
                <img src={selected.avatar_url} alt="" className="send-coins-friend-avatar" />
              ) : (
                <span className="send-coins-friend-avatar send-coins-friend-avatar--fallback">
                  {friendInitial(selected)}
                </span>
              )}
              <div>
                <strong>{selected.display_name}</strong>
                {selected.user_code && <p>ID: {selected.user_code}</p>}
              </div>
            </div>

            <p className="send-coins-hint">Pick an amount</p>
            <div className="send-coins-amounts">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`send-coins-amt ${amount === a && !customAmount ? "send-coins-amt--active" : ""}`}
                  onClick={() => {
                    setAmount(a);
                    setCustomAmount("");
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
            <label className="field-label">Custom amount</label>
            <input
              type="number"
              min="1"
              placeholder="Or enter amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />

            {error && <p className="banner error send-coins-error">{error}</p>}

            <button type="button" className="primary-btn send-coins-submit" disabled={!canSend} onClick={handleSend}>
              {busy ? "Sending…" : `Send ${sendAmount || 0} coins`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
