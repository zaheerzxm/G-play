import { useEffect, useRef } from "react";
import { loadSvgaPlayer } from "../giftSvga.js";

/** Full-screen SVGA overlay when gift assets exist in public/G-play */
export default function SvgaGiftFx({ url, onDone, duration = 2800 }) {
  const ref = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!url || !ref.current) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => onDone?.(), duration);

    loadSvgaPlayer()
      .then((SVGA) => {
        if (cancelled || !ref.current) return;
        const player = new SVGA.Player(ref.current);
        const parser = new SVGA.Parser(ref.current);
        playerRef.current = player;
        parser.load(url, (videoItem) => {
          if (cancelled) return;
          player.setVideoItem(videoItem);
          player.startAnimation();
        });
      })
      .catch(() => onDone?.());

    return () => {
      cancelled = true;
      clearTimeout(timer);
      playerRef.current?.clear?.();
      playerRef.current = null;
    };
  }, [url, onDone, duration]);

  if (!url) return null;

  return (
    <div className="svga-gift-overlay" aria-hidden>
      <div ref={ref} className="svga-gift-canvas" />
    </div>
  );
}
