import { useEffect, useState } from "react";
import { formatCoins } from "../gifts.js";
import { sendCoinsToUser } from "../profile.js";
import { loadMutualFriends } from "../social.js";
import CoinIcon from "./CoinIcon.jsx";

const AMOUNTS = [50, 100, 200, 500];
const SEND_TABS = ["Package", "Gift", "Special", "VIP"];

function friendInitial(friend) {
  return (friend?.display_name || "?").charAt(0).toUpperCase();
}

function recipientIdOf(friend) {
  return friend?.id ?? friend?.user_id ?? null;
}

export default function SendCoinsSheet({
  userId,
  coins,
  isSuperAdmin,
  onCoinsChange,
  onClose,
  onOpenFriends,
  onSent,
  recipient = null,
  embedded = false,
}) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(!recipient);
  const [selected, setSelected] = useState(recipient);
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [activeTab, setActiveTab] = useState("Gift");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const payee = selected ?? recipient;
  const balance = Number(coins ?? 0);

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

  const sendAmount = customAmount.trim() ? Math.floor(Number(customAmount)) : amount;
  const canSend =
    recipientIdOf(payee) &&
    Number.isFinite(sendAmount) &&
    sendAmount >= 1 &&
    (isSuperAdmin || balance >= sendAmount) &&
    !busy;

  function handleClose(result) {
    onClose?.(result);
  }

  async function handleSend() {
    if (!canSend) return;
    const targetId = recipientIdOf(payee);
    if (!targetId) {
      setError("Could not find recipient");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { newSenderBalance, recipientName } = await sendCoinsToUser({
        fromUserId: userId,
        recipientUserId: targetId,
        amount: sendAmount,
        isSuperAdmin,
        currentCoins: balance,
      });
      onCoinsChange?.(newSenderBalance);
      onSent?.({ amount: sendAmount, recipientName, recipientId: targetId });
      handleClose({ message: `Sent ${sendAmount} coins to ${recipientName}` });
    } catch (e) {
      setError(e.message ?? "Transfer failed");
    } finally {
      setBusy(false);
    }
  }

  const page = (
      <div
        className={`gplay-mobile-shell send-coins-page${embedded ? " send-coins-page--embedded" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="send-coins-header send-coins-header--page">
          {payee && !recipient ? (
            <button type="button" className="send-coins-back" onClick={() => setSelected(null)} aria-label="Back">
              ‹
            </button>
          ) : (
            <span className="send-coins-back send-coins-back--spacer" aria-hidden />
          )}
          <h3 className="send-coins-title coin-inline">
            <CoinIcon size="sm" /> Send Coins
          </h3>
          <button type="button" className="send-coins-close" onClick={() => handleClose()} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="send-coins-page-body">
          <div className="send-coins-tabs" role="tablist" aria-label="Gift categories">
            {SEND_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={`send-coins-tab ${activeTab === tab ? "send-coins-tab--active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <p className="send-coins-balance coin-inline">
            Balance <CoinIcon size="sm" /> <strong>{formatCoins(balance, isSuperAdmin)}</strong>
          </p>

          {!payee && !recipient ? (
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
              <div className="send-coins-recipient send-coins-recipient--card">
                {payee?.avatar_url ? (
                  <img src={payee.avatar_url} alt="" className="send-coins-friend-avatar" />
                ) : (
                  <span className="send-coins-friend-avatar send-coins-friend-avatar--fallback">
                    {friendInitial(payee)}
                  </span>
                )}
                <div className="send-coins-recipient-meta">
                  <strong>{payee?.display_name || "Friend"}</strong>
                  {payee?.user_code && <small>ID: {payee.user_code}</small>}
                </div>
              </div>

              <p className="send-coins-section-label">Pick an amount</p>
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

              <label className="send-coins-section-label" htmlFor="send-coins-custom">
                Custom amount
              </label>
              <div className="personal-chat-input-wrap send-coins-input-wrap">
                <input
                  id="send-coins-custom"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="Or enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {payee && (
          <footer className="send-coins-footer">
            {error && <p className="send-coins-error">{error}</p>}
            <div className="send-coins-footer-meta">
              <span>Qty. 1</span>
              <span className="coin-inline">
                <CoinIcon size="sm" /> {formatCoins(balance, isSuperAdmin)}
              </span>
            </div>
            <button
              type="button"
              className="send-coins-submit-btn"
              disabled={!canSend}
              onClick={handleSend}
            >
              {busy ? "Sending…" : `Send ${Number.isFinite(sendAmount) ? sendAmount : 0} coins`}
            </button>
          </footer>
        )}
      </div>
  );

  if (embedded) {
    return (
      <div
        className="personal-chat-send-coins-overlay"
        role="presentation"
        onClick={() => handleClose()}
      >
        {page}
      </div>
    );
  }

  return (
    <div className="gplay-mobile-shell-backdrop gplay-mobile-shell-backdrop--send-coins">
      {page}
    </div>
  );
}
