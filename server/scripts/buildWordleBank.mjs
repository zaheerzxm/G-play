#!/usr/bin/env node
/**
 * Build server/wordleWords.json from NYT Wordle lists (curated, common words).
 * Run: node server/scripts/buildWordleBank.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isBlockedWord } from "../wordleBlocklist.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../wordleWords.json");

const NYT_ANSWERS =
  "https://raw.githubusercontent.com/stuartpb/wordles/main/wordles.json";
const NYT_GUESSES =
  "https://raw.githubusercontent.com/stuartpb/wordles/main/nonwordles.json";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.status}`);
  return res.json();
}

function cleanList(words) {
  return [...new Set(words.map((w) => String(w).trim().toLowerCase()).filter((w) => !isBlockedWord(w)))];
}

async function main() {
  const [answersRaw, extraGuessesRaw] = await Promise.all([
    fetchJson(NYT_ANSWERS),
    fetchJson(NYT_GUESSES),
  ]);

  const answers = cleanList(answersRaw);
  const guesses = cleanList([...answersRaw, ...extraGuessesRaw]);

  if (answers.length < 500) {
    throw new Error(`Answer pool too small (${answers.length}); check blocklist or source URLs`);
  }

  const payload = { guesses, answers };
  fs.writeFileSync(OUT, JSON.stringify(payload));
  console.log(`Wrote ${OUT}: ${guesses.length} guesses, ${answers.length} answers`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
