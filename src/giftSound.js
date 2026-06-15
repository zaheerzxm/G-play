let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function tone(ctx, { freq, start, dur, type = "sine", vol = 0.06, slide = 1 }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slide !== 1) {
    osc.frequency.exponentialRampToValueAtTime(freq * slide, start + dur * 0.85);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

export function playRoomSoundEffect(enabled = true) {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    tone(ctx, { freq: 180, start: now, dur: 0.08, vol: 0.05, type: "square" });
    tone(ctx, { freq: 240, start: now + 0.05, dur: 0.1, vol: 0.045, type: "triangle" });
    tone(ctx, { freq: 320, start: now + 0.1, dur: 0.12, vol: 0.04 });
  } catch {
    /* ok */
  }
}

export function playGiftSound(enabled = true) {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    tone(ctx, { freq: 520, start: now, dur: 0.12, vol: 0.05 });
    tone(ctx, { freq: 780, start: now + 0.06, dur: 0.14, vol: 0.04, type: "triangle" });
  } catch {
    /* ok */
  }
}

/** Soft whoosh for pfp-to-pfp gift flights. */
export function playPfpGiftSound(enabled = true) {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    tone(ctx, { freq: 280, start: now, dur: 0.22, vol: 0.035, slide: 1.8, type: "triangle" });
    tone(ctx, { freq: 420, start: now + 0.08, dur: 0.18, vol: 0.03, slide: 1.4 });
  } catch {
    /* ok */
  }
}

export function playPremiumGiftSound(type = "sparkle", enabled = true) {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (type === "rocket") {
      tone(ctx, { freq: 90, start: now, dur: 0.5, vol: 0.08, type: "sawtooth", slide: 0.5 });
      tone(ctx, { freq: 140, start: now + 0.35, dur: 0.45, vol: 0.07, type: "triangle", slide: 2.2 });
      tone(ctx, { freq: 520, start: now + 0.75, dur: 0.35, vol: 0.09, slide: 1.6 });
      return;
    }

    if (type === "firework") {
      for (let i = 0; i < 5; i += 1) {
        tone(ctx, {
          freq: 300 + i * 90,
          start: now + i * 0.18,
          dur: 0.2,
          vol: 0.055,
          type: "square",
          slide: 2.5,
        });
      }
      return;
    }

    if (type === "dragon") {
      tone(ctx, { freq: 110, start: now, dur: 0.6, vol: 0.07, type: "sawtooth", slide: 1.8 });
      tone(ctx, { freq: 220, start: now + 0.2, dur: 0.5, vol: 0.06, slide: 2.4 });
      tone(ctx, { freq: 440, start: now + 0.55, dur: 0.4, vol: 0.05, type: "triangle" });
      return;
    }

    if (type === "universe" || type === "galaxy") {
      const notes = [196, 247, 330, 494, 660];
      notes.forEach((freq, i) => {
        tone(ctx, {
          freq,
          start: now + i * 0.08,
          dur: 1.1,
          vol: 0.065,
          type: i % 2 ? "triangle" : "sine",
          slide: 1.5,
        });
      });
      return;
    }

    if (type === "car") {
      tone(ctx, { freq: 120, start: now, dur: 0.35, vol: 0.06, type: "sawtooth", slide: 1.6 });
      tone(ctx, { freq: 180, start: now + 0.2, dur: 0.4, vol: 0.055, slide: 1.8 });
      tone(ctx, { freq: 90, start: now + 0.5, dur: 0.25, vol: 0.04, type: "triangle" });
      return;
    }

    if (type === "supercar") {
      tone(ctx, { freq: 200, start: now, dur: 0.2, vol: 0.07, type: "sawtooth", slide: 2.8 });
      tone(ctx, { freq: 400, start: now + 0.08, dur: 0.25, vol: 0.065, slide: 2.2 });
      tone(ctx, { freq: 800, start: now + 0.15, dur: 0.3, vol: 0.05, slide: 1.5 });
      return;
    }

    if (type === "castle" || type === "yacht") {
      tone(ctx, { freq: 165, start: now, dur: 0.5, vol: 0.06, slide: 1.3 });
      tone(ctx, { freq: 330, start: now + 0.25, dur: 0.55, vol: 0.055, type: "triangle", slide: 1.4 });
      tone(ctx, { freq: 495, start: now + 0.55, dur: 0.45, vol: 0.05 });
      return;
    }

    if (type === "palace") {
      [131, 165, 196, 262, 330].forEach((freq, i) => {
        tone(ctx, { freq, start: now + i * 0.1, dur: 0.55, vol: 0.055, type: "triangle", slide: 1.15 });
      });
      return;
    }

    if (type === "frame") {
      tone(ctx, { freq: 440, start: now, dur: 0.3, vol: 0.05, type: "triangle" });
      tone(ctx, { freq: 554, start: now + 0.15, dur: 0.35, vol: 0.055 });
      tone(ctx, { freq: 659, start: now + 0.3, dur: 0.4, vol: 0.05, slide: 1.2 });
      return;
    }

    if (type === "ring" || type === "hearts") {
      tone(ctx, { freq: 392, start: now, dur: 0.25, vol: 0.05, type: "triangle" });
      tone(ctx, { freq: 523, start: now + 0.12, dur: 0.28, vol: 0.055 });
      tone(ctx, { freq: 659, start: now + 0.24, dur: 0.32, vol: 0.05, type: "sine" });
      return;
    }

    if (type === "crown") {
      [330, 415, 523, 659].forEach((freq, i) => {
        tone(ctx, { freq, start: now + i * 0.07, dur: 0.35, vol: 0.05, slide: 1.2 });
      });
      return;
    }

    tone(ctx, { freq: 262, start: now, dur: 0.3, vol: 0.05 });
    tone(ctx, { freq: 392, start: now + 0.1, dur: 0.35, vol: 0.055, type: "triangle" });
    tone(ctx, { freq: 523, start: now + 0.22, dur: 0.4, vol: 0.05, slide: 1.3 });
  } catch {
    /* ok */
  }
}
