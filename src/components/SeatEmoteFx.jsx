import CoinIcon from "./CoinIcon.jsx";
import TgsEmote from "./TgsEmote.jsx";

function EmoteGlyph({ value, size = "lg" }) {
  if (value === "coin") return <CoinIcon size={size} />;
  return value;
}

export default function SeatEmoteFx({ reactions }) {
  if (!reactions?.length) return null;

  return (
    <div className="seat-emote-layer" aria-hidden>
      {reactions.map((r) => (
        <div
          key={r.id}
          className={`seat-emote-burst seat-emote-burst--${r.anim ?? "default"}`}
          style={{ left: `${r.x}px`, top: `${r.y}px` }}
        >
          {r.tgs ? (
            <TgsEmote src={r.tgs} className="seat-emote-tgs" loop={false} autoplay />
          ) : (
            <>
              <span className={`seat-emote-hero seat-emote-hero--${r.anim ?? "default"}`}>
                <EmoteGlyph value={r.emoji} size="lg" />
              </span>
              {(r.particles ?? []).map((p, i) => (
                <span
                  key={`${r.id}-p${i}`}
                  className="seat-emote-particle"
                  style={{ "--i": i, "--rot": `${(i - 1) * 28}deg` }}
                >
                  <EmoteGlyph value={p} size="md" />
                </span>
              ))}
              {r.anim === "love" && (
                <>
                  <span className="seat-emote-heart seat-emote-heart--1">💖</span>
                  <span className="seat-emote-heart seat-emote-heart--2">💕</span>
                  <span className="seat-emote-heart seat-emote-heart--3">❤️</span>
                </>
              )}
              {r.anim === "laugh" && <span className="seat-emote-lol">LOL</span>}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
