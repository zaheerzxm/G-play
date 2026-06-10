import { useEffect, useRef } from "react";
import lottie from "lottie-web";
import { loadLottieAnimationData } from "../lottieGift.js";

export default function LottieGift({ src, className, loop = false, autoplay = true }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !src) return undefined;
    let cancelled = false;

    loadLottieAnimationData(src)
      .then(({ data, assetsPath }) => {
        if (cancelled || !containerRef.current) return;
        animRef.current?.destroy();
        animRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop,
          autoplay,
          animationData: data,
          assetsPath,
        });
      })
      .catch((err) => console.warn("LottieGift failed", src, err.message));

    return () => {
      cancelled = true;
      animRef.current?.destroy();
      animRef.current = null;
    };
  }, [src, loop, autoplay]);

  return <div ref={containerRef} className={className} aria-hidden />;
}
