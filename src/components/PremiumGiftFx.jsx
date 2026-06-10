import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import CoinIcon from "./CoinIcon.jsx";
import { formatCompactNumber } from "../formatCompact.js";
import { premiumFxDuration } from "../giftPremiumTypes.js";

function GiftLabel({ effect, className = "premium-gift-label" }) {
  const coinClass = effect.reward > 0 ? " premium-gift-label--coins" : "";
  return (
    <div className={`${className}${coinClass}`}>
      <span className="premium-gift-name">
        {effect.giftName}
        {effect.quantity > 1 ? ` x${formatCompactNumber(effect.quantity)}` : ""}
      </span>
      <span className="premium-gift-route">
        {effect.senderName} → {effect.recipientName}
      </span>
      {effect.reward > 0 && (
        <span className="premium-gift-reward coin-inline">
          +{formatCompactNumber(effect.reward)} <CoinIcon size="sm" />
        </span>
      )}
    </div>
  );
}

function UniverseScene({ effect }) {
  const stars = Array.from({ length: 22 });
  return (
    <>
      {stars.map((_, i) => {
        const angle = (i / stars.length) * Math.PI * 2;
        return (
          <span
            key={i}
            className="premium-gift-star"
            style={{
              "--i": i,
              left: `${50 + Math.cos(angle) * (38 + (i % 5) * 7)}%`,
              top: `${48 + Math.sin(angle) * (28 + (i % 4) * 6)}%`,
            }}
          />
        );
      })}
      <div className="premium-gift-orbit premium-gift-orbit--a" />
      <div className="premium-gift-orbit premium-gift-orbit--b" />
      <div className="premium-gift-hero premium-gift-hero--spin">
        <span className="premium-gift-hero-emoji">{effect.emoji}</span>
        <GiftLabel effect={effect} className="premium-gift-label premium-gift-label--hero" />
      </div>
    </>
  );
}

function GalaxyScene({ effect }) {
  return (
    <>
      <div className="premium-gift-galaxy-swirl" />
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="premium-gift-galaxy-star"
          style={{
            "--gs": i,
            left: `${12 + (i * 3.4) % 76}%`,
            top: `${18 + (i % 7) * 10}%`,
          }}
        />
      ))}
      <div className="premium-gift-hero premium-gift-hero--pulse">
        <span className="premium-gift-hero-emoji">{effect.emoji}</span>
        <GiftLabel effect={effect} className="premium-gift-label premium-gift-label--hero" />
      </div>
    </>
  );
}

function RocketScene({ effect }) {
  return (
    <>
      <div className="premium-gift-rocket-launchpad" />
      <div className="premium-gift-rocket-ship">
        <span className="premium-gift-rocket-body">{effect.emoji}</span>
        <span className="premium-gift-rocket-nozzle" />
        <span className="premium-gift-rocket-flame premium-gift-rocket-flame--a" />
        <span className="premium-gift-rocket-flame premium-gift-rocket-flame--b" />
        <span className="premium-gift-rocket-flame premium-gift-rocket-flame--c" />
        <span className="premium-gift-rocket-smoke" />
      </div>
      <div className="premium-gift-rocket-burst" />
      <GiftLabel effect={effect} className="premium-gift-label premium-gift-label--dock" />
    </>
  );
}

function CarGraphic() {
  return (
    <svg className="premium-gift-car-svg" viewBox="0 0 96 40" aria-hidden>
      <ellipse className="premium-gift-car-wheel" cx="22" cy="31" rx="8" ry="8" />
      <ellipse className="premium-gift-car-wheel" cx="68" cy="31" rx="8" ry="8" />
      <ellipse className="premium-gift-car-wheel-hub" cx="22" cy="31" rx="3.5" ry="3.5" />
      <ellipse className="premium-gift-car-wheel-hub" cx="68" cy="31" rx="3.5" ry="3.5" />
      <path
        className="premium-gift-car-body-path"
        d="M6 26 L18 16 L34 11 L58 9 L82 12 L90 18 L90 26 Z"
      />
      <path className="premium-gift-car-cabin" d="M30 16 L48 12 L68 14 L72 22 L30 22 Z" />
      <path className="premium-gift-car-spoiler" d="M6 20 L6 14 L14 16 L14 20 Z" />
      <path className="premium-gift-car-stripe" d="M38 12 L72 12 L74 15 L40 15 Z" />
    </svg>
  );
}

function CarScene({ effect }) {
  return (
    <>
      <div className="premium-gift-car-road" />
      <div className="premium-gift-car-drive">
        <CarGraphic />
        <span className="premium-gift-car-dust" />
        <span className="premium-gift-car-gift-emoji" aria-hidden>
          {effect.emoji}
        </span>
      </div>
      <GiftLabel effect={effect} className="premium-gift-label premium-gift-label--dock" />
    </>
  );
}

function SupercarScene({ effect }) {
  return (
    <>
      <div className="premium-gift-supercar-road" />
      <div className="premium-gift-supercar-neon" />
      <div className="premium-gift-supercar-drive">
        <span className="premium-gift-supercar-emoji">{effect.emoji}</span>
      </div>
      <GiftLabel effect={effect} className="premium-gift-label premium-gift-label--dock" />
    </>
  );
}

function FireworkScene({ effect }) {
  const bursts = [15, 35, 55, 72, 28, 48, 82, 62];
  return (
    <>
      {bursts.map((left, i) => (
        <span
          key={i}
          className="premium-gift-firework-burst"
          style={{ "--fw-i": i, left: `${left}%`, top: `${18 + (i % 4) * 12}%` }}
        >
          {Array.from({ length: 12 }).map((_, j) => (
            <span key={j} className="premium-gift-firework-spark" style={{ "--fj": j }} />
          ))}
        </span>
      ))}
      <div className="premium-gift-firework-hero">{effect.emoji}</div>
      <GiftLabel effect={effect} className="premium-gift-label premium-gift-label--dock" />
    </>
  );
}

function CastleScene({ effect }) {
  return (
    <>
      <div className="premium-gift-castle-glow" />
      <div className="premium-gift-castle-rise">
        <span className="premium-gift-castle-emoji">{effect.emoji}</span>
      </div>
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} className="premium-gift-castle-sparkle" style={{ "--cs": i }}>
          ✨
        </span>
      ))}
      <GiftLabel effect={effect} className="premium-gift-label premium-gift-label--dock" />
    </>
  );
}

function PalaceScene({ effect }) {
  return (
    <>
      <div className="premium-gift-palace-gates" />
      <div className="premium-gift-palace-beam" />
      <div className="premium-gift-palace-reveal">
        <span className="premium-gift-palace-emoji">{effect.emoji}</span>
      </div>
      <GiftLabel effect={effect} className="premium-gift-label premium-gift-label--dock" />
    </>
  );
}

function DragonScene({ effect }) {
  return (
    <>
      <div className="premium-gift-dragon-trail" />
      <div className="premium-gift-dragon-swoop">
        <span className="premium-gift-dragon-emoji">{effect.emoji}</span>
        <span className="premium-gift-dragon-fire" />
      </div>
      <GiftLabel effect={effect} className="premium-gift-label premium-gift-label--dock" />
    </>
  );
}

function YachtScene({ effect }) {
  return (
    <>
      <div className="premium-gift-yacht-waves" />
      <div className="premium-gift-yacht-ship">
        <span className="premium-gift-yacht-emoji">{effect.emoji}</span>
      </div>
      <div className="premium-gift-yacht-wake" />
      <GiftLabel effect={effect} className="premium-gift-label premium-gift-label--dock" />
    </>
  );
}

function RingScene({ effect }) {
  return (
    <>
      <div className="premium-gift-ring-gem">{effect.emoji}</div>
      <div className="premium-gift-ring-pulse premium-gift-ring-pulse--a" />
      <div className="premium-gift-ring-pulse premium-gift-ring-pulse--b" />
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} className="premium-gift-ring-heart" style={{ "--rh": i }}>
          💎
        </span>
      ))}
      <GiftLabel effect={effect} className="premium-gift-label premium-gift-label--dock" />
    </>
  );
}

function HeartsScene({ effect }) {
  return (
    <>
      <div className="premium-gift-hearts-burst">{effect.emoji}</div>
      {Array.from({ length: 16 }).map((_, i) => (
        <span key={i} className="premium-gift-heart-float" style={{ "--hf": i }}>
          {i % 3 === 0 ? "💕" : i % 3 === 1 ? "💖" : "💗"}
        </span>
      ))}
      <GiftLabel effect={effect} className="premium-gift-label premium-gift-label--dock" />
    </>
  );
}

function CrownScene({ effect }) {
  return (
    <>
      <div className="premium-gift-crown-hero">{effect.emoji}</div>
      {Array.from({ length: 22 }).map((_, i) => (
        <span key={i} className="premium-gift-crown-coin" style={{ "--cc": i }}>
          {i % 2 ? "🪙" : "✨"}
        </span>
      ))}
      <GiftLabel effect={effect} className="premium-gift-label premium-gift-label--dock" />
    </>
  );
}

function FrameScene({ effect }) {
  return (
    <>
      <div className="premium-gift-frame-outer">
        <div className="premium-gift-frame-inner">
          <span className="premium-gift-frame-emoji">{effect.emoji}</span>
        </div>
      </div>
      <GiftLabel effect={effect} className="premium-gift-label premium-gift-label--dock" />
    </>
  );
}

function PremiumScene({ type, effect }) {
  switch (type) {
    case "universe":
      return <UniverseScene effect={effect} />;
    case "galaxy":
      return <GalaxyScene effect={effect} />;
    case "rocket":
      return <RocketScene effect={effect} />;
    case "car":
      return <CarScene effect={effect} />;
    case "supercar":
      return <SupercarScene effect={effect} />;
    case "firework":
      return <FireworkScene effect={effect} />;
    case "castle":
      return <CastleScene effect={effect} />;
    case "palace":
      return <PalaceScene effect={effect} />;
    case "dragon":
      return <DragonScene effect={effect} />;
    case "yacht":
      return <YachtScene effect={effect} />;
    case "ring":
      return <RingScene effect={effect} />;
    case "hearts":
      return <HeartsScene effect={effect} />;
    case "crown":
      return <CrownScene effect={effect} />;
    case "frame":
      return <FrameScene effect={effect} />;
    default:
      return <CrownScene effect={effect} />;
  }
}

function premiumPortalRoot() {
  if (typeof document === "undefined") return null;
  return document.querySelector(".voice-room") ?? document.body;
}

export default function PremiumGiftFx({ effect, onDone }) {
  const type = effect?.premiumType ?? "crown";
  const duration = effect?.duration ?? premiumFxDuration(type);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!effect?.id) return undefined;
    const { id } = effect;
    const t = setTimeout(() => onDoneRef.current?.(id), duration);
    return () => clearTimeout(t);
  }, [effect?.id, duration]);

  if (!effect) return null;

  const portalRoot = premiumPortalRoot();
  if (!portalRoot) return null;

  const inVoiceRoom = portalRoot.classList.contains("voice-room");

  return createPortal(
    <div
      className={`premium-gift-portal premium-gift-portal--${type}${
        inVoiceRoom ? "" : " premium-gift-portal--viewport"
      }`}
      aria-hidden
    >
      <div
        key={effect.id}
        className={`premium-gift-fx premium-gift-fx--${type}${
          effect.reward > 0 ? " premium-gift-fx--has-reward" : ""
        }`}
        style={{
          "--premium-dur": `${duration}ms`,
          ...(effect.reward > 0
            ? { "--premium-coin-delay": `${Math.round(duration * 0.56)}ms` }
            : {}),
        }}
      >
        {type !== "car" && <div className="premium-gift-fx-bg" />}
        <PremiumScene type={type} effect={effect} />
      </div>
    </div>,
    portalRoot,
  );
}
