import { useEffect, useRef } from "react";
import lottie from "lottie-web";
import { loadTgsAnimationData } from "../tgsEmote.js";

export default function TgsEmote({ src, className, loop = true, autoplay = true }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !src) return undefined;
    let cancelled = false;

    loadTgsAnimationData(src)
      .then((data) => {
        if (cancelled || !containerRef.current) return;
        animRef.current?.destroy();
        animRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop,
          autoplay,
          animationData: data,
        });
      })
      .catch((err) => console.warn("TgsEmote failed", src, err.message));

    return () => {
      cancelled = true;
      animRef.current?.destroy();
      animRef.current = null;
    };
  }, [src, loop, autoplay]);

  return <div ref={containerRef} className={className} aria-hidden />;
}
