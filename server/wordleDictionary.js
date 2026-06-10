import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { getRoom } from "./gameState.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const bank = JSON.parse(readFileSync(join(__dirname, "wordleWords.json"), "utf8"));

const GUESS_SET = new Set(bank.guesses);
const ANSWER_POOL = bank.answers?.length ? bank.answers : bank.guesses;

export function isValidWord(word) {
  return GUESS_SET.has(String(word ?? "").trim().toLowerCase());
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
