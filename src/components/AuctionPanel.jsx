import { useEffect, useRef, useState } from "react";
import { loadAuction, placeBid, settleAuction, startAuction } from "../auction.js";
import { formatCoins } from "../gifts.js";
import CoinIcon from "./CoinIcon.jsx";

function secondsLeft(endsAt) {
  if (!endsAt) return 0;
  return Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
}

export default function AuctionPanel({
  roomId,
  userId,
  displayName,
  isRoomOwner,
  isSuperAdmin,
  coins,
  onBalanceChange,
  onSettled,
  onError,
  onToast,
}) {
  const [auction, setAuction] = useState(null);
  const [bidInput, setBidInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const settlingRef = useRef(false);

  useEffect(() => {
    if (!roomId) return;
    loadAuction(roomId).then(setAuction);
    const poll = setInterval(() => {
      loadAuction(roomId).then(setAuction);
    }, 3000);
    return () => clearInterval(poll);
  }, [roomId]);

  useEffect(() => {
    if (!auction || auction.status !== "active") return undefined;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [auction]);

  useEffect(() => {
    if (!auction || auction.status !== "active" || !auction.ends_at) return;
    if (secondsLeft(auction.ends_at) > 0) return;
    if (settlingRef.current) return;
    settlingRef.current = true;

    settleAuction(roomId)
      .then((result) => {
        setAuction(result);
        onSettled?.(result);
        if (result?.high_bidder_name) {
          onToast?.(`${result.high_bidder_name} won seat ${result.seat_number} for ${result.current_bid} gold`);
        } else {
          onToast?.("Auction ended with no bids");
        }
      })
      .catch((e) => onError?.(e.message))
      .finally(() => {
        settlingRef.current = false;
      });
  }, [auction, roomId, tick, onSettled, onToast, onError]);

  async function handleStart() {
    settlingRef.current = false;
    setBusy(true);
    try {
      const next = await startAuction(roomId, { seatNumber: 2, minBid: 50, durationSec: 60 });
      setAuction(next);
      onToast?.("Auction started — 60 seconds!");
    } catch (e) {
      onError?.(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleBid() {
    setBusy(true);
    try {
      const { auction: next } = await placeBid({
        roomId,
        userId,
        displayName,
        bidAmount: bidInput,
        isSuperAdmin,
        onBalanceChange,
      });
      setAuction(next);
      setBidInput("");
      onToast?.(`Bid placed: ${next.current_bid} gold`);
    } catch (e) {
      onError?.(e.message);
    } finally {
      setBusy(false);
    }
  }

  void tick;
  const remaining = auction?.ends_at ? secondsLeft(auction.ends_at) : 0;
  const minBid = auction
    ? Math.max(Number(auction.min_bid), Number(auction.current_bid) + 10)
    : 50;

  if (!auction || auction.status === "idle") {
    return (
      <div className="auction-panel auction-panel--idle">
        <span className="auction-panel-label">🔨 Auction seat</span>
        {isRoomOwner ? (
          <button type="button" className="auction-panel-btn" disabled={busy} onClick={handleStart}>
            Start auction
          </button>
        ) : (
          <span className="auction-panel-hint">Waiting for host to start</span>
        )}
      </div>
    );
  }

  if (auction.status === "settled") {
    return (
      <div className="auction-panel auction-panel--settled">
        <span>
          {auction.high_bidder_name
            ? `Winner: ${auction.high_bidder_name} · ${auction.current_bid} gold`
            : "Auction ended"}
        </span>
        {isRoomOwner && (
          <button type="button" className="auction-panel-btn" disabled={busy} onClick={handleStart}>
            New auction
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="auction-panel auction-panel--active">
      <div className="auction-panel-top">
        <strong>Seat {auction.seat_number} auction</strong>
        <span className="auction-panel-timer">{remaining}s</span>
      </div>
      <p className="auction-panel-bid">
        Current: <strong>{formatCoins(auction.current_bid)}</strong>
        {auction.high_bidder_name ? ` · ${auction.high_bidder_name}` : ""}
      </p>
      <div className="auction-panel-actions">
        <input
          type="number"
          min={minBid}
          placeholder={`Min ${minBid}`}
          value={bidInput}
          onChange={(e) => setBidInput(e.target.value)}
        />
        <button type="button" className="auction-panel-btn" disabled={busy} onClick={handleBid}>
          Bid
        </button>
      </div>
      <p className="auction-panel-balance coin-inline">Your balance: <CoinIcon size="sm" /> {formatCoins(coins, isSuperAdmin)}</p>
    </div>
  );
}
