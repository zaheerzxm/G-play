import { randomUUID } from "crypto";
import { isValidWord, pickSecretWord } from "./wordleDictionary.js";
import { computeRoundScore, evaluateGuess } from "./wordleLogic.js";

const MAX_ATTEMPTS = 6;
const WORD_LEN = 5;
const COUNTDOWN_START = 3;
const COUNTDOWN_STEP_MS = 1000;
const ROUND_MS = 180000;
const ROUND_END_MS = 6000;

function playerProgress(p, includeGuesses = false) {
  return {
    userId: p.userId,
    userName: p.userName,
    attemptsUsed: p.guesses.length,
    solved: p.solved,
    solveTimeMs: p.solveTimeMs,
    rank: p.rank,
    roundScore: p.roundScore,
    finished: p.solved || p.guesses.length >= MAX_ATTEMPTS,
    ...(includeGuesses ? { guesses: p.guesses.map((g) => ({ guess: g.guess, result: g.result })) } : {}),
  };
}

function allPlayersFinished(players) {
  return players.every((p) => p.solved || p.guesses.length >= MAX_ATTEMPTS);
}

function assignRanks(players, roundStartedAt) {
  const solved = players
    .filter((p) => p.solved)
    .sort((a, b) => {
      if (a.guesses.length !== b.guesses.length) return a.guesses.length - b.guesses.length;
      return (a.solveTimeMs ?? 0) - (b.solveTimeMs ?? 0);
    });

  let rank = 1;
  for (const p of solved) {
    p.rank = rank;
    p.roundScore = computeRoundScore({
      attemptsUsed: p.guesses.length,
      solveTimeMs: p.solveTimeMs ?? Date.now() - roundStartedAt,
      rank,
      solved: true,
    });
    rank += 1;
  }

  for (const p of players) {
    if (!p.solved) {
      p.rank = null;
      p.roundScore = 0;
    }
  }
}

export function createWordleGame({ roomId, hostUserId, players }) {
  const scores = {};
  for (const p of players) scores[p.userId] = 0;

  const state = {
    gameId: randomUUID(),
    roundNumber: 0,
    secretWord: null,
    roundStartedAt: null,
    countdown: null,
  };

  const game = {
    type: "wordle",
    roomId,
    hostUserId,
    phase: "waiting",
    maxAttempts: MAX_ATTEMPTS,
    wordLength: WORD_LEN,
    scores,
    players: players.map((p) => ({
      userId: p.userId,
      userName: p.userName,
      guesses: [],
      solved: false,
      solveTimeMs: null,
      rank: null,
      roundScore: 0,
    })),
    timers: [],
    startedAt: Date.now(),
    endsAt: null,
    winnerId: null,
    _state: state,

    snapshot(forUserId) {
      const me = forUserId ? this.players.find((p) => p.userId === forUserId) : null;
      const ranked = [...this.players]
        .map((p) => playerProgress(p, false))
        .sort((a, b) => {
          if (a.solved !== b.solved) return a.solved ? -1 : 1;
          if (a.solved && b.solved) {
            if (a.attemptsUsed !== b.attemptsUsed) return a.attemptsUsed - b.attemptsUsed;
            return (a.solveTimeMs ?? 0) - (b.solveTimeMs ?? 0);
          }
          return a.attemptsUsed - b.attemptsUsed;
        });

      return {
        type: "wordle",
        gameId: state.gameId,
        phase: this.phase,
        roundNumber: state.roundNumber,
        countdown: state.countdown,
        maxAttempts: MAX_ATTEMPTS,
        wordLength: WORD_LEN,
        endsAt: this.endsAt,
        secretWord:
          this.phase === "roundEnd" || this.phase === "finished" ? state.secretWord : null,
        players: ranked,
        scores: { ...scores },
        myGuesses: me ? me.guesses.map((g) => ({ guess: g.guess, result: g.result })) : [],
        mySolved: me?.solved ?? false,
        myFinished: me ? me.solved || me.guesses.length >= MAX_ATTEMPTS : false,
        winnerId: this.winnerId,
        hostUserId,
      };
    },

    toPublic() {
      return this.snapshot();
    },

    clearTimers() {
      for (const t of this.timers) clearTimeout(t);
      this.timers = [];
    },

    destroy() {
      this.clearTimers();
    },
  };

  return game;
}

export function broadcastWordleState(io, roomId, game, roomMembers = []) {
  for (const m of roomMembers) {
    if (m.socketId) {
      io.to(m.socketId).emit("gameStateUpdate", { game: game.snapshot(m.userId) });
    }
  }
}

export function startWordleRound(game, io, roomId, getMembers) {
  game.clearTimers();
  const state = game._state;
  state.roundNumber += 1;
  state.secretWord = pickSecretWord(roomId);
  state.roundStartedAt = null;
  state.countdown = COUNTDOWN_START;
  game.phase = "countdown";
  game.winnerId = null;
  game.endsAt = null;

  for (const p of game.players) {
    p.guesses = [];
    p.solved = false;
    p.solveTimeMs = null;
    p.rank = null;
    p.roundScore = 0;
  }

  const members = getMembers?.() ?? [];
  broadcastWordleState(io, roomId, game, members);
  runCountdown(game, io, roomId, getMembers);
}

function runCountdown(game, io, roomId, getMembers) {
  const state = game._state;
  const members = getMembers?.() ?? [];

  const tick = () => {
    broadcastWordleState(io, roomId, game, members);
    state.countdown -= 1;
    if (state.countdown > 0) {
      const t = setTimeout(tick, COUNTDOWN_STEP_MS);
      game.timers.push(t);
      return;
    }
    state.countdown = 0;
    beginWordlePlay(game, io, roomId, getMembers);
  };

  const t = setTimeout(tick, COUNTDOWN_STEP_MS);
  game.timers.push(t);
}

function beginWordlePlay(game, io, roomId, getMembers) {
  const state = game._state;
  game.phase = "playing";
  state.countdown = null;
  state.roundStartedAt = Date.now();
  game.endsAt = state.roundStartedAt + ROUND_MS;

  const members = getMembers?.() ?? [];
  broadcastWordleState(io, roomId, game, members);

  const roundTimer = setTimeout(() => finishWordleRound(game, io, roomId, getMembers), ROUND_MS);
  game.timers.push(roundTimer);
}

function finishWordleRound(game, io, roomId, getMembers) {
  if (game.phase !== "playing") return;
  game.clearTimers();
  const state = game._state;
  assignRanks(game.players, state.roundStartedAt ?? Date.now());

  for (const p of game.players) {
    game.scores[p.userId] = (game.scores[p.userId] ?? 0) + (p.roundScore ?? 0);
  }

  const winner = game.players.find((p) => p.rank === 1);
  game.winnerId = winner?.userId ?? null;
  game.phase = "roundEnd";

  const members = getMembers?.() ?? [];
  broadcastWordleState(io, roomId, game, members);

  const endTimer = setTimeout(() => {
    game.phase = "finished";
    broadcastWordleState(io, roomId, game, members);
  }, ROUND_END_MS);
  game.timers.push(endTimer);
}

export function startNextWordleRound(game, io, roomId, getMembers) {
  if (game.phase !== "roundEnd" && game.phase !== "finished") return false;
  startWordleRound(game, io, roomId, getMembers);
  return true;
}

export function handleWordleGuess(game, userId, rawGuess, io, roomId, getMembers) {
  if (game.phase !== "playing") return { ok: false, error: "Round not active" };

  const guess = String(rawGuess ?? "").trim().toLowerCase();
  if (guess.length !== WORD_LEN) return { ok: false, error: "Word must be 5 letters" };
  if (!/^[a-z]+$/.test(guess)) return { ok: false, error: "Letters only" };
  if (!isValidWord(guess)) return { ok: false, error: "Not in word list" };

  const player = game.players.find((p) => p.userId === userId);
  if (!player) return { ok: false, error: "Not in this game" };
  if (player.solved || player.guesses.length >= MAX_ATTEMPTS) {
    return { ok: false, error: "Already finished" };
  }

  const result = evaluateGuess(guess, game._state.secretWord);
  player.guesses.push({ guess, result });

  if (result.every((r) => r === "correct")) {
    player.solved = true;
    player.solveTimeMs = Date.now() - (game._state.roundStartedAt ?? Date.now());
    if (!game.winnerId) game.winnerId = userId;
  }

  const members = getMembers?.() ?? [];
  broadcastWordleState(io, roomId, game, members);

  if (allPlayersFinished(game.players)) {
    finishWordleRound(game, io, roomId, getMembers);
  }

  return {
    ok: true,
    result,
    solved: player.solved,
    attemptsUsed: player.guesses.length,
  };
}
