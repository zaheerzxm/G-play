/** Words / patterns excluded from Word Battle (guesses + secret answers). */
export const BLOCK_EXACT = new Set([
  "booty", "booby", "horny", "semen", "prick", "gonad", "fecal", "urine",
  "enema", "lusty", "grope", "randy", "sperm", "pubic", "thong", "hymen",
  "groin", "spank", "twink", "penes", "yonic", "fanny", "bawdy", "wench",
  "sissy", "bimbo", "harpy", "hussy",
]);

export const BLOCK_SUBSTRINGS = [
  "fuck", "shit", "bitch", "cunt", "whore", "slut", "rape", "nazi",
  "coon", "spic", "kike", "fagg", "dyke", "porn", "anus", "penis",
  "vulva", "clit", "tits", "niger", "chink", "gook", "wetback",
];

export function isBlockedWord(word) {
  const w = String(word ?? "").trim().toLowerCase();
  if (w.length !== 5 || !/^[a-z]+$/.test(w)) return true;
  if (BLOCK_EXACT.has(w)) return true;
  return BLOCK_SUBSTRINGS.some((s) => w.includes(s));
}
