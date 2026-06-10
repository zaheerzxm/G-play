/** Wordle tile evaluation — correct | present | absent */

export function evaluateGuess(guess, secret) {
  const g = guess.toLowerCase().split("");
  const s = secret.toLowerCase().split("");
  const result = ["absent", "absent", "absent", "absent", "absent"];
  const used = [false, false, false, false, false];

  for (let i = 0; i < 5; i += 1) {
    if (g[i] === s[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }

  for (let i = 0; i < 5; i += 1) {
    if (result[i] === "correct") continue;
    const idx = s.findIndex((ch, j) => !used[j] && ch === g[i]);
    if (idx !== -1) {
      result[i] = "present";
      used[idx] = true;
    }
  }

  return result;
}

export const ATTEMPT_SCORES = [100, 80, 60, 40, 20, 10];
export const PLACEMENT_BONUS = [50, 25, 10];

export function attemptScore(attemptsUsed) {
  const idx = Math.max(0, Math.min(5, attemptsUsed - 1));
  return ATTEMPT_SCORES[idx] ?? 0;
}

export function speedBonus(solveTimeMs) {
  if (!solveTimeMs || solveTimeMs <= 0) return 0;
  const sec = solveTimeMs / 1000;
  if (sec <= 15) return 30;
  if (sec <= 30) return 20;
  if (sec <= 60) return 10;
  if (sec <= 120) return 5;
  return 0;
}

export function placementBonus(rank) {
  if (rank < 1 || rank > 3) return 0;
  return PLACEMENT_BONUS[rank - 1] ?? 0;
}

export function computeRoundScore({ attemptsUsed, solveTimeMs, rank, solved }) {
  if (!solved) return 0;
  return attemptScore(attemptsUsed) + placementBonus(rank) + speedBonus(solveTimeMs);
}
