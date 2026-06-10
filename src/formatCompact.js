/** Compact display — 999 · 1.5k · 300k · 3m · 1.2b · 300t */

const SUFFIXES = [
  [1e12, "t"],
  [1e9, "b"],
  [1e6, "m"],
  [1e3, "k"],
];

function trimFraction(s) {
  return s.replace(/\.0+$/, "");
}

export function formatCompactNumber(value, { maxFractionDigits = 1 } = {}) {
  const n = Math.floor(Number(value) || 0);
  if (!Number.isFinite(n)) return "0";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);

  if (abs < 1000) return `${sign}${abs}`;

  for (const [unit, suffix] of SUFFIXES) {
    if (abs >= unit) {
      const scaled = abs / unit;
      let text;
      if (scaled >= 100) {
        text = String(Math.round(scaled));
      } else if (scaled >= 10) {
        text = trimFraction((Math.round(scaled * 10) / 10).toFixed(1));
      } else {
        const factor = 10 ** maxFractionDigits;
        text = trimFraction((Math.round(scaled * factor) / factor).toFixed(maxFractionDigits));
      }
      return `${sign}${text}${suffix}`;
    }
  }

  return `${sign}${abs}`;
}
