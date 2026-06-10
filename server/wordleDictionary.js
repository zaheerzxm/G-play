import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { getRoom } from "./gameState.js";
import { isBlockedWord } from "./wordleBlocklist.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const bank = JSON.parse(readFileSync(join(__dirname, "wordleWords.json"), "utf8"));

const GUESS_SET = new Set(bank.guesses.filter((w) => !isBlockedWord(w)));
const ANSWER_POOL = (bank.answers?.length ? bank.answers : bank.guesses).filter(
  (w) => !isBlockedWord(w),
);

export function isValidWord(word) {
  const w = String(word ?? "").trim().toLowerCase();
  return !isBlockedWord(w) && GUESS_SET.has(w);
}

export function pickSecretWord(roomId) {
  const room = getRoom(roomId);
  if (!room.wordleUsedWords) room.wordleUsedWords = new Set();

  let available = ANSWER_POOL.filter((w) => !room.wordleUsedWords.has(w));
  if (available.length < 1) {
    room.wordleUsedWords.clear();
    available = [...ANSWER_POOL];
  }

  const word = available[Math.floor(Math.random() * available.length)];
  room.wordleUsedWords.add(word);
  return word;
}

export const DICTIONARY_SIZE = GUESS_SET.size;
