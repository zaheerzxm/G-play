import { useCallback, useEffect, useRef, useState } from "react";

function beep(ctx, freq, duration, type = "sine", gain = 0.08) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function useDDDSounds() {
  const [muted, setMuted] = useState(false);
  const ctxRef = useRef(null);
  const unlockedRef = useRef(false);

  const ensureCtx = useCallback(() => {
    if (muted) return null;
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  }, [muted]);

  const unlock = useCallback(() => {
    const ctx = ensureCtx();
    if (!ctx || unlockedRef.current) return;
    if (ctx.state === "suspended") ctx.resume();
    unlockedRef.current = true;
  }, [ensureCtx]);

  const play = useCallback((name) => {
    const ctx = ensureCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    switch (name) {
      case "turn_start":
        beep(ctx, 440, 0.12);
        setTimeout(() => beep(ctx, 660, 0.15), 120);
        break;
      case "timer_tick":
        beep(ctx, 880, 0.05, "square", 0.04);
        break;
      case "dil_reveal":
        beep(ctx, 523, 0.2);
        setTimeout(() => beep(ctx, 659, 0.25), 150);
        break;
      case "dimaag_reveal":
        beep(ctx, 392, 0.15);
        setTimeout(() => beep(ctx, 494, 0.2), 100);
        setTimeout(() => beep(ctx, 587, 0.25), 220);
        break;
      case "dustbin_reveal":
        beep(ctx, 180, 0.15, "sawtooth", 0.06);
        setTimeout(() => beep(ctx, 120, 0.3, "sawtooth", 0.05));
        break;
      case "round_end":
        beep(ctx, 330, 0.2);
        setTimeout(() => beep(ctx, 440, 0.2), 180);
        setTimeout(() => beep(ctx, 554, 0.3), 360);
        break;
      case "button_click":
        beep(ctx, 600, 0.04, "triangle", 0.03);
        break;
      default:
        break;
    }
  }, [ensureCtx]);

  useEffect(() => () => {
    ctxRef.current?.close?.();
    ctxRef.current = null;
  }, []);

  return { muted, setMuted, play, unlock, toggleMute: () => setMuted((m) => !m) };
}
