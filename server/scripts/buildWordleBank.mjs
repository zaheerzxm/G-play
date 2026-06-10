#!/usr/bin/env node
/**
 * Build server/wordleWords.json from public Wordle word lists.
 * Run: node server/scripts/buildWordleBank.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../wordleWords.json");

const BLOCK = ["fuck", "shit", "bitch", "cunt", "whore", "slut", "rape", "nazi", "coon", "spic", "kike", "fagg", "dyke", "porn", "anus", "damn"];
const isClean = (w) => w.length === 5 && /^[a-z]+$/.test(w) && !BLOCK.some((b) => w.includes(b));

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.status}`);
  return res.text();
}

async function main() {
  const [guessesRaw, alphaRaw] = await Promise.all([
    fetchText("https://raw.githubusercontent.com/tabatkins/wordle-list/main/words"),
    fetchText("https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt"),
  ]);

  const guesses = [...new Set(guessesRaw.split("\n").map((w) => w.trim().toLowerCase()).filter(isClean))];
  const common = [...new Set(alphaRaw.split("\n").map((w) => w.trim().toLowerCase()).filter(isClean))];
  const guessSet = new Set(guesses);
  const answers = common.filter((w) => guessSet.has(w));

  const payload = {
    guesses,
    answers: answers.length >= 2000 ? answers : guesses.slice(0, 2500),
  };

  fs.writeFileSync(OUT, JSON.stringify(payload));
  console.log(`Wrote ${OUT}: ${payload.guesses.length} guesses, ${payload.answers.length} answers`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
