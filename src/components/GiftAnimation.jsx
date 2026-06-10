import { useEffect } from "react";
import CoinIcon from "./CoinIcon.jsx";
import AvatarImg from "./AvatarImg.jsx";
import LottieGift from "./LottieGift.jsx";

function particlesForFx(fx) {
  if (fx === "rocket") return 6;
  if (fx === "burst") return 10;
  if (fx === "pfp") return 5;
  return 4;
}

function PfpFly({ fx }) {
  const senderInitial = (fx.senderName ?? "?").charAt(0).toUpperCase();
  const recipientInitial = (fx.recipientName ?? "?").charAt(0).toUpperCase();

  return (
    <>
      <span className="gift-fx-pfp-line" />
      <span className="gift-fx-pfp-from">
        <AvatarImg
          src={fx.senderAvatar}
          fallback={senderInitial}
          className="gift-fx-pfp-avatar gift-fx-pfp-avatar--fallback"
          imgClassName="gift-fx-pfp-avatar"
        />
      </span>
      <span className="gift-fx-pfp-emoji">{fx.emoji}</span>
      <span className="gift-fx-pfp-to">
        <AvatarImg
          src={fx.recipientAvatar}
          fallback={recipientInitial}
          className="gift-fx-pfp-avatar gift-fx-pfp-avatar--fallback"
          imgClassName="gift-fx-pfp-avatar"
        />
      </span>
    </>
  );
}

export default function GiftAnimation({ effects, onDone }) {
  useEffect(() => {
    if (!effects.length) return undefined;
    const timers = effects.map((fx) =>
      setTimeout(() => onDone(fx.id), fx.duration ?? 1400),
    );
    return () => timers.forEach(clearTimeout);
  }, [effects, onDone]);

  if (!effects.length) return null;

  return (
    <div className="gift-fx-layer" aria-hidden>
      {effects.map((fx) => (
        <div
          key={fx.id}
          className={`gift-fx gift-fx--${fx.fx ?? "fly"}`}
          style={{
            "--dx": `${fx.dx}px`,
            "--dy": `${fx.dy}px`,
            "--dur": `${fx.duration ?? 1400}ms`,
            ...(fx.fx === "rose-lottie"
              ? {
                  "--x": `${fx.x}px`,
                  "--y": `${fx.y}px`,
                }
              : {}),
            ...(fx.fx === "pfp"
              ? {
                  "--start-x": `${fx.startX}px`,
                  "--start-y": `${fx.startY}px`,
                  "--target-x": `${fx.targetX ?? fx.startX + fx.dx}px`,
                  "--target-y": `${fx.targetY ?? fx.startY + fx.dy}px`,
                }
              : {}),
          }}
        >
          {fx.fx === "rose-lottie" && fx.lottie ? (
            <>
              <LottieGift src={fx.lottie} className="gift-fx-lottie" loop={false} />
              {fx.reward > 0 && (
                <span className="gift-fx-reward gift-fx-reward--lottie coin-inline">
                  +{fx.reward} <CoinIcon size="sm" />
                </span>
              )}
            </>
          ) : fx.fx === "pfp" ? (
            <PfpFly fx={fx} />
          ) : (
            <>
              {fx.fx === "rocket" && (
                <>
                  <span className="gift-fx-rocket-glow" />
                  <span className="gift-fx-trail" />
                  <span className="gift-fx-trail gift-fx-trail--2" />
                </>
              )}
              <span className="gift-fx-emoji">{fx.emoji}</span>
              {fx.reward > 0 && (
                <span className="gift-fx-reward coin-inline">+{fx.reward} <CoinIcon size="sm" /></span>
              )}
              <span className="gift-fx-burst" />
              {Array.from({ length: particlesForFx(fx.fx) }).map((_, i) => (
                <span
                  key={i}
                  className="gift-fx-particle"
                  style={{ "--pi": i, "--pa": `${i * 36}deg` }}
                >
                  ✨
                </span>
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
