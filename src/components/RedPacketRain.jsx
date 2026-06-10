import { useCallback, useEffect, useRef, useState } from "react";
import { RED_PACKET_RAIN_MS } from "../redPacket.js";

/** Random lanes/timing — frozen once per packet so taps never reshuffle others. */
function buildDropVisuals(drops) {
  return drops
    .filter((d) => !d.claimed_by)
    .map((d) => ({
      dropIndex: d.drop_index,
      left: 3 + Math.random() * 90,
      delay: Math.random() * 2.4,
      duration: 5.5 + Math.random() * 2.5,
      size: 2.5 + Math.random() * 0.75,
    }));
}

export default function RedPacketRain({
  packetId,
  totalCoins,
  senderName,
  drops = [],
  onGrab,
  onDone,
}) {
  const [gone, setGone] = useState(() => new Set());
  const [fallen, setFallen] = useState(() => new Set());
  const [popping, setPopping] = useState(() => new Set());
  const [paused, setPaused] = useState(() => new Set());
  const doneRef = useRef(false);
  const goneRef = useRef(new Set());
  const poppingRef = useRef(new Set());
  const visualsRef = useRef(null);
  const frozenPacketRef = useRef(null);

  if (frozenPacketRef.current !== packetId) {
    frozenPacketRef.current = packetId;
    visualsRef.current = null;
  }
  if (!visualsRef.current && drops.length > 0) {
    visualsRef.current = buildDropVisuals(drops);
  }
  const visuals = visualsRef.current ?? [];

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone?.();
  }, [onDone]);

  useEffect(() => {
    if (!visuals.length) {
      finish();
      return undefined;
    }
    const maxMs = Math.max(
      RED_PACKET_RAIN_MS,
      ...visuals.map((v) => (v.delay + v.duration) * 1000 + 700),
    );
    const t = window.setTimeout(finish, maxMs);
    return () => window.clearTimeout(t);
  }, [visuals, finish]);

  useEffect(() => {
    if (!visuals.length || doneRef.current) return;
    const allDone = visuals.every((v) => goneRef.current.has(v.dropIndex) || fallen.has(v.dropIndex));
    if (allDone) finish();
  }, [gone, fallen, visuals, finish]);

  function blockOverlayClick(e) {
    if (e.target === e.currentTarget) {
      e.stopPropagation();
    }
  }

  function markFallen(dropIndex) {
    setFallen((prev) => {
      if (prev.has(dropIndex)) return prev;
      return new Set(prev).add(dropIndex);
    });
  }

  function grabDrop(dropIndex, event) {
    if (event?.pointerType === "mouse" && event.button !== 0) return;
    if (goneRef.current.has(dropIndex) || poppingRef.current.has(dropIndex)) return;

    event?.preventDefault();
    event?.stopPropagation();

    poppingRef.current.add(dropIndex);
    setPopping(new Set(poppingRef.current));
    setPaused((prev) => new Set(prev).add(dropIndex));

    if (event?.currentTarget) {
      event.currentTarget.style.animationPlayState = "paused";
    }

    void Promise.resolve(onGrab(packetId, dropIndex)).catch(() => {});

    window.setTimeout(() => {
      goneRef.current.add(dropIndex);
      setGone(new Set(goneRef.current));
      poppingRef.current.delete(dropIndex);
      setPopping(new Set(poppingRef.current));
      setPaused((prev) => {
        const next = new Set(prev);
        next.delete(dropIndex);
        return next;
      });
    }, 360);
  }

  return (
    <div
      className="red-packet-rain"
      aria-live="polite"
      onClick={blockOverlayClick}
    >
      <div className="red-packet-rain-hud">
        <p className="red-packet-rain-title">
          🧧 {senderName} sent {totalCoins} gold
        </p>
        <p className="red-packet-rain-sub">Tap the envelopes</p>
      </div>

      <div className="red-packet-rain-stage">
        {visuals.map((v) => {
          if (gone.has(v.dropIndex)) return null;
          const isPopping = popping.has(v.dropIndex);
          const isPaused = paused.has(v.dropIndex);
          return (
            <button
              key={v.dropIndex}
              type="button"
              className={`red-packet-rain-drop${isPopping ? " red-packet-rain-drop--vanish" : ""}${isPaused ? " red-packet-rain-drop--paused" : ""}`}
              style={{
                left: `${v.left}%`,
                animationDuration: `${v.duration}s`,
                animationDelay: `${v.delay}s`,
                fontSize: `${v.size}rem`,
              }}
              onPointerDown={(e) => grabDrop(v.dropIndex, e)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onAnimationEnd={(e) => {
                if (isPopping || isPaused || e.animationName !== "red-packet-fall") return;
                markFallen(v.dropIndex);
              }}
            >
              <span
                className={`red-packet-rain-drop-icon${isPopping ? " red-packet-rain-drop-icon--pop" : ""}`}
                aria-hidden
              >
                🧧
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
